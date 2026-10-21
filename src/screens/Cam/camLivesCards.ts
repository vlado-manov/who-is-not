// src/screens/Cam/camLivesCards.ts
import type { TFunction } from "i18next";

import type { CamLivesCard } from "../../components/cam/CamLivesReveal";
import type { CamGameState } from "./cam.types";

/**
 * Cards for the lives reveal: the impostor first (losing a life when caught,
 * keeping it otherwise), then every other player who loses one.
 */
export function buildCamLivesCards(
  state: CamGameState,
  t: TFunction,
): CamLivesCard[] {
  const { phase, round, players, lives } = state;
  if (phase.kind !== "livesUpdate" || !round) return [];

  const impostor = players.find((p) => p.id === round.impostorId);
  if (!impostor) return [];

  const outLine = (id: string, name: string) =>
    (lives[id] ?? 0) <= 0 ? [t("cam_player_out", { name })] : [];

  const cards: CamLivesCard[] = [
    {
      player: impostor,
      lives: lives[impostor.id] ?? 0,
      losing: phase.caught,
      captions: [
        t("cam_was_impostor", { name: impostor.name }),
        phase.caught
          ? t("cam_impostor_loses", { name: impostor.name })
          : t("cam_keeps_life", { name: impostor.name }),
        ...(phase.caught ? outLine(impostor.id, impostor.name) : []),
      ],
    },
  ];

  if (!phase.caught) {
    for (const player of players) {
      if (!phase.lostLifeIds.includes(player.id)) continue;
      cards.push({
        player,
        lives: lives[player.id] ?? 0,
        losing: true,
        captions: [
          t("cam_impostor_loses", { name: player.name }),
          ...outLine(player.id, player.name),
        ],
      });
    }
  }
  return cards;
}
