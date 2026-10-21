import React, { useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import CamIconButton from "./CamIconButton";
import { CAM_LAYOUT, CAM_TIMING } from "../../screens/Cam/cam.constants";
import type { CamRect } from "../../screens/Cam/cam.types";

type Props = {
  uri: string;
  /** Where the photo sits on screen before it is enlarged. */
  from: CamRect;
  frame: { width: number; height: number };
  topInset: number;
  closeLabel: string;
  onClose: () => void;
};

/**
 * A photo grown to full screen. It goes back with the close button in the
 * corner or by tapping the photo itself.
 */
export default function CamPhotoZoom({
  uri,
  from,
  frame,
  topInset,
  closeLabel,
  onClose,
}: Props) {
  const progress = useSharedValue(0);
  const closingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    progress.value = withTiming(1, { duration: CAM_TIMING.photoZoomMs });
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [progress]);

  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    progress.value = withTiming(0, { duration: CAM_TIMING.photoZoomMs });
    timerRef.current = setTimeout(onClose, CAM_TIMING.photoZoomMs);
  };

  const boxStyle = useAnimatedStyle(() => ({
    left: interpolate(progress.value, [0, 1], [from.x, 0]),
    top: interpolate(progress.value, [0, 1], [from.y, 0]),
    width: interpolate(progress.value, [0, 1], [from.width, frame.width]),
    height: interpolate(progress.value, [0, 1], [from.height, frame.height]),
  }));
  const closeStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close}>
        <Animated.View style={[styles.box, boxStyle]}>
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        </Animated.View>
      </Pressable>
      <Animated.View
        style={[
          styles.close,
          { top: topInset + CAM_LAYOUT.exitTop, right: CAM_LAYOUT.exitLeft },
          closeStyle,
        ]}
      >
        <CamIconButton
          icon="close"
          size={CAM_LAYOUT.recordButtonSize}
          accessibilityLabel={closeLabel}
          onPress={close}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: "absolute",
    overflow: "hidden",
  },
  close: {
    position: "absolute",
  },
});
