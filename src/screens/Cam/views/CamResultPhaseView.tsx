// src/screens/Cam/views/CamResultPhaseView.tsx
import React from "react";
import { useTranslation } from "react-i18next";

import CamButton from "../../../components/cam/CamButton";
import { getCamWinners } from "../camGameReducer";
import CamBottomBar, { CamBarRow } from "../phases/CamBottomBar";
import type { CamGame } from "../useCamGame";

type Props = {
  game: CamGame;
  /** The full-screen lives reveal has finished and the grid is back. */
  revealDone: boolean;
  /** A round video is being recorded or finalised. */
  recording: boolean;
  /** "round" = this round's photos and video, "all" = every round. */
  onOpenGallery: (scope: "round" | "all") => void;
  onExit: () => void;
};

/** Bottom bar under the roster grid after a round and at game over. */
export default function CamResultPhaseView({
  game,
  revealDone,
  recording,
  onOpenGallery,
  onExit,
}: Props) {
  const { t } = useTranslation();
  const { state } = game;
  const { phase, round, media } = state;

  if (phase.kind === "livesUpdate") {
    if (!revealDone) return null;
    const roundMedia = media.filter((m) => m.round === round?.index);
    // A recording that is still being finalised will be in the gallery too.
    const hasRoundMedia = roundMedia.length > 0 || recording;

    return (
      <CamBottomBar>
        <CamBarRow>
          {hasRoundMedia && (
            <CamButton
              title={t("cam_gallery")}
              variant="secondary"
              icon="images-outline"
              onPress={() => onOpenGallery("round")}
            />
          )}
          <CamButton title={t("continue_btn")} onPress={game.startRound} />
        </CamBarRow>
      </CamBottomBar>
    );
  }

  if (phase.kind !== "gameOver") return null;

  const winners = getCamWinners(state).map((p) => p.name);

  return (
    <CamBottomBar
      headline={
        winners.length === 1
          ? t("cam_winner", { name: winners[0] })
          : t("cam_winners", { names: winners.join(" & ") })
      }
    >
      {media.length > 0 && (
        <CamBarRow>
          <CamButton
            title={t("cam_gallery")}
            variant="secondary"
            icon="images-outline"
            onPress={() => onOpenGallery("all")}
          />
        </CamBarRow>
      )}
      <CamBarRow>
        <CamButton title={t("cam_exit")} variant="secondary" onPress={onExit} />
        <CamButton
          title={t("cam_play_again")}
          icon="refresh"
          disabled={game.saveStatus === "saving"}
          onPress={game.playAgain}
        />
      </CamBarRow>
    </CamBottomBar>
  );
}
