// src/screens/Cam/views/CamRoundPhaseView.tsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { CAM_TIMING } from "../cam.constants";
import type { CamPlayer } from "../cam.types";
import CamCaptionButtonPhase from "../phases/CamCaptionButtonPhase";
import CamCaughtPhase from "../phases/CamCaughtPhase";
import CamKeepsakePhase from "../phases/CamKeepsakePhase";
import CamMessagePhase from "../phases/CamMessagePhase";
import CamQuestionRevealPhase from "../phases/CamQuestionRevealPhase";
import CamPeekCountdownPhase from "../phases/CamPeekCountdownPhase";
import CamQuestionSlamPhase from "../phases/CamQuestionSlamPhase";
import CamTimedCaptionPhase from "../phases/CamTimedCaptionPhase";
import type { CamGame } from "../useCamGame";

type Props = {
  game: CamGame;
  /** Player holding the phone during handoff / peek phases. */
  turnPlayer: CamPlayer | null;
};

/** Round phases: handoff and peek per player, then the pointing sequence on camera. */
export default function CamRoundPhaseView({ game, turnPlayer }: Props) {
  const { t } = useTranslation();
  const { state, dispatch } = game;
  const { phase, round } = state;
  const countdownSteps = useMemo(() => ["3", "2", "1", t("cam_now")], [t]);

  if (!round) return null;
  // Number and written-answer questions are written down and shown, not pointed.
  const isWrite = round.questionType !== "pick";

  switch (phase.kind) {
    case "handoff":
      return (
        <CamMessagePhase
          onTint
          title={t("cam_take_phone", { name: turnPlayer?.name ?? "" })}
          primaryLabel={t("cam_yes")}
          onPrimary={() => dispatch({ type: "HANDOFF_YES" })}
        />
      );

    case "peekCountdown":
      return (
        <CamPeekCountdownPhase
          onDone={() => dispatch({ type: "PEEK_COUNTED" })}
        />
      );

    case "peekQuestion":
      return (
        <CamQuestionRevealPhase
          // A fresh cover for every player.
          key={turnPlayer?.id}
          playerName={turnPlayer?.name ?? ""}
          playerColor={turnPlayer?.color ?? "#FFFFFF"}
          question={
            turnPlayer?.id === round.impostorId ? round.oddText : round.baseText
          }
          note={isWrite ? t("cam_think_write") : t("cam_think")}
          continueLabel={t("continue_btn")}
          onDone={() => dispatch({ type: "PEEK_DONE" })}
        />
      );

    case "placePhone":
      return (
        <CamMessagePhase
          title={t("cam_place_phone")}
          primaryLabel={t("cam_ready")}
          onPrimary={() => dispatch({ type: "PHONE_PLACED" })}
        />
      );

    case "voteIntro":
      return (
        <CamCaptionButtonPhase
          caption={isWrite ? t("cam_show_intro") : t("cam_vote_intro")}
          buttonLabel={t("cam_confirm")}
          onPress={() => dispatch({ type: "VOTE_CONFIRMED" })}
        />
      );

    case "voteCountdown":
      return (
        <CamTimedCaptionPhase
          caption={isWrite ? t("cam_show_after") : t("cam_point_after")}
          steps={countdownSteps}
          holdMs={CAM_TIMING.voteNowHoldMs}
          onDone={() => dispatch({ type: "VOTE_DONE" })}
        />
      );

    case "questionSlam":
      return (
        <CamQuestionSlamPhase
          text={round.baseText}
          captured={phase.captured}
          onCapture={() => void game.takeKeepsake(round.baseText)}
          onContinue={() => dispatch({ type: "SLAM_CONTINUE" })}
        />
      );

    case "accuseIntro":
      return (
        <CamCaptionButtonPhase
          caption={t("cam_accuse_intro")}
          buttonLabel={t("continue_btn")}
          onPress={() => dispatch({ type: "ACCUSE_CONFIRMED" })}
        />
      );

    case "accuseCountdown":
      return (
        <CamTimedCaptionPhase
          caption={t("cam_point_after")}
          steps={countdownSteps}
          holdMs={0}
          onDone={() => dispatch({ type: "ACCUSE_NOW" })}
        />
      );

    case "keepsake":
      return (
        <CamKeepsakePhase
          caption={t("cam_point_after")}
          nowLabel={t("cam_now")}
          captured={phase.captured}
          onCapture={() => void game.takeKeepsake(t("cam_who_is_impostor"))}
          onShown={() => dispatch({ type: "KEEPSAKE_SHOWN" })}
        />
      );

    case "caughtPrompt":
      return <CamCaughtPhase onAnswer={game.answerCaught} />;

    default:
      return null;
  }
}
