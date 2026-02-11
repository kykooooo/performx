import { describe, expect, it } from "vitest";
import { getAverageRating, getReviewTotal } from "@/lib/reviews";

describe("reviews utils", () => {
  it("calcule la moyenne des avis", () => {
    const rating = getAverageRating([{ rating: 4 }, { rating: 5 }, { rating: 3 }], 0);
    expect(rating).toBeCloseTo(4);
  });

  it("retourne le fallback quand il n'y a pas d'avis", () => {
    expect(getAverageRating([], 4.2)).toBe(4.2);
  });

  it("calcule le total d'avis en comparant avec le fallback", () => {
    expect(getReviewTotal([{ rating: 5 }], 8)).toBe(8);
    expect(getReviewTotal([{ rating: 5 }, { rating: 4 }], 1)).toBe(2);
  });
});
