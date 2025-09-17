// src/components/common/CustomText.tsx
import React, { ReactNode, useMemo } from "react";
import { Text, TextProps, useWindowDimensions } from "react-native";

type TextVariant =
  | "h1"
  | "h2"
  | "h2-headline"
  | "h3"
  | "h3-headline"
  | "h3-small"
  | "p"
  | "label"
  | "footnote"
  | "quote";

interface Props extends TextProps {
  children: ReactNode;
  variant?: TextVariant;
  className?: string; // допълнителни Tailwind класове (-rotate-2, tracking-wide и т.н.)
  shadow?: boolean; // ако е true -> добавя text-shadow-default клас
  responsive?: boolean; // shrink под 390px ширина (default: true)
  textColor?: string; // "text-black" | "text-sky-400" | "#fff" | "rgb(255,0,0)" | т.н.
}

/**
 * Runtime-only sizing (без Tailwind text-[..] размери).
 * - Ползва базов пикселен размер според варианта.
 * - Смалява пропорционално под 390px; никога не скалира нагоре.
 * - По подразбиране цветът е бял, освен ако е подаден textColor.
 */
export default function CustomText({
  children,
  variant = "p",
  className,
  shadow = false,
  responsive = true,
  textColor, // <- нов проп
  ...rest
}: Props) {
  const { width } = useWindowDimensions();

  const baseSize = useMemo(() => {
    switch (variant) {
      case "h1":
        return 110;
      case "h2":
        return 72;
      case "h2-headline":
        return 56;
      case "h3":
        return 56;
      case "h3-headline":
        return 20;
      case "h3-small":
        return 24;
      case "p":
        return 16;
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

  // shrink only if the device is narrower than 390px
  const scale = responsive ? Math.min(1, width / 390) : 1;
  const fontSize = Math.round(baseSize * scale);

  // font family per variant (via Tailwind font-* classes you defined)
  const fontClass = useMemo(() => {
    switch (variant) {
      case "h1":
      case "h2":
      case "h3":
      case "h3-small":
        return "font-seymour";
      case "h2-headline":
      case "h3-headline":
      case "p":
      case "label":
        return "font-opensans";
      case "footnote":
        return "font-messiri";
      case "quote":
        return "font-amatic-bold";
      default:
        return "font-opensans";
    }
  }, [variant]);

  // 1) Премахваме евентуални text-* цветове от className, за да няма конфликт
  // вместо: /\btext-[^\s]+/g
  const sanitizedClassName = useMemo(
    () =>
      className
        ? className
            .replace(/\btext-(?!center|left|right|justify)\S+/g, "")
            .trim()
        : "",
    [className]
  );

  // 2) Определяме цветa: по подразбиране е бял
  const isTailwindTextClass =
    typeof textColor === "string" && textColor.startsWith("text-");
  const colorClass = isTailwindTextClass ? (textColor as string) : "text-white";
  const inlineColor =
    textColor && !isTailwindTextClass
      ? { color: textColor as string }
      : undefined;

  return (
    <Text
      className={[
        fontClass,
        colorClass, // Tailwind цвят (или text-white по подразбиране)
        shadow ? "text-shadow-default" : "", // опционална сянка през клас
        sanitizedClassName, // останалите класове (без text-*)
      ]
        .filter(Boolean)
        .join(" ")
        .trim()}
      style={[{ fontSize }, inlineColor]} // ако е hex/rgb -> минава през style.color
      {...rest}
    >
      {children}
    </Text>
  );
}
