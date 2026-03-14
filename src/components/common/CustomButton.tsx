import React, { useRef } from "react";
import {
  Pressable,
  Text,
  View,
  Animated,
  Platform,
  ImageSourcePropType,
  GestureResponderEvent,
} from "react-native";
import AppImage from "../AppImage";
import { LinearGradient } from "expo-linear-gradient";
import AudioManager from "../../utils/audioManager";

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

export type ButtonVariant = "default" | "pill" | "circle";
export type ButtonAppearance =
  | "primary"
  | "secondary"
  | "tertiary"
  | "danger"
  | "custom";

export type ButtonFontSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

interface CustomButtonProps {
  title: string;
  onPress?: (e: GestureResponderEvent) => void;

  variant?: ButtonVariant;
  appearance?: ButtonAppearance;

  fullWidth?: boolean;
  disabled?: boolean;

  /** visuals */
  gradientColors?: [string, string];
  backgroundImage?: ImageSourcePropType;
  solidColor?: string;

  /** icon */
  icon?: ImageSourcePropType;
  iconSize?: number;

  /** sizing */
  btnSize?: ButtonSize;
  height?: number;
  diameter?: number;

  /** text */
  fontSize?: ButtonFontSize;
  fontSizePx?: number;

  /** badge */
  label?: string;
  horizontalPadding?: number;
  /** glow */
  glow?: boolean;
  glowColor?: string;
  glowIntensity?: number;
  shadowColor?: string;
  /** classes */
  buttonClassName?: string;
}

/* -------------------------------------------------------------------------- */
/* PRESETS */
/* -------------------------------------------------------------------------- */

type PresetAppearance = Exclude<ButtonAppearance, "custom">;

const APPEARANCE_PRESETS: Record<PresetAppearance, [string, string]> = {
  primary: ["#ff711c", "#FA3A00"],
  secondary: ["#cc4eed", "#e878be"],
  tertiary: ["#82b52f", "#beca2c"],
  danger: ["#FF4D4D", "#D91E18"],
};

const FONT_SIZE_MAP: Record<ButtonFontSize, number> = {
  xs: 14,
  sm: 18,
  md: 24,
  lg: 30,
  xl: 36,
};

const BTN_SIZE_HEIGHT: Record<ButtonSize, number> = {
  xs: 56,
  sm: 64,
  md: 80,
  lg: 96,
};

/* -------------------------------------------------------------------------- */
/* COMPONENT */
/* -------------------------------------------------------------------------- */

export default function CustomButton({
  title,
  onPress,

  variant = "default",
  appearance = "primary",

  fullWidth = false,
  disabled = false,

  gradientColors,
  backgroundImage,
  solidColor,

  icon,
  iconSize = 36,

  btnSize = "md",
  height,
  diameter = 180,

  fontSize = "md",
  fontSizePx,

  label,
  horizontalPadding = 24,
  glow = false,
  glowColor = "rgba(253, 193, 194, 0.8)",
  glowIntensity = 8,
  shadowColor = "#000",
  buttonClassName,
}: CustomButtonProps) {
  const pressAnim = useRef(new Animated.Value(0)).current;

  /* ----------------------------- Animations ------------------------------ */

  const onPressIn = () =>
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: 80,
      useNativeDriver: true,
    }).start();

  const onPressOut = () =>
    Animated.timing(pressAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start();

  const translateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 6],
  });

  const scale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.97],
  });

  const overlayOpacity = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  /* ------------------------------ Styling -------------------------------- */

  const resolvedHeight =
    variant === "circle" ? diameter : (height ?? BTN_SIZE_HEIGHT[btnSize]);

  const radius =
    variant === "circle" ? diameter / 2 : variant === "pill" ? 999 : 20;

  const colors: [string, string] =
    gradientColors ||
    (appearance !== "custom"
      ? APPEARANCE_PRESETS[appearance]
      : APPEARANCE_PRESETS.primary);

  const resolvedFontSize = fontSizePx ?? FONT_SIZE_MAP[fontSize];

  const shadow =
    Platform.OS === "ios"
      ? {
          shadowColor: shadowColor,
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.8,
          shadowRadius: 0.5,
        }
      : { elevation: 10 };

  const glowShadow =
    glow && Platform.OS === "ios"
      ? {
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: glowIntensity,
        }
      : {};

  /* ------------------------------------------------------------------------ */

  return (
    <View
      className={buttonClassName}
      style={[glowShadow, fullWidth && { width: "100%" }]}
    >
      {glow && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            inset: -2,
            borderRadius: radius + 2,
            backgroundColor: glowColor,
            opacity: 0.45,
            zIndex: -1,
          }}
        />
      )}

      <View style={[shadow, { borderRadius: radius, width: "100%" }]}>
        <Pressable
          style={{ width: "100%" }}
          disabled={disabled}
          onPress={(e) => {
            AudioManager.playButtonClick();
            onPress?.(e);
          }}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
        >
          <Animated.View
            style={{
              transform: [{ translateY }, { scale }],
              borderRadius: radius,
              overflow: "hidden",
              height: resolvedHeight,
              width: variant === "circle" ? diameter : "100%",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {/* BACKGROUND */}
            {backgroundImage ? (
              <AppImage
                source={backgroundImage}
                contentFit="cover"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                }}
              />
            ) : solidColor ? (
              <View
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: solidColor,
                }}
              />
            ) : (
              <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: "absolute", inset: 0 }}
              />
            )}

            {/* GLOSS */}
            <View
              style={{
                position: "absolute",
                top: 4,
                left: 4,
                right: 4,
                height: "45%",
                borderRadius: radius,
                backgroundColor: "rgba(255,255,255,0.25)",
              }}
            />

            {/* CONTENT */}
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                paddingHorizontal: horizontalPadding,
              }}
            >
              {icon && (
                <AppImage
                  source={icon}
                  contentFit="contain"
                  style={{ width: iconSize, height: iconSize }}
                />
              )}

              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
                style={{
                  color: "#fff",
                  fontSize: resolvedFontSize,
                  textTransform: "uppercase",
                  fontFamily: "SeymourOne-Regular",
                  textShadowColor: "rgba(0,0,0,0.35)",
                  textShadowOffset: { width: 0, height: 3 },
                  textShadowRadius: 4,
                }}
              >
                {title}
              </Text>
            </View>

            {/* PRESS OVERLAY */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "#000",
                opacity: overlayOpacity,
              }}
            />
          </Animated.View>
        </Pressable>

        {/* BADGE */}
        {label && (
          <View
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              backgroundColor: "#FFD966",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
            }}
          >
            <Text
              style={{
                color: "#000",
                fontSize: 12,
                fontWeight: "800",
                textTransform: "uppercase",
              }}
            >
              {label}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
