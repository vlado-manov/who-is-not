// src/game/playerLimits.ts
import type { PremiumTier } from "../types/user";

/**
 * How many players each mode allows, by membership. The one place these
 * numbers live: the count pickers, the online lobby, the store and the
 * rulebook all read them from here.
 */
export const PLAYER_LIMITS = {
  min: 3,
  party: { free: 6, premium: 10 },
  cam: { free: 4, premium: 9 },
  /** Online: 6 places, 10 with a Premium host; each perk player adds one; never above 10. */
  online: { free: 6, premium: 10, max: 10 },
} as const;

/**
 * Party games above 10 (one phone, a different hero for every player). Off
 * until every game screen is checked with that many players.
 */
export const PARTY_ABOVE_TEN_ENABLED = false;

/** The most players any one-phone game is built for (results list, grids). */
export const PARTY_ABSOLUTE_MAX = 18;

export type LimitMode = "party" | "cam" | "online";

/** Why a player count is locked, which decides what the premium sheet says. */
export type LockReason =
  | { kind: "PREMIUM"; mode: LimitMode; free: number }
  /** Party above 10 without a membership: Premium and a hero for each player. */
  | { kind: "PREMIUM_AND_HEROES"; count: number }
  /** Party above 10 with Premium: not enough unlocked heroes. */
  | { kind: "MORE_HEROES"; owned: number; missing: number }
  /** Online above the room's places: more perk players needed. */
  | { kind: "ROOM_PERK" };

export type PlayerLimit = {
  min: number;
  /** Highest count allowed now. */
  max: number;
  /** Highest count shown; counts above `max` are shown locked. */
  shownMax: number;
  lockOf: (count: number) => LockReason | null;
};

export function hasMembership(tier: PremiumTier): boolean {
  return tier !== "NONE";
}

/**
 * One phone: 3–6 free, up to 10 with Premium. Above 10 every player needs a
 * hero of their own, so Premium plays up to the unlocked heroes and Expert
 * (everything unlocked) up to all heroes.
 */
export function getPartyLimit(input: {
  tier: PremiumTier;
  unlockedHeroCount: number;
  totalHeroCount: number;
  aboveTenEnabled?: boolean;
}): PlayerLimit {
  const { tier, unlockedHeroCount } = input;
  const aboveTen = input.aboveTenEnabled ?? PARTY_ABOVE_TEN_ENABLED;
  const { free, premium } = PLAYER_LIMITS.party;
  // Heroes not loaded yet: behave as before limits existed above 10.
  const total =
    input.totalHeroCount > 0
      ? Math.min(input.totalHeroCount, PARTY_ABSOLUTE_MAX)
      : premium;
  const top = aboveTen ? Math.max(premium, total) : premium;

  let max: number;
  if (tier === "NONE") max = free;
  else if (!aboveTen) max = premium;
  else if (tier === "EXPERT") max = top;
  else max = Math.min(top, Math.max(premium, unlockedHeroCount));

  return {
    min: PLAYER_LIMITS.min,
    max,
    shownMax: top,
    lockOf: (count) => {
      if (count <= max) return null;
      if (tier === "NONE") {
        return count <= premium
          ? { kind: "PREMIUM", mode: "party", free }
          : { kind: "PREMIUM_AND_HEROES", count };
      }
      return {
        kind: "MORE_HEROES",
        owned: unlockedHeroCount,
        missing: Math.max(1, count - unlockedHeroCount),
      };
    },
  };
}

/** Cam Mode: 3–4 free, up to 9 with Premium. */
export function getCamLimit(input: { tier: PremiumTier }): PlayerLimit {
  const { free, premium } = PLAYER_LIMITS.cam;
  const max = hasMembership(input.tier) ? premium : free;
  return {
    min: PLAYER_LIMITS.min,
    max,
    shownMax: premium,
    lockOf: (count) =>
      count <= max ? null : { kind: "PREMIUM", mode: "cam", free },
  };
}

/** Places before perks for a host with this membership. */
export function onlineCapacityBase(tier: PremiumTier): number {
  return hasMembership(tier)
    ? PLAYER_LIMITS.online.premium
    : PLAYER_LIMITS.online.free;
}

/**
 * Places in an online room: 6, or 10 with a Premium/Expert host; each player
 * (host included) who owns a bought hero or Expert adds one; never above 10.
 * The backend applies the same rule when someone joins.
 */
export function getOnlineCapacity(input: {
  hostTier: PremiumTier;
  perkPlayerCount: number;
}): PlayerLimit {
  const { free, max: hardMax } = PLAYER_LIMITS.online;
  const max = Math.min(
    hardMax,
    onlineCapacityBase(input.hostTier) + Math.max(0, input.perkPlayerCount),
  );
  return {
    min: PLAYER_LIMITS.min,
    max,
    shownMax: hardMax,
    lockOf: (count) => {
      if (count <= max) return null;
      return hasMembership(input.hostTier)
        ? { kind: "ROOM_PERK" }
        : { kind: "PREMIUM", mode: "online", free };
    },
  };
}
