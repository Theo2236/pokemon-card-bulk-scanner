import { describe, expect, it } from "vitest";
import { cardmarketPricingToCardPrices } from "./tcgdex";

describe("cardmarketPricingToCardPrices", () => {
  it("mapt trend/low/avg naar Cardmarket EUR prijzen", () => {
    const prices = cardmarketPricingToCardPrices(
      { trend: 12.5, low: 9.99, avg: 11.2 },
      false,
    );

    expect(prices[0]).toEqual({
      variant: "normal",
      market: 12.5,
      low: 9.99,
      mid: 11.2,
    });
  });

  it("gebruikt foil trend voor holo kaarten", () => {
    const prices = cardmarketPricingToCardPrices(
      { trend: 1, low: 0.5, "trend-holo": 6.75, "low-holo": 4.5, "avg-holo": 5.2 },
      true,
    );

    expect(prices[0]?.market).toBe(6.75);
    expect(prices[0]?.low).toBe(4.5);
  });
});
