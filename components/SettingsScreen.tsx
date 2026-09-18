"use client";

import { useRef, useState } from "react";
import { resetSettings, saveSettings } from "@/lib/storage";
import { DEFAULT_SETTINGS, Settings } from "@/lib/types";

const ACCENT_PRESETS = [
  { name: "Navy", value: "#1e3a5f" },
  { name: "Forest green", value: "#1f5233" },
  { name: "Brick red", value: "#8c2f24" },
  { name: "Charcoal", value: "#333638" },
];

interface SettingsScreenProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onClose: () => void;
}

export default function SettingsScreen({
  settings,
  onSettingsChange,
  onClose,
}: SettingsScreenProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState("");

  function update(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    onSettingsChange(next);
    saveSettings(next);
  }

  async function handleLogo(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setLogoError("");
    try {
      const dataUrl = await resizeLogo(file, 400);
      update({ logoDataUrl: dataUrl });
    } catch {
      setLogoError("Could not read that image. Try a JPEG or PNG.");
    }
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  function handleReset() {
    if (!window.confirm("Reset all settings? Your logo and branding will be cleared.")) {
      return;
    }
    resetSettings();
    onSettingsChange({ ...DEFAULT_SETTINGS });
  }

  const text = (
    label: string,
    key: keyof Settings,
    placeholder = "",
    type = "text"
  ) => (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={String(settings[key] ?? "")}
        placeholder={placeholder}
        onChange={(e) => update({ [key]: e.target.value })}
        className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-base focus:border-gray-500 focus:outline-none"
      />
    </label>
  );

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-24">
      <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Business</h2>
        {text("Business name", "businessName")}
        {text("Tagline", "tagline")}
        {text("Address", "address")}
        {text("Phone", "phone", "", "tel")}
        {text("Email", "email", "", "email")}
        {text("Website", "website")}
        {text("Trade", "trade", "e.g. general contractor, plumber")}
      </section>

      <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Money & terms</h2>
        <label className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            HST registered
          </span>
          <input
            type="checkbox"
            checked={settings.hstRegistered}
            onChange={(e) => update({ hstRegistered: e.target.checked })}
            className="h-6 w-6"
          />
        </label>
        {settings.hstRegistered && text("HST number", "hstNumber")}
        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Default labour rate ($/hr)
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={settings.defaultLabourRate}
            onChange={(e) =>
              update({ defaultLabourRate: parseFloat(e.target.value) || 0 })
            }
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-base focus:border-gray-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Default payment terms
          </span>
          <textarea
            value={settings.paymentTerms}
            onChange={(e) => update({ paymentTerms: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-base focus:border-gray-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Quote validity (days)
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={settings.validityDays}
            onChange={(e) =>
              update({ validityDays: parseInt(e.target.value, 10) || 30 })
            }
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-base focus:border-gray-500 focus:outline-none"
          />
        </label>
      </section>

      <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Branding</h2>
        <div>
          <span className="text-sm font-medium text-gray-700">Logo</span>
          <div className="mt-1 flex items-center gap-3">
            {settings.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logoDataUrl}
                alt="Logo"
                className="h-14 max-w-[120px] rounded border object-contain"
              />
            ) : (
              <span className="text-sm text-gray-400">No logo yet</span>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleLogo(e.target.files)}
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
            >
              Upload
            </button>
            {settings.logoDataUrl && (
              <button
                type="button"
                onClick={() => update({ logoDataUrl: "" })}
                className="text-sm text-red-600"
              >
                Remove
              </button>
            )}
          </div>
          {logoError && (
            <p className="mt-1 text-sm text-red-600">{logoError}</p>
          )}
        </div>

        <div>
          <span className="text-sm font-medium text-gray-700">
            Accent color
          </span>
          <div className="mt-1 flex items-center gap-2">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                title={preset.name}
                aria-label={preset.name}
                onClick={() => update({ accentColor: preset.value })}
                className={`h-9 w-9 rounded-full border-2 ${
                  settings.accentColor === preset.value
                    ? "border-gray-900"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: preset.value }}
              />
            ))}
            <input
              type="color"
              value={settings.accentColor}
              onChange={(e) => update({ accentColor: e.target.value })}
              aria-label="Custom accent color"
              className="h-9 w-12 cursor-pointer rounded border border-gray-300"
            />
          </div>
        </div>

        <div>
          <span className="text-sm font-medium text-gray-700">
            Heading font
          </span>
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => update({ headingFont: "sans" })}
              className={`flex-1 rounded-lg border py-3 ${
                settings.headingFont === "sans"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300"
              }`}
            >
              Clean sans
            </button>
            <button
              type="button"
              onClick={() => update({ headingFont: "serif" })}
              style={{ fontFamily: "var(--font-serif-stack)" }}
              className={`flex-1 rounded-lg border py-3 ${
                settings.headingFont === "serif"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300"
              }`}
            >
              Warm serif
            </button>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={handleReset}
        className="w-full rounded-xl border border-red-300 bg-white py-3 font-semibold text-red-600"
      >
        Reset settings
      </button>

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-xl bg-blue-700 py-4 font-bold text-white active:bg-blue-800"
      >
        Done
      </button>
    </div>
  );
}

/** Resize an uploaded logo to at most `maxWidth` px wide, keep PNG transparency. */
function resizeLogo(file: File, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas unsupported"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
