// src/components/common/CustomText.tsx
import React, { ReactNode, useMemo } from "react";
import { Text, TextProps, useWindowDimensions } from "react-native";

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

interface Props extends TextProps {
  children: ReactNode;
  variant?: TextVariant;
  className?: string;
  shadow?: boolean;
  shadowStrong?: boolean;
  responsive?: boolean;
  textColor?: string;
}

export default function CustomText({
  children,
  variant = "p",
  className,
  shadow = false,
  shadowStrong = false,
  responsive = true,
  textColor,
  ...rest
}: Props) {
  const { width } = useWindowDimensions();

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
  const fontSize = Math.round(baseSize * scale);

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
  const colorClass = isTailwindTextClass ? (textColor as string) : "text-white";
  const inlineColor =
    textColor && !isTailwindTextClass
      ? { color: textColor as string }
      : undefined;

  return (
    <Text
      className={[fontClass, colorClass, sanitizedClassName]
        .filter(Boolean)
        .join(" ")
        .trim()}
      style={[
        { fontSize },
        inlineColor,
        shadow && {
          // textShadowColor: "rgba(0,0,0,0.55)",
          textShadowOffset: { width: 0, height: 1.75 },
          textShadowRadius: 0,
        },
        shadowStrong && {
          textShadowColor: "rgba(0,0,0,1)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 0,
        },
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
