import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Image } from "expo-image";

import { HEART_EMPTY_URI, HEART_FULL_URI } from "../../constants/heartImages";
import { CAM_TIMING, CAM_UI } from "../../screens/Cam/cam.constants";

type Props = {
  /** Lives left (already reduced when `losing`). */
  count: number;
  max: number;
  size: number;
  /** Plays the heart-loss pulse on the heart that was just lost. */
  losing: boolean;
};

const GLOW_EXTRA = 14;

/**
 * Row of life hearts. Losing a life uses the same pulse-and-glow as the classic
 * lives reveal: the heart swells, glows, shrinks back and turns empty.
 */
export default function CamHearts({ count, max, size, losing }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(losing ? count + 1 : count);

  useEffect(() => {
    if (!losing) {
      setShown(count);
      return;
    }
    setShown(count + 1);
    pulse.setValue(0);
    const anim = Animated.sequence([
      Animated.delay(CAM_TIMING.heartLossDelayMs),
      Animated.timing(pulse, {
        toValue: 1,
        duration: CAM_TIMING.heartPulseUpMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 0,
        duration: CAM_TIMING.heartPulseDownMs,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    anim.start(({ finished }) => {
      if (finished) setShown(count);
    });
    return () => anim.stop();
  }, [losing, count, pulse]);

  const burningIndex = losing && shown > count ? count : -1;

  return (
    <View style={styles.row}>
      {Array.from({ length: max }, (_, i) => {
        const isBurning = i === burningIndex;
        return (
          <Animated.View
            key={i}
            style={
              isBurning && {
                transform: [
                  {
                    scale: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.45],
                    }),
                  },
                ],
              }
            }
          >
            {isBurning && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.glow,
                  {
                    width: size + GLOW_EXTRA,
                    height: size + GLOW_EXTRA,
                    borderRadius: (size + GLOW_EXTRA) / 2,
                    opacity: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.75],
                    }),
                  },
                ]}
              />
            )}
            <Image
              source={{ uri: i < shown ? HEART_FULL_URI : HEART_EMPTY_URI }}
              contentFit="contain"
              style={{ width: size, height: size }}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  glow: {
    position: "absolute",
    top: -GLOW_EXTRA / 2,
    left: -GLOW_EXTRA / 2,
    backgroundColor: CAM_UI.heartGlow,
  },
});
