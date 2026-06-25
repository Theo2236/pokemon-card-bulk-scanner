"use client";

import { useState } from "react";
import { AlbumDetail } from "@/components/AlbumDetail";
import { AlbumList } from "@/components/AlbumList";
import { useAlbums } from "@/hooks/useAlbums";
import type { ScanResponse } from "@/lib/types";

export function AlbumManager() {
  const {
    albums,
    activeAlbum,
    activeAlbumId,
    setActiveAlbumId,
    isLoading,
    createAlbum,
    deleteAlbum,
    renameAlbum,
    addScanToAlbum,
    updateCardPurchasePrice,
    removeCard,
    removePhoto,
  } = useAlbums();

  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<ScanResponse | null>(null);

  async function handleScan(payload: { image: string; mimeType: string; dataUrl: string }) {
    if (!activeAlbumId) {
      setScanError("Selecteer of maak eerst een album aan.");
      return;
    }

    setIsScanning(true);
    setScanError(null);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: payload.image, mimeType: payload.mimeType }),
      });

      const data = (await response.json()) as ScanResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Scan mislukt");
      }

      await addScanToAlbum(activeAlbumId, data, payload.dataUrl, payload.mimeType);
      setLastScan(data);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setIsScanning(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-yellow-300 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-yellow-300">
          AI Bulk Scanner
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Pokémon Kaart Scanner
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-white/70">
          Maak albums aan, voeg meerdere foto&apos;s toe, zie actuele marktprijzen, vul in wat je
          betaald hebt en bereken je winst. Exporteer alles naar Excel.
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <AlbumList
          albums={albums}
          activeAlbumId={activeAlbumId}
          onSelect={(id) => {
            setActiveAlbumId(id);
            setLastScan(null);
            setScanError(null);
          }}
          onCreate={(name) => void createAlbum(name)}
          onDelete={(id) => void deleteAlbum(id)}
        />

        {activeAlbum ? (
          <AlbumDetail
            album={activeAlbum}
            isScanning={isScanning}
            scanError={scanError}
            onScan={handleScan}
            onRename={(name) => void renameAlbum(activeAlbum.id, name)}
            onPurchasePriceChange={(cardId, price) =>
              void updateCardPurchasePrice(activeAlbum.id, cardId, price)
            }
            onRemoveCard={(cardId) => void removeCard(activeAlbum.id, cardId)}
            onRemovePhoto={(photoId) => void removePhoto(activeAlbum.id, photoId)}
            lastScan={lastScan}
          />
        ) : (
          <div className="flex min-h-64 flex-1 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5">
            <div className="text-center text-white/50">
              <p className="text-lg font-medium">Geen album geselecteerd</p>
              <p className="mt-2 text-sm">Maak links een nieuw album aan om te beginnen.</p>
            </div>
          </div>
        )}
      </div>

      <footer className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
        <p className="font-medium text-white">Tips</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Maak aparte albums per set, aankoop of verkooplot</li>
          <li>Voeg meerdere foto&apos;s toe aan hetzelfde album</li>
          <li>Marktprijzen komen van TCGPlayer (USD); PnL wordt berekend in EUR (koers 0,92)</li>
          <li>Exporteer je album naar Excel voor je administratie</li>
        </ul>
      </footer>
    </div>
  );
}
