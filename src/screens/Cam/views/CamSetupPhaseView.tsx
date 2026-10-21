// src/screens/Cam/views/CamSetupPhaseView.tsx
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import CamButton from "../../../components/cam/CamButton";
import { CAM_TIMING } from "../cam.constants";
import CamBottomBar, { CamBarRow } from "../phases/CamBottomBar";
import CamMessagePhase from "../phases/CamMessagePhase";
import CamNameColorPhase from "../phases/CamNameColorPhase";
import CamSelfiePhase from "../phases/CamSelfiePhase";
import type { CamGame } from "../useCamGame";

type Props = {
  game: CamGame;
  /** Set once the camera permission was asked for and not granted. */
  permissionDenied: { canAskAgain: boolean } | null;
  onRetryPermission: () => void;
  onOpenSystemSettings: () => void;
  nameColor: string;
  takenColors: string[];
  onColorChange: (color: string) => void;
  onNamed: (index: number, name: string) => void;
  onExit: () => void;
};

/** Setup phases: permission → player count → name/colour → selfie → full roster. */
export default function CamSetupPhaseView({
  game,
  permissionDenied,
  onRetryPermission,
  onOpenSystemSettings,
  nameColor,
  takenColors,
  onColorChange,
  onNamed,
  onExit,
}: Props) {
  const { t } = useTranslation();
  const { state, dispatch } = game;
  const { phase, players } = state;

  switch (phase.kind) {
    case "permission":
      if (!permissionDenied) return null;
      return (
        <CamMessagePhase
          title={t("cam_permission_denied")}
          primaryLabel={
            permissionDenied.canAskAgain ? t("retry") : t("cam_open_settings")
          }
          onPrimary={
            permissionDenied.canAskAgain
              ? onRetryPermission
              : onOpenSystemSettings
          }
          secondaryLabel={t("cam_exit")}
          onSecondary={onExit}
        />
      );

    // Drawn full screen by the screen itself (logo layout over the camera).
    case "playerCount":
      return null;

    case "nameColor":
      return (
        <CamNameColorPhase
          index={phase.index}
          color={nameColor}
          takenColors={takenColors}
          onColorChange={onColorChange}
          onSubmit={(name) => onNamed(phase.index, name)}
        />
      );

    case "selfie":
      return (
        <CamSelfiePhase
          caption={t("cam_take_selfie", {
            name: players[phase.index]?.name ?? "",
          })}
          busy={game.capturing}
          onShutter={() => void game.takeSelfie()}
        />
      );

    case "selfieFly":
      return (
        <SelfieLandedTimer onDone={() => dispatch({ type: "SELFIE_LANDED" })} />
      );

    case "roster":
      return (
        <CamBottomBar>
          <CamBarRow>
            <CamButton title={t("cam_start")} onPress={game.startRound} />
          </CamBarRow>
        </CamBottomBar>
      );

    default:
      return null;
  }
}

/** Lets the landed selfie rest in its slot before the next step. */
function SelfieLandedTimer({ onDone }: { onDone: () => void }) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const timer = setTimeout(
      () => onDoneRef.current(),
      CAM_TIMING.selfieToSlotMs + CAM_TIMING.selfieLandedHoldMs,
    );
    return () => clearTimeout(timer);
  }, []);

  return null;
}
