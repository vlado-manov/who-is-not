import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Vignette blur on left/right so the live game feels distant (“shadow realm”).
 * Web: gradient-only fallback (no native blur).
 */
export default function SpectatorRealmOverlay() {
  const edgeStyle = { width: "22%" as const };

  if (Platform.OS === "web") {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={["rgba(8,6,18,0.92)", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.edge, edgeStyle, { left: 0 }]}
        />
        <LinearGradient
          colors={["transparent", "rgba(8,6,18,0.92)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.edge, edgeStyle, { right: 0 }]}
        />
        <View style={styles.veil} />
      </View>
    );
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <BlurView intensity={72} tint="dark" style={[styles.edge, edgeStyle, { left: 0 }]} />
      <BlurView intensity={72} tint="dark" style={[styles.edge, edgeStyle, { right: 0 }]} />
      <LinearGradient
        colors={["rgba(0,0,0,0.55)", "transparent", "rgba(0,0,0,0.55)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  edge: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,4,12,0.25)",
  },
});
