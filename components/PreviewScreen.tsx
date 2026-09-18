"use client";

import { useState } from "react";
import { Quote, QuoteMeta, Settings } from "@/lib/types";
import { formatCAD, hstAmount, round2, subtotal } from "@/lib/money";
import QuoteDocument from "./QuoteDocument";

interface PreviewScreenProps {
  quote: Quote;
  meta: QuoteMeta;
  settings: Settings;
  onBack: () => void;
}

export default function PreviewScreen({
  quote,
  meta,
  settings,
  onBack,
}: PreviewScreenProps) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const sub = subtotal(quote.lineItems);
    const total = round2(sub + hstAmount(sub, settings.hstRegistered));
    const text = [
      `${settings.businessName || "Estimate"} — ${quote.title}`,
      quote.summary,
      `Total: ${formatCAD(total)} (${meta.quoteNumber})`,
    ]
      .filter(Boolean)
      .join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // user cancelled or share failed; fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable; nothing else to do
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-24">
      <div className="no-print flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl border border-gray-300 bg-white py-3 font-semibold"
        >
          Back to edit
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 rounded-xl bg-blue-700 py-3 font-bold text-white active:bg-blue-800"
        >
          Save as PDF
        </button>
        <button
          type="button"
          onClick={share}
          className="flex-1 rounded-xl border border-gray-300 bg-white py-3 font-semibold"
        >
          {copied ? "Copied!" : "Share"}
        </button>
      </div>
      <QuoteDocument quote={quote} meta={meta} settings={settings} />
    </div>
  );
}
