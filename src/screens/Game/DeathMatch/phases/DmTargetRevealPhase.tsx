// src/screens/Game/DeathMatch/phases/DmTargetRevealPhase.tsx
import React from "react";
import { useTranslation } from "react-i18next";

import { backgrounds } from "../../../../../assets/backgrounds";
import CustomButton from "../../../../components/common/CustomButton";
import DmFrame from "../components/DmFrame";
import DmTargetCard from "../components/DmTargetCard";
import { DM_UI } from "../dm.constants";

type Props = {
  roundNumber: number;
  targetMs: number;
  starterName: string;
  blind: boolean;
  /** Pass & play: the button moves on. Online the referee moves on by itself. */
  onContinue?: () => void;
};

/** Shows the time the game picked for this round and who goes first. */
export default function DmTargetRevealPhase({
  roundNumber,
  targetMs,
  starterName,
  blind,
  onContinue,
}: Props) {
  const { t } = useTranslation();
  return (
    <DmFrame
      chip={t("deathmatch_round_label", { n: roundNumber })}
      title={t("deathmatch_target_title")}
      subtitle={t("deathmatch_starts_first", { name: starterName })}
      footer={
        onContinue ? (
          <CustomButton
            title={t("deathmatch_continue")}
            fullWidth
            btnSize="md"
            fontSize="md"
            backgroundImage={backgrounds.bg026}
            shadowColor={DM_UI.startShadow}
            onPress={onContinue}
          />
        ) : undefined
      }
    >
      <DmTargetCard
        targetMs={targetMs}
        badge={blind ? t("deathmatch_blind_badge") : undefined}
      />
    </DmFrame>
  );
}
