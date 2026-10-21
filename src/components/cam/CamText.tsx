import React from "react";
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from "react-native";

import { CAM_FONT, CAM_TEXT } from "../../screens/Cam/cam.constants";

export type CamTextVariant =
  | "title"
  | "question"
  | "subtitle"
  | "body"
  | "ribbon"
  | "digit";

type Props = Omit<TextProps, "style"> & {
  variant?: CamTextVariant;
  color?: string;
  center?: boolean;
  /** Soft shadow for text drawn straight over the camera or a colour tint. */
  shadow?: boolean;
  style?: StyleProp<TextStyle>;
};

/**
 * Cam Mode text. Deliberately not `CustomText`: this mode uses TikTok Sans and
 * TikTok-like sizes instead of the game's typography.
 */
export default function CamText({
  variant = "body",
  color = CAM_TEXT,
  center = false,
  shadow = false,
  style,
  ...rest
}: Props) {
  return (
    <Text
      maxFontSizeMultiplier={1.2}
      {...rest}
      style={[
        styles[variant],
        { color },
        center && styles.center,
        shadow && styles.shadow,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: CAM_FONT.bold,
    fontSize: 26,
    lineHeight: 32,
  },
  question: {
    fontFamily: CAM_FONT.extraBold,
    fontSize: 34,
    lineHeight: 42,
  },
  subtitle: {
    fontFamily: CAM_FONT.medium,
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.8,
  },
  body: {
    fontFamily: CAM_FONT.semiBold,
    fontSize: 17,
    lineHeight: 23,
  },
  ribbon: {
    fontFamily: CAM_FONT.bold,
    fontSize: 24,
    lineHeight: 30,
  },
  digit: {
    fontFamily: CAM_FONT.extraBold,
    fontSize: 112,
    lineHeight: 124,
  },
  center: {
    textAlign: "center",
  },
  shadow: {
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
