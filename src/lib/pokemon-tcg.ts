import type { CardPrice, DetectedCard, MatchedCard } from "./types";
import {
  extractSetToken,
  numbersMatch,
  parseCollectorNumber,
  setNamesMatch,
} from "./card-match";
import { lookupTcgdexPricing } from "./tcgdex";

export { numbersMatch, parseCollectorNumber, setNamesMatch } from "./card-match";

const API_BASE = "https://api.pokemontcg.io/v2";

type PokemonCard = {
  id: string;
  name: string;
  number: string;
  rarity: string;
  set: { name: string; id?: string };
  images?: { small?: string; large?: string };
};

type SearchResponse = {
  data: PokemonCard[];
  totalCount: number;
};

function buildHeaders(apiKey?: string): HeadersInit {
  const headers: HeadersInit = { Accept: "application/json" };
  if (apiKey) headers["X-Api-Key"] = apiKey;
  return headers;
}

function escapeQuery(value: string): string {
  return value.replace(/"/g, '\\"');
}

export function buildSearchQuery(card: DetectedCard): string {
  const parts: string[] = [`name:"${escapeQuery(card.name)}"`];
  if (card.setName) parts.push(`set.name:"${escapeQuery(card.setName)}"`);
  const number = parseCollectorNumber(card.cardNumber);
  if (number) parts.push(`number:${number}`);
  return parts.join(" ");
}

export function buildSearchQueries(card: DetectedCard): string[] {
  const queries: string[] = [];
  const number = parseCollectorNumber(card.cardNumber);
  const name = card.name.trim();

  if (name && number) {
    queries.push(`name:"${escapeQuery(name)}" number:${number}`);
  }

  if (name && card.setName && number) {
    queries.push(buildSearchQuery(card));

    const setToken = extractSetToken(card.setName);
    if (setToken && /^\d+$/.test(setToken)) {
      queries.push(`name:"${escapeQuery(name)}" number:${number} set.name:*${setToken}*`);
    }
  }

  if (name && card.setName) {
    queries.push(`name:"${escapeQuery(name)}" set.name:"${escapeQuery(card.setName)}"`);
  }

  queries.push(`name:"${escapeQuery(name)}"`);

  return [...new Set(queries)];
}

export function scoreMatch(detected: DetectedCard, card: PokemonCard): number {
  const detectedName = detected.name.trim().toLowerCase();
  const cardName = card.name.trim().toLowerCase();

  if (cardName !== detectedName && !cardName.startsWith(`${detectedName} `)) {
    return 0;
  }

  let score = cardName === detectedName ? 35 : 20;

  if (detected.cardNumber) {
    if (numbersMatch(detected.cardNumber, card.number)) {
      score += 50;
    } else {
      score -= 40;
    }
  }

  if (detected.setName) {
    if (setNamesMatch(detected.setName, card.set.name)) {
      score += 25;
    } else {
      score -= 10;
    }
  }

  if (detected.rarity && card.rarity) {
    const rarityA = detected.rarity.toLowerCase();
    const rarityB = card.rarity.toLowerCase();
    if (rarityA === rarityB || rarityB.includes(rarityA) || rarityA.includes(rarityB)) {
      score += 5;
    }
  }

  return score;
}

function mapCard(card: PokemonCard) {
  return {
    id: card.id,
    name: card.name,
    set: card.set.name,
    number: card.number,
    rarity: card.rarity,
    imageUrl: card.images?.large ?? card.images?.small,
    prices: [] as CardPrice[],
  };
}

async function attachTcgdexPricing(
  mapped: NonNullable<MatchedCard["card"]>,
  detected: DetectedCard,
): Promise<NonNullable<MatchedCard["card"]>> {
  try {
    const pricing = await lookupTcgdexPricing(detected, {
      name: mapped.name,
      set: mapped.set,
      number: mapped.number,
      rarity: mapped.rarity,
    });

    if (!pricing) {
      return mapped;
    }

    return {
      ...mapped,
      cardmarketUrl: pricing.url,
      cardmarketProductId: pricing.productId,
      prices: pricing.prices,
    };
  } catch (error) {
    console.warn("TCGdex prijslookup mislukt:", error);
    return mapped;
  }
}

function resolveMatchStatus(
  detected: DetectedCard,
  best: PokemonCard,
  bestScore: number,
): MatchedCard["matchStatus"] {
  const hasNumber = Boolean(parseCollectorNumber(detected.cardNumber));
  const numberMatches = numbersMatch(detected.cardNumber, best.number);
  const setMatches = setNamesMatch(detected.setName, best.set.name);

  if (hasNumber) {
    if (numberMatches && (setMatches || !detected.setName) && bestScore >= 60) {
      return "matched";
    }
    if (numberMatches && bestScore >= 45) {
      return "partial";
    }
    return bestScore >= 35 ? "partial" : "not_found";
  }

  if (setMatches && bestScore >= 55) return "matched";
  if (bestScore >= 40) return "partial";
  return "not_found";
}

async function searchCards(
  query: string,
  apiKey?: string,
  pageSize = 20,
): Promise<PokemonCard[]> {
  const url = new URL(`${API_BASE}/cards`);
  url.searchParams.set("q", query);
  url.searchParams.set("pageSize", String(pageSize));

  const response = await fetch(url, {
    headers: buildHeaders(apiKey),
    next: { revalidate: 3600 },
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as SearchResponse;
  return payload.data ?? [];
}

export async function lookupCard(
  detected: DetectedCard,
  apiKey?: string,
): Promise<MatchedCard> {
  const searchQueries = buildSearchQueries(detected);
  const primaryQuery = searchQueries[0] ?? `name:"${escapeQuery(detected.name)}"`;

  try {
    const seen = new Set<string>();
    const candidates: PokemonCard[] = [];

    for (const query of searchQueries) {
      const results = await searchCards(query, apiKey);
      for (const card of results) {
        if (seen.has(card.id)) continue;
        seen.add(card.id);
        candidates.push(card);
      }

      if (candidates.length > 0) {
        const bestSoFar = [...candidates].sort(
          (a, b) => scoreMatch(detected, b) - scoreMatch(detected, a),
        )[0];
        if (bestSoFar && scoreMatch(detected, bestSoFar) >= 75) {
          break;
        }
      }
    }

    if (!candidates.length) {
      return { detected, matchStatus: "not_found", searchQuery: primaryQuery };
    }

    const best = [...candidates].sort(
      (a, b) => scoreMatch(detected, b) - scoreMatch(detected, a),
    )[0];
    const bestScore = scoreMatch(detected, best);
    const mapped = await attachTcgdexPricing(mapCard(best), detected);

    return {
      detected,
      matchStatus: resolveMatchStatus(detected, best, bestScore),
      searchQuery: primaryQuery,
      card: mapped,
      error:
        mapped.prices.length === 0
          ? "Geen Cardmarket prijs gevonden via TCGdex."
          : undefined,
    };
  } catch (error) {
    return {
      detected,
      matchStatus: "not_found",
      searchQuery: primaryQuery,
      error: error instanceof Error ? error.message : "Onbekende fout bij lookup",
    };
  }
}

export async function lookupCards(
  detected: DetectedCard[],
  apiKey?: string,
): Promise<MatchedCard[]> {
  const results: MatchedCard[] = [];

  for (const card of detected) {
    results.push(await lookupCard(card, apiKey));
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return results;
}
