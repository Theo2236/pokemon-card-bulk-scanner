"use client";

import { useMemo, useState } from "react";
import type { Album } from "@/lib/album-types";
import { computeAlbumSummary, exportAlbumToExcel } from "@/lib/excel-export";
import { formatEur, formatPnl, pnlColor } from "@/lib/format";
import { isSuspiciousMatch } from "@/lib/match-utils";
import { CardRow } from "@/components/CardRow";
import { PendingScanReview } from "@/components/PendingScanReview";
import { ScannerUpload } from "@/components/ScannerUpload";
import type { MatchedCard, ScanResponse } from "@/lib/types";

type PendingScanProps = {
  scan: ScanResponse;
  previewUrl: string;
  cards: MatchedCard[];
  onRemoveCard: (index: number) => void;
  onRemoveSuspicious: () => void;
  onConfirm: () => void;
  onCancel: () => void;
};

type AlbumDetailProps = {
  album: Album;
  isScanning: boolean;
  scanError: string | null;
  onScan: (payload: { image: string; mimeType: string; dataUrl: string }) => Promise<void>;
  onRename: (name: string) => void;
  onPurchasePriceChange: (cardId: string, price: number | undefined) => void;
  onRemoveCard: (cardId: string) => void;
  onRemoveSuspiciousCards: () => void;
  onRemovePhoto: (photoId: string) => void;
  lastScan?: ScanResponse | null;
  pendingScan?: PendingScanProps | null;
};

