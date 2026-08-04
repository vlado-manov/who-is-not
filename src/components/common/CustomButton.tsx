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
  gradientColors?: string[];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
  backgroundImage?: ImageSourcePropType;
  /** Semi-transparent gradient overlay rendered on top of backgroundImage (for tinting/vignette). */
  overlayColors?: string[];
  overlayStart?: { x: number; y: number };
  overlayEnd?: { x: number; y: number };
  solidColor?: string;
  showGloss?: boolean;
  glossOpacity?: number;

  /** icon */
  icon?: ImageSourcePropType;
  iconSize?: number;
  /** Defaults to `iconSize` for both dimensions when omitted. */
  iconWidth?: number;
  iconHeight?: number;
  /** Vector / custom icon (e.g. @expo/vector-icons). Shown before `icon` image if both set. */
  iconNode?: React.ReactNode;
  iconPosition?: "inline" | "leftAbsolute";
  /**
   * Renders the icon *outside* the clipped button body (sibling of overflow:hidden layer).
   * `play` / `party`: top -8, left -10 · `store`: left -16, bottom -8 · `rulebook`: right side, vertically centered.
   */
  iconOverlayPreset?: "play" | "store" | "rulebook" | "party";
  /** e.g. `-10deg` — used with overlay presets. */
  iconRotation?: string;
  /**
   * Absolute offsets for the overlay icon (px; may be negative). Omitted keys fall back to
   * `iconOverlayPreset` / `leftAbsolute` defaults; only set keys are applied to layout.
   */
  iconTop?: number;
  iconBottom?: number;
  iconLeft?: number;
  iconRight?: number;
  /**
   * When `true` (default), extra horizontal padding keeps the label away from the overlay icon.
   * Set `false` to keep the title centered/symmetric — icon is decorative only (`pointerEvents: none`).
   */
  iconOverlayPadText?: boolean;

  /** sizing */
  btnSize?: ButtonSize;
  height?: number;
  diameter?: number;

  /** text */
  fontSize?: ButtonFontSize;
  fontSizePx?: number;
  /** Overrides default min scale when `adjustsFontSizeToFit` shrinks the title. */
  titleMinFontScale?: number;
  /** Overrides the default white title color. */
  titleColor?: string;
  /** Overrides the default SeymourOne-Regular font family for the title. */
  titleFontFamily?: string;
  /** When set, renders a polka-dot circle pattern overlay with this color. */
  circlePatternColor?: string;

  /** badge */
  label?: string;
  /** Pill position when `label` is set. Default `right` (top-right corner). */
  labelSide?: "left" | "right";
  horizontalPadding?: number;
  /** border overlay rendered inside the clip area */
  borderColor?: string;
  borderWidth?: number;
  /** glow */
  glow?: boolean;
  glowColor?: string;
  glowIntensity?: number;
  shadowColor?: string;
  /** classes */
  buttonClassName?: string;
  /** Falls back to `title` when set */
  accessibilityLabel?: string;
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

function getPresetOverlayOffsets(
  preset: CustomButtonProps["iconOverlayPreset"],
  iconPosition: "inline" | "leftAbsolute",
  resolvedHeight: number,
  ih: number,
): Partial<Record<"top" | "bottom" | "left" | "right", number>> {
  if (preset === "store") return { left: -16, bottom: -8 };
  if (preset === "rulebook")
    return { right: -10, top: (resolvedHeight - ih) / 2 };
  if (preset === "play" || preset === "party") return { left: -10, top: -8 };
  if (iconPosition === "leftAbsolute") return { left: -10, top: -8 };
  return {};
}

