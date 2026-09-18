"use client";

import { useEffect, useRef, useState } from "react";
import { resizeToJpeg } from "@/lib/image";

const MAX_PHOTOS = 6;

// Minimal typings for the Web Speech API, which TypeScript doesn't ship.
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface CaptureScreenProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  customerName: string;
  onCustomerNameChange: (value: string) => void;
  customerAddress: string;
  onCustomerAddressChange: (value: string) => void;
  jobType: string;
  onJobTypeChange: (value: string) => void;
  building: boolean;
  progressMessage: string;
  error: string;
  onBuild: () => void;
  onCancel: () => void;
}

export default function CaptureScreen(props: CaptureScreenProps) {
  const {
    photos,
    onPhotosChange,
    description,
    onDescriptionChange,
    building,
    progressMessage,
    error,
  } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const descriptionRef = useRef(description);
  descriptionRef.current = description;

  useEffect(() => {
    setSpeechSupported(getSpeechRecognition() !== null);
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPhotoError("");
    const room = MAX_PHOTOS - photos.length;
    const selected = Array.from(files).slice(0, room);
    if (files.length > room) {
      setPhotoError(`Maximum ${MAX_PHOTOS} photos. Extra photos were skipped.`);
    }
    const resized: string[] = [];
    for (const file of selected) {
      try {
        resized.push(await resizeToJpeg(file));
      } catch {
        setPhotoError("One photo could not be read and was skipped.");
      }
    }
    if (resized.length > 0) onPhotosChange([...photos, ...resized]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function startListening() {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = "en-CA";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          if (text) {
            const current = descriptionRef.current;
            props.onDescriptionChange(
              current ? `${current.replace(/\s+$/, "")} ${text}` : text
            );
          }
        } else {
          interimText += result[0].transcript;
        }
      }
      setInterim(interimText);
    };
    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };
    recognition.onerror = () => {
      setListening(false);
      setInterim("");
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
    setInterim("");
  }

  const canBuild =
    (description.trim().length > 0 || photos.length > 0) && !building;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Site photos</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={photos.length >= MAX_PHOTOS || building}
          className="w-full rounded-lg bg-gray-900 py-4 text-lg font-semibold text-white active:bg-gray-700 disabled:bg-gray-300"
        >
          📷 Take photo
        </button>
        <p className="mt-2 text-sm text-gray-500">
          {photos.length}/{MAX_PHOTOS} photos
        </p>
        {photoError && <p className="mt-1 text-sm text-red-600">{photoError}</p>}
        {photos.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {photos.map((photo, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`Site photo ${i + 1}`}
                  className="aspect-square w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  aria-label={`Remove photo ${i + 1}`}
                  onClick={() =>
                    onPhotosChange(photos.filter((_, j) => j !== i))
                  }
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-sm text-white shadow"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Describe the job</h2>
        {speechSupported ? (
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            disabled={building}
            className={`mb-3 w-full rounded-lg py-4 text-lg font-semibold text-white ${
              listening ? "animate-pulse bg-red-600" : "bg-gray-900"
            } disabled:bg-gray-300`}
          >
            {listening ? "⏹ Stop recording" : "🎤 Start talking"}
          </button>
        ) : (
          <p className="mb-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            Use the mic on your keyboard to dictate.
          </p>
        )}
        <textarea
          value={interim ? `${description} ${interim}`.trim() : description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          readOnly={listening}
          rows={5}
          placeholder="Walk through the job: what needs doing, materials, sizes, anything the photos don't show…"
          className="w-full rounded-lg border border-gray-300 p-3 text-base focus:border-gray-500 focus:outline-none"
        />
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Job details</h2>
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Customer name
            </span>
            <input
              type="text"
              value={props.customerName}
              onChange={(e) => props.onCustomerNameChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-base focus:border-gray-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Customer address
            </span>
            <input
              type="text"
              value={props.customerAddress}
              onChange={(e) => props.onCustomerAddressChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-base focus:border-gray-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Job type</span>
            <input
              type="text"
              value={props.jobType}
              onChange={(e) => props.onJobTypeChange(e.target.value)}
              placeholder="e.g. bathroom reno, deck, roof repair"
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-base focus:border-gray-500 focus:outline-none"
            />
          </label>
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {building ? (
        <div className="space-y-3 rounded-xl bg-white p-4 text-center shadow-sm">
          {photos.length > 0 && (
            <div className="flex justify-center gap-2">
              {photos.map((photo, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={photo}
                  alt=""
                  className="h-12 w-12 rounded object-cover opacity-70"
                />
              ))}
            </div>
          )}
          <p className="animate-pulse text-base font-medium">
            {progressMessage}
          </p>
          <button
            type="button"
            onClick={props.onCancel}
            className="w-full rounded-lg border border-gray-300 py-3 font-semibold"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={props.onBuild}
          disabled={!canBuild}
          className="w-full rounded-xl bg-blue-700 py-4 text-lg font-bold text-white shadow active:bg-blue-800 disabled:bg-gray-300"
        >
          Build quote
        </button>
      )}
    </div>
  );
}
