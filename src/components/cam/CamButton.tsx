import React, { useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

import AudioManager from "../../utils/audioManager";
import { CAM_FONT, CAM_TEXT, CAM_UI } from "../../screens/Cam/cam.constants";

/**
 * `primary` = TikTok red, `secondary` = translucent grey, `light` = white (for
 * use on colour tints), `dark` = black (for use on red backgrounds).
 */
export type CamButtonVariant =
  | "primary"
  | "secondary"
  | "light"
  | "dark"
  /** Grey fill with dark text, for unselected options on a white screen. */
  | "fill";

type Props = {
  title: string;
  onPress?: () => void;
  variant?: CamButtonVariant;
  /** `tile` is the large square used for the player-count choice. */
  shape?: "bar" | "tile";
  /** Side of the `tile` shape. */
  tileSize?: number;
  size?: "lg" | "md";
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** Spring scale used by every Cam Mode control while it is pressed. */
export function useCamPressScale() {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (toValue: number) =>
    Animated.spring(scale, {
      toValue,
      speed: 40,
      bounciness: 6,
      useNativeDriver: true,
    }).start();

  return {
    scale,
    onPressIn: () => to(CAM_UI.pressedScale),
    onPressOut: () => to(1),
  };
}

/** Translucent material behind secondary controls; Android gets a flat tint. */
export function CamGlass() {
  return (
    <>
      {Platform.OS === "ios" && (
        <BlurView
          intensity={CAM_UI.blurIntensity}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={[StyleSheet.absoluteFill, styles.glassTint]} />
    </>
  );
}

/**
 * Cam Mode button. Deliberately not `CustomButton`: this mode is styled after
 * TikTok (TikTok Sans, red primary, grey translucent secondary).
 */
export default function CamButton({
  title,
  onPress,
  variant = "primary",
  shape = "bar",
  tileSize = 88,
  size = "lg",
  icon,
  disabled = false,
  style,
  accessibilityLabel,
}: Props) {
  const press = useCamPressScale();
  const isSecondary = variant === "secondary";
  const labelColor =
    variant === "light" || variant === "fill" ? CAM_UI.lightText : CAM_TEXT;

  return (
    <Animated.View
      style={[
        { transform: [{ scale: press.scale }] },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        disabled={disabled}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        onPress={() => {
          AudioManager.playButtonClick();
          onPress?.();
        }}
        style={[
          styles.base,
          shape === "tile"
            ? [styles.tile, { width: tileSize, height: tileSize }]
            : size === "lg"
              ? styles.lg
              : styles.md,
          variant === "primary" && styles.primary,
          variant === "light" && styles.light,
          variant === "dark" && styles.dark,
          variant === "fill" && styles.fill,
          isSecondary && styles.secondaryBorder,
        ]}
      >
        {isSecondary && <CamGlass />}
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.2}
          style={[
            shape === "tile"
              ? [styles.tileLabel, { fontSize: tileSize * 0.42 }]
              : styles.label,
            { color: labelColor },
          ]}
        >
          {title}
        </Text>
        {icon && <Ionicons name={icon} size={18} color={labelColor} />}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    overflow: "hidden",
    paddingHorizontal: 20,
    borderRadius: CAM_UI.radius,
  },
  lg: {
    height: 50,
  },
  md: {
    height: 42,
  },
  tile: {
    borderRadius: 16,
    paddingHorizontal: 0,
  },
  primary: {
    backgroundColor: CAM_UI.primary,
  },
  light: {
    backgroundColor: CAM_TEXT,
  },
  dark: {
    backgroundColor: CAM_UI.lightText,
  },
  fill: {
    backgroundColor: "#F1F1F2",
  },
  glassTint: {
    backgroundColor: CAM_UI.secondary,
  },
  secondaryBorder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CAM_UI.secondaryBorder,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily: CAM_FONT.bold,
    fontSize: 16,
  },
  tileLabel: {
    fontFamily: CAM_FONT.extraBold,
  },
});
