// src/game/unlocks.ts
import type { ICharacter, IUnlockInfo } from "../types/character";
import i18n from "../i18n";

/** The unlock info, also for heroes from an older backend without it. */
export function unlockOf(item: ICharacter): IUnlockInfo {
  return (
    item.unlock ?? {
      mode: item.premium ? "BUY" : "FREE",
      productId: null,
      storeProductId: null,
      price: item.price || null,
      discountPrice: item.discountPrice || null,
      action: null,
    }
  );
}

/**
 * Unlocked for this player: the server says so, or it was bought in this
 * session (demo) or on login. A skin also needs its hero to be unlocked.
 */
export function isUnlockedFor(
  item: ICharacter,
  extraIds: ReadonlySet<string>,
  hero?: ICharacter,
): boolean {
  if (!hero) return item.unlocked || extraIds.has(item.id);
  // A skin: the server's `unlocked` already includes its hero, which may have
  // been unlocked only now (this session). So decide the skin by its own rule.
  const unlock = unlockOf(item);
  const ownRight =
    unlock.mode === "FREE" ||
    item.unlocked ||
    extraIds.has(item.id) ||
    (unlock.action !== null && unlock.action.progress >= unlock.action.target);
  return ownRight && (hero.unlocked || extraIds.has(hero.id));
}

/** The store sells in euro. */
export const STORE_CURRENCY = "EUR";

/** A price in the player's language, e.g. "€1.49" (en) or "1,49 €" (bg). */
export function formatPrice(
  cents: number | null | undefined,
  currency: string = STORE_CURRENCY,
): string {
  const value = (cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat(i18n.language || "en", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency === "EUR" ? "€" : currency}`;
  }
}
