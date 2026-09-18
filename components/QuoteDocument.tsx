"use client";

import {
  LineItem,
  LineItemCategory,
  Quote,
  QuoteMeta,
  Settings,
} from "@/lib/types";
import { formatCAD, hstAmount, lineTotal, round2, subtotal } from "@/lib/money";

const CATEGORY_ORDER: LineItemCategory[] = ["Labour", "Materials", "Other"];

interface QuoteDocumentProps {
  quote: Quote;
  meta: QuoteMeta;
  settings: Settings;
}

export default function QuoteDocument({
  quote,
  meta,
  settings,
}: QuoteDocumentProps) {
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: quote.lineItems.filter((item) => item.category === category),
  })).filter((g) => g.items.length > 0);

  const sub = subtotal(quote.lineItems);
  const hst = hstAmount(sub, settings.hstRegistered);
  const contactBits = [settings.phone, settings.email, settings.website].filter(
    Boolean
  );
  const headingFont =
    settings.headingFont === "serif"
      ? "var(--font-serif-stack)"
      : "var(--font-sans-stack)";

  return (
    <div
      className="print-area mx-auto max-w-2xl bg-white shadow-sm"
      style={
        {
          "--accent": settings.accentColor,
          "--font-heading": headingFont,
        } as React.CSSProperties
      }
    >
      {/* Header band */}
      <div
        className="flex items-center justify-between gap-4 p-5 text-white"
        style={{ backgroundColor: "var(--accent)" }}
      >
        <div className="flex items-center gap-3">
          {settings.logoDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoDataUrl}
              alt="Logo"
              className="max-h-16 max-w-[120px] rounded bg-white/90 object-contain p-1"
            />
          )}
        </div>
        <div className="text-right">
          <p
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {settings.businessName || "Your Business"}
          </p>
          {settings.tagline && (
            <p className="text-sm opacity-90">{settings.tagline}</p>
          )}
          {settings.address && (
            <p className="text-xs opacity-90">{settings.address}</p>
          )}
          {contactBits.length > 0 && (
            <p className="text-xs opacity-90">{contactBits.join(" · ")}</p>
          )}
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* Estimate header + customer */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{
                color: "var(--accent)",
                fontFamily: "var(--font-heading)",
              }}
            >
              Estimate
            </h1>
            <p className="text-sm text-gray-600">{meta.quoteNumber}</p>
            <p className="text-sm text-gray-600">
              Date: {formatDate(meta.date)}
            </p>
            <p className="text-sm text-gray-600">
              Valid until: {formatDate(meta.validUntil)}
            </p>
          </div>
          {(meta.customerName || meta.customerAddress) && (
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Prepared for
              </p>
              {meta.customerName && (
                <p className="font-medium">{meta.customerName}</p>
              )}
              {meta.customerAddress && (
                <p className="text-sm text-gray-600">{meta.customerAddress}</p>
              )}
            </div>
          )}
        </div>

        {/* Title and summary */}
        <div>
          <h2
            className="text-lg font-semibold"
            style={{
              color: "var(--accent)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {quote.title}
          </h2>
          {quote.summary && (
            <p className="mt-1 text-sm text-gray-700">{quote.summary}</p>
          )}
        </div>

        {/* Line items grouped by category */}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 text-left" style={{ borderColor: "var(--accent)" }}>
              <th className="py-2 pr-2 font-semibold">Description</th>
              <th className="py-2 pr-2 text-right font-semibold">Qty</th>
              <th className="py-2 pr-2 font-semibold">Unit</th>
              <th className="py-2 pr-2 text-right font-semibold">Price</th>
              <th className="py-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <GroupRows key={group.category} {...group} />
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="ml-auto w-56 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCAD(sub)}</span>
          </div>
          {settings.hstRegistered && (
            <div className="flex justify-between">
              <span>HST (13%)</span>
              <span>{formatCAD(hst)}</span>
            </div>
          )}
          <div
            className="flex justify-between rounded px-2 py-1.5 font-bold text-white"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <span>Total</span>
            <span>{formatCAD(round2(sub + hst))}</span>
          </div>
        </div>

        {/* Assumptions / exclusions */}
        {(quote.assumptions.length > 0 || quote.exclusions.length > 0) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {quote.assumptions.length > 0 && (
              <div>
                <h3
                  className="text-sm font-semibold"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Assumptions
                </h3>
                <ul className="mt-1 list-disc pl-5 text-xs text-gray-700">
                  {quote.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            {quote.exclusions.length > 0 && (
              <div>
                <h3
                  className="text-sm font-semibold"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Not included
                </h3>
                <ul className="mt-1 list-disc pl-5 text-xs text-gray-700">
                  {quote.exclusions.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Payment terms + signature */}
        <div className="border-t pt-4 text-sm">
          <p className="text-gray-700">{settings.paymentTerms}</p>
          <p className="mt-8 text-gray-700">
            Accepted by ______________________ Date ______________
          </p>
        </div>

        {/* Footer */}
        <div className="border-t pt-3 text-center text-xs text-gray-500">
          {settings.hstRegistered && settings.hstNumber && (
            <p>HST # {settings.hstNumber}</p>
          )}
          <p>
            {[settings.businessName, ...contactBits].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
    </div>
  );
}

function GroupRows({
  category,
  items,
}: {
  category: LineItemCategory;
  items: LineItem[];
}) {
  const groupSub = round2(items.reduce((sum, item) => sum + lineTotal(item), 0));
  return (
    <>
      <tr>
        <td
          colSpan={5}
          className="pt-3 pb-1 text-xs font-bold uppercase tracking-wide"
          style={{ color: "var(--accent)" }}
        >
          {category}
        </td>
      </tr>
      {items.map((item, i) => (
        <tr key={i} className="border-b border-gray-100">
          <td className="py-1.5 pr-2">
            {item.description}
            {item.unitPrice === 0 && (
              <span className="text-gray-400"> (TBD)</span>
            )}
          </td>
          <td className="py-1.5 pr-2 text-right">{item.qty}</td>
          <td className="py-1.5 pr-2">{item.unit}</td>
          <td className="py-1.5 pr-2 text-right">{formatCAD(item.unitPrice)}</td>
          <td className="py-1.5 text-right">{formatCAD(lineTotal(item))}</td>
        </tr>
      ))}
      <tr>
        <td colSpan={4} className="py-1 pr-2 text-right text-xs text-gray-500">
          {category} subtotal
        </td>
        <td className="py-1 text-right text-xs font-semibold">
          {formatCAD(groupSub)}
        </td>
      </tr>
    </>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
