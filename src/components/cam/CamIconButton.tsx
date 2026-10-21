import React from "react";
import { Animated, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AudioManager from "../../utils/audioManager";
import { CAM_TEXT, CAM_UI } from "../../screens/Cam/cam.constants";
import { CamGlass, useCamPressScale } from "./CamButton";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
};

/** Round glass button with a single icon (close, settings). */
export default function CamIconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 40,
}: Props) {
  const press = useCamPressScale();

  return (
    <Animated.View style={{ transform: [{ scale: press.scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={8}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        onPress={() => {
          AudioManager.playButtonClick();
          onPress();
        }}
        style={[
          styles.button,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <CamGlass />
        <Ionicons name={icon} size={size * 0.5} color={CAM_TEXT} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CAM_UI.secondaryBorder,
  },
});
