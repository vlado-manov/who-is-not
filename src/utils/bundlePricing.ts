// src/utils/bundlePricing.ts

/** The pack should always save about a third compared with buying one by one. */
const MIN_SAVING = 0.3;
const MAX_SAVING = 0.35;
const TARGET_SAVING = (MIN_SAVING + MAX_SAVING) / 2;

export type PackPrice = {
  /** Sum of the single prices. */
  fullPrice: number;
  /** Pack price, always ending in .99. */
  packPrice: number;
  /** Whole-number saving shown on the card. */
  savingPercent: number;
};

/**
 * Price of a pack made of the given single prices: a "natural" amount ending in
 * .99 that saves 30–35% where such an amount exists, otherwise the .99 amount
 * closest to that range. Returns null when there is nothing to bundle.
 */
export function getPackPrice(singlePrices: number[]): PackPrice | null {
  if (singlePrices.length === 0) return null;
  const fullPrice = singlePrices.reduce((sum, price) => sum + price, 0);
  const target = fullPrice * (1 - TARGET_SAVING);

  // Candidates are 0.99, 1.99, 2.99, … — take the one nearest the target.
  const lower = Math.max(0, Math.floor(target + 0.01) - 1);
  const candidates = [lower, lower + 1, lower + 2].map((n) => n + 0.99);
  const inRange = candidates.filter((price) => {
    const saving = 1 - price / fullPrice;
    return saving >= MIN_SAVING && saving <= MAX_SAVING;
  });
  const pool = inRange.length > 0 ? inRange : candidates;
  const packPrice = pool.reduce((best, price) =>
    Math.abs(price - target) < Math.abs(best - target) ? price : best,
  );

  return {
    fullPrice: Math.round(fullPrice * 100) / 100,
    packPrice,
    savingPercent: Math.round((1 - packPrice / fullPrice) * 100),
  };
}
