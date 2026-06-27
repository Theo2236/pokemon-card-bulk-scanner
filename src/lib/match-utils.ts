import type { AlbumCardEntry } from "./album-types";
import { numbersMatch, setNamesMatch } from "./card-match";
import type { MatchedCard, ScanSummary } from "./types";

type MatchLike = Pick<AlbumCardEntry, "detected" | "matchStatus" | "card">;

export function isSuspiciousMatch(entry: MatchLike): boolean {
  if (entry.matchStatus === "not_found" || entry.matchStatus === "partial") {
    return true;
  }

  if (!entry.card) return true;

  if (entry.detected.confidence < 0.75) return true;

  if (
    entry.detected.setName &&
    !setNamesMatch(entry.detected.setName, entry.card.set)
  ) {
    return true;
  }

  if (
    entry.detected.cardNumber &&
    !numbersMatch(entry.detected.cardNumber, entry.card.number)
  ) {
    return true;
  }

  return false;
}

export function buildScanSummary(cards: MatchedCard[]): ScanSummary {
  return {
    totalDetected: cards.length,
    matched: cards.filter((card) => card.matchStatus === "matched").length,
    partial: cards.filter((card) => card.matchStatus === "partial").length,
    notFound: cards.filter((card) => card.matchStatus === "not_found").length,
    totalMarketValue: cards.reduce((sum, item) => {
      const prices = item.card?.prices ?? [];
      let best = 0;
      for (const price of prices) {
        const candidate = price.market ?? price.mid ?? price.low ?? 0;
        if (candidate > best) best = candidate;
      }
      return sum + best;
    }, 0),
    currency: "EUR",
  };
}
