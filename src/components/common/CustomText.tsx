// src/components/common/CustomText.tsx
import React, { ReactNode, useMemo } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  useWindowDimensions,
} from "react-native";

import { useUiStyle } from "../../context/UiStyleContext";

type TextVariant =
  | "h0"
  | "h1"
  | "h2"
  | "h2-small"
  | "h2-headline"
  | "h3"
  | "h3-headline"
  | "h3-small"
  | "h4"
  | "h4-headline"
  | "h5"
  | "h6"
  | "h5-headline"
  | "h6-headline"
  | "p"
  | "p-small"
  | "p-xsmall"
  | "label"
  | "footnote"
  | "quote";

/** Headings / labels: stay on one line; font shrinks to fit width (iOS + Android RN). */
const SINGLE_LINE_SHRINK_VARIANTS = new Set<TextVariant>([
  "h0",
  "h1",
  "h2",
  "h2-small",
  "h2-headline",
  "h3",
  "h3-headline",
  "h3-small",
  "h4",
  "h4-headline",
  "h5",
  "h5-headline",
  "h6",
  "h6-headline",
  "label",
]);

/**
 * TikTok look (see `UiStyleContext`): one family, smaller display sizes. The
 * game's display variants (h0–h5) are far larger than app UI headings.
 */
const TIKTOK_TEXT: Record<TextVariant, { size: number; family: string }> = {
  h0: { size: 48, family: "TikTokSans-ExtraBold" },
  h1: { size: 40, family: "TikTokSans-ExtraBold" },
  h2: { size: 32, family: "TikTokSans-ExtraBold" },
  "h2-small": { size: 22, family: "TikTokSans-Bold" },
  "h2-headline": { size: 26, family: "TikTokSans-Bold" },
  h3: { size: 28, family: "TikTokSans-ExtraBold" },
  "h3-headline": { size: 22, family: "TikTokSans-Bold" },
  "h3-small": { size: 20, family: "TikTokSans-Bold" },
  h4: { size: 24, family: "TikTokSans-Bold" },
  "h4-headline": { size: 22, family: "TikTokSans-Bold" },
  h5: { size: 20, family: "TikTokSans-Bold" },
  "h5-headline": { size: 17, family: "TikTokSans-Bold" },
  h6: { size: 15, family: "TikTokSans-SemiBold" },
  "h6-headline": { size: 18, family: "TikTokSans-Bold" },
  p: { size: 15, family: "TikTokSans-Medium" },
  "p-small": { size: 13, family: "TikTokSans-Medium" },
  "p-xsmall": { size: 11, family: "TikTokSans-Medium" },
  label: { size: 17, family: "TikTokSans-SemiBold" },
  footnote: { size: 13, family: "TikTokSans-Regular" },
  quote: { size: 18, family: "TikTokSans-Medium" },
};

/** An inline `fontWeight` picks the matching TikTok Sans face (the family has no synthetic bold). */
function tiktokFamilyForWeight(
  weight: TextStyle["fontWeight"],
  fallback: string,
): string {
  if (weight === undefined || weight === "normal") return fallback;
  const n = weight === "bold" ? 700 : Number(weight);
  if (!Number.isFinite(n)) return fallback;
  if (n >= 800) return "TikTokSans-ExtraBold";
  if (n >= 700) return "TikTokSans-Bold";
  if (n >= 600) return "TikTokSans-SemiBold";
  if (n >= 500) return "TikTokSans-Medium";
  return "TikTokSans-Regular";
}

interface Props extends TextProps {
  children: ReactNode;
  variant?: TextVariant;
  className?: string;
  shadow?: boolean;
  shadowStrong?: boolean;
  responsive?: boolean;
  textColor?: string;
  /** When true, heading text may wrap (opt out of single-line shrink). */
  allowWrap?: boolean;
  /** Added to the computed responsive font size (can be negative). */
  sizeDelta?: number;
}

