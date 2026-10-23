import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CamButton from "./cam/CamButton";
import CamCountPicker from "./cam/CamCountPicker";
import CamText from "./cam/CamText";
import { TTL } from "../constants/tiktokTheme";

type Props = {
  title: string;
  hint: string;
  min: number;
  max: number;
  selected: number | null;
  onSelect: (count: number) => void;
  confirmLabel: string;
  /** Called with the chosen count when the button is pressed. */
  onConfirm: (count: number) => void;
  /** Shows a spinner instead of the button and locks the tiles. */
  loading?: boolean;
  /** Counts shown locked (premium), and what tapping one does. */
  isLocked?: (count: number) => boolean;
  onLockedPress?: (count: number) => void;
};

/**
 * "How many players?" inside the white sheet of `LogoSheetLayout`: pick a
 * number (it becomes active), then confirm. Used by party mode and Cam Mode.
 */
export default function PlayerCountSheet({
  title,
  hint,
  min,
  max,
  selected,
  onSelect,
  confirmLabel,
  onConfirm,
  loading = false,
  isLocked,
  onLockedPress,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.texts}>
        <CamText variant="title" center color={TTL.text}>
          {title}
        </CamText>
        <CamText variant="subtitle" center color={TTL.text}>
          {hint}
        </CamText>
      </View>

      <CamCountPicker
        tone="light"
        min={min}
        max={max}
        selected={selected}
        disabled={loading}
        onSelect={onSelect}
        isLocked={isLocked}
        onLockedPress={onLockedPress}
      />

      {/* Fixed height so the tiles do not jump when the button appears. */}
      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator size="large" color={TTL.text} />
        ) : (
          selected !== null && (
            <CamButton title={confirmLabel} onPress={() => onConfirm(selected)} />
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 24,
  },
  texts: {
    gap: 6,
  },
  footer: {
    height: 50,
    justifyContent: "center",
  },
});
