import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CamText from "../../../components/cam/CamText";
import { CAM_CAPTION_BG, CAM_LAYOUT } from "../cam.constants";

type Props = {
  /** One line above the buttons (e.g. the winner). */
  headline?: string;
  /** Button rows; each row is `barButtonHeight` tall (see `getCamBarHeight`). */
  children: React.ReactNode;
};

/**
 * Solid bar at the bottom of the roster grid. Its height is fixed by the number
 * of rows so the grid can end exactly at its top edge and stay fully visible.
 */
export default function CamBottomBar({ headline, children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View
        style={[
          styles.bar,
          {
            // The phase sits inside the safe area; the bar bleeds to the screen edge.
            marginBottom: -insets.bottom,
            paddingBottom: CAM_LAYOUT.barPaddingBottom + insets.bottom,
          },
        ]}
      >
        {!!headline && (
          <View style={styles.headline}>
            <CamText variant="title" center numberOfLines={1} adjustsFontSizeToFit>
              {headline}
            </CamText>
          </View>
        )}
        {children}
      </View>
    </View>
  );
}

/** One row of the bar: its buttons share the width equally. */
export function CamBarRow({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      {React.Children.map(children, (child) =>
        child ? <View style={styles.rowItem}>{child}</View> : null,
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bar: {
    backgroundColor: CAM_CAPTION_BG,
    paddingTop: CAM_LAYOUT.barPaddingTop,
    paddingHorizontal: 16,
    gap: CAM_LAYOUT.barRowGap,
  },
  headline: {
    height: CAM_LAYOUT.barHeadlineHeight,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    height: CAM_LAYOUT.barButtonHeight,
    gap: CAM_LAYOUT.barRowGap,
  },
  rowItem: {
    flex: 1,
  },
});
