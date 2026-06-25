import type { CardCondition, MatchedCard, ScanResponse } from "@/lib/types";

/** Vaste wisselkoers USD → EUR voor PnL-berekening */
export const USD_TO_EUR = 0.92;

export function usdToEur(usd: number): number {
  return usd * USD_TO_EUR;
}

export function formatUsd(value?: number): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatEur(value?: number): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatPnl(value?: number): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  const formatted = formatEur(value);
  if (value > 0) return `+${formatted}`;
  return formatted;
}

export function pnlColor(value?: number): string {
  if (value === undefined) return "text-white/50";
  if (value > 0) return "text-emerald-300";
  if (value < 0) return "text-rose-300";
  return "text-white/70";
}

export function conditionLabel(condition: CardCondition): string {
  const labels: Record<CardCondition, string> = {
    mint: "Mint",
    near_mint: "Near Mint",
    lightly_played: "Lightly Played",
    moderately_played: "Moderately Played",
    heavily_played: "Heavily Played",
    damaged: "Damaged",
    unknown: "Onbekend",
  };
  return labels[condition];
}

export function statusLabel(status: MatchedCard["matchStatus"]): string {
  const labels = {
    matched: "Match",
    partial: "Gedeeltelijk",
    not_found: "Niet gevonden",
  };
  return labels[status];
}

export function statusColor(status: MatchedCard["matchStatus"]): string {
  const colors = {
    matched: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    partial: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    not_found: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  };
  return colors[status];
}

export function bestMarketPrice(card: ScanResponse["cards"][number]): number | undefined {
  const prices = card.card?.prices ?? [];
  let best: number | undefined;
  for (const price of prices) {
    const candidate = price.market ?? price.mid ?? price.low;
    if (candidate !== undefined && (best === undefined || candidate > best)) {
      best = candidate;
    }
  }
  return best;
}

export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      resolve({ base64, mimeType: file.type || "image/jpeg", dataUrl });
    };
    reader.onerror = () => reject(new Error("Kon bestand niet lezen"));
    reader.readAsDataURL(file);
  });
}
