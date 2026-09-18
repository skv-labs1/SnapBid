export type LineItemCategory = "Labour" | "Materials" | "Other";
export type LineItemUnit = "hr" | "each" | "sq ft" | "lump";

export interface LineItem {
  category: LineItemCategory;
  description: string;
  qty: number;
  unit: LineItemUnit;
  unitPrice: number;
  total: number;
}

export interface Quote {
  title: string;
  summary: string;
  lineItems: LineItem[];
  assumptions: string[];
  exclusions: string[];
  notes: string;
}

export interface QuoteMeta {
  quoteNumber: string;
  date: string; // ISO date
  validUntil: string; // ISO date
  customerName: string;
  customerAddress: string;
  jobType: string;
}

export interface Settings {
  businessName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  hstNumber: string;
  hstRegistered: boolean;
  defaultLabourRate: number;
  trade: string;
  paymentTerms: string;
  validityDays: number;
  logoDataUrl: string;
  accentColor: string;
  headingFont: "sans" | "serif";
}

export const DEFAULT_SETTINGS: Settings = {
  businessName: "",
  tagline: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  hstNumber: "",
  hstRegistered: false,
  defaultLabourRate: 85,
  trade: "",
  paymentTerms:
    "50% deposit to schedule, balance on completion. E-transfer or cheque.",
  validityDays: 30,
  logoDataUrl: "",
  accentColor: "#1e3a5f",
  headingFont: "sans",
};

export const HST_RATE = 0.13;

export interface SavedQuote {
  quote: Quote;
  meta: QuoteMeta;
  savedAt: string;
}
