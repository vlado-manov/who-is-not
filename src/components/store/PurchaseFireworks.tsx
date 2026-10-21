import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from "react-native";

type BurstSpec = {
  /** Centre of the burst as a fraction of the screen. */
  x: number;
  y: number;
  delay: number;
  radius: number;
  colors: readonly string[];
};

const PARTICLES = 18;
const BURST_MS = 1150;
const REST_MS = 900;
const ROUNDS = 3;
const GRAND_ROUNDS = 5;
/** Sparks sag a little at the end of their flight. */
const GRAVITY_DROP = 26;

const WARM = ["#FE2C55", "#FF8A00", "#FFD43B", "#FFFFFF"] as const;
const COOL = ["#25F4EE", "#7C5CFF", "#FFFFFF", "#FE2C55"] as const;

const BURSTS: readonly BurstSpec[] = [
  { x: 0.5, y: 0.2, delay: 0, radius: 120, colors: WARM },
  { x: 0.2, y: 0.28, delay: 280, radius: 86, colors: COOL },
  { x: 0.8, y: 0.26, delay: 520, radius: 92, colors: WARM },
  { x: 0.12, y: 0.52, delay: 900, radius: 70, colors: WARM },
  { x: 0.88, y: 0.5, delay: 1150, radius: 74, colors: COOL },
];

/** The usual bursts plus a second wave lower down and in between. */
const GRAND_BURSTS: readonly BurstSpec[] = [
  ...BURSTS,
  { x: 0.35, y: 0.12, delay: 1500, radius: 96, colors: COOL },
  { x: 0.66, y: 0.36, delay: 1800, radius: 110, colors: WARM },
  { x: 0.28, y: 0.7, delay: 2100, radius: 84, colors: COOL },
  { x: 0.74, y: 0.72, delay: 2400, radius: 88, colors: WARM },
  { x: 0.5, y: 0.58, delay: 2700, radius: 130, colors: COOL },
];

function Burst({
  spec,
  width,
  height,
  rounds,
}: {
  spec: BurstSpec;
  width: number;
  height: number;
  rounds: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(spec.delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: BURST_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(REST_MS),
      ]),
      { iterations: rounds },
    );
    anim.start();
    return () => anim.stop();
  }, [progress, rounds, spec.delay]);

  const opacity = progress.interpolate({
    inputRange: [0, 0.08, 0.65, 1],
    outputRange: [0, 1, 1, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0.3, 1, 0.55],
  });

  return (
    <View
      style={[styles.burst, { left: spec.x * width, top: spec.y * height }]}
    >
      {Array.from({ length: PARTICLES }, (_, i) => {
        const angle = (i / PARTICLES) * Math.PI * 2;
        // Every other spark flies a shorter way, which gives the burst depth.
        const reach = spec.radius * (i % 2 === 0 ? 1 : 0.62);
        const dx = Math.cos(angle) * reach;
        const dy = Math.sin(angle) * reach;
        return (
          <Animated.View
            key={i}
            style={[
              i % 2 === 0 ? styles.streak : styles.dot,
              {
                backgroundColor: spec.colors[i % spec.colors.length],
                opacity,
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, dx],
                    }),
                  },
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 0.7, 1],
                      outputRange: [0, dy * 0.88, dy + GRAVITY_DROP],
                    }),
                  },
                  { rotate: `${angle + Math.PI / 2}rad` },
                  { scale },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

/**
 * Fireworks behind a purchase confirmation: a few staggered bursts, then calm.
 * `grand` roughly doubles the bursts and keeps them going longer (donations).
 */
export default function PurchaseFireworks({ grand = false }: { grand?: boolean }) {
  const { width, height } = useWindowDimensions();
  const bursts = grand ? GRAND_BURSTS : BURSTS;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {bursts.map((spec, i) => (
        <Burst
          key={i}
          spec={spec}
          width={width}
          height={height}
          rounds={grand ? GRAND_ROUNDS : ROUNDS}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  burst: {
    position: "absolute",
    width: 0,
    height: 0,
  },
  streak: {
    position: "absolute",
    width: 3,
    height: 14,
    borderRadius: 2,
    marginLeft: -1.5,
    marginTop: -7,
  },
  dot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: -3,
    marginTop: -3,
  },
});
