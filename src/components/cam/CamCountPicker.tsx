import React from "react";
import { StyleSheet, View } from "react-native";

import CamButton from "./CamButton";

type Props = {
  min: number;
  max: number;
  selected: number | null;
  onSelect: (count: number) => void;
  disabled?: boolean;
  /** `light` = on a white sheet: grey tiles, the chosen one black. */
  tone?: "dark" | "light";
};

const TILE = 72;
const GAP = 12;
const PER_ROW = 4;

/** Number tiles for the player count; the chosen one is highlighted. */
export default function CamCountPicker({
  min,
  max,
  selected,
  onSelect,
  disabled = false,
  tone = "dark",
}: Props) {
  const idleVariant = tone === "light" ? "fill" : "secondary";
  const selectedVariant = tone === "light" ? "dark" : "light";
  const counts = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <View style={styles.grid}>
      {counts.map((count) => (
        <CamButton
          key={count}
          title={String(count)}
          variant={count === selected ? selectedVariant : idleVariant}
          shape="tile"
          tileSize={TILE}
          disabled={disabled}
          accessibilityLabel={String(count)}
          onPress={() => onSelect(count)}
        />
      ))}
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
});
