/**
 * Win/lose quote variants based on vote results.
 * - PERFECT_BLUFF (win): no one voted for the impostor
 * - COOKED (lose): everyone voted for the impostor
 * - BARELY_SOLD_IT (win): one vote away from being caught (exactly one voted for impostor)
 * - NEARLY_THERE (lose): one vote away from escaping (all but one voted for impostor)
 * - NORMAL: everything else
 */
export type WinVariant = "PERFECT_BLUFF" | "BARELY_SOLD_IT" | "NORMAL";
export type LoseVariant = "COOKED" | "NEARLY_THERE" | "NORMAL";

/**
 * Computes the quote variant from vote counts.
 * @param votesForImpostor Number of players who voted for the impostor
 * @param totalVoters Total number of voters
 * @param impostorWon True if the impostor was not caught (voted winner !== impostor)
 */
export function getRevealVariant(
  votesForImpostor: number,
  totalVoters: number,
  impostorWon: boolean
): WinVariant | LoseVariant {
  if (impostorWon) {
    if (votesForImpostor === 0) return "PERFECT_BLUFF";
    if (votesForImpostor === 1) return "BARELY_SOLD_IT";
    return "NORMAL";
  }
  if (votesForImpostor === totalVoters) return "COOKED";
  if (totalVoters > 0 && votesForImpostor === totalVoters - 1) return "NEARLY_THERE";
  return "NORMAL";
}

function getRandom<T>(arr: T[]): T | undefined {
  if (!arr?.length) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Picks a quote for the given variant, with fallback to NORMAL, then to flat list, then to default text.
 */
export function pickRevealQuote(
  byVariant: Record<string, string[]> | undefined,
  variant: string,
  defaultText: string,
  flatQuotes?: string[]
): string {
  if (byVariant && typeof byVariant === "object") {
    const list = byVariant[variant] ?? byVariant.NORMAL;
    const quote = getRandom(Array.isArray(list) ? list : []);
    if (quote?.trim()) return quote.trim();
  }
  const fromFlat = getRandom(flatQuotes ?? []);
  return fromFlat?.trim() || defaultText;
}

/** Same seed → same index (multiplayer: everyone sees the same title / character art). */
export function deterministicPickIndex(seed: string, length: number): number {
  if (length <= 1) return 0;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % length;
}

export function getRevealQuoteI18nKey(
  impostorWon: boolean,
  v: WinVariant | LoseVariant
): string {
  if (impostorWon) {
    const m: Record<WinVariant, string> = {
      PERFECT_BLUFF: "reveal_quote_win_perfect_bluff",
      BARELY_SOLD_IT: "reveal_quote_win_barely_sold_it",
      NORMAL: "reveal_quote_win_normal",
    };
    return m[v as WinVariant] ?? "reveal_quote_win_normal";
  }
  const m: Record<LoseVariant, string> = {
    COOKED: "reveal_quote_lose_cooked",
    NEARLY_THERE: "reveal_quote_lose_nearly_there",
    NORMAL: "reveal_quote_lose_normal",
  };
  return m[v as LoseVariant] ?? "reveal_quote_lose_normal";
}
