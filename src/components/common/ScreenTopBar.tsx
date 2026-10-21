import React, { useState } from "react";
import { ImageSourcePropType, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppImage from "../AppImage";
import AudioManager from "../../utils/audioManager";

export type ScreenTopBarVariant = "default" | "soloBackFromCenter";

type Props = {
  /** Kept for callers; the bar uses fixed 16pt gutters. */
  horizontalPadding?: number;
  /** Kept for callers; the buttons have a fixed size. */
  topIconSize?: number;
  /** When false (Welcome / MenuPlay), only the right-hand buttons are shown. */
  showBack?: boolean;
  onSettings: () => void;
  onProfile: () => void;
  onBack?: () => void;
  /** Shows a Store tile on the left (main menu). */
  onStore?: () => void;
  storeAccessibilityLabel?: string;
  /**
   * Main menu layout: the profile button shows this picture in a circle
   * (instead of the person icon) and settings move to the left group.
   */
  profileImage?: ImageSourcePropType | null;
  settingsOnLeft?: boolean;
  /** Kept for callers; no longer used. */
  useExpoImage?: boolean;
  backAccessibilityLabel?: string;
  /** `soloBackFromCenter`: only the back button (no profile / settings). */
  variant?: ScreenTopBarVariant;
};

const BUTTON = 44;
const ICON = 22;
/** The profile picture on the main menu, a little larger than a button. */
const AVATAR = 60;
/** Side gutter and gap under the status bar, shared by every top button. */
export const SCREEN_TOP_BAR_GUTTER = 16;
export const SCREEN_TOP_BAR_TOP_GAP = 6;
const GUTTER = SCREEN_TOP_BAR_GUTTER;
const TOP_GAP = SCREEN_TOP_BAR_TOP_GAP;

type IconName = keyof typeof Ionicons.glyphMap;

/** One top-bar button: a rounded dark tile with a white icon. */
export function ScreenTopButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => {
        AudioManager.playButtonClick();
        onPress();
      }}
    >
      {/* Styled on a plain View: the tile must not depend on Pressable's style. */}
      <View style={[styles.button, pressed && styles.pressed]}>
        <Ionicons name={icon} size={ICON} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

/**
 * Top row over the game backgrounds, laid out the way most apps do it:
 * back on the left, profile and settings on the right — each in its own
 * rounded tile with clear space between them — just under the status bar.
 */
export default function ScreenTopBar({
  showBack = false,
  onSettings,
  onProfile,
  onBack,
  onStore,
  storeAccessibilityLabel = "Store",
  profileImage,
  settingsOnLeft = false,
  backAccessibilityLabel = "Back",
  variant = "default",
}: Props) {
  const insets = useSafeAreaInsets();
  const backOnly = variant === "soloBackFromCenter";

  return (
    <View
      pointerEvents="box-none"
      style={[styles.bar, { top: insets.top + TOP_GAP }]}
    >
      <View style={styles.group}>
        {showBack && onBack && (
          <ScreenTopButton
            icon="chevron-back"
            label={backAccessibilityLabel}
            onPress={onBack}
          />
        )}
        {settingsOnLeft && !backOnly && (
          <ScreenTopButton
            icon="settings-outline"
            label="Settings"
            onPress={onSettings}
          />
        )}
        {onStore && (
          <ScreenTopButton
            icon="bag-handle-outline"
            label={storeAccessibilityLabel}
            onPress={onStore}
          />
        )}
      </View>
      {!backOnly && (
        <View style={styles.group}>
          {profileImage ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Profile"
              hitSlop={8}
              onPress={() => {
                AudioManager.playButtonClick();
                onProfile();
              }}
            >
              <View style={styles.avatar}>
                <AppImage
                  source={profileImage}
                  contentFit="cover"
                  // Hero portraits are tall: keep the face, not the chest.
                  contentPosition="top"
                  style={styles.avatarImage}
                />
              </View>
            </Pressable>
          ) : (
            <ScreenTopButton
              icon="person-outline"
              label="Profile"
              onPress={onProfile}
            />
          )}
          {!settingsOnLeft && (
            <ScreenTopButton
              icon="settings-outline"
              label="Settings"
              onPress={onSettings}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: GUTTER,
    flexDirection: "row",
    // Top-aligned: the large profile picture hangs below the row of buttons.
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  group: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  button: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  // Just the picture: no frame, no rounding, no backing tile.
  avatar: {
    width: AVATAR,
    height: AVATAR,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
});
