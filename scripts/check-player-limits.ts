// Checks the player-limit rules (the app has no test runner):
//   npx tsx scripts/check-player-limits.ts
import {
  getCamLimit,
  getOnlineCapacity,
  getPartyLimit,
} from "../src/game/playerLimits";

// Plain checks: the app's tsconfig has no Node types.
const assert = {
  equal(actual: unknown, expected: unknown) {
    if (actual !== expected) throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
  },
  deepEqual(actual: unknown, expected: unknown) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) throw new Error(`expected ${b}, got ${a}`);
  },
};

const party = (tier: "NONE" | "PREMIUM" | "EXPERT", unlocked: number, aboveTen: boolean) =>
  getPartyLimit({ tier, unlockedHeroCount: unlocked, totalHeroCount: 18, aboveTenEnabled: aboveTen });

// Party, free: 3–6; 7–10 need Premium; above 10 Premium and heroes.
{
  const l = party("NONE", 10, true);
  assert.equal(l.min, 3);
  assert.equal(l.max, 6);
  assert.equal(l.lockOf(6), null);
  assert.deepEqual(l.lockOf(7), { kind: "PREMIUM", mode: "party", free: 6 });
  assert.deepEqual(l.lockOf(11), { kind: "PREMIUM_AND_HEROES", count: 11 });
  assert.equal(l.shownMax, 18);
}
// Above 10 switched off: everyone stops at 10, nothing shown above it.
{
  const l = party("PREMIUM", 10, false);
  assert.equal(l.max, 10);
  assert.equal(l.shownMax, 10);
  assert.equal(party("EXPERT", 18, false).max, 10);
  assert.equal(party("NONE", 10, false).shownMax, 10);
}
// Premium: as many as there are unlocked heroes, at least 10.
{
  const l = party("PREMIUM", 10, true);
  assert.equal(l.max, 10);
  assert.deepEqual(l.lockOf(11), { kind: "MORE_HEROES", owned: 10, missing: 1 });
  assert.equal(party("PREMIUM", 13, true).max, 13);
  assert.equal(party("PREMIUM", 30, true).max, 18);
}
// Expert: every hero.
assert.equal(party("EXPERT", 0, true).max, 18);
// Heroes not loaded yet: behaves as before (10 at most).
assert.equal(
  getPartyLimit({ tier: "EXPERT", unlockedHeroCount: 0, totalHeroCount: 0, aboveTenEnabled: true }).max,
  10,
);

// Cam: 3–4 free, up to 9 with Premium.
{
  const free = getCamLimit({ tier: "NONE" });
  assert.equal(free.max, 4);
  assert.equal(free.shownMax, 9);
  assert.deepEqual(free.lockOf(5), { kind: "PREMIUM", mode: "cam", free: 4 });
  assert.equal(getCamLimit({ tier: "PREMIUM" }).max, 9);
  assert.equal(getCamLimit({ tier: "EXPERT" }).lockOf(9), null);
}

// Online: 6 / 10 by the host, +1 per perk player, never above 10.
{
  assert.equal(getOnlineCapacity({ hostTier: "NONE", perkPlayerCount: 0 }).max, 6);
  assert.equal(getOnlineCapacity({ hostTier: "NONE", perkPlayerCount: 2 }).max, 8);
  assert.equal(getOnlineCapacity({ hostTier: "NONE", perkPlayerCount: 9 }).max, 10);
  assert.equal(getOnlineCapacity({ hostTier: "PREMIUM", perkPlayerCount: 0 }).max, 10);
  assert.equal(getOnlineCapacity({ hostTier: "EXPERT", perkPlayerCount: 3 }).max, 10);
  const free = getOnlineCapacity({ hostTier: "NONE", perkPlayerCount: 1 });
  assert.equal(free.shownMax, 10);
  assert.deepEqual(free.lockOf(8), { kind: "PREMIUM", mode: "online", free: 6 });
}

console.log("player limits: all checks passed");
