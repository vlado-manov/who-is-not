import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import CamText from "./CamText";
import { TTL } from "../../constants/tiktokTheme";
import { CAM_TEXT } from "../../screens/Cam/cam.constants";

type Props = {
  title: string;
  onBack: () => void;
  backLabel: string;
  /** Optional control on the right (e.g. Skip, settings). */
  right?: React.ReactNode;
  /** Colour of the chevron and title: white by default, `dark` on a light screen. */
  tone?: "light" | "dark";
};

export const CAM_NAV_BAR_HEIGHT = 44;
const SIDE_WIDTH = 88;

/** Standard navigation bar: back chevron on the left, centred title, one slot on the right. */
export default function CamNavBar({
  title,
  onBack,
  backLabel,
  right,
  tone = "light",
}: Props) {
  const color = tone === "dark" ? TTL.text : CAM_TEXT;
  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        hitSlop={8}
        style={styles.side}
        onPress={onBack}
      >
        <Ionicons name="chevron-back" size={26} color={color} />
      </Pressable>
      <CamText
        variant="body"
        center
        numberOfLines={1}
        color={color}
        style={styles.title}
      >
        {title}
      </CamText>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: CAM_NAV_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  side: {
    width: SIDE_WIDTH,
    height: CAM_NAV_BAR_HEIGHT,
    justifyContent: "center",
  },
  right: {
    alignItems: "flex-end",
    paddingRight: 8,
  },
  title: {
    flex: 1,
  },
});
