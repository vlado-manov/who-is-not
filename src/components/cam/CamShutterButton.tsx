import React from "react";
import { Animated, Pressable, StyleSheet } from "react-native";

import { CAM_TEXT, CAM_UI } from "../../screens/Cam/cam.constants";
import { useCamPressScale } from "./CamButton";

type Props = {
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
};

const RING_SIZE = 78;
const RING_WIDTH = 4;
const CORE_SIZE = 62;

/** TikTok-style record button: a white ring with a red core that shrinks while pressed. */
export default function CamShutterButton({
  onPress,
  disabled = false,
  accessibilityLabel,
}: Props) {
  const press = useCamPressScale();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      onPress={onPress}
      style={[styles.ring, disabled && styles.disabled]}
    >
      <Animated.View
        style={[styles.core, { transform: [{ scale: press.scale }] }]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_WIDTH,
    borderColor: CAM_TEXT,
    alignItems: "center",
    justifyContent: "center",
  },
  core: {
    width: CORE_SIZE,
    height: CORE_SIZE,
    borderRadius: CORE_SIZE / 2,
    backgroundColor: CAM_UI.primary,
  },
  disabled: {
    opacity: 0.4,
  },
});
