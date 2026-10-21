// src/game/resolvePlayerHero.ts
import type { ICharacter } from "../types/character";

type PlayerHeroRef =
  | { characterId?: string; skinId?: string }
  | null
  | undefined;

/**
 * The hero a player is playing, in the look they picked. This is the one place
 * every screen goes through to show a player's hero, so a skin's pictures and
 * quotes appear everywhere.
 *
 * The result keeps the BASE hero's id and slug (claims, taken heroes, button
 * styles and analytics are keyed by them) and takes everything else from the
 * skin — which already falls back to the hero for anything it lacks.
 */
export function resolvePlayerHero(
  heroes: ICharacter[],
  player: PlayerHeroRef,
): ICharacter | undefined {
  if (!player?.characterId) return undefined;
  let skinId = player.skinId;
  let base = heroes.find((h) => h.id === player.characterId);
  if (!base) {
    // A skin's id sent in place of its hero's (an old or modified client).
    base = heroes.find((h) => h.skins?.some((s) => s.id === player.characterId));
    skinId = player.characterId;
  }
  if (!base) return undefined;
  const skin = skinId ? base.skins?.find((s) => s.id === skinId) : undefined;
  if (!skin) return base;
  return {
    ...skin,
    id: base.id,
    slug: base.slug,
    skins: base.skins,
    parentCharacterId: undefined,
    unlock: base.unlock,
    unlocked: base.unlocked,
  };
}

/** The BASE hero id for an id that may belong to a skin. */
export function baseHeroId(heroes: ICharacter[], id: string): string {
  if (heroes.some((h) => h.id === id)) return id;
  return heroes.find((h) => h.skins?.some((s) => s.id === id))?.id ?? id;
}
