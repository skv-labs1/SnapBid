import { HST_RATE, LineItem } from "./types";

export function formatCAD(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

export function lineTotal(item: LineItem): number {
  return round2(item.qty * item.unitPrice);
}

export function subtotal(items: LineItem[]): number {
  return round2(items.reduce((sum, item) => sum + lineTotal(item), 0));
}

export function hstAmount(sub: number, hstRegistered: boolean): number {
  return hstRegistered ? round2(sub * HST_RATE) : 0;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
