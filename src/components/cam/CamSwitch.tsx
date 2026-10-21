import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";

import { CAM_TEXT, CAM_UI } from "../../screens/Cam/cam.constants";

type Props = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  accessibilityLabel: string;
};

const TRACK_WIDTH = 50;
const TRACK_HEIGHT = 30;
const THUMB_SIZE = 26;
const THUMB_INSET = (TRACK_HEIGHT - THUMB_SIZE) / 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_INSET * 2;

/**
 * Toggle with a fixed size on every platform (the native `Switch` is sized by
 * the system and came out squashed and misaligned inside the settings rows).
 */
export default function CamSwitch({
  value,
  onValueChange,
  accessibilityLabel,
}: Props) {
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [value, progress]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      onPress={() => onValueChange(!value)}
      style={styles.track}
    >
      <Animated.View style={[styles.trackOn, { opacity: progress }]} />
      <Animated.View
        style={[
          styles.thumb,
          {
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, THUMB_TRAVEL],
                }),
              },
            ],
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: CAM_UI.secondary,
    justifyContent: "center",
    overflow: "hidden",
    // Never squeezed by a long label next to it.
    flexShrink: 0,
  },
  trackOn: {
    ...StyleSheet.absoluteFill,
    backgroundColor: CAM_UI.primary,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    marginLeft: THUMB_INSET,
    backgroundColor: CAM_TEXT,
  },
});
