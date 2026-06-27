"use client";

import type { AlbumCardEntry } from "@/lib/album-types";
import {
  bestMarketPrice,
  conditionLabel,
  formatEur,
  formatPnl,
  pnlColor,
  statusColor,
  statusLabel,
} from "@/lib/format";

type CardRowProps = {
  card: AlbumCardEntry;
  suspicious?: boolean;
  onPurchasePriceChange: (price: number | undefined) => void;
  onRemove: () => void;
};

export function CardRow({
  card,
  suspicious = false,
  onPurchasePriceChange,
  onRemove,
}: CardRowProps) {
  const marketEur = bestMarketPrice({
    detected: card.detected,
    matchStatus: card.matchStatus,
    card: card.card,
    searchQuery: card.searchQuery,
  });
  const pnl =
    marketEur !== undefined && card.purchasePrice !== undefined
      ? marketEur - card.purchasePrice
      : undefined;
  const displayName = card.card?.name ?? card.detected.name;

  return (
    <article
      className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4 sm:p-5 ${
        suspicious ? "border-l-4 border-l-amber-400 bg-amber-500/5" : ""
      }`}
    >
      <div className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-900/80">
        {card.card?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.card.imageUrl}
            alt={card.card.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl">🃏</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-white">{displayName}</h3>
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
            Vision las: {card.detected.setName ?? "?"} · #{card.detected.cardNumber ?? "?"}
          </p>
        )}

        {suspicious && card.card && (
          <p className="mt-1 text-xs text-amber-200/80">
            Set of nummer lijkt niet te kloppen — verwijder als dit niet de juiste kaart is.
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/50">
          <span>Conditie: {conditionLabel(card.detected.condition)}</span>
          <span>Zekerheid: {Math.round(card.detected.confidence * 100)}%</span>
        </div>

        {card.error && <p className="mt-2 text-sm text-rose-300">{card.error}</p>}
      </div>

      <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[220px]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-wide text-white/50">Marktprijs</p>
            <p className="text-lg font-bold text-yellow-300">{formatEur(marketEur)}</p>
            <p className="text-xs text-white/40">Cardmarket trend (TCGdex)</p>
            {card.card?.cardmarketUrl && (
              <a
                href={card.card.cardmarketUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs text-sky-300 hover:underline"
              >
                Cardmarket →
              </a>
            )}
          </div>

          <div className="text-left sm:text-right">
            <label className="text-xs uppercase tracking-wide text-white/50">Betaald (€)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={card.purchasePrice ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                onPurchasePriceChange(val === "" ? undefined : parseFloat(val));
              }}
              placeholder="0,00"
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-2 py-1.5 text-right text-sm text-white placeholder:text-white/30 focus:border-yellow-300/50 focus:outline-none sm:w-24 sm:ml-auto"
            />
            <p className="mt-2 text-xs uppercase tracking-wide text-white/50">PnL</p>
            <p className={`text-lg font-bold ${pnlColor(pnl)}`}>{formatPnl(pnl)}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (confirm(`"${displayName}" verwijderen uit dit album?`)) {
              onRemove();
            }
          }}
          className="w-full rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20 sm:w-auto"
        >
          Verwijderen
        </button>
      </div>
    </article>
  );
}
