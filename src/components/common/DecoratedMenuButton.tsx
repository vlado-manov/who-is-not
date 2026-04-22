import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

type Props = {
  children: React.ReactNode;
  /** Ionicons name — decorative, sits outside the button edge. */
  decorName: IoniconsName;
  decorSize?: number;
  /** Degrees string for transform rotate */
  rotation?: string;
  /** Nudge icon position (design tuning) */
  offsetLeft?: number;
  offsetRight?: number;
  offsetTop?: number;
  /** Where the “floating” icon sits relative to the button */
  anchor?: "left" | "right";
};

/**
 * Wraps a button with a floating Ionicons glyph that breaks past the button bounds.
 */
export default function DecoratedMenuButton({
  children,
  decorName,
  decorSize = 30,
  rotation = "-14deg",
  offsetLeft = -4,
  offsetRight = -4,
  offsetTop = -18,
  anchor = "left",
}: Props) {
  const posStyle =
    anchor === "left"
      ? { left: offsetLeft, right: undefined as number | undefined }
      : { right: offsetRight, left: undefined as number | undefined };

  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        <View
          style={[
            styles.decor,
            posStyle,
            {
              top: offsetTop,
              transform: [{ rotate: rotation }],
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons
            name={decorName}
            size={decorSize}
            color="rgba(255, 252, 245, 0.92)"
            style={styles.decorShadow}
          />
        </View>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "visible",
    width: "100%",
  },
  inner: {
    position: "relative",
    overflow: "visible",
    width: "100%",
  },
  decor: {
    position: "absolute",
    zIndex: 10,
  },
  decorShadow: {
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