export function AlbumDetail({
  album,
  isScanning,
  scanError,
  onScan,
  onRename,
  onPurchasePriceChange,
  onRemoveCard,
  onRemoveSuspiciousCards,
  onRemovePhoto,
  lastScan,
  pendingScan,
}: AlbumDetailProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(album.name);
  const [showOnlySuspicious, setShowOnlySuspicious] = useState(false);
  const summary = computeAlbumSummary(album);

  const suspiciousCount = useMemo(
    () => album.cards.filter(isSuspiciousMatch).length,
    [album.cards],
  );

  const visibleCards = useMemo(
    () =>
      showOnlySuspicious
        ? album.cards.filter(isSuspiciousMatch)
        : album.cards,
    [album.cards, showOnlySuspicious],
  );

  function handleRenameSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = editName.trim();
    if (trimmed) onRename(trimmed);
    setIsEditingName(false);
  }

  return (
    <div className="min-w-0 flex-1 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {isEditingName ? (
            <form onSubmit={handleRenameSubmit} className="flex gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xl font-bold text-white focus:border-yellow-300/50 focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="rounded-lg bg-yellow-400 px-3 py-1.5 text-sm font-medium text-slate-950"
              >
                Opslaan
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditName(album.name);
                setIsEditingName(true);
              }}
              className="text-left text-2xl font-bold text-white hover:text-yellow-300"
              title="Naam wijzigen"
            >
              {album.name} ✎
            </button>
          )}
          <p className="mt-1 text-sm text-white/50">
            {album.photos.length} foto{album.photos.length !== 1 ? "’s" : ""} ·{" "}
            {album.cards.length} kaart{album.cards.length !== 1 ? "en" : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={() => exportAlbumToExcel(album)}
          disabled={album.cards.length === 0}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          📊 Exporteer naar Excel
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Kaarten" value={String(summary.totalCards)} />
        <SummaryCard
          label="Marktwaarde"
          value={formatEur(summary.totalMarketValueEur)}
          sub="Cardmarket via TCGdex (EUR)"
          accent="yellow"
        />
        <SummaryCard
          label="Totaal betaald"
          value={formatEur(summary.totalPurchasePriceEur)}
          accent="slate"
        />
        <SummaryCard
          label="Totale PnL"
          value={formatPnl(summary.totalPnlEur)}
          accent={summary.totalPnlEur >= 0 ? "emerald" : "rose"}
          valueClass={pnlColor(summary.totalPnlEur)}
        />
      </div>

      <ScannerUpload
        onScan={onScan}
        isScanning={isScanning}
        compact={album.photos.length > 0}
        label={
          album.photos.length > 0
            ? "Nog een foto toevoegen aan dit album"
            : "Eerste foto toevoegen"
        }
      />

      {scanError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-200">
          {scanError}
        </div>
      )}

      {pendingScan && (
        <PendingScanReview
          scan={pendingScan.scan}
          previewUrl={pendingScan.previewUrl}
          cards={pendingScan.cards}
          onRemoveCard={pendingScan.onRemoveCard}
          onRemoveSuspicious={pendingScan.onRemoveSuspicious}
          onConfirm={pendingScan.onConfirm}
          onCancel={pendingScan.onCancel}
        />
      )}

      {lastScan && !pendingScan && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200">
          Laatste scan: {lastScan.summary.totalDetected} kaarten gedetecteerd (
          {lastScan.summary.matched} matches, {formatEur(lastScan.summary.totalMarketValue)}{" "}
          marktwaarde)
        </div>
      )}

      {album.photos.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/70">
            Foto&apos;s in album
          </h3>
          <div className="flex flex-wrap gap-3">
            {album.photos.map((photo) => {
              const cardCount = album.cards.filter((c) => c.photoId === photo.id).length;
              return (
                <div key={photo.id} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.imageDataUrl}
                    alt={`Foto ${new Date(photo.scannedAt).toLocaleDateString("nl-NL")}`}
                    className="h-24 w-24 rounded-lg border border-white/10 object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 rounded-b-lg bg-black/60 px-1 py-0.5 text-center text-[10px] text-white/80">
                    {cardCount} kaart{cardCount !== 1 ? "en" : ""}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Foto en bijbehorende kaarten verwijderen?")) {
                        onRemovePhoto(photo.id);
                      }
                    }}
                    className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs text-white group-hover:flex"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {album.cards.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Kaarten in album</h2>
                <p className="text-sm text-white/60">
                  Vul in wat je betaald hebt per kaart om je winst/verlies (PnL) te zien
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {suspiciousCount > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowOnlySuspicious((current) => !current)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        showOnlySuspicious
                          ? "border-amber-400/40 bg-amber-400/15 text-amber-200"
                          : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      Twijfelachtig ({suspiciousCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `${suspiciousCount} twijfelachtige kaarten verwijderen uit dit album?`,
                          )
                        ) {
                          onRemoveSuspiciousCards();
                          setShowOnlySuspicious(false);
                        }
                      }}
                      className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20"
                    >
                      Verwijder twijfelachtige
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="divide-y divide-white/10">
            {visibleCards.length > 0 ? (
              visibleCards.map((card) => (
                <CardRow
                  key={card.id}
                  card={card}
                  suspicious={isSuspiciousMatch(card)}
                  onPurchasePriceChange={(price) => onPurchasePriceChange(card.id, price)}
                  onRemove={() => onRemoveCard(card.id)}
                />
              ))
            ) : (
              <p className="px-5 py-8 text-center text-sm text-white/50">
                Geen twijfelachtige kaarten in dit album.
              </p>
            )}
          </div>
        </section>
      ) : (
        !isScanning && (
          <div className="rounded-xl border border-dashed border-white/15 px-6 py-10 text-center text-white/50">
            <p className="text-lg">Nog geen kaarten in dit album</p>
            <p className="mt-2 text-sm">Upload een foto met Pokémon kaarten om te beginnen.</p>
          </div>
        )
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  accent = "slate",
  valueClass,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "slate" | "emerald" | "amber" | "yellow" | "rose";
  valueClass?: string;
}) {
  const accents = {
    slate: "border-white/10",
    emerald: "border-emerald-500/30",
    amber: "border-amber-500/30",
    yellow: "border-yellow-400/40",
    rose: "border-rose-500/30",
  };

  return (
    <div className={`rounded-xl border bg-white/5 p-4 ${accents[accent]}`}>
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueClass ?? "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-white/40">{sub}</p>}
    </div>
  );
}
