"use client";

import {
  bestMarketPrice,
  conditionLabel,
  formatEur,
  statusColor,
  statusLabel,
} from "@/lib/format";
import { isSuspiciousMatch } from "@/lib/match-utils";
import type { MatchedCard, ScanResponse } from "@/lib/types";

type PendingScanReviewProps = {
  scan: ScanResponse;
  previewUrl: string;
  cards: MatchedCard[];
  onRemoveCard: (index: number) => void;
  onRemoveSuspicious: () => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function PendingScanReview({
  scan,
  previewUrl,
  cards,
  onRemoveCard,
  onRemoveSuspicious,
  onConfirm,
  onCancel,
}: PendingScanReviewProps) {
  const suspiciousCount = cards.filter(isSuspiciousMatch).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-yellow-400/30 bg-yellow-400/5">
      <div className="border-b border-yellow-400/20 px-5 py-4">
        <h2 className="text-lg font-semibold text-white">Scan controleren</h2>
        <p className="mt-1 text-sm text-white/70">
          Verwijder kaarten die niet kloppen vóór je ze aan het album toevoegt.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={cards.length === 0}
            className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {cards.length} kaart{cards.length !== 1 ? "en" : ""} toevoegen aan album
          </button>
          {suspiciousCount > 0 && (
            <button
              type="button"
              onClick={onRemoveSuspicious}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/20"
            >
              Verwijder {suspiciousCount} twijfelachtige
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
          >
            Annuleren
          </button>
        </div>
      </div>

      <div className="grid gap-4 border-b border-yellow-400/20 p-5 lg:grid-cols-[120px_1fr]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Gescande foto"
          className="h-28 w-full rounded-lg border border-white/10 object-cover lg:h-32 lg:w-28"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Gedetecteerd" value={String(cards.length)} />
          <Stat label="Twijfelachtig" value={String(suspiciousCount)} accent="amber" />
          <Stat label="Provider" value={scan.provider} />
        </div>
      </div>

      <div className="divide-y divide-white/10">
        {cards.length === 0 ? (
          <p className="px-5 py-8 text-center text-white/50">
            Geen kaarten geselecteerd. Annuleer of scan opnieuw.
          </p>
        ) : (
          cards.map((card, index) => {
            const suspicious = isSuspiciousMatch(card);
            const market = bestMarketPrice(card);

            return (
              <article
                key={`${card.detected.index}-${card.detected.name}-${index}`}
                className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5 ${
                  suspicious ? "bg-amber-500/5" : ""
                }`}
              >
                <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-900/80">
                  {card.card?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.card.imageUrl}
                      alt={card.card.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xl">🃏</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-white">
                      {card.card?.name ?? card.detected.name}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColor(card.matchStatus)}`}
                    >
                      {statusLabel(card.matchStatus)}
                    </span>
                    {suspicious && (
                      <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-200 ring-1 ring-inset ring-amber-500/30">
                        Controleer
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-white/70">
                    {card.card
                      ? `${card.card.set} · #${card.card.number} · ${card.card.rarity}`
                      : `Gedetecteerd: ${card.detected.name}`}
                  </p>

                  {(card.detected.setName || card.detected.cardNumber) && (
                    <p className="mt-1 text-xs text-white/45">
                      Vision: {card.detected.setName ?? "?"} · #{card.detected.cardNumber ?? "?"}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/50">
                    <span>Conditie: {conditionLabel(card.detected.condition)}</span>
                    <span>Zekerheid: {Math.round(card.detected.confidence * 100)}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-white/50">Marktprijs</p>
                    <p className="text-lg font-bold text-yellow-300">{formatEur(market)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveCard(index)}
                    className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20"
                  >
                    Verwijderen
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: string;
  accent?: "slate" | "amber";
}) {
  return (
    <div
      className={`rounded-xl border bg-white/5 p-3 ${
        accent === "amber" ? "border-amber-500/30" : "border-white/10"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}
