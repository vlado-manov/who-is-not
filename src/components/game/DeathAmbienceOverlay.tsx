import React, { memo, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";

type GhostDef = {
  left: string;
  top: string;
  size: number;
  dur: number;
  delay: number;
  drift: number;
};

type EmberDef = {
  left: string;
  size: number;
  dur: number;
  delay: number;
  color: string;
  /** Start height as % from screen bottom (0 = edge). */
  startBottomPct: number;
  /** How far up they travel, as fraction of screen height. */
  travelRatio: number;
};

const GHOST_DUR_SCALE = 1.35;

const GHOSTS: GhostDef[] = [
  { left: "8%", top: "18%", size: 52, dur: Math.round(4200 * GHOST_DUR_SCALE), delay: 0, drift: 14 },
  { left: "78%", top: "30%", size: 44, dur: Math.round(3800 * GHOST_DUR_SCALE), delay: 600, drift: -12 },
  { left: "62%", top: "12%", size: 36, dur: Math.round(5100 * GHOST_DUR_SCALE), delay: 1200, drift: 10 },
  { left: "22%", top: "38%", size: 40, dur: Math.round(4600 * GHOST_DUR_SCALE), delay: 900, drift: -16 },
  { left: "44%", top: "20%", size: 34, dur: Math.round(4400 * GHOST_DUR_SCALE), delay: 1500, drift: 12 },
];

const EMBERS: EmberDef[] = [
  { left: "3%", size: 5, dur: 24000, delay: 0, color: "#f472b6", startBottomPct: 2, travelRatio: 0.72 },
  { left: "9%", size: 4, dur: 19000, delay: 2200, color: "#e879f9", startBottomPct: 14, travelRatio: 0.48 },
  { left: "16%", size: 6, dur: 27000, delay: 480, color: "#fb7185", startBottomPct: 6, travelRatio: 0.85 },
  { left: "23%", size: 3, dur: 15000, delay: 3100, color: "#fbbf24", startBottomPct: 22, travelRatio: 0.38 },
  { left: "31%", size: 5, dur: 26000, delay: 1400, color: "#f472b6", startBottomPct: 4, travelRatio: 0.78 },
  { left: "37%", size: 4, dur: 21000, delay: 800, color: "#c084fc", startBottomPct: 18, travelRatio: 0.55 },
  { left: "44%", size: 7, dur: 28000, delay: 2600, color: "#fb923c", startBottomPct: 8, travelRatio: 0.82 },
  { left: "51%", size: 3, dur: 17000, delay: 120, color: "#e879f9", startBottomPct: 26, travelRatio: 0.42 },
  { left: "57%", size: 5, dur: 25000, delay: 3600, color: "#fda4af", startBottomPct: 3, travelRatio: 0.76 },
  { left: "63%", size: 4, dur: 22000, delay: 1900, color: "#f0abfc", startBottomPct: 16, travelRatio: 0.52 },
  { left: "69%", size: 6, dur: 26500, delay: 700, color: "#fb7185", startBottomPct: 10, travelRatio: 0.88 },
  { left: "75%", size: 3, dur: 16000, delay: 2800, color: "#fde047", startBottomPct: 24, travelRatio: 0.36 },
  { left: "81%", size: 5, dur: 25500, delay: 4100, color: "#fda4af", startBottomPct: 5, travelRatio: 0.74 },
  { left: "87%", size: 4, dur: 20000, delay: 1500, color: "#f0abfc", startBottomPct: 20, travelRatio: 0.46 },
  { left: "93%", size: 6, dur: 27500, delay: 600, color: "#fb923c", startBottomPct: 7, travelRatio: 0.8 },
  { left: "6%", size: 4, dur: 23000, delay: 3400, color: "#e879f9", startBottomPct: 12, travelRatio: 0.58 },
  { left: "27%", size: 5, dur: 24500, delay: 2100, color: "#f472b6", startBottomPct: 9, travelRatio: 0.7 },
  { left: "47%", size: 3, dur: 18000, delay: 900, color: "#fde047", startBottomPct: 28, travelRatio: 0.4 },
  { left: "59%", size: 4, dur: 26200, delay: 4300, color: "#c084fc", startBottomPct: 11, travelRatio: 0.66 },
  { left: "71%", size: 5, dur: 23800, delay: 1700, color: "#fb7185", startBottomPct: 15, travelRatio: 0.62 },
  { left: "84%", size: 4, dur: 26800, delay: 500, color: "#f472b6", startBottomPct: 4, travelRatio: 0.84 },
  { left: "96%", size: 3, dur: 19500, delay: 3800, color: "#e879f9", startBottomPct: 19, travelRatio: 0.44 },
];

const FloatingGhost = memo(function FloatingGhost({
  left,
  top,
  size,
  dur,
  delay,
  drift,
}: GhostDef) {
  const bob = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: dur,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: dur,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: dur * 0.85,
          delay,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: 0,
          duration: dur * 0.85,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const fadeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(fade, {
          toValue: 0.9,
          duration: dur * 0.6,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 0.45,
          duration: dur * 0.6,
          useNativeDriver: true,
        }),
      ]),
    );
    bobLoop.start();
    swayLoop.start();
    fadeLoop.start();
    return () => {
      bobLoop.stop();
      swayLoop.stop();
      fadeLoop.stop();
    };
  }, [bob, delay, dur, fade, sway]);

  const bodyH = size * 1.05;
  const tailH = size * 0.42;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: left as ViewStyle["left"],
        top: top as ViewStyle["top"],
        width: size,
        height: bodyH + tailH,
        opacity: fade,
        transform: [
          {
            translateY: bob.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -18],
            }),
          },
          {
            translateX: sway.interpolate({
              inputRange: [0, 1],
              outputRange: [-drift, drift],
            }),
          },
        ],
      }}
    >
      <View
        style={{
          width: size,
          height: bodyH,
          borderTopLeftRadius: size * 0.48,
          borderTopRightRadius: size * 0.48,
          borderBottomLeftRadius: size * 0.22,
          borderBottomRightRadius: size * 0.22,
          backgroundColor: "rgba(196, 140, 255, 0.72)",
          borderWidth: 1.5,
          borderColor: "rgba(255,255,255,0.35)",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: size * 0.18,
            marginTop: size * 0.28,
          }}
        >
          <View
            style={{
              width: size * 0.16,
              height: size * 0.2,
              borderRadius: size * 0.1,
              backgroundColor: "rgba(30, 10, 40, 0.85)",
            }}
          />
          <View
            style={{
              width: size * 0.16,
              height: size * 0.2,
              borderRadius: size * 0.1,
              backgroundColor: "rgba(30, 10, 40, 0.85)",
            }}
          />
        </View>
        <View
          style={{
            alignSelf: "center",
            marginTop: size * 0.06,
            width: size * 0.12,
            height: size * 0.08,
            borderBottomLeftRadius: size * 0.08,
            borderBottomRightRadius: size * 0.08,
            backgroundColor: "rgba(30, 10, 40, 0.85)",
          }}
        />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: -2 }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: size * 0.28,
              height: tailH,
              marginHorizontal: -size * 0.04,
              borderBottomLeftRadius: size * 0.2,
              borderBottomRightRadius: size * 0.2,
              backgroundColor: "rgba(196, 140, 255, 0.72)",
            }}
          />
        ))}
      </View>
    </Animated.View>
  );
});

