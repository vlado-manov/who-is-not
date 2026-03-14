/**
 * AppImage – wraps expo-image with consistent defaults:
 * - cachePolicy="memory-disk"
 * - transition={200}
 * - contentFit="cover"
 * Accepts all standard Image props; pass style with width/height for best results.
 * Maps resizeMode (RN) to contentFit (expo-image).
 */
import React from "react";
import { Image, ImageProps } from "expo-image";

type AppImageProps = ImageProps & {
  resizeMode?: "contain" | "cover" | "stretch" | "center" | "repeat";
};

export default function AppImage({
  cachePolicy = "memory-disk",
  transition = 200,
  contentFit = "cover",
  resizeMode,
  ...props
}: AppImageProps) {
  const resolvedContentFit =
    contentFit === "cover" && resizeMode
      ? (resizeMode === "contain"
          ? "contain"
          : resizeMode === "stretch"
            ? "fill"
            : resizeMode === "center"
              ? "none"
              : contentFit)
      : contentFit;

  return (
    <Image
      cachePolicy={cachePolicy}
      transition={transition}
      contentFit={resolvedContentFit}
      {...props}
    />
  );
}