export default function CustomText({
  children,
  variant = "p",
  className,
  shadow = false,
  shadowStrong = false,
  responsive = true,
  textColor,
  allowWrap = false,
  sizeDelta = 0,
  ...rest
}: Props) {
  const uiStyle = useUiStyle();
  const tiktok = uiStyle === "game" ? null : TIKTOK_TEXT[variant];
  const lightUi = uiStyle === "tiktokLight";
  const { width } = useWindowDimensions();
  const { style: restStyle, ...textRest } = rest;
  const isTablet = width >= 768;

  const headingSingleLineShrink =
    !allowWrap && SINGLE_LINE_SHRINK_VARIANTS.has(variant);

  const baseSize = useMemo(() => {
    switch (variant) {
      case "h0":
        return 180;
      case "h1":
        return 110;
      case "h2":
        return 72;
      case "h2-small":
        return 28;
      case "h2-headline":
        return 56;
      case "h3":
        return 56;
      case "h3-headline":
        return 28;
      case "h3-small":
        return 28;
      case "h4":
        return 40;
      case "h5":
        return 28;
      case "h6":
        return 15;
      case "h4-headline":
        return 32;
      case "h5-headline":
        return 20;
      case "h6-headline":
        return 32;
      case "p":
        return 16;
      case "p-small":
        return 12;
      case "p-xsmall":
        return 10;
      case "label":
        return 32;
      case "footnote":
        return 14;
      case "quote":
        return 32;
      default:
        return 16;
    }
  }, [variant]);

  const scale = responsive ? Math.min(1, width / 390) : 1;
  const fontSize = Math.round(baseSize * scale) + (isTablet ? 2 : 0) + sizeDelta;

  const fontClass = useMemo(() => {
    switch (variant) {
      case "h0":
      case "h1":
      case "h2":
      case "h2-small":
      case "h3":
      case "h3-small":
      case "h4":
      case "h5":
        return "font-seymour";
      case "h2-headline":
      case "h3-headline":
      case "p":
      case "label":
        return "font-opensans";
      case "h4-headline":
      case "p-small":
      case "p-small":
        return "font-opensans-bold";
      case "h5-headline":
      case "h6":
      case "h6-headline":
        return "font-opensans-extrabold";
      case "footnote":
        return "font-messiri";
      case "quote":
        return "font-amatic-bold";
      default:
        return "font-opensans";
    }
  }, [variant]);

  const sanitizedClassName = useMemo(
    () =>
      className
        ? className
            .replace(/\btext-(?!center|left|right|justify)\S+/g, "")
            .trim()
        : "",
    [className]
  );

  const isTailwindTextClass =
    typeof textColor === "string" && textColor.startsWith("text-");
  // Default text is white, except on the light TikTok background.
  const colorClass = isTailwindTextClass
    ? (textColor as string)
    : lightUi
      ? ""
      : "text-white";
  const inlineColor =
    textColor && !isTailwindTextClass
      ? { color: textColor as string }
      : lightUi && !isTailwindTextClass
        ? { color: "#161823" }
        : undefined;

  return (
    <Text
      className={[
        fontClass,
        colorClass,
        // Tilted headings belong to the game look.
        tiktok
          ? sanitizedClassName.replace(/-?rotate-\S+/g, "")
          : sanitizedClassName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim()}
      {...(headingSingleLineShrink
        ? {
            numberOfLines: 1,
            adjustsFontSizeToFit: true,
            minimumFontScale: 0.32,
            maxFontSizeMultiplier: 1.35,
          }
        : {})}
      {...textRest}
      style={[
        { fontSize: tiktok ? tiktok.size + sizeDelta : fontSize },
        inlineColor,
        headingSingleLineShrink && {
          flexShrink: 1,
          minWidth: 0,
          maxWidth: "100%",
        },
        Platform.OS === "android" && headingSingleLineShrink && {
          includeFontPadding: false,
        },
        shadow && {
          textShadowOffset: { width: 0, height: 1.75 },
          textShadowRadius: 0,
        },
        shadowStrong && {
          textShadowColor: "rgba(0,0,0,1)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 0,
        },
        restStyle,
        // Last, so screens that set their own game font inline still switch.
        tiktok && {
          fontFamily: tiktokFamilyForWeight(
            StyleSheet.flatten(restStyle)?.fontWeight,
            tiktok.family,
          ),
          fontWeight: "normal",
        },
      ]}
    >
      {children}
    </Text>
  );
}
