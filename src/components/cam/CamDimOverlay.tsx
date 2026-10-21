import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { CAM_BLUR_INTENSITY } from "../../screens/Cam/cam.constants";

type Props = {
  /** Tint drawn over the camera, e.g. `rgba(0,0,0,0.75)` or a player colour. */
  color: string;
};

/**
 * Blur + tint over the live camera. Android skips the blur: the camera preview
 * is a separate surface there, so only the tint is drawn.
 */
export default function CamDimOverlay({ color }: Props) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Platform.OS === "ios" && (
        <BlurView intensity={CAM_BLUR_INTENSITY} tint="default" style={StyleSheet.absoluteFill} />
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: color }]} />
    </View>
  );
}
