import React from "react";
import { ImageSourcePropType, Platform, StyleSheet } from "react-native";
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
  size: number;
};

/**
 * Grayscale hero for death screen — no `react-native-color-matrix-image-filters`
 * (native view missing in Expo Go). Uses `react-native-svg` FilterImage on native,
 * CSS filter on web.
 */
export default function PlayerDeathGrayscaleImage({ source, size }: Props) {
  if (Platform.OS === "web") {
    return (
      <Image
        source={source}
        style={[
          styles.img,
          { width: size, height: size },
          { filter: "grayscale(1)" } as object,
        ]}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
    );
  }

  return (
    <FilterImage
      source={source}
      width={size}
      height={size}
      resizeMode="contain"
      style={{ width: size, height: size }}
      filters={GRAYSCALE_FE_MATRIX}
    />
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: "transparent" },
});