function mergeIconOverlayOffsets(
  presetOffsets: Partial<Record<"top" | "bottom" | "left" | "right", number>>,
  iconTop: number | undefined,
  iconBottom: number | undefined,
  iconLeft: number | undefined,
  iconRight: number | undefined,
): Record<string, number> {
  const top = iconTop !== undefined ? iconTop : presetOffsets.top;
  const bottom = iconBottom !== undefined ? iconBottom : presetOffsets.bottom;
  const left = iconLeft !== undefined ? iconLeft : presetOffsets.left;
  const right = iconRight !== undefined ? iconRight : presetOffsets.right;
  const out: Record<string, number> = {};
  if (top !== undefined) out.top = top;
  if (bottom !== undefined) out.bottom = bottom;
  if (left !== undefined) out.left = left;
  if (right !== undefined) out.right = right;
  return out;
}

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
  gradientStart,
  gradientEnd,
  backgroundImage,
  overlayColors,
  overlayStart,
  overlayEnd,
  solidColor,
  showGloss = true,
  glossOpacity = 0.25,

  icon,
  iconSize = 36,
  iconWidth,
  iconHeight,
  iconNode,
  iconPosition = "inline",
  iconOverlayPreset,
  iconRotation = "-8deg",
  iconTop,
  iconBottom,
  iconLeft,
  iconRight,
  iconOverlayPadText = true,

  btnSize = "md",
  height,
  diameter = 180,

  fontSize = "md",
  fontSizePx,
  titleMinFontScale,
  titleColor,
  titleFontFamily,
  circlePatternColor,

  borderColor,
  borderWidth: borderWidthProp,
  label,
  labelSide = "right",
  horizontalPadding = 8,
  glow = false,
  glowColor = "rgba(253, 193, 194, 0.8)",
  glowIntensity = 8,
  shadowColor = "#000",
  buttonClassName,
  accessibilityLabel: accessibilityLabelProp,
}: CustomButtonProps) {
  const accessibilityLabel =
    accessibilityLabelProp ?? (title ? title : undefined);
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

  const colors: string[] =
    (gradientColors && gradientColors.length >= 2 ? gradientColors : null) ??
    (appearance !== "custom"
      ? APPEARANCE_PRESETS[appearance]
      : APPEARANCE_PRESETS.primary);

  const resolvedFontSize = fontSizePx ?? FONT_SIZE_MAP[fontSize];

  const iw = iconWidth ?? iconSize;
  const ih = iconHeight ?? iconSize;

  const hasCustomOverlayOffsets =
    iconTop !== undefined ||
    iconBottom !== undefined ||
    iconLeft !== undefined ||
    iconRight !== undefined;

  const presetOffsets = getPresetOverlayOffsets(
    iconOverlayPreset,
    iconPosition,
    resolvedHeight,
    ih,
  );
  const iconOverlayOffsets = mergeIconOverlayOffsets(
    presetOffsets,
    iconTop,
    iconBottom,
    iconLeft,
    iconRight,
  );

  const iconOutsideOverlay = Boolean(
    icon &&
    (iconOverlayPreset ||
      iconPosition === "leftAbsolute" ||
      hasCustomOverlayOffsets),
  );

  /** Long titles: tighter horizontal padding (8px) so text can stay larger before scaling down. */
  const compactPad = title.length > 22 || (fullWidth && title.length > 16);
  const basePad = compactPad ? 8 : horizontalPadding;
  const padForLeftIcon = Math.max(basePad, Math.round(iw * 0.55) + 8);
  const padForRightIcon = Math.max(basePad, Math.round(iw * 0.4) + 8);

  let contentPaddingLeft = basePad;
  let contentPaddingRight = basePad;
  if (iconOutsideOverlay && icon && iconOverlayPadText) {
    if (iconOverlayPreset === "rulebook" || iconRight !== undefined) {
      contentPaddingRight = padForRightIcon;
    }
    if (
      iconOverlayPreset === "play" ||
      iconOverlayPreset === "party" ||
      iconOverlayPreset === "store" ||
      iconPosition === "leftAbsolute" ||
      iconLeft !== undefined ||
      iconTop !== undefined ||
      iconBottom !== undefined
    ) {
      if (iconOverlayPreset !== "rulebook" && iconRight === undefined) {
        contentPaddingLeft = padForLeftIcon;
      }
    }
  }

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
      style={[
        glowShadow,
        fullWidth && { width: "100%" },
        iconOutsideOverlay && { overflow: "visible" as const },
      ]}
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

      <View
        style={[
          shadow,
          { borderRadius: radius, width: "100%" },
          iconOutsideOverlay && { overflow: "visible" as const },
        ]}
      >
        <Pressable
          style={{ width: "100%" }}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          onPress={(e) => {
            AudioManager.playButtonClick();
            onPress?.(e);
          }}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
        >
          <View style={{ position: "relative", width: "100%" }}>
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
                  colors={colors as any}
                  start={gradientStart ?? { x: 0, y: 0 }}
                  end={gradientEnd ?? { x: 1, y: 1 }}
                  style={{ position: "absolute", inset: 0 }}
                />
              )}
              {/* COLOR OVERLAY — on top of backgroundImage for tinting */}
              {backgroundImage && overlayColors && overlayColors.length >= 2 && (
                <LinearGradient
                  colors={overlayColors as any}
                  start={overlayStart ?? { x: 0, y: 0 }}
                  end={overlayEnd ?? { x: 1, y: 1 }}
                  style={{ position: "absolute", inset: 0 }}
                />
              )}

              {/* GLOSS */}
              {showGloss && (
                <View
                  style={{
                    position: "absolute",
                    top: 4,
                    left: 4,
                    right: 4,
                    height: "45%",
                    borderRadius: radius,
                    backgroundColor: `rgba(255,255,255,${glossOpacity})`,
                  }}
                />
              )}

              {/* CIRCLE PATTERN OVERLAY */}
              {circlePatternColor && (
                <View
                  pointerEvents="none"
                  style={{ position: "absolute", inset: 0, overflow: "hidden" }}
                >
                  {Array.from({ length: 60 }).map((_, i) => {
                    const col = i % 12;
                    const row = Math.floor(i / 12);
                    return (
                      <View
                        key={i}
                        style={{
                          position: "absolute",
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: circlePatternColor,
                          left: col * 24 - 4,
                          top: row * 24 - 4,
                        }}
                      />
                    );
                  })}
                </View>
              )}

              {/* BORDER OVERLAY — inside clip so it follows borderRadius */}
              {borderWidthProp != null && borderColor && (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: radius,
                    borderWidth: borderWidthProp,
                    borderColor,
                  }}
                />
              )}

              {/* CONTENT */}
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: iconNode ? 8 : 14,
                  paddingLeft: contentPaddingLeft,
                  paddingRight: contentPaddingRight,
                  minWidth: 0,
                }}
              >
                {iconNode}
                {icon && !iconOutsideOverlay && (
                  <AppImage
                    source={icon}
                    contentFit="contain"
                    style={{
                      width: iw,
                      height: ih,
                    }}
                  />
                )}

                {title ? (
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={
                      titleMinFontScale ?? (compactPad ? 0.62 : 0.5)
                    }
                    style={{
                      flexShrink: 1,
                      color: titleColor ?? "#fff",
                      fontSize: resolvedFontSize,
                      textTransform: "uppercase",
                      fontFamily: titleFontFamily ?? "Tektur-Black",
                      textShadowColor: "rgba(0,0,0,0.35)",
                      textShadowOffset: { width: 0, height: 3 },
                      textShadowRadius: 4,
                    }}
                  >
                    {title}
                  </Text>
                ) : null}
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

            {iconOutsideOverlay && icon ? (
              <View
                pointerEvents="none"
                style={[
                  {
                    position: "absolute",
                    width: iw,
                    height: ih,
                    zIndex: 4,
                    transform: [{ rotate: iconRotation }],
                  },
                  iconOverlayOffsets,
                ]}
              >
                <AppImage
                  source={icon}
                  contentFit="contain"
                  style={{ width: iw, height: ih }}
                />
              </View>
            ) : null}
          </View>
        </Pressable>

        {/* BADGE */}
        {label && (
          <View
            style={{
              position: "absolute",
              top: -10,
              ...(labelSide === "left" ? { left: -10 } : { right: -10 }),
              backgroundColor: "#FFD966",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
              maxWidth: 148,
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.55}
              style={{
                color: "#000",
                fontSize: 10,
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
