import React from "react";
import { ActivityIndicator, ImageBackground, StyleSheet, View } from "react-native";

import LoadingScreen from "../../components/LoadingScreen";
import { backgrounds } from "../../../assets/backgrounds";
import { useGameStore } from "../../store/useGameStore";
import { CAM_OVERLAY_BLACK, CAM_TEXT } from "../Cam/cam.constants";

/**
 * Loader while the hero picker gets ready.
 * Party mode (LOCAL) uses the same loader as Cam Mode: the dimmed background
 * with a plain spinner, matching the player-count screen before it.
 * Online keeps the game loading screen.
 */
export default function HeroPickerLoadingOverlay() {
  const mode = useGameStore((s) => s.mode);

  if (mode === "ONLINE") {
    return (
      <View style={styles.root}>
        <LoadingScreen
          skipIntroAnimation
          fullScreenWithStatusBar
          backgroundSource={backgrounds.bg024}
        />
      </View>
    );
  }

  return (
    <ImageBackground
      source={backgrounds.bg024}
      resizeMode="cover"
      style={styles.root}
    >
      <View style={[StyleSheet.absoluteFill, styles.dim]}>
        <ActivityIndicator size="large" color={CAM_TEXT} />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  dim: {
    backgroundColor: CAM_OVERLAY_BLACK,
    alignItems: "center",
    justifyContent: "center",
  },
});
