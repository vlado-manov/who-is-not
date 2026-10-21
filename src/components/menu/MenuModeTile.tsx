// src/components/menu/MenuModeTile.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ImageSourcePropType,
  Pressable,
  StyleProp,
  ViewStyle,
} from "react-native";

import AppImage from "../AppImage";
import AudioManager from "../../utils/audioManager";

type Props = {
  /**
   * The mode's card: finished art with its own frame, tilt and title on a
   * transparent background, so nothing is drawn over or around it.
   */
  image: ImageSourcePropType;
  /** Read by screen readers (the title is part of the picture). */
  label: string;
  width: number;
  /** Width / height of the card art. */
  aspectRatio: number;
  /** Position tweaks from the menu (overlap, stacking order). */
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
};

/**
 * A game mode on the main menu, shown as its card art. Pressing sinks and
 * tilts it; hover and keyboard focus lift it a little.
 */
export default function MenuModeTile({
  image,
  label,
  width,
  aspectRatio,
  style,
  onPress,
}: Props) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const height = Math.round(width / aspectRatio);

  const lift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(lift, {
      toValue: pressed ? 2 : hovered || focused ? 1 : 0,
      speed: 28,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
  }, [focused, hovered, lift, pressed]);

  // 0 = resting, 1 = hover/focus (grows a little), 2 = pressed (sinks, tilts).
  const scale = lift.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [1, 1.05, 0.94],
  });
  const tilt = lift.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ["0deg", "0deg", "-3deg"],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={style}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={() => {
        AudioManager.playButtonClick();
        onPress();
      }}
    >
      <Animated.View
        style={{ width, height, transform: [{ scale }, { rotate: tilt }] }}
      >
        <AppImage
          source={image}
          contentFit="contain"
          style={{ width, height }}
        />
      </Animated.View>
    </Pressable>
  );
}
