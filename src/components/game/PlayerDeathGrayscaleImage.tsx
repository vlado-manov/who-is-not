import React from "react";
import {
  ImageSourcePropType,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { Image } from "expo-image";
import { FilterImage } from "react-native-svg/filter-image";
import type { Filters } from "react-native-svg/filter-image";

/** Rec. 709 luma → grayscale (single FeColorMatrix). */
const GRAYSCALE_FE_MATRIX: Filters = [
  {
    name: "feColorMatrix",
    type: "matrix",
    values: [
      0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0.2126,
      0.7152, 0.0722, 0, 0, 0, 0, 0, 1, 0,
    ],
  },
];

type Props = {
  source: ImageSourcePropType;
  /** Legacy square size — prefer `width` + `height`. */
  size?: number;
  width?: number;
  height?: number;
};

/**
 * Grayscale hero overlay — same box + `contain` as the color layer beneath it.
 */
export default function PlayerDeathGrayscaleImage({
  source,
  size,
  width,
  height,
}: Props) {
  const w = width ?? size ?? 0;
  const h = height ?? size ?? 0;
  if (w <= 0 || h <= 0) return null;

  if (Platform.OS === "web") {
    return (
      <Image
        source={source}
        style={[
          StyleSheet.absoluteFillObject,
          { filter: "grayscale(1) sepia(0.18) hue-rotate(290deg) saturate(1.4)" } as object,
        ]}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
    );
  }

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <FilterImage
        source={source}
        width={w}
        height={h}
        resizeMode="contain"
        style={{ width: w, height: h, backgroundColor: "transparent" }}
        filters={GRAYSCALE_FE_MATRIX}
      />
    </View>
  );
}
