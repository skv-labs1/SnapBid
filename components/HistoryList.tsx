"use client";

import { SavedQuote } from "@/lib/types";
import { formatCAD, hstAmount, round2, subtotal } from "@/lib/money";

interface HistoryListProps {
  history: SavedQuote[];
  hstRegistered: boolean;
  onOpen: (entry: SavedQuote) => void;
}

export default function HistoryList({
  history,
  hstRegistered,
  onOpen,
}: HistoryListProps) {
  if (history.length === 0) return null;
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold">Recent quotes</h2>
      <ul className="divide-y divide-gray-100">
        {history.map((entry) => {
          const sub = subtotal(entry.quote.lineItems);
          const total = round2(sub + hstAmount(sub, hstRegistered));
          return (
            <li key={entry.meta.quoteNumber}>
              <button
                type="button"
                onClick={() => onOpen(entry)}
                className="flex w-full items-center justify-between gap-2 py-3 text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {entry.quote.title || "Untitled quote"}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {entry.meta.quoteNumber} ·{" "}
                    {new Date(entry.meta.date).toLocaleDateString("en-CA")}
                  </span>
                </span>
                <span className="shrink-0 font-semibold">
                  {formatCAD(total)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
