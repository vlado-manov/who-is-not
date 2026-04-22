import React, { useEffect, useRef } from "react";
import {
  View,
  Pressable,
  Animated,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import AudioManager from "../../utils/audioManager";
import { TOP_EDGE_ICON_OFFSET } from "../../utils/responsive";
import { game_images } from "../../../assets/images";

const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);

export type ScreenTopBarVariant = "default" | "soloBackFromCenter";

type Props = {
  horizontalPadding: number;
  topIconSize: number;
  /** When false (Welcome / MenuPlay), only edge icons — no center back. */
  showBack?: boolean;
  onSettings: () => void;
  onProfile: () => void;
  onBack?: () => void;
  /** Use expo-image Animated (MenuPlay); default Image (Welcome). */
  useExpoImage?: boolean;
  backAccessibilityLabel?: string;
  /**
   * `soloBackFromCenter`: only back — animates from screen center to the left (settings slot),
   * icon rotates from “up” to pointing left. Hides settings + profile.
   */
  variant?: ScreenTopBarVariant;
};

function useIconPressAnim() {
  const anim = useRef(new Animated.Value(0)).current;
  const pressIn = () =>
    Animated.timing(anim, {
      toValue: 1,
      duration: 80,
      useNativeDriver: true,
    }).start();
  const pressOut = () =>
    Animated.timing(anim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start();
  const style = {
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 4],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.94],
        }),
      },
    ],
  };
  return { style, pressIn, pressOut };
}

/**
 * Top row: settings (left) · optional back (center) · profile (right).
 * Horizontal inset is `horizontalPadding - 8` so icons sit slightly closer to screen edges.
 */
/** Approx. half-width of the back pill for centering math. */
const SOLO_BACK_HALF_W = 40;

export default function ScreenTopBar({
  horizontalPadding,
  topIconSize,
  showBack = false,
  onSettings,
  onProfile,
  onBack,
  useExpoImage = false,
  backAccessibilityLabel = "Back",
  variant = "default",
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const settingsAnim = useIconPressAnim();
  const profileAnim = useIconPressAnim();
  const sidePad = Math.max(0, horizontalPadding - 8);

  const soloProgress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (variant !== "soloBackFromCenter") return;
    soloProgress.setValue(0);
    Animated.timing(soloProgress, {
      toValue: 1,
      duration: 480,
      useNativeDriver: true,
    }).start();
  }, [variant, soloProgress]);

  const soloTranslateX = soloProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      Math.max(0, windowWidth / 2 - sidePad - SOLO_BACK_HALF_W),
      0,
    ],
  });
  /** Same `arrow-up-circle` as center back: 0° = up, −90° = left (one quarter turn). */
  const soloRotate = soloProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-90deg"],
  });

  const settingsIconStyle = [
    { width: topIconSize, height: topIconSize },
    settingsAnim.style,
  ];

  const profileIconStyle = [
    { width: topIconSize, height: topIconSize },
    profileAnim.style,
  ];

  if (variant === "soloBackFromCenter" && showBack && onBack) {
    return (
      <View
        style={[
          styles.bar,
          {
            paddingLeft: sidePad,
            paddingRight: sidePad,
            top: TOP_EDGE_ICON_OFFSET,
            justifyContent: "flex-start",
          },
        ]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={{
            transform: [{ translateX: soloTranslateX }, { rotate: soloRotate }],
          }}
        >
          <Pressable
            onPress={() => {
              AudioManager.playButtonClick();
              onBack();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            style={({ pressed }) => [
              styles.backBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={backAccessibilityLabel}
          >
            <Ionicons
              name="arrow-up-circle"
              size={48}
              color="rgba(255,248,240,0.95)"
              style={styles.backIconShadow}
            />
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.bar,
        {
          paddingLeft: sidePad,
          paddingRight: sidePad,
          top: TOP_EDGE_ICON_OFFSET,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.side}>
        <Pressable
          onPressIn={settingsAnim.pressIn}
          onPressOut={settingsAnim.pressOut}
          onPress={() => {
            AudioManager.playButtonClick();
            onSettings();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 12 }}
        >
          {useExpoImage ? (
            <AnimatedExpoImage
              source={game_images.settingsIcon}
              style={settingsIconStyle}
              contentFit="contain"
            />
          ) : (
            <Animated.Image
              source={game_images.settingsIcon}
              style={settingsIconStyle}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </View>

      {showBack && onBack ? (
        <View style={styles.centerOverlay} pointerEvents="box-none">
          <Pressable
            onPress={() => {
              AudioManager.playButtonClick();
              onBack();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            style={({ pressed }) => [
              styles.backBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={backAccessibilityLabel}
          >
            <Ionicons
              name="arrow-up-circle"
              size={48}
              color="rgba(255,248,240,0.95)"
              style={styles.backIconShadow}
            />
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.side, styles.sideRight]}>
        <Pressable
          onPressIn={profileAnim.pressIn}
          onPressOut={profileAnim.pressOut}
          onPress={() => {
            AudioManager.playButtonClick();
            onProfile();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 12, right: 8 }}
        >
          {useExpoImage ? (
            <AnimatedExpoImage
              source={game_images.userIcon}
              style={profileIconStyle}
              contentFit="contain"
            />
          ) : (
            <Animated.Image
              source={game_images.userIcon}
              style={profileIconStyle}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 30,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  side: {
    flex: 1,
    alignItems: "flex-start",
    minWidth: 0,
  },
  sideRight: {
    alignItems: "flex-end",
  },
  centerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    alignItems: "center",
  },
  backBtn: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(12, 10, 8, 0.48)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.16)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.35,
        shadowRadius: 3,
      },
      android: { elevation: 4 },
    }),
  },
  backIconShadow: {
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginTop: 8,
  },
});