const RisingEmber = memo(function RisingEmber({
  left,
  size,
  dur,
  delay,
  color,
  startBottomPct,
  travelRatio,
}: EmberDef) {
  const { height } = useWindowDimensions();
  const posY = useRef(new Animated.Value(0)).current;
  const alpha = useRef(new Animated.Value(0)).current;
  const travelPx = height * travelRatio;

  useEffect(() => {
    posY.setValue(0);
    alpha.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(posY, {
            toValue: 1,
            duration: dur,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(alpha, {
              toValue: 0.85,
              duration: dur * 0.12,
              useNativeDriver: true,
            }),
            Animated.timing(alpha, {
              toValue: 0,
              duration: dur * 0.88,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(posY, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [alpha, delay, dur, posY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        bottom: startBottomPct > 0 ? (`${startBottomPct}%` as ViewStyle["bottom"]) : 0,
        left: left as ViewStyle["left"],
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: alpha,
        transform: [
          {
            translateY: posY.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -travelPx],
            }),
          },
        ],
      }}
    />
  );
});

export default function DeathAmbienceOverlay() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {EMBERS.map((e, i) => (
        <RisingEmber key={`ember-${i}`} {...e} />
      ))}
      {GHOSTS.map((g, i) => (
        <FloatingGhost key={`ghost-${i}`} {...g} />
      ))}
    </View>
  );
}
