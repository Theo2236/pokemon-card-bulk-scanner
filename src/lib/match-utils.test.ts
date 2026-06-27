import { describe, expect, it } from "vitest";
import { isSuspiciousMatch } from "./match-utils";
import type { MatchedCard } from "./types";

describe("isSuspiciousMatch", () => {
  it("markeert partial matches als twijfelachtig", () => {
    const card: MatchedCard = {
      detected: {
        index: 1,
        name: "Pikachu",
        setName: "151",
        cardNumber: "025/165",
        condition: "near_mint",
        confidence: 0.9,
      },
      matchStatus: "partial",
      searchQuery: "name:\"Pikachu\" number:25",
      card: {
        id: "sv3pt5-25",
        name: "Pikachu",
        set: "151",
        number: "25",
        rarity: "Common",
        prices: [],
      },
    };

    expect(isSuspiciousMatch(card)).toBe(true);
  });

  it("markeert matched kaarten met verkeerd nummer als twijfelachtig", () => {
    const card: MatchedCard = {
      detected: {
        index: 1,
        name: "Pikachu",
        setName: "151",
        cardNumber: "025/165",
        condition: "near_mint",
        confidence: 0.95,
      },
      matchStatus: "matched",
      searchQuery: "name:\"Pikachu\" number:25",
      card: {
        id: "base1-58",
        name: "Pikachu",
        set: "Base Set",
        number: "58",
        rarity: "Common",
        prices: [],
      },
    };

    expect(isSuspiciousMatch(card)).toBe(true);
  });
});
