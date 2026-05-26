import React from "react";
import { View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  /** Full-screen layer behind `children`; does not receive touches */
  backdrop: React.ReactNode;
  rootStyle?: StyleProp<ViewStyle>;
};

/**
 * Renders `children` first in the flex tree so they get real height, then paints
 * `backdrop` absolutely behind. Inverted order (backdrop-first) can collapse the
 * foreground to zero height on Yoga while still showing the background + bubbles.
 */
export default function FullBleedStack({
  children,
  backdrop,
  rootStyle,
}: Props) {
  return (
    <View style={[styles.root, rootStyle]}>
      <View style={styles.foreground}>{children}</View>
      <View pointerEvents="none" style={styles.backdrop}>
        {backdrop}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  foreground: {
    flex: 1,
    zIndex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});
