/**
 * IAP Product IDs — must match exactly what is configured in
 * App Store Connect (iOS) and Google Play Console (Android).
 *
 * Convention: com.whoisnot.<category>.<identifier>
 */
export const IAP_SKUS = {
  // ── Membership ────────────────────────────────────────────────────────────
  // Premium monthly and Expert monthly belong in ONE App Store subscription
  // group (Expert ranked higher) so moving up is an upgrade, not a second bill.
  // Expert lifetime is a non-consumable (iOS) / one-time product (Android).
  PREMIUM_MONTHLY: "com.whoisnot.premium.monthly",
  EXPERT_MONTHLY: "com.whoisnot.expert.monthly",
  EXPERT_LIFETIME: "com.whoisnot.expert.lifetime",

  // ── Individual heroes (€1.99 each) ────────────────────────────────────────
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
  IAP_SKUS.EXPERT_LIFETIME,
];

/** Subscription SKUs. */
export const SUBSCRIPTION_SKUS: string[] = [
  IAP_SKUS.PREMIUM_MONTHLY,
  IAP_SKUS.EXPERT_MONTHLY,
];

/** Price in cents (EUR) when the store's own price is not available. */
export const IAP_FALLBACK_PRICES: Record<string, { cents: number; currency: string }> = {
  [IAP_SKUS.PREMIUM_MONTHLY]:       { cents: 599, currency: "EUR" },
  [IAP_SKUS.EXPERT_MONTHLY]:        { cents: 899, currency: "EUR" },
  [IAP_SKUS.EXPERT_LIFETIME]:       { cents: 3990, currency: "EUR" },
  [IAP_SKUS.HERO_DR_WRONG]:         { cents: 199, currency: "EUR" },
  [IAP_SKUS.HERO_TEDIMECHOV]:       { cents: 199, currency: "EUR" },
  [IAP_SKUS.HERO_MR_GOODTIME]:      { cents: 199, currency: "EUR" },
  [IAP_SKUS.HERO_CHEF_FRANCO]:      { cents: 199, currency: "EUR" },
  [IAP_SKUS.HERO_WINE_BENDER]:      { cents: 199, currency: "EUR" },
  [IAP_SKUS.HERO_SCREENA]:          { cents: 199, currency: "EUR" },
  [IAP_SKUS.HERO_VIBESWITCH]:       { cents: 199, currency: "EUR" },
  [IAP_SKUS.HERO_VIRALA]:           { cents: 199, currency: "EUR" },
  [IAP_SKUS.BUNDLE_TROUBLEMAKERS]:  { cents: 399, currency: "EUR" },
  [IAP_SKUS.BUNDLE_ALL_HEROES]:     { cents: 1099, currency: "EUR" },
};

/** Membership plans: what each SKU gives. */
export const TIER_PLANS = {
  premium_monthly: { sku: IAP_SKUS.PREMIUM_MONTHLY, tier: "PREMIUM", lifetime: false },
  expert_monthly: { sku: IAP_SKUS.EXPERT_MONTHLY, tier: "EXPERT", lifetime: false },
  expert_lifetime: { sku: IAP_SKUS.EXPERT_LIFETIME, tier: "EXPERT", lifetime: true },
} as const;

export type TierPlan = keyof typeof TIER_PLANS;

/** A plan's price, formatted for the UI (store price unknown: the fallback). */
export function tierPlanCents(plan: TierPlan): { cents: number; currency: string } {
  return IAP_FALLBACK_PRICES[TIER_PLANS[plan].sku];
}

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
