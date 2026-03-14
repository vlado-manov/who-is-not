// src/components/Round1TransitionOverlay.tsx
// Единен overlay: затваряне → countdown 3 2 1 GO → отваряне (без прекъсване)
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View,
} from "react-native";
import AppImage from "./AppImage";
import { LinearGradient } from "expo-linear-gradient";
import CustomText from "./common/CustomText";
import { images } from "../../assets/images";
import AudioManager from "../utils/audioManager";

const { height: H, width: W } = Dimensions.get("window");
const OVERSHOOT_PX = 120;
const CLOSE_MS = 1000;
const OPEN_MS = 2000;

type Props = {
  onDone: () => void;
  onCountdownStart?: () => void;
};

export default function Round1TransitionOverlay({
  onDone,
  onCountdownStart,
}: Props) {
  const topY = useRef(new Animated.Value(-H / 2 - OVERSHOOT_PX)).current;
  const botY = useRef(new Animated.Value(H / 2 + OVERSHOOT_PX)).current;
  const gradientOpacity = useRef(new Animated.Value(0)).current;
  const [countdownText, setCountdownText] = useState<string | null>(null);
  const countOpacity = useRef(new Animated.Value(0)).current;
  const countScale = useRef(new Animated.Value(1)).current;

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const onCountdownStartRef = useRef(onCountdownStart);
  onCountdownStartRef.current = onCountdownStart;

  const curtainTopSource =
    typeof images.curtainTop === "string"
      ? { uri: images.curtainTop }
      : images.curtainTop;
  const curtainBottomSource =
    typeof images.curtainBottom === "string"
      ? { uri: images.curtainBottom }
      : images.curtainBottom;

  useEffect(() => {
    AudioManager.stopBackground();
    AudioManager.playCurtainSoundClose();

    const doStep = (txt: string, scaleFrom = 1.5) =>
      new Promise<void>((res) => {
        setCountdownText(txt);
        countScale.setValue(scaleFrom);
        countOpacity.setValue(0);
        Animated.parallel([
          Animated.timing(countOpacity, {
            toValue: 1,
            duration: 120,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(countScale, {
            toValue: 1.0,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(() => res());
      });

    const runCount = async () => {
      onCountdownStartRef.current?.();
      AudioManager.playCount();
      await doStep("3");
      await new Promise((r) => setTimeout(r, 175));
      await doStep("2");
      await new Promise((r) => setTimeout(r, 175));
      await doStep("1");
      await new Promise((r) => setTimeout(r, 175));
      await doStep("GO!", 1.7);
      await new Promise((r) => setTimeout(r, 175));
      await new Promise<void>((res) => {
        Animated.timing(countOpacity, {
          toValue: 0,
          duration: 150,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }).start(() => res());
      });
      setCountdownText(null);
    };

    const openCurtains = () => {
      AudioManager.playCurtainSound();
      setTimeout(() => AudioManager.playBackgroundGame(), 1000);
      Animated.parallel([
        Animated.timing(topY, {
          toValue: -H / 2 - OVERSHOOT_PX,
          duration: OPEN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(botY, {
          toValue: H / 2 + OVERSHOOT_PX,
          duration: OPEN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(gradientOpacity, {
          toValue: 0,
          duration: OPEN_MS * 0.35,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onDoneRef.current();
      });
    };

    Animated.parallel([
      Animated.timing(topY, {
        toValue: 0,
        duration: CLOSE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(botY, {
        toValue: 0,
        duration: CLOSE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(gradientOpacity, {
        toValue: 1,
        duration: CLOSE_MS * 0.45,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(async ({ finished }) => {
      if (!finished) return;
      await runCount();
      await new Promise((r) => setTimeout(r, 800));
      openCurtains();
    });
  }, [topY, botY, gradientOpacity, countOpacity, countScale]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[styles.gradientOverlay, { opacity: gradientOpacity }]}
      >
        <LinearGradient
          colors={[
            "rgba(0,0,0,1)",
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0)",
            "rgba(0,0,0,1)",
          ]}
          locations={[0.25, 0.26, 0.74, 0.75]}
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
      {countdownText ? (
        <View style={styles.countdownWrap} pointerEvents="none">
          <Animated.View
            style={{
              opacity: countOpacity,
              transform: [{ scale: countScale }],
            }}
          >
            <CustomText
              variant="h1"
              className="text-center text-shadow-default"
            >
              {countdownText}
            </CustomText>
          </Animated.View>
        </View>
      ) : null}
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
  countdownWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
