// src/components/game/HoldToConfirmButton.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import CustomButton from "../common/CustomButton";
import { backgrounds } from "../../../assets/backgrounds";
import AudioManager from "../../utils/audioManager";

type Props = {
  title: string;
  /** Called once, when the button has been held for the whole fill. */
  onConfirm: () => void;
  horizontalPadding?: number;
  /** How long the button has to be held. */
  holdMs?: number;
  /**
   * The button to show instead of the green game button (it is not pressable
   * itself). Pass its corner `radius` so the fill follows its shape.
   */
  children?: React.ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

const DEFAULT_HOLD_MS = 1100;
const RELEASE_MS = 180;
/** Matches `CustomButton`'s corner radius, so the fill follows its shape. */
const BUTTON_RADIUS = 20;

/**
 * A button unlocked by holding (by default the green "It's me" button of the
 * pass-the-phone screens): a fill sweeps across it like a loading bar and only a full sweep
 * confirms. Letting go early drains it, so a stray tap by the wrong player
 * does not reveal anything.
 */
export default function HoldToConfirmButton({
  title,
  onConfirm,
  horizontalPadding,
  holdMs = DEFAULT_HOLD_MS,
  children,
  radius = BUTTON_RADIUS,
  style,
}: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const doneRef = useRef(false);
  const [width, setWidth] = useState(0);
  const [holding, setHolding] = useState(false);

  useEffect(() => () => progress.stopAnimation(), [progress]);

  const start = () => {
    if (doneRef.current) return;
    setHolding(true);
    Animated.timing(progress, {
      toValue: 1,
      duration: holdMs,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || doneRef.current) return;
      doneRef.current = true;
      AudioManager.playButtonClick();
      onConfirm();
    });
  };

  const release = () => {
    setHolding(false);
    if (doneRef.current) return;
    Animated.timing(progress, {
      toValue: 0,
      duration: RELEASE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      // Screen readers cannot hold: their activation confirms directly.
      onAccessibilityTap={() => {
        if (doneRef.current) return;
        doneRef.current = true;
        onConfirm();
      }}
      style={style}
      onPressIn={start}
      onPressOut={release}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          transform: [
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.97],
              }),
            },
          ],
        }}
      >
        {children ?? (
          <CustomButton
            title={title}
            backgroundImage={backgrounds.bg026}
            glow
            glowColor={holding ? "rgba(41,255,25,1)" : "rgba(41,255,25,0.8)"}
            shadowColor="#005f07"
            horizontalPadding={horizontalPadding}
            fullWidth
          />
        )}
        <View style={[styles.fillClip, { borderRadius: radius }]}>
          <Animated.View
            style={[
              styles.fill,
              {
                width,
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-width, 0],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fillClip: {
    ...StyleSheet.absoluteFill,
    borderRadius: BUTTON_RADIUS,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.38)",
    borderRightWidth: 3,
    borderRightColor: "rgba(255,255,255,0.9)",
  },
});
