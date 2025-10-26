// src/components/InitialLoadingScreen.tsx
import React, { useEffect, useRef } from "react";
import { View, Image, ActivityIndicator, Animated } from "react-native";
import { backgrounds } from "../../assets/backgrounds";

type Props = {
  heroReady: boolean;
};

export default function InitialLoadingScreen({ heroReady }: Props) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!heroReady) return;
    Animated.timing(fade, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  }, [heroReady]);

  return (
    <View className="absolute inset-0 w-full h-full bg-black z-[9999] items-center justify-center">
      {!heroReady ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        <Image
          source={backgrounds.bgheroes01}
          resizeMode="contain"
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </View>
  );
}
