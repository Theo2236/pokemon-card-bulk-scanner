"use client";

import { useCallback, useRef, useState } from "react";
import { fileToBase64 } from "@/lib/format";
import { normalizeImageForScan } from "@/lib/image-normalize";

type ScannerUploadProps = {
  onScan: (payload: { image: string; mimeType: string; dataUrl: string }) => Promise<void>;
  isScanning: boolean;
  label?: string;
  compact?: boolean;
};

export function ScannerUpload({
  onScan,
  isScanning,
  label = "Kies een foto uit je bibliotheek of maak een nieuwe",
  compact = false,
}: ScannerUploadProps) {
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetInputs = useCallback(() => {
    if (libraryInputRef.current) libraryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!file.type.startsWith("image/")) {
        setError("Upload een afbeeldingsbestand (JPG, PNG of WebP).");
        return;
      }

      if (file.size > 12 * 1024 * 1024) {
        setError("Afbeelding is te groot (max 12 MB).");
        return;
      }

      const normalized = await normalizeImageForScan(file);
      const objectUrl = URL.createObjectURL(normalized);
      setPreview(objectUrl);

      try {
        const { base64, mimeType, dataUrl } = await fileToBase64(normalized);
        await onScan({ image: base64, mimeType, dataUrl });
        URL.revokeObjectURL(objectUrl);
        setPreview(null);
        resetInputs();
      } catch (scanError) {
        setError(
          scanError instanceof Error
            ? scanError.message
            : "Kon de afbeelding niet verwerken.",
        );
      }
    },
    [onScan, resetInputs],
  );

  const openLibrary = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    libraryInputRef.current?.click();
  }, []);

  const openCamera = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    cameraInputRef.current?.click();
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);
      const file = event.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  return (
    <section
      className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur ${
        compact ? "p-4" : "p-6"
      }`}
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition ${
          compact ? "min-h-32 p-4" : "min-h-48 p-8"
        } ${
          dragOver
            ? "border-yellow-300 bg-yellow-300/10"
            : "border-white/20 hover:border-white/40 hover:bg-white/5"
        }`}
      >
        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Preview van geüploade kaarten"
            className={`w-full rounded-lg object-contain ${compact ? "max-h-40" : "max-h-72"}`}
          />
        ) : (
          <div className="text-center">
            <div
              className={`mx-auto mb-3 flex items-center justify-center rounded-full bg-yellow-400/20 text-2xl ${
                compact ? "h-10 w-10" : "h-14 w-14 text-3xl"
              }`}
            >
              📸
            </div>
            <h2 className={`font-semibold text-white ${compact ? "text-sm" : "text-lg"}`}>
              {label}
            </h2>
            {!compact && (
              <p className="mt-2 max-w-md text-sm text-white/60">
                Kies een bestaande foto uit je bibliotheek of maak een nieuwe. Meerdere foto&apos;s
                per album mogelijk.
              </p>
            )}
            <div
              className={`mt-4 flex flex-wrap items-center justify-center gap-2 ${
                compact ? "mt-3" : ""
              }`}
            >
              <button
                type="button"
                onClick={openLibrary}
                disabled={isScanning}
                className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Bibliotheek
              </button>
              <button
                type="button"
                onClick={openCamera}
                disabled={isScanning}
                className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Camera
              </button>
            </div>
            {!compact && (
              <p className="mt-3 text-xs text-white/40">
                Op desktop kun je ook een bestand hierheen slepen.
              </p>
            )}
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-950/70">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-yellow-300 border-t-transparent" />
              <p className="font-medium text-white">Kaarten analyseren…</p>
              <p className="text-sm text-white/60">Vision AI + prijslookup</p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
    </section>
  );
}
