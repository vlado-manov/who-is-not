import React, { useRef } from "react";
import {
  Pressable,
  Text,
  GestureResponderEvent,
  View,
  Animated,
  Platform,
} from "react-native";

interface CustomButtonProps {
  title: string;
  onPress?: (e: GestureResponderEvent) => void;
  color?: string;
  label?: boolean;
  labelTitle?: string;
  fullWidth?: boolean;
  buttonClassName?: string;
  textClassName?: string;
  labelClassName?: string;
  btnSize?: "sm" | "lg";
  disabled?: boolean;
}

function darkenHex(hex: string, amount = 0.1) {
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const m = hex?.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return hex;
  const r = clamp(Math.round(parseInt(m[1], 16) * (1 - amount)));
  const g = clamp(Math.round(parseInt(m[2], 16) * (1 - amount)));
  const b = clamp(Math.round(parseInt(m[3], 16) * (1 - amount)));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function CustomButton({
  title,
  onPress,
  color,
  label = false,
  labelTitle,
  fullWidth = false,
  buttonClassName,
  textClassName,
  labelClassName,
  btnSize,
  disabled = false,
}: CustomButtonProps) {
  const isHex = !!color && color[0] === "#";

  // анимация при натискане
  const pressAnim = useRef(new Animated.Value(0)).current;
  const handlePressIn = () =>
    !disabled &&
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: 80,
      useNativeDriver: true,
    }).start();
  const handlePressOut = () =>
    Animated.timing(pressAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start();

  const containerScale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });
  const textScale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const overlayOpacity = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.08],
  });

  const shadowStyle =
    Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: { elevation: 6 },
    }) || {};

  let textSizeClass = "text-[24px]";
  if (btnSize === "lg") textSizeClass = "text-[32px]";
  if (btnSize === "sm") textSizeClass = "text-[20px]";

  const tailwindBgClass = !isHex ? color || "bg-primary-500" : "";

  return (
    <View
      className={`relative ${fullWidth ? "w-full" : ""}`}
      style={[{ borderRadius: 8 }, shadowStyle]}
    >
      <Pressable
        disabled={disabled}
        accessibilityState={{ disabled }}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={`${fullWidth ? "w-full" : ""} ${buttonClassName || ""}`}
        style={{ borderRadius: 8, opacity: disabled ? 0.55 : 1 }}
      >
        <Animated.View
          className={`items-center justify-center rounded-2xl py-6 ${fullWidth ? "px-4" : "px-8"} ${tailwindBgClass}`}
          style={[
            { transform: [{ scale: containerScale }], borderRadius: 8 },
            isHex ? { backgroundColor: color as string } : null,
          ]}
        >
          {!isHex && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                backgroundColor: "#000",
                opacity: overlayOpacity,
                borderRadius: 16,
              }}
            />
          )}
          {isHex && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                backgroundColor: darkenHex(color as string, 0.08),
                opacity: pressAnim,
                borderRadius: 16,
              }}
            />
          )}

          <Animated.Text
            className={`text-white uppercase text-center font-seymour ${textSizeClass} ${textClassName || ""}`}
            style={{
              transform: [{ scale: textScale }],
              textShadowColor: "rgba(0,0,0,0.25)",
              textShadowOffset: { width: 0, height: 4 },
              textShadowRadius: 4,
            }}
          >
            {title}
          </Animated.Text>
        </Animated.View>
      </Pressable>

      {label && (
        <Text
          className={`mt-2 text-sm text-white text-center shadow-custom absolute -top-2 -translate-y-1/2 -right-4 uppercase font-opensans-extrabold text-[16px] px-4 py-2 bg-primary-500 rounded-full ${labelClassName || ""}`}
        >
          {labelTitle}
        </Text>
      )}
    </View>
  );
}
