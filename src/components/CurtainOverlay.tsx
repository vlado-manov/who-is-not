// src/components/CurtainOverlay.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  View,
} from "react-native";
import { images } from "../../assets/images";
import AudioManager from "../utils/audioManager";

const { height: H } = Dimensions.get("window");

type Props = {
  onDone: () => void;
  delayMs?: number;
  durationMs?: number;
  edgeOffset?: number;
  overshootPx?: number;
};

export default function CurtainOverlay({
  onDone,
  delayMs = 800,
  durationMs = 3800,
  edgeOffset = 117,
  overshootPx = 120,
}: Props) {
  const topY = useRef(new Animated.Value(0)).current;
  const bottomY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(1)).current;
  const [canTouch, setCanTouch] = useState(false);

  useEffect(() => {
    const touchDelay = delayMs + durationMs * 0.2;
    const touchTimer = setTimeout(() => setCanTouch(true), touchDelay);

    const soundTimer = setTimeout(() => {
      AudioManager.playCurtainSound();
    }, delayMs);

    Animated.sequence([
      Animated.delay(delayMs),
      Animated.parallel([
        Animated.timing(topY, {
          toValue: -H / 2 - overshootPx,
          duration: durationMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bottomY, {
          toValue: H / 2 + overshootPx,
          duration: durationMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) onDone();
    });

    return () => {
      clearTimeout(touchTimer);
      clearTimeout(soundTimer);
    };
  }, [
    delayMs,
    durationMs,
    overshootPx,
    topY,
    bottomY,
    backdropOpacity,
    onDone,
  ]);

  return (
    <View pointerEvents={canTouch ? "none" : "auto"} style={styles.container}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: backdropOpacity, backgroundColor: "#000" },
        ]}
      />

      <Animated.View
        style={[
          styles.half,
          styles.topHalf,
          { transform: [{ translateY: topY }] },
        ]}
      >
        <Image
          source={images.curtainTop}
          resizeMode="contain"
          style={[styles.image, { bottom: -edgeOffset, zIndex: 99 }]}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.half,
          styles.bottomHalf,
          { transform: [{ translateY: bottomY }] },
        ]}
      >
        <Image
          source={images.curtainBottom}
          resizeMode="contain"
          style={[styles.image, { top: -edgeOffset, zIndex: 9 }]}
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
  half: {
    position: "absolute",
    width: "100%",
    height: "50%",
    backgroundColor: "transparent",
    overflow: "visible",
  },
  topHalf: { top: 0, zIndex: 99 },
  bottomHalf: { bottom: 0 },
  image: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
});
