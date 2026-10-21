import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { Image } from "expo-image";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { CamNameRibbon } from "./CamRosterGrid";
import { CAM_LAYOUT } from "../../screens/Cam/cam.constants";
import type { CamRect } from "../../screens/Cam/cam.types";

type Props = {
  uri: string;
  from: CamRect;
  to: CamRect;
  durationMs: number;
  /** Name band that fades in while the photo lands. */
  ribbon?: { name: string; color: string; topInset: number };
  border: { color: string; width: number; radius: number };
};

/**
 * A captured photo that starts as the frozen full-screen frame and flies to its
 * final rectangle. The photo keeps `cover` fit the whole way, like the preview.
 */
export default function CamFlyingPhoto({
  uri,
  from,
  to,
  durationMs,
  ribbon,
  border,
}: Props) {
  // 0 = from, 1 = to. Runs once on mount, so a re-render never replays the flight.
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: durationMs });
  }, [progress, durationMs]);

  const boxStyle = useAnimatedStyle(() => ({
    left: interpolate(progress.value, [0, 1], [from.x, to.x]),
    top: interpolate(progress.value, [0, 1], [from.y, to.y]),
    width: interpolate(progress.value, [0, 1], [from.width, to.width]),
    height: interpolate(progress.value, [0, 1], [from.height, to.height]),
    borderWidth: interpolate(progress.value, [0, 1], [0, border.width]),
  }));

  const ribbonStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [CAM_LAYOUT.ribbonFadeStart, 1],
      [0, 1],
      "clamp",
    ),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.box,
        { borderColor: border.color, borderRadius: border.radius },
        boxStyle,
      ]}
    >
      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      {ribbon && (
        <Animated.View style={[StyleSheet.absoluteFill, ribbonStyle]}>
          <CamNameRibbon
            name={ribbon.name}
            color={ribbon.color}
            topInset={ribbon.topInset}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: "absolute",
    overflow: "hidden",
  },
});
