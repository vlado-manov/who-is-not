// src/screens/Game/DeathMatch/phases/DmRoundResultPhase.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { backgrounds } from "../../../../../assets/backgrounds";
import AppImage from "../../../../components/AppImage";
import CustomButton from "../../../../components/common/CustomButton";
import CustomText from "../../../../components/common/CustomText";
import DmFrame from "../components/DmFrame";
import DmTargetCard, { DmSeconds } from "../components/DmTargetCard";
import { DM_UI } from "../dm.constants";
import type { DmPlayerView, DmRoundResult } from "../dm.types";

type Props = {
  roundNumber: number;
  result: DmRoundResult;
  players: [DmPlayerView, DmPlayerView];
  /**
   * Pass & play, when another round follows: the button moves on. Not set for
   * the deciding round (the celebration starts by itself) or online.
   */
  onContinue?: () => void;
};

const AVATAR = 52;

/** Both stopped times, how far each was from the target, and who took the round. */
export default function DmRoundResultPhase({
  roundNumber,
  result,
  players,
  onContinue,
}: Props) {
  const { t } = useTranslation();
  const winner = players.find((p) => p.id === result.winnerId);

  return (
    <DmFrame
      chip={t("deathmatch_round_label", { n: roundNumber })}
      title={
        winner
          ? t("deathmatch_result_round_winner", { name: winner.name })
          : t("deathmatch_result_tie")
      }
      footer={
        onContinue ? (
          <CustomButton
            title={t("deathmatch_result_next_round")}
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
      <DmTargetCard targetMs={result.targetMs} size="compact" />
      {players.map((player) => {
        const stopped = result.stops[player.id];
        const off = Math.abs(stopped - result.targetMs);
        const won = result.winnerId === player.id;
        const tone =
          result.winnerId === null
            ? DM_UI.accent
            : won
              ? DM_UI.good
              : DM_UI.bad;
        return (
          <View
            key={player.id}
            style={[styles.row, won && { borderColor: DM_UI.good }]}
          >
            <View style={styles.avatar}>
              {player.profileImage ? (
                <AppImage
                  source={player.profileImage}
                  contentFit="cover"
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
            </View>
            <View style={styles.rowText}>
              <CustomText variant="h6-headline" textColor={DM_UI.text}>
                {player.name}
              </CustomText>
              <CustomText variant="footnote" textColor={DM_UI.textMuted}>
                {t("deathmatch_result_stopped")}
              </CustomText>
              <DmSeconds ms={stopped} decimals={3} fontSize={24} />
            </View>
            <View style={styles.off}>
              <CustomText variant="footnote" textColor={DM_UI.textMuted}>
                {t("deathmatch_result_difference")}
              </CustomText>
              {off === 0 ? (
                <CustomText variant="h6-headline" textColor={tone}>
                  {t("deathmatch_result_perfect")}
                </CustomText>
              ) : (
                <DmSeconds ms={off} decimals={3} fontSize={24} color={tone} />
              )}
            </View>
          </View>
        );
      })}
    </DmFrame>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: DM_UI.card,
    borderRadius: DM_UI.radius,
    borderWidth: 1.5,
    borderColor: DM_UI.cardEdge,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    overflow: "hidden",
    backgroundColor: DM_UI.cardInner,
  },
  off: {
    alignItems: "flex-end",
    gap: 2,
  },
  rowText: {
    flex: 1,
    gap: 2,
    alignItems: "flex-start",
  },
});
