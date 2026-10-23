import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import CamButton from "./CamButton";

type Props = {
  min: number;
  max: number;
  selected: number | null;
  onSelect: (count: number) => void;
  disabled?: boolean;
  /** `light` = on a white sheet: grey tiles, the chosen one black. */
  tone?: "dark" | "light";
  /** A locked count is shown dimmed with a padlock and never selected. */
  isLocked?: (count: number) => boolean;
  /** Tapping a locked count (opens the premium sheet). */
  onLockedPress?: (count: number) => void;
};

const TILE = 72;
const GAP = 12;
const PER_ROW = 4;
const BADGE = 22;

/** Number tiles for the player count; the chosen one is highlighted. */
export default function CamCountPicker({
  min,
  max,
  selected,
  onSelect,
  disabled = false,
  tone = "dark",
  isLocked,
  onLockedPress,
}: Props) {
  const { t } = useTranslation();
  const idleVariant = tone === "light" ? "fill" : "secondary";
  const selectedVariant = tone === "light" ? "dark" : "light";
  const counts = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <View style={styles.grid}>
      {counts.map((count) => {
        const locked = isLocked?.(count) ?? false;
        return (
          <View key={count} style={locked && styles.lockedTile}>
            <CamButton
              title={String(count)}
              variant={count === selected && !locked ? selectedVariant : idleVariant}
              shape="tile"
              tileSize={TILE}
              disabled={disabled}
              accessibilityLabel={
                locked ? t("limit_locked_a11y", { count }) : String(count)
              }
              onPress={() => (locked ? onLockedPress?.(count) : onSelect(count))}
            />
            {locked && (
              <View pointerEvents="none" style={styles.badge}>
                <Ionicons name="lock-closed" size={12} color="#161823" />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignSelf: "center",
    gap: GAP,
    maxWidth: PER_ROW * TILE + (PER_ROW - 1) * GAP,
  },
  lockedTile: { opacity: 0.5 },
  // Gold padlock chip on the tile's corner.
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: "#FFD966",
    alignItems: "center",
    justifyContent: "center",
  },
});
