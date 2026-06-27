import { describe, expect, it } from "vitest";
import type { Album } from "@/lib/album-types";
import { computeAlbumSummary } from "@/lib/excel-export";

const baseAlbum: Album = {
  id: "1",
  name: "Test",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  photos: [],
  cards: [
    {
      id: "c1",
      photoId: "p1",
      scannedAt: "2026-01-01",
      detected: {
        index: 0,
        name: "Pikachu",
        condition: "near_mint",
        confidence: 0.9,
      },
      matchStatus: "matched",
      card: {
        id: "x",
        name: "Pikachu",
        set: "Base",
        number: "58",
        rarity: "Common",
        prices: [{ variant: "normal", market: 10 }],
      },
      searchQuery: "pikachu",
      purchasePrice: 5,
    },
  ],
};

describe("computeAlbumSummary", () => {
  it("berekent marktwaarde, aankoop en PnL", () => {
    const summary = computeAlbumSummary(baseAlbum);
    expect(summary.totalCards).toBe(1);
    expect(summary.totalMarketValueEur).toBe(10);
    expect(summary.totalPurchasePriceEur).toBe(5);
    expect(summary.totalPnlEur).toBeCloseTo(5);
    expect(summary.matched).toBe(1);
  });
});
