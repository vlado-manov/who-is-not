// src/components/RateFloatMenu.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import AppImage from "./AppImage";
import CustomButton from "./common/CustomButton";
import { backgrounds } from "../../assets/backgrounds";

const ORBIT_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const BASE_URL =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery";

const BTN_IMAGES: Record<number, { uri: string }> = {
  1: { uri: `${BASE_URL}/7d65e802-5be7-48ca-b85e-5019c980da34-btntest01.webp` },
  2: { uri: `${BASE_URL}/10817853-e3c5-46d3-aa4c-b9cfde3df758-btntest02.webp` },
  3: { uri: `${BASE_URL}/72a41c99-dd0f-4006-97f3-fd626ab75203-btntest03.webp` },
  4: { uri: `${BASE_URL}/e442e88f-769f-4590-9866-912c57eeeb83-btntest04.webp` },
  5: { uri: `${BASE_URL}/7af0211b-e8fd-4313-baeb-8379d4f179f6-btntest05.webp` },
  6: { uri: `${BASE_URL}/71903ea7-8f66-4a17-9b3c-49728f916027-btntest06.webp` },
  7: { uri: `${BASE_URL}/33c1be1e-ea32-4655-9b60-60ebf8989431-btntest07.webp` },
  8: { uri: `${BASE_URL}/337fd83b-f5ca-41d3-b84d-50296322ae70-btntest08.webp` },
  9: { uri: `${BASE_URL}/0157745f-93e8-4c1e-b54c-3c874a491654-btntest09.webp` },
  10: {
    uri: `${BASE_URL}/d0fbbd5e-e69c-4d77-a0df-2e236da08b50-btntest10.webp`,
  },
};

type RateFloatMenuProps = {
  onSelect: (value: number) => void;
  tapHintText: string;
  confirmYesText: string;
};

