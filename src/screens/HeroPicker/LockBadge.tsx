// src/screens/HeroPicker/LockBadge.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Canvas, Circle, Path, Skia } from "@shopify/react-native-skia";
import { Ionicons } from "@expo/vector-icons";

import type { IUnlockInfo } from "../../types/character";
import { formatPrice } from "../../game/unlocks";

const SIZE = 58;
const RING = 4;
const GOLD = "#FFD966";

type Props = {
  unlock: IUnlockInfo;
  /** Shown under the badge when the hero/skin is sold. */
  showPrice?: boolean;
};

/**
 * A locked hero's corner badge (in the style of Brawl Stars / Clash Royale):
 * a dark glass disc with a gold padlock that gently bobs. For "earn it" locks a
 * gold ring shows how far along the player is, with "3/10" under it; for "buy"
 * locks the price sits under it.
 */
export default function LockBadge({ unlock, showPrice = true }: Props) {
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  const action = unlock.action;
  const share = action ? Math.min(1, action.progress / Math.max(1, action.target)) : 0;
  const arc = useMemo(() => {
    const path = Skia.Path.Make();
    const r = SIZE / 2 - RING / 2;
    path.addArc(
      { x: RING / 2, y: RING / 2, width: r * 2, height: r * 2 },
      -90,
      360 * share,
    );
    return path;
  }, [share]);
  const sold = unlock.mode === "BUY" || unlock.mode === "BUY_OR_ACTION";
  const price = unlock.discountPrice ?? unlock.price;

  return (
    <View pointerEvents="none" style={styles.root}>
      <Animated.View
        style={[
          styles.disc,
          {
            transform: [
              { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
            ],
          },
        ]}
      >
        {action ? (
          <Canvas style={StyleSheet.absoluteFill}>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={SIZE / 2 - RING / 2}
              style="stroke"
              strokeWidth={RING}
              color="rgba(255,255,255,0.18)"
            />
            <Path
              path={arc}
              style="stroke"
              strokeWidth={RING}
              strokeCap="round"
              color={GOLD}
            />
          </Canvas>
        ) : null}
        <Ionicons name="lock-closed" size={24} color={GOLD} />
      </Animated.View>
      {action ? (
        <Text style={styles.label}>{`${action.progress}/${action.target}`}</Text>
      ) : null}
      {sold && showPrice && price ? (
        <View style={styles.priceChip}>
          <Text style={styles.priceText}>{formatPrice(price)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    gap: 4,
  },
  disc: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,12,28,0.78)",
    borderWidth: 1.5,
    borderColor: "rgba(255,217,102,0.55)",
    boxShadow: "0px 0px 14px rgba(255,217,102,0.35)",
  },
  label: {
    color: "#FFFFFF",
    fontFamily: "Onest-ExtraBold",
    fontSize: 13,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 3,
  },
  priceChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: GOLD,
  },
  priceText: {
    color: "#3A2400",
    fontFamily: "Onest-ExtraBold",
    fontSize: 13,
  },
});
