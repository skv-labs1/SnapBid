"use client";

import {
  LineItem,
  LineItemCategory,
  LineItemUnit,
  Quote,
  QuoteMeta,
} from "@/lib/types";
import { formatCAD, hstAmount, lineTotal, subtotal } from "@/lib/money";

const CATEGORIES: LineItemCategory[] = ["Labour", "Materials", "Other"];
const UNITS: LineItemUnit[] = ["hr", "each", "sq ft", "lump"];

interface ReviewScreenProps {
  quote: Quote;
  onQuoteChange: (quote: Quote) => void;
  meta: QuoteMeta;
  hstRegistered: boolean;
  onBack: () => void;
  onPreview: () => void;
}

export default function ReviewScreen({
  quote,
  onQuoteChange,
  meta,
  hstRegistered,
  onBack,
  onPreview,
}: ReviewScreenProps) {
  function updateItem(index: number, patch: Partial<LineItem>) {
    const items = quote.lineItems.map((item, i) =>
      i === index ? { ...item, ...patch } : item
    );
    onQuoteChange({ ...quote, lineItems: items });
  }

  function addRow() {
    onQuoteChange({
      ...quote,
      lineItems: [
        ...quote.lineItems,
        {
          category: "Other",
          description: "",
          qty: 1,
          unit: "each",
          unitPrice: 0,
          total: 0,
        },
      ],
    });
  }

  function deleteRow(index: number) {
    onQuoteChange({
      ...quote,
      lineItems: quote.lineItems.filter((_, i) => i !== index),
    });
  }

  function updateList(
    key: "assumptions" | "exclusions",
    text: string
  ) {
    onQuoteChange({
      ...quote,
      [key]: text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    });
  }

  const sub = subtotal(quote.lineItems);
  const hst = hstAmount(sub, hstRegistered);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-24">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">
          {meta.quoteNumber} · {formatDate(meta.date)} · valid until{" "}
          {formatDate(meta.validUntil)}
        </p>
        <input
          type="text"
          value={quote.title}
          onChange={(e) => onQuoteChange({ ...quote, title: e.target.value })}
          className="mt-2 w-full rounded-lg border border-gray-200 p-2 text-lg font-semibold focus:border-gray-500 focus:outline-none"
          aria-label="Quote title"
        />
        <textarea
          value={quote.summary}
          onChange={(e) => onQuoteChange({ ...quote, summary: e.target.value })}
          rows={3}
          className="mt-2 w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-gray-500 focus:outline-none"
          aria-label="Quote summary"
        />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Line items</h2>
        <div className="space-y-3">
          {quote.lineItems.map((item, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-start gap-2">
                <textarea
                  value={item.description}
                  onChange={(e) =>
                    updateItem(i, { description: e.target.value })
                  }
                  rows={2}
                  className="w-full rounded border border-gray-200 p-2 text-sm focus:border-gray-500 focus:outline-none"
                  aria-label={`Item ${i + 1} description`}
                />
                <button
                  type="button"
                  onClick={() => deleteRow(i)}
                  aria-label={`Delete item ${i + 1}`}
                  className="rounded p-2 text-red-600"
                >
                  🗑
                </button>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                <label className="col-span-2 block">
                  <span className="text-xs text-gray-500">Category</span>
                  <select
                    value={item.category}
                    onChange={(e) =>
                      updateItem(i, {
                        category: e.target.value as LineItemCategory,
                      })
                    }
                    className="mt-0.5 w-full rounded border border-gray-200 p-2 text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="col-span-2 block">
                  <span className="text-xs text-gray-500">Unit</span>
                  <select
                    value={item.unit}
                    onChange={(e) =>
                      updateItem(i, { unit: e.target.value as LineItemUnit })
                    }
                    className="mt-0.5 w-full rounded border border-gray-200 p-2 text-sm"
                  >
                    {UNITS.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-gray-500">Qty</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={item.qty}
                    onChange={(e) =>
                      updateItem(i, { qty: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-0.5 w-full rounded border border-gray-200 p-2 text-sm"
                  />
                </label>
                <label className="col-span-2 block">
                  <span className="text-xs text-gray-500">Unit price ($)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(i, {
                        unitPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-0.5 w-full rounded border border-gray-200 p-2 text-sm"
                  />
                </label>
                <div className="flex flex-col justify-end text-right">
                  <span className="text-xs text-gray-500">Total</span>
                  <span className="p-2 text-sm font-semibold">
                    {formatCAD(lineTotal(item))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="mt-3 w-full rounded-lg border border-dashed border-gray-400 py-3 text-sm font-semibold text-gray-600"
        >
          + Add row
        </button>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="space-y-1 text-right">
          <p className="text-sm">
            Subtotal: <span className="font-semibold">{formatCAD(sub)}</span>
          </p>
          {hstRegistered && (
            <p className="text-sm">
              HST (13%): <span className="font-semibold">{formatCAD(hst)}</span>
            </p>
          )}
          <p className="text-lg font-bold">
            Total: {formatCAD(sub + hst)}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <label className="block">
          <span className="text-sm font-semibold">
            Assumptions (one per line)
          </span>
          <textarea
            defaultValue={quote.assumptions.join("\n")}
            onBlur={(e) => updateList("assumptions", e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-sm font-semibold">
            Exclusions (one per line)
          </span>
          <textarea
            defaultValue={quote.exclusions.join("\n")}
            onBlur={(e) => updateList("exclusions", e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </label>
        {quote.notes && (
          <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <span className="font-semibold">Double-check: </span>
            {quote.notes}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl border border-gray-300 bg-white py-4 font-semibold"
        >
          Back to capture
        </button>
        <button
          type="button"
          onClick={onPreview}
          className="flex-1 rounded-xl bg-blue-700 py-4 font-bold text-white active:bg-blue-800"
        >
          Preview quote
        </button>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
