import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from "react-native";

type Props = {
  /** How many pieces fall at once. */
  count?: number;
  /** How many times each piece falls before the rain stops. */
  rounds?: number;
};

const COLORS = ["#FE2C55", "#25F4EE", "#FFD43B", "#7C5CFF", "#FF8A00", "#FFFFFF"];

type Piece = {
  left: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
  spins: number;
};

function Flake({ piece, height, rounds }: { piece: Piece; height: number; rounds: number }) {
  const fall = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(piece.delay),
        Animated.timing(fall, {
          toValue: 1,
          duration: piece.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
      { iterations: rounds },
    );
    anim.start();
    return () => anim.stop();
  }, [fall, piece.delay, piece.duration, rounds]);

  return (
    <Animated.View
      style={[
        styles.flake,
        {
          left: piece.left,
          width: piece.size,
          height: piece.size * 1.6,
          backgroundColor: piece.color,
          opacity: fall.interpolate({
            inputRange: [0, 0.05, 0.9, 1],
            outputRange: [0, 1, 1, 0],
          }),
          transform: [
            {
              translateY: fall.interpolate({
                inputRange: [0, 1],
                outputRange: [-30, height + 30],
              }),
            },
            {
              translateX: fall.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, piece.drift, 0],
              }),
            },
            {
              rotate: fall.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", `${piece.spins * 360}deg`],
              }),
            },
          ],
        },
      ]}
    />
  );
}

/** Confetti falling from the top of the screen for a few rounds, then calm. */
export default function ConfettiRain({ count = 44, rounds = 3 }: Props) {
  const { width, height } = useWindowDimensions();

  // Laid out once; the randomness is only in where and how fast pieces fall.
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * width,
        size: 6 + Math.random() * 5,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 1800,
        duration: 2400 + Math.random() * 1800,
        drift: (Math.random() - 0.5) * 80,
        spins: 1 + Math.round(Math.random() * 3),
      })),
    [count, width],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, i) => (
        <Flake key={i} piece={piece} height={height} rounds={rounds} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flake: {
    position: "absolute",
    top: 0,
    borderRadius: 2,
  },
});
