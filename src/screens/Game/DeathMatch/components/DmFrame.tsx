// src/screens/Game/DeathMatch/components/DmFrame.tsx
import React, { createContext, useContext } from "react";
import { StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CamText from "../../../../components/cam/CamText";
import { DM_UI } from "../dm.constants";

/** The running score of a best-2-of-3 duel, shown on every duel screen. */
export type DmScore = {
  left: { name: string; wins: number };
  right: { name: string; wins: number };
};

/** Set by the match view while a best-2-of-3 duel is on; null otherwise. */
export const DmScoreContext = createContext<DmScore | null>(null);

type Props = {
  /** Small accent label above the title (the round, whose turn). */
  chip?: string;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  /** Pinned to the bottom: the phase's button or a waiting note. */
  footer?: React.ReactNode;
  /** Art drawn behind the content (hand-the-phone). */
  art?: React.ReactNode;
};

/**
 * Shared layout of the duel phases: dimmed backdrop, a flat modern header
 * (accent label, bold title, muted line), the score when it is best 2 of 3,
 * content, footer.
 */
export default function DmFrame({
  chip,
  title,
  subtitle,
  children,
  footer,
  art,
}: Props) {
  const insets = useSafeAreaInsets();
  const score = useContext(DmScoreContext);
  const pad = DM_UI.gutter;

  return (
    <View style={styles.fill}>
      <View
        style={[StyleSheet.absoluteFill, styles.dim]}
        pointerEvents="none"
      />
      <BlurView
        intensity={DM_UI.blurIntensity}
        tint="dark"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {art}
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 20, paddingHorizontal: pad },
        ]}
      >
        {title ? (
          <View style={styles.header}>
            {chip ? (
              <View style={styles.chip}>
                <CamText
                  variant="subtitle"
                  color={DM_UI.accent}
                  style={styles.chipText}
                >
                  {chip}
                </CamText>
              </View>
            ) : null}
            <CamText variant="title" center color={DM_UI.sheetText}>
              {title}
            </CamText>
            {subtitle ? (
              <CamText variant="subtitle" center color={DM_UI.sheetText}>
                {subtitle}
              </CamText>
            ) : null}
          </View>
        ) : null}
        {score ? (
          <View style={styles.score}>
            <CamText
              variant="body"
              color={DM_UI.sheetText}
              numberOfLines={1}
              style={[styles.scoreName, styles.scoreNameLeft]}
            >
              {score.left.name}
            </CamText>
            <View style={styles.scoreValue}>
              <CamText
                variant="ribbon"
                color={DM_UI.sheetText}
                style={styles.scoreDigits}
              >
                {`${score.left.wins} : ${score.right.wins}`}
              </CamText>
            </View>
            <CamText
              variant="body"
              color={DM_UI.sheetText}
              numberOfLines={1}
              style={styles.scoreName}
            >
              {score.right.name}
            </CamText>
          </View>
        ) : null}
        {children}
      </View>
      {footer ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + 20, paddingHorizontal: pad },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  dim: { backgroundColor: DM_UI.dim },
  content: {
    flex: 1,
    gap: 16,
  },
  header: {
    alignItems: "center",
    gap: 6,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginBottom: 2,
    backgroundColor: DM_UI.chipFill,
  },
  chipText: {
    opacity: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  score: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: DM_UI.sheet,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scoreName: {
    flex: 1,
  },
  scoreNameLeft: {
    textAlign: "right",
  },
  scoreValue: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 2,
    backgroundColor: DM_UI.badgeFill,
  },
  scoreDigits: {
    fontFamily: DM_UI.digitFont,
  },
  footer: {
    gap: 10,
    paddingTop: 12,
  },
});
