import React from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

import { CAM_TEXT } from "../../screens/Cam/cam.constants";
import { useCamPressScale } from "./CamButton";

type Props = {
  color: string;
  selected: boolean;
  /** Already picked by another player. */
  taken: boolean;
  onPress: () => void;
  accessibilityLabel: string;
};

const RING_SIZE = 46;
const DOT_SIZE = 34;

/** Colour dot; the selected one gets a white ring around it. */
export default function CamColorSwatch({
  color,
  selected,
  taken,
  onPress,
  accessibilityLabel,
}: Props) {
  const press = useCamPressScale();

  return (
    <Animated.View style={{ transform: [{ scale: press.scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected, disabled: taken }}
        disabled={taken}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        onPress={onPress}
        style={[styles.ring, selected && styles.ringSelected, taken && styles.taken]}
      >
        <View style={[styles.dot, { backgroundColor: color }]} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 3,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  ringSelected: {
    borderColor: CAM_TEXT,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  taken: {
    opacity: 0.2,
  },
});
