import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { TTL } from "../../constants/tiktokTheme";

type Props = {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** Accepted and ignored so it can stand in for an `ImageBackground` plate. */
  source?: unknown;
  resizeMode?: unknown;
  imageStyle?: unknown;
};

/**
 * Stand-in for the game's parchment `ImageBackground` plates in the light
 * TikTok look. It keeps the plate's layout style but draws nothing of its own:
 * no card, border, gold edges or glow — the controls inside sit directly on
 * the white background, as they do in TikTok.
 */
export default function LightPlate({ style, children }: Props) {
  return <View style={[style, styles.plate]}>{children}</View>;
}

const styles = StyleSheet.create({
  plate: {
    backgroundColor: TTL.card,
    borderWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
});