export default function RateFloatMenu({
  onSelect,
  confirmYesText,
}: RateFloatMenuProps) {
  const [pendingValue, setPendingValue] = useState<number | null>(null);
  const { width } = useWindowDimensions();
  const size = Math.min(width - 48, 340);
  const orbitRadius = size * 0.38;
  const orbitBtnSize = Math.floor(size * 0.2);
  const centerBtnSize = Math.floor(size * 0.4);

  const orbitRotation = useRef(new Animated.Value(0)).current;
  const centerBounceX = useRef(new Animated.Value(0)).current;
  const centerBounceY = useRef(new Animated.Value(0)).current;
  const centerScale = useRef(new Animated.Value(1)).current;
  const centerRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotation = Animated.loop(
      Animated.timing(orbitRotation, {
        toValue: 1,
        duration: 45000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    rotation.start();
    return () => rotation.stop();
  }, [orbitRotation]);

  useEffect(() => {
    const spring = { tension: 140, friction: 11, useNativeDriver: true };
    const d = (ms: number) => Animated.delay(ms);

    const to = (x: number, y: number) =>
      Animated.parallel([
        Animated.spring(centerBounceX, { ...spring, toValue: x }),
        Animated.spring(centerBounceY, { ...spring, toValue: y }),
      ]);

    const scale = (s: number) =>
      Animated.spring(centerScale, { ...spring, toValue: s });

    const tilt = (deg: number) =>
      Animated.spring(centerRotate, {
        ...spring,
        toValue: deg,
      });

    const centerAttention = Animated.loop(
      Animated.sequence([
        Animated.sequence([to(0, -22), to(0, 0)]),
        d(600),
        Animated.parallel([scale(1.07), to(0, -8)]),
        Animated.parallel([scale(1), to(0, 0)]),
        d(500),
        Animated.sequence([to(-16, -20), to(0, 0)]),
        d(800),
        Animated.sequence([tilt(-4), tilt(4), tilt(0)]),
        d(400),
        Animated.sequence([to(16, -20), to(0, 0)]),
        d(700),
        Animated.sequence([scale(0.96), scale(1.05), scale(1)]),
        d(500),
        Animated.sequence([to(0, -16), to(0, 0), to(0, -16), to(0, 0)]),
        d(1200),
      ]),
    );
    centerAttention.start();
    return () => centerAttention.stop();
  }, [centerBounceX, centerBounceY, centerScale, centerRotate]);

  const orbitRotateDeg = orbitRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const counterRotateDeg = orbitRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-360deg"],
  });

  const handleNumberPress = (value: number) => {
    setPendingValue(value);
  };

  const handleFinalChoice = () => {
    if (pendingValue !== null) {
      onSelect(pendingValue);
    }
  };

  const centerValue = pendingValue ?? 10;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.orbitWrapper, { width: size, height: size }]}>
        <Animated.View
          style={[
            styles.orbitRing,
            {
              width: size,
              height: size,
              transform: [{ rotate: orbitRotateDeg }],
            },
          ]}
        >
          {ORBIT_VALUES.map((n, i) => {
            const angle = (i / 9) * 2 * Math.PI - Math.PI / 2;
            const x = orbitRadius * Math.cos(angle);
            const y = orbitRadius * Math.sin(angle);
            const isSwapped = pendingValue === n;
            const displayValue = isSwapped ? 10 : n;

            return (
              <Animated.View
                key={n}
                style={[
                  styles.orbitBtn,
                  {
                    left: size / 2 - orbitBtnSize / 2 + x,
                    top: size / 2 - orbitBtnSize / 2 + y,
                    width: orbitBtnSize,
                    height: orbitBtnSize,
                    borderRadius: orbitBtnSize / 2,
                    transform: [{ rotate: counterRotateDeg }],
                  },
                ]}
              >
                <Pressable
                  onPress={() => handleNumberPress(displayValue)}
                  style={styles.orbitPressable}
                >
                  <AppImage
                    source={BTN_IMAGES[displayValue]}
                    style={styles.orbitImage}
                    contentFit="contain"
                  />
                </Pressable>
              </Animated.View>
            );
          })}
        </Animated.View>

        <Animated.View
          style={[
            styles.centerBtn,
            {
              left: size / 2 - centerBtnSize / 2,
              top: size / 2 - centerBtnSize / 2,
              width: centerBtnSize,
              height: centerBtnSize,
              // borderRadius: centerBtnSize / 2,
              transform: [
                { translateX: centerBounceX },
                { translateY: centerBounceY },
                {
                  scale: centerScale,
                },
                {
                  rotate: centerRotate.interpolate({
                    inputRange: [-4, 0, 4],
                    outputRange: ["-4deg", "0deg", "4deg"],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable
            onPress={() => handleNumberPress(centerValue)}
            style={styles.centerPressable}
          >
            <AppImage
              source={BTN_IMAGES[centerValue]}
              style={styles.centerImage}
              contentFit="contain"
            />
          </Pressable>
        </Animated.View>
      </View>

      {pendingValue !== null && (
        <View style={styles.finalChoiceRow}>
          <CustomButton
            title={confirmYesText}
            onPress={handleFinalChoice}
            btnSize="md"
            backgroundImage={backgrounds.bg026}
            glow
            glowColor="rgba(41,255,25,0.8)"
            shadowColor="#005f07"
            horizontalPadding={48}
            fullWidth
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    minHeight: 340,
    paddingBottom: 80,
    // backgroundColor: "#599373",
  },
  orbitWrapper: {
    position: "relative",
  },
  orbitRing: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  orbitBtn: {
    position: "absolute",
    overflow: "hidden",
    elevation: 6,
    backgroundColor: "#599373",
    padding: 4,
  },
  orbitPressable: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  orbitImage: {
    width: "100%",
    height: "100%",
  },
  centerBtn: {
    position: "absolute",
    overflow: "hidden",
    zIndex: 10,
    elevation: 10,
  },
  centerPressable: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  centerImage: {
    width: "100%",
    height: "100%",
  },
  finalChoiceRow: {
    marginTop: 16,
    alignItems: "center",
    width: "100%",
  },
});
