// src/components/ClosingCurtainOverlay.tsx
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View,
} from "react-native";
import AppImage from "./AppImage";
import { LinearGradient } from "expo-linear-gradient";
import { images } from "../../assets/images";
import AudioManager from "../utils/audioManager";

const { height: H, width: W } = Dimensions.get("window");
const OVERSHOOT_PX = 120;

type Props = {
  onDone: () => void;
  durationMs?: number;
};

/** Curtains close from off-screen (top/bottom) to meeting in middle, with timer.
 * Gradient overlay (15% black top/bottom, transparent middle) animates in sync. */
export default function ClosingCurtainOverlay({
  onDone,
  durationMs = 2400,
}: Props) {
  const topY = useRef(new Animated.Value(-H / 2 - OVERSHOOT_PX)).current;
  const botY = useRef(new Animated.Value(H / 2 + OVERSHOOT_PX)).current;
  const gradientOpacity = useRef(new Animated.Value(0.15)).current;

  const curtainTopSource =
    typeof images.curtainTop === "string"
      ? { uri: images.curtainTop }
      : images.curtainTop;
  const curtainBottomSource =
    typeof images.curtainBottom === "string"
      ? { uri: images.curtainBottom }
      : images.curtainBottom;

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    AudioManager.stopBackground();
    AudioManager.playCurtainSoundClose();

    Animated.parallel([
      Animated.timing(topY, {
        toValue: 0,
        duration: durationMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(botY, {
        toValue: 0,
        duration: durationMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(gradientOpacity, {
        toValue: 1,
        duration: durationMs,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onDoneRef.current();
    });
    // Run only on mount – onDone in ref to avoid re-running on parent re-renders (countdown)
  }, [durationMs, topY, botY, gradientOpacity]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[styles.gradientOverlay, { opacity: gradientOpacity }]}
      >
        <LinearGradient
          colors={[
            "rgba(0,0,0,1)",
            "rgba(0,0,0,1)",
            "rgba(0,0,0,1)",
            "rgba(0,0,0,1)",
          ]}
          locations={[0.51, 0.52, 0.6, 0.61]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.half,
          styles.topHalf,
          { transform: [{ translateY: topY }] },
        ]}
      >
        <AppImage
          source={curtainTopSource}
          contentFit="contain"
          style={[styles.curtainImage, { bottom: -117, width: W, height: "100%" }]}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.half,
          styles.bottomHalf,
          { transform: [{ translateY: botY }] },
        ]}
      >
        <AppImage
          source={curtainBottomSource}
          contentFit="contain"
          style={[styles.curtainImage, { top: -117, width: W, height: "100%" }]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: "transparent",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  half: {
    position: "absolute",
    width: "100%",
    height: "50%",
    backgroundColor: "transparent",
    overflow: "visible",
  },
  topHalf: { top: 0, zIndex: 1 },
  bottomHalf: { bottom: 0, zIndex: 1 },
  curtainImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
});
