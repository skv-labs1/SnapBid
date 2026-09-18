import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type {
  LineItem,
  LineItemCategory,
  LineItemUnit,
  Quote,
} from "@/lib/types";

export const runtime = "nodejs";

const MODEL = process.env.GEMINI_MODEL || "gemini-3-flash";
const MAX_IMAGES = 6;

const SYSTEM_GUIDANCE = `You are drafting an estimate for a small Ontario contractor. Use the photos and the contractor's description.
- Prices in CAD. Use the contractor's labour rate if given. Materials at reasonable GTA retail prices.
- Mark uncertain prices in "notes"; do not invent precise costs for things you cannot see.
- Be conservative. It is better to list an item with TBD pricing than to guess wildly. Represent TBD as unitPrice 0 and mention it in notes.
- Never add HST into line items; the app computes tax.
- Reply with JSON only, no prose, no code fence, exactly in this shape:
{
  "title": "Bathroom renovation - 123 Main St",
  "summary": "2-3 sentence plain-English scope",
  "lineItems": [
    { "category": "Labour" | "Materials" | "Other", "description": "...", "qty": 1, "unit": "hr" | "each" | "sq ft" | "lump", "unitPrice": 85, "total": 85 }
  ],
  "assumptions": ["..."],
  "exclusions": ["..."],
  "notes": "anything the contractor should double-check"
}`;

interface QuoteRequestBody {
  description?: string;
  jobType?: string;
  customerName?: string;
  images?: string[];
  settings?: {
    businessName?: string;
    trade?: string;
    defaultLabourRate?: number;
    hstRegistered?: boolean;
  };
}

export async function POST(request: NextRequest) {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return NextResponse.json(
      { error: "Server is missing APP_PASSWORD. Set it in the environment." },
      { status: 500 }
    );
  }
  if (request.headers.get("x-app-password") !== appPassword) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing GEMINI_API_KEY. Set it in the environment." },
      { status: 500 }
    );
  }

  let body: QuoteRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const description = (body.description ?? "").trim();
  const images = Array.isArray(body.images) ? body.images.slice(0, MAX_IMAGES) : [];
  if (!description && images.length === 0) {
    return NextResponse.json(
      { error: "Add a description or at least one photo." },
      { status: 400 }
    );
  }

  const settings = body.settings ?? {};
  const contextLines = [
    body.jobType ? `Job type: ${body.jobType}` : "",
    body.customerName ? `Customer: ${body.customerName}` : "",
    settings.trade ? `Contractor's trade: ${settings.trade}` : "",
    settings.defaultLabourRate
      ? `Contractor's labour rate: $${settings.defaultLabourRate}/hr CAD`
      : "",
    description ? `Contractor's description of the job:\n${description}` : "",
  ].filter(Boolean);

  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = images.map((data) => ({
    inlineData: { mimeType: "image/jpeg", data },
  }));
  parts.push({ text: `${SYSTEM_GUIDANCE}\n\n${contextLines.join("\n")}` });

  let rawText = "";
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 2000,
      },
    });
    console.log("Gemini token usage:", JSON.stringify(response.usageMetadata));
    rawText = response.text ?? "";
  } catch (err) {
    if (isRateLimit(err)) {
      return NextResponse.json(
        { error: "The AI is busy. Wait a minute and try again." },
        { status: 429 }
      );
    }
    console.error("Gemini call failed:", err);
    return NextResponse.json(
      { error: "The AI service returned an error. Try again." },
      { status: 502 }
    );
  }

  const quote = parseQuote(rawText);
  if (!quote) {
    return NextResponse.json(
      { error: "The AI returned something unexpected. Try again.", raw: rawText },
      { status: 422 }
    );
  }

  return NextResponse.json({ quote });
}

function isRateLimit(err: unknown): boolean {
  if (typeof err === "object" && err !== null) {
    const e = err as { status?: unknown; message?: unknown };
    if (e.status === 429) return true;
    const message = typeof e.message === "string" ? e.message : "";
    if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
      return true;
    }
  }
  return false;
}

const CATEGORIES: LineItemCategory[] = ["Labour", "Materials", "Other"];
const UNITS: LineItemUnit[] = ["hr", "each", "sq ft", "lump"];

function parseQuote(raw: string): Quote | null {
  let text = raw.trim();
  // Strip a markdown code fence if the model added one anyway.
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenced) text = fenced[1];

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }

  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.lineItems)) return null;

  const lineItems: LineItem[] = [];
  for (const item of obj.lineItems) {
    if (typeof item !== "object" || item === null) continue;
    const it = item as Record<string, unknown>;
    const qty = toNumber(it.qty, 1);
    const unitPrice = toNumber(it.unitPrice, 0);
    lineItems.push({
      category: CATEGORIES.includes(it.category as LineItemCategory)
        ? (it.category as LineItemCategory)
        : "Other",
      description: typeof it.description === "string" ? it.description : "",
      qty,
      unit: UNITS.includes(it.unit as LineItemUnit)
        ? (it.unit as LineItemUnit)
        : "each",
      unitPrice,
      total: toNumber(it.total, qty * unitPrice),
    });
  }
  if (lineItems.length === 0) return null;

  return {
    title: typeof obj.title === "string" ? obj.title : "Estimate",
    summary: typeof obj.summary === "string" ? obj.summary : "",
    lineItems,
    assumptions: toStringArray(obj.assumptions),
    exclusions: toStringArray(obj.exclusions),
    notes: typeof obj.notes === "string" ? obj.notes : "",
  };
}

function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}
