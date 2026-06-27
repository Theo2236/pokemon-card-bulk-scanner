import type { CardPrice, DetectedCard } from "./types";
import {
  numbersMatch,
  parseCollectorNumber,
  setNamesMatch,
} from "./card-match";

const TCGDEX_API = "https://api.tcgdex.net/v2";

export type TcgdexCardmarketPricing = {
  updated?: string;
  unit?: string;
  idProduct?: number;
  avg?: number | null;
  low?: number | null;
  trend?: number | null;
  "avg-holo"?: number | null;
  "low-holo"?: number | null;
  "trend-holo"?: number | null;
  avg1?: number | null;
  avg7?: number | null;
  avg30?: number | null;
};

type TcgdexCardBrief = {
  id: string;
  localId: string;
  name: string;
  image?: string;
};

type TcgdexCardDetail = {
  id: string;
  localId: string;
  name: string;
  rarity?: string;
  image?: string;
  set?: { id: string; name: string };
  pricing?: {
    cardmarket?: TcgdexCardmarketPricing;
  };
};

export function getTcgdexLanguage(): string {
  return process.env.TCGDEX_LANG?.trim() || "en";
}

function isFoilRarity(rarity?: string): boolean {
  if (!rarity) return false;
  const value = rarity.toLowerCase();
  return (
    value.includes("holo") ||
    value.includes("ultra") ||
    value.includes("secret") ||
    value.includes("illustration") ||
    value.includes("special") ||
    value.includes("rare holo")
  );
}

export function cardmarketPricingToCardPrices(
  pricing: TcgdexCardmarketPricing,
  foil: boolean,
): CardPrice[] {
  if (foil) {
    const market = pricing["trend-holo"] ?? pricing["avg-holo"] ?? undefined;
    if (market === undefined || market === null) return [];

    return [
      {
        variant: "foil",
        market,
        low: pricing["low-holo"] ?? undefined,
        mid: pricing["avg-holo"] ?? undefined,
      },
    ];
  }

  const market = pricing.trend ?? pricing.avg ?? undefined;
  if (market === undefined || market === null) return [];

  return [
    {
      variant: "normal",
      market,
      low: pricing.low ?? undefined,
      mid: pricing.avg ?? undefined,
    },
  ];
}

export function scoreTcgdexCard(
  detected: DetectedCard,
  card: { name: string; localId?: string; set?: { name?: string } },
): number {
  const detectedName = detected.name.trim().toLowerCase();
  const cardName = card.name.trim().toLowerCase();

  if (cardName !== detectedName && !cardName.startsWith(`${detectedName} `)) {
    return 0;
  }

  let score = cardName === detectedName ? 35 : 20;

  if (detected.cardNumber) {
    if (numbersMatch(detected.cardNumber, card.localId)) {
      score += 50;
    } else {
      score -= 40;
    }
  }

  if (detected.setName && card.set?.name) {
    if (setNamesMatch(detected.setName, card.set.name)) {
      score += 25;
    } else {
      score -= 10;
    }
  }

  return score;
}

function buildCardmarketSearchUrl(
  name: string,
  set?: string,
  number?: string,
): string {
  const parts = [name, set, number].filter(Boolean);
  return `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(parts.join(" "))}`;
}

async function tcgdexFetch<T>(path: string, language: string): Promise<T | null> {
  const response = await fetch(`${TCGDEX_API}/${language}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

async function searchTcgdexBriefs(
  name: string,
  localId?: string,
  language = getTcgdexLanguage(),
): Promise<TcgdexCardBrief[]> {
  const params = new URLSearchParams();
  params.set("name", `eq:${name}`);

  if (localId) {
    params.set("localId", `eq:${localId}`);
  }

  return (await tcgdexFetch<TcgdexCardBrief[]>(`/cards?${params}`, language)) ?? [];
}

async function fetchTcgdexCardDetail(
  id: string,
  language = getTcgdexLanguage(),
): Promise<TcgdexCardDetail | null> {
  return tcgdexFetch<TcgdexCardDetail>(`/cards/${id}`, language);
}

export async function lookupTcgdexPricing(
  detected: DetectedCard,
  hints?: { name?: string; set?: string; number?: string; rarity?: string },
  language = getTcgdexLanguage(),
): Promise<{
  prices: CardPrice[];
  url?: string;
  productId?: number;
  tcgdexId?: string;
} | null> {
  const searchName = hints?.name ?? detected.name;
  const searchNumber =
    parseCollectorNumber(hints?.number) ?? parseCollectorNumber(detected.cardNumber);

  let briefs = await searchTcgdexBriefs(searchName, searchNumber, language);

  if (briefs.length === 0) {
    briefs = await searchTcgdexBriefs(searchName, undefined, language);
  }

  if (briefs.length === 0) {
    return null;
  }

  const rankedBriefs = [...briefs]
    .map((brief) => ({
      brief,
      score: scoreTcgdexCard(detected, {
        name: brief.name,
        localId: brief.localId,
      }),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  let bestDetail: TcgdexCardDetail | null = null;
  let bestScore = -Infinity;

  for (const { brief, score } of rankedBriefs) {
    if (score <= 0) continue;

    const detail = await fetchTcgdexCardDetail(brief.id, language);
    if (!detail?.pricing?.cardmarket) continue;

    const detailScore = scoreTcgdexCard(detected, detail);
    if (detailScore > bestScore) {
      bestScore = detailScore;
      bestDetail = detail;
    }

    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  if (!bestDetail?.pricing?.cardmarket || bestScore < 35) {
    return null;
  }

  const cardmarket = bestDetail.pricing.cardmarket;
  const foil = isFoilRarity(hints?.rarity ?? detected.rarity ?? bestDetail.rarity);
  const prices = cardmarketPricingToCardPrices(cardmarket, foil).filter(
    (price) => price.market || price.low || price.mid,
  );

  if (prices.length === 0) {
    return null;
  }

  return {
    prices,
    productId: cardmarket.idProduct,
    tcgdexId: bestDetail.id,
    url: buildCardmarketSearchUrl(
      bestDetail.name,
      bestDetail.set?.name,
      bestDetail.localId,
    ),
  };
}
