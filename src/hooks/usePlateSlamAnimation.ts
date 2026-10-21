import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing } from "react-native";

/**
 * Plate "slam": flies in from scale 40 with a back-ease, then a short 4-step shake.
 * Starts on mount, stops on unmount. Callers play their own sound.
 * Apply `shakeX` (translateX) only to the layer that should shake.
 */
const PLATE_SHAKE_PX = 8;

export function usePlateSlamAnimation() {
  const plateScale = useRef(new Animated.Value(40)).current;
  const plateOpacity = useRef(new Animated.Value(0)).current;
  const screenShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shakeStep = (toValue: number) =>
      Animated.timing(screenShake, {
        toValue,
        duration: 60,
        useNativeDriver: true,
      });

    const anim = Animated.sequence([
      Animated.parallel([
        Animated.timing(plateScale, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(3)),
          useNativeDriver: true,
        }),
        Animated.timing(plateOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([shakeStep(1), shakeStep(-1), shakeStep(1), shakeStep(0)]),
    ]);
    anim.start();
    return () => anim.stop();
  }, [plateScale, plateOpacity, screenShake]);

  const shakeX = useMemo(
    () =>
      screenShake.interpolate({
        inputRange: [-1, 1],
        outputRange: [-PLATE_SHAKE_PX, PLATE_SHAKE_PX],
      }),
    [screenShake],
  );

  return { plateScale, plateOpacity, shakeX };
}
