"use client";

import { useEffect, useRef, useState } from "react";
import CaptureScreen from "@/components/CaptureScreen";
import ReviewScreen from "@/components/ReviewScreen";
import PreviewScreen from "@/components/PreviewScreen";
import { dataUrlToBase64 } from "@/lib/image";
import {
  clearPassword,
  loadPassword,
  loadSettings,
  nextQuoteNumber,
  savePassword,
} from "@/lib/storage";
import { DEFAULT_SETTINGS, Quote, QuoteMeta, Settings } from "@/lib/types";

type Screen = "capture" | "review" | "preview";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("capture");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const [photos, setPhotos] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [jobType, setJobType] = useState("");

  const [quote, setQuote] = useState<Quote | null>(null);
  const [meta, setMeta] = useState<QuoteMeta | null>(null);

  const [building, setBuilding] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState("");
  const [askPassword, setAskPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function handleBuild() {
    setError("");
    if (!loadPassword()) {
      setAskPassword(true);
      return;
    }
    void buildQuote();
  }

  function submitPassword() {
    const value = passwordInput.trim();
    if (!value) return;
    savePassword(value);
    setAskPassword(false);
    setPasswordInput("");
    void buildQuote();
  }

  async function buildQuote() {
    setBuilding(true);
    setProgressMessage("Reading your photos and notes…");
    const controller = new AbortController();
    abortRef.current = controller;
    const slowTimer = setTimeout(
      () => setProgressMessage("Drafting your quote… usually 10–30 seconds."),
      4000
    );

    try {
      const currentSettings = loadSettings();
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app-password": loadPassword(),
        },
        signal: controller.signal,
        body: JSON.stringify({
          description,
          jobType,
          customerName,
          images: photos.map(dataUrlToBase64),
          settings: {
            businessName: currentSettings.businessName,
            trade: currentSettings.trade,
            defaultLabourRate: currentSettings.defaultLabourRate,
            hstRegistered: currentSettings.hstRegistered,
          },
        }),
      });

      if (response.status === 401) {
        clearPassword();
        setError("Wrong password. Tap Build quote to enter it again.");
        return;
      }
      if (response.status === 413) {
        setError("The photos are too large. Remove a photo and try again.");
        return;
      }

      let data: { quote?: Quote; error?: string } = {};
      try {
        data = await response.json();
      } catch {
        // non-JSON error body; handled below
      }

      if (response.status === 429) {
        setError(data.error ?? "The AI is busy. Wait a minute and try again.");
        return;
      }
      if (response.status === 422) {
        setError(
          "The AI returned something unexpected. Tap Build quote to try again."
        );
        return;
      }
      if (!response.ok || !data.quote) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }

      const now = new Date();
      const validUntil = new Date(now);
      validUntil.setDate(
        validUntil.getDate() + (currentSettings.validityDays || 30)
      );
      setQuote(data.quote);
      setMeta({
        quoteNumber: nextQuoteNumber(),
        date: now.toISOString(),
        validUntil: validUntil.toISOString(),
        customerName,
        customerAddress,
        jobType,
      });
      setScreen("review");
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setError("");
      } else {
        setError("Network problem. Check your connection and try again.");
      }
    } finally {
      clearTimeout(slowTimer);
      setBuilding(false);
      abortRef.current = null;
    }
  }

  function cancelBuild() {
    abortRef.current?.abort();
  }

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold">SnapBid</h1>
      </header>

      {screen === "capture" && (
        <CaptureScreen
          photos={photos}
          onPhotosChange={setPhotos}
          description={description}
          onDescriptionChange={setDescription}
          customerName={customerName}
          onCustomerNameChange={setCustomerName}
          customerAddress={customerAddress}
          onCustomerAddressChange={setCustomerAddress}
          jobType={jobType}
          onJobTypeChange={setJobType}
          building={building}
          progressMessage={progressMessage}
          error={error}
          onBuild={handleBuild}
          onCancel={cancelBuild}
        />
      )}

      {screen === "review" && quote && meta && (
        <ReviewScreen
          quote={quote}
          onQuoteChange={setQuote}
          meta={meta}
          hstRegistered={settings.hstRegistered}
          onBack={() => setScreen("capture")}
          onPreview={() => setScreen("preview")}
        />
      )}

      {screen === "preview" && quote && meta && (
        <PreviewScreen
          quote={quote}
          meta={meta}
          settings={settings}
          onBack={() => setScreen("review")}
        />
      )}

      {askPassword && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5">
            <h2 className="text-lg font-semibold">App password</h2>
            <p className="mt-1 text-sm text-gray-600">
              Enter the password once; it will be remembered on this phone.
            </p>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitPassword()}
              autoFocus
              className="mt-3 w-full rounded-lg border border-gray-300 p-3 text-base focus:border-gray-500 focus:outline-none"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setAskPassword(false)}
                className="flex-1 rounded-lg border border-gray-300 py-3 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitPassword}
                className="flex-1 rounded-lg bg-blue-700 py-3 font-semibold text-white"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
