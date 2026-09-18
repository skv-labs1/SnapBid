import { DEFAULT_SETTINGS, SavedQuote, Settings } from "./types";

const SETTINGS_KEY = "snapbid:settings";
const PASSWORD_KEY = "snapbid:password";
const COUNTER_KEY = "snapbid:quoteCounter";
const HISTORY_KEY = "snapbid:history";

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage full or unavailable; nothing sensible to do in a demo
  }
}

export function loadSettings(): Settings {
  const raw = safeGet(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  safeSet(SETTINGS_KEY, JSON.stringify(settings));
}

export function resetSettings(): void {
  try {
    window.localStorage.removeItem(SETTINGS_KEY);
  } catch {
    // ignore
  }
}

export function loadPassword(): string {
  return safeGet(PASSWORD_KEY) ?? "";
}

export function savePassword(password: string): void {
  safeSet(PASSWORD_KEY, password);
}

export function clearPassword(): void {
  try {
    window.localStorage.removeItem(PASSWORD_KEY);
  } catch {
    // ignore
  }
}

/** Q-YYYYMMDD-XXX where XXX increments across all quotes on this device. */
export function nextQuoteNumber(): string {
  let counter = 0;
  const raw = safeGet(COUNTER_KEY);
  if (raw) {
    const parsed = parseInt(raw, 10);
    if (Number.isFinite(parsed)) counter = parsed;
  }
  counter += 1;
  safeSet(COUNTER_KEY, String(counter));
  const now = new Date();
  const ymd = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  return `Q-${ymd}-${String(counter).padStart(3, "0")}`;
}

export function loadHistory(): SavedQuote[] {
  const raw = safeGet(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Insert or update by quote number; keep the 10 most recent. */
export function saveToHistory(entry: SavedQuote): void {
  const history = loadHistory().filter(
    (h) => h.meta.quoteNumber !== entry.meta.quoteNumber
  );
  history.unshift(entry);
  safeSet(HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
}
