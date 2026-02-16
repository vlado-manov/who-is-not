// src/hooks/useIconPressAnim.ts
import { useRef } from "react";
import { Animated } from "react-native";

export const useIconPressAnim = () => {
  const anim = useRef(new Animated.Value(0)).current;

  const pressIn = () =>
    Animated.timing(anim, {
      toValue: 1,
      duration: 80,
      useNativeDriver: true,
    }).start();

  const pressOut = () =>
    Animated.timing(anim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start();

  const style = {
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 4],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.94],
        }),
      },
    ],
  };

  return { style, pressIn, pressOut };
};
