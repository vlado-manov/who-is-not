import React from "react";
import { Pressable, View, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomText from "./CustomText";
import AudioManager from "../../utils/audioManager";

type Props = {
  onPress: () => void;
  /** Optional label (e.g. "Menu"). Omit for icon-only. */
  label?: string;
  /** Horizontal inset from left edge (default: same as screen padding). */
  left?: number;
  /** Override vertical position (default: below status bar / notch). */
  top?: number;
};

/**
 * Soft, consistent back control — not harsh on the eyes.
 */
export default function ScreenBackButton({
  onPress,
  label,
  left = 16,
  top,
}: Props) {
  const insets = useSafeAreaInsets();
  const topResolved = top ?? insets.top + 8;

  return (
    <Pressable
      onPress={() => {
        AudioManager.playButtonClick();
        onPress();
      }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [
        styles.wrap,
        {
          left,
          top: topResolved,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label ?? "Back"}
    >
      <View style={styles.inner}>
        <Ionicons
          name="chevron-back"
          size={22}
          color="rgba(255,248,240,0.95)"
        />
        {label ? (
          <CustomText variant="p" textColor="rgba(255,248,240,0.92)" style={styles.label}>
            {label}
          </CustomText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    zIndex: 30,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.35, shadowRadius: 3 },
      android: { elevation: 4 },
    }),
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(12, 10, 8, 0.42)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.14)",
  },
  label: {
    fontSize: 15,
    marginLeft: 6,
  },
});
