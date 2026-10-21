import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import CamButton from "./CamButton";
import CamText from "./CamText";
import { CAM_OVERLAY_BLACK, CAM_TEXT } from "../../screens/Cam/cam.constants";

type Props = {
  /** Centre and diameter of the control to highlight, in screen coordinates. */
  target: { centerX: number; centerY: number; size: number };
  title: string;
  body: string;
  buttonLabel: string;
  onDismiss: () => void;
};

/** Larger than any screen: the border of the spotlight view is the dark scrim. */
const SCRIM = 2000;
const HALO = 10;

/**
 * First-use hint: darkens the screen except a circle around one control and
 * explains it. The hole is a transparent circle with a huge dark border.
 */
export default function CamCoachMark({
  target,
  title,
  body,
  buttonLabel,
  onDismiss,
}: Props) {
  const hole = target.size + HALO * 2;
  const outer = hole + SCRIM * 2;

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
      <View
        pointerEvents="none"
        style={[
          styles.spotlight,
          {
            width: outer,
            height: outer,
            borderRadius: outer / 2,
            left: target.centerX - outer / 2,
            top: target.centerY - outer / 2,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            width: hole,
            height: hole,
            borderRadius: hole / 2,
            left: target.centerX - hole / 2,
            top: target.centerY - hole / 2,
          },
        ]}
      />
      <View
        style={[styles.card, { top: target.centerY + hole / 2 + 16 }]}
      >
        <CamText variant="title">{title}</CamText>
        <CamText variant="subtitle">{body}</CamText>
        <CamButton
          title={buttonLabel}
          size="md"
          style={styles.button}
          onPress={onDismiss}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  spotlight: {
    position: "absolute",
    borderWidth: SCRIM,
    borderColor: CAM_OVERLAY_BLACK,
  },
  ring: {
    position: "absolute",
    borderWidth: 2,
    borderColor: CAM_TEXT,
  },
  card: {
    position: "absolute",
    left: 24,
    right: 24,
    gap: 8,
  },
  button: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
});
