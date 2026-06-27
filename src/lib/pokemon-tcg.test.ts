import { describe, expect, it } from "vitest";
import {
  buildSearchQueries,
  buildSearchQuery,
  numbersMatch,
  parseCollectorNumber,
  scoreMatch,
  setNamesMatch,
} from "./pokemon-tcg";
import { bestMarketPrice } from "./format";
import type { DetectedCard } from "./types";

const baseDetected: DetectedCard = {
  index: 1,
  name: "Pikachu",
  setName: "151",
  cardNumber: "025/165",
  condition: "near_mint",
  confidence: 0.9,
};

describe("parseCollectorNumber", () => {
  it("haalt leading zeros weg uit numerieke nummers", () => {
    expect(parseCollectorNumber("025/165")).toBe("25");
    expect(parseCollectorNumber("4/102")).toBe("4");
  });

  it("behoudt promo codes", () => {
    expect(parseCollectorNumber("TG25/TG30")).toBe("TG25");
  });
});

describe("setNamesMatch", () => {
  it("matcht korte en lange setnamen", () => {
    expect(setNamesMatch("151", "Scarlet & Violet—151")).toBe(true);
    expect(setNamesMatch("Paradox Rift", "Paradox Rift")).toBe(true);
    expect(setNamesMatch("Base Set", "Base Set 2")).toBe(false);
  });
});

describe("buildSearchQuery", () => {
  it("bouwt een query met naam, set en nummer", () => {
    expect(buildSearchQuery(baseDetected)).toBe('name:"Pikachu" set.name:"151" number:25');
  });
});

describe("buildSearchQueries", () => {
  it("prioriteert naam + nummer als eerste query", () => {
    const queries = buildSearchQueries(baseDetected);
    expect(queries[0]).toBe('name:"Pikachu" number:25');
  });
});

describe("scoreMatch", () => {
  it("geeft hoge score bij juiste naam, nummer en set", () => {
    const score = scoreMatch(baseDetected, {
      id: "sv3pt5-25",
      name: "Pikachu",
      number: "25",
      rarity: "Common",
      set: { name: "151" },
    });
    expect(score).toBeGreaterThanOrEqual(75);
  });

  it("bestraft verkeerd kaartnummer", () => {
    const good = scoreMatch(baseDetected, {
      id: "sv3pt5-25",
      name: "Pikachu",
      number: "25",
      rarity: "Common",
      set: { name: "151" },
    });
    const bad = scoreMatch(baseDetected, {
      id: "base1-58",
      name: "Pikachu",
      number: "58",
      rarity: "Common",
      set: { name: "Base Set" },
    });
    expect(good).toBeGreaterThan(bad);
  });
});

describe("numbersMatch", () => {
  it("matcht genormaliseerde nummers", () => {
    expect(numbersMatch("025/165", "25")).toBe(true);
    expect(numbersMatch("025/165", "58")).toBe(false);
  });
});

describe("bestMarketPrice", () => {
  it("kiest de hoogste marktprijs uit varianten", () => {
    const total = bestMarketPrice({
      detected: { index: 0, name: "Test", condition: "unknown", confidence: 1 },
      matchStatus: "matched",
      card: {
        id: "x",
        name: "Test",
        set: "Set",
        number: "1",
        rarity: "Common",
        prices: [
          { variant: "normal", market: 1.5 },
          { variant: "holofoil", market: 4.25 },
        ],
      },
      searchQuery: "test",
    });

    expect(total).toBe(4.25);
  });
});
