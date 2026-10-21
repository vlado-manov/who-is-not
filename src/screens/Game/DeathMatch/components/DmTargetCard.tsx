// src/screens/Game/DeathMatch/components/DmTargetCard.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import CamText from "../../../../components/cam/CamText";
import { DM_UI } from "../dm.constants";
import { formatSeconds } from "../dmFormat";

type Props = {
  targetMs: number;
  /** Small pill ("Blind"). */
  badge?: string;
  /**
   * `hero` = the target on its own (reveal): a tall card with a large value.
   * `compact` = one slim pill above the dial, which stays the main thing on
   * the stopwatch screen.
   */
  size?: "hero" | "compact";
};

type ValueProps = {
  ms: number;
  decimals: 1 | 3;
  fontSize: number;
  color?: string;
};

/**
 * A time as large digits with a small unit beside them, in the duel's own
 * number font — the same look wherever a time is shown.
 */
export function DmSeconds({
  ms,
  decimals,
  fontSize,
  color = DM_UI.sheetText,
}: ValueProps) {
  const { t } = useTranslation();
  return (
    <Text maxFontSizeMultiplier={1} style={{ color }}>
      <Text style={[styles.digits, { fontSize, lineHeight: fontSize * 1.12 }]}>
        {formatSeconds(ms, decimals, t("deathmatch_decimal_separator"))}
      </Text>
      <Text style={[styles.unit, { fontSize: Math.max(13, fontSize * 0.38) }]}>
        {` ${t("deathmatch_seconds_unit")}`}
      </Text>
    </Text>
  );
}

/** The time to hit, in the flat style of the duel's sheets. */
export default function DmTargetCard({
  targetMs,
  badge,
  size = "hero",
}: Props) {
  const { t } = useTranslation();

  if (size === "compact") {
    return (
      <View style={styles.pill}>
        <CamText variant="subtitle" color={DM_UI.sheetText}>
          {t("deathmatch_target_label")}
        </CamText>
        <DmSeconds ms={targetMs} decimals={1} fontSize={24} />
        {badge ? (
          <View style={styles.badge}>
            <CamText variant="subtitle" color={DM_UI.sheetText}>
              {badge}
            </CamText>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <CamText variant="subtitle" center color={DM_UI.sheetText}>
        {t("deathmatch_target_label")}
      </CamText>
      <DmSeconds ms={targetMs} decimals={1} fontSize={76} />
      <CamText variant="subtitle" center color={DM_UI.sheetText}>
        {t("deathmatch_target_instruction")}
      </CamText>
      {badge ? (
        <View style={[styles.badge, styles.badgeHero]}>
          <CamText variant="subtitle" color={DM_UI.sheetText}>
            {badge}
          </CamText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  digits: {
    fontFamily: DM_UI.digitFont,
  },
  unit: {
    fontFamily: DM_UI.unitFont,
    opacity: 0.7,
  },
  card: {
    alignItems: "center",
    gap: 4,
    backgroundColor: DM_UI.sheet,
    borderRadius: DM_UI.sheetRadius,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  pill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: DM_UI.sheet,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: DM_UI.badgeFill,
  },
  badgeHero: {
    marginTop: 8,
  },
});
