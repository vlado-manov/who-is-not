// src/screens/Game/DeathMatch/phases/DmPassPhase.tsx
import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import AppImage from "../../../../components/AppImage";
import CustomText from "../../../../components/common/CustomText";
import HoldToConfirmButton from "../../../../components/game/HoldToConfirmButton";
import DmFrame from "../components/DmFrame";
import { DM_HANDTHEPHONE_URI, DM_UI } from "../dm.constants";

type Props = {
  toName: string;
  /** Set when the other finalist has just played. */
  lockedName?: string;
  onReady: () => void;
};

/**
 * Pass & play: hand the phone to the finalist whose turn it is. The button is
 * unlocked by holding it, like "It's me" before a question, so a stray tap
 * does not start the wrong player's turn.
 */
export default function DmPassPhase({ toName, lockedName, onReady }: Props) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  return (
    <DmFrame
      chip={t("deathmatch_pass_title")}
      title={toName}
      subtitle={
        lockedName
          ? t("deathmatch_pass_locked", { name: lockedName })
          : t("deathmatch_pass_to", { name: toName })
      }
      art={
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.art, { top: height * 0.3 }]}
        >
          <AppImage
            source={{ uri: DM_HANDTHEPHONE_URI }}
            contentFit="contain"
            style={{ width, height: height * 0.72 }}
          />
        </View>
      }
      footer={
        <>
          <HoldToConfirmButton
            title={t("deathmatch_pass_ready")}
            onConfirm={onReady}
          />
          <View style={styles.hintRow}>
            <MaterialCommunityIcons
              name="gesture-tap-hold"
              size={20}
              color={DM_UI.accent}
            />
            <CustomText
              variant="footnote"
              textColor={DM_UI.textMuted}
              allowWrap
              style={styles.hint}
            >
              {t("deathmatch_pass_hold_hint", { name: toName })}
            </CustomText>
          </View>
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  art: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  hint: {
    fontFamily: "Onest-SemiBold",
    flexShrink: 1,
  },
});
