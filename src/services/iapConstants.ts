/**
 * IAP Product IDs — must match exactly what is configured in
 * App Store Connect (iOS) and Google Play Console (Android).
 *
 * Convention: com.whoisnot.<category>.<identifier>
 */
export const IAP_SKUS = {
  // ── Subscription ──────────────────────────────────────────────────────────
  PREMIUM_MONTHLY: "com.whoisnot.premium.monthly",

  // ── Individual heroes ($1.99 each) ────────────────────────────────────────
  HERO_DR_WRONG:   "com.whoisnot.hero.dr_wrong",
  HERO_TEDIMECHOV: "com.whoisnot.hero.tedimechov",
  HERO_MR_GOODTIME:"com.whoisnot.hero.mr_goodtime",
  HERO_CHEF_FRANCO:"com.whoisnot.hero.chef_franco",
  HERO_WINE_BENDER:"com.whoisnot.hero.wine_bender",
  HERO_SCREENA:    "com.whoisnot.hero.screena",
  HERO_VIBESWITCH: "com.whoisnot.hero.vibeswitch",
  HERO_VIRALA:     "com.whoisnot.hero.virala",

  // ── Bundles ────────────────────────────────────────────────────────────────
  BUNDLE_TROUBLEMAKERS: "com.whoisnot.bundle.troublemakers",
  BUNDLE_ALL_HEROES:    "com.whoisnot.bundle.all_heroes",
} as const;

export type IapSku = (typeof IAP_SKUS)[keyof typeof IAP_SKUS];

/** All one-time purchase SKUs (non-subscription). */
export const ONE_TIME_SKUS: string[] = [
  IAP_SKUS.HERO_DR_WRONG,
  IAP_SKUS.HERO_TEDIMECHOV,
  IAP_SKUS.HERO_MR_GOODTIME,
  IAP_SKUS.HERO_CHEF_FRANCO,
  IAP_SKUS.HERO_WINE_BENDER,
  IAP_SKUS.HERO_SCREENA,
  IAP_SKUS.HERO_VIBESWITCH,
  IAP_SKUS.HERO_VIRALA,
  IAP_SKUS.BUNDLE_TROUBLEMAKERS,
  IAP_SKUS.BUNDLE_ALL_HEROES,
];

/** Subscription SKUs. */
export const SUBSCRIPTION_SKUS: string[] = [IAP_SKUS.PREMIUM_MONTHLY];

/** Map SKU → human-readable price for display when store API prices are unavailable. */
export const IAP_FALLBACK_PRICES: Record<string, string> = {
  [IAP_SKUS.PREMIUM_MONTHLY]:       "$5.99/mo",
  [IAP_SKUS.HERO_DR_WRONG]:         "$1.99",
  [IAP_SKUS.HERO_TEDIMECHOV]:       "$1.99",
  [IAP_SKUS.HERO_MR_GOODTIME]:      "$1.99",
  [IAP_SKUS.HERO_CHEF_FRANCO]:      "$1.99",
  [IAP_SKUS.HERO_WINE_BENDER]:      "$1.99",
  [IAP_SKUS.HERO_SCREENA]:          "$1.99",
  [IAP_SKUS.HERO_VIBESWITCH]:       "$1.99",
  [IAP_SKUS.HERO_VIRALA]:           "$1.99",
  [IAP_SKUS.BUNDLE_TROUBLEMAKERS]:  "$3.99",
  [IAP_SKUS.BUNDLE_ALL_HEROES]:     "$10.99",
};

/** Map character slug → IAP SKU (for hero picker / store logic). */
export const HERO_SLUG_TO_SKU: Record<string, string> = {
  dr_wrong:   IAP_SKUS.HERO_DR_WRONG,
  tedimechov: IAP_SKUS.HERO_TEDIMECHOV,
  mr_goodtime:IAP_SKUS.HERO_MR_GOODTIME,
  chef_franco:IAP_SKUS.HERO_CHEF_FRANCO,
  wine_bender:IAP_SKUS.HERO_WINE_BENDER,
  screena:    IAP_SKUS.HERO_SCREENA,
  vibeswitch: IAP_SKUS.HERO_VIBESWITCH,
  virala:     IAP_SKUS.HERO_VIRALA,
};
