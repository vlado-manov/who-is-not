import React from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  SCREEN_TOP_BAR_GUTTER,
  SCREEN_TOP_BAR_TOP_GAP,
  ScreenTopButton,
} from "../common/ScreenTopBar";
import { useUserSettingsSheet } from "../../context/UserSettingsModalContext";

type Props = {
  onRefresh: () => void;
};

/**
 * Settings during gameplay: the same button, in the same top-right spot, as on
 * the menu screens.
 */
export default function GameplaySettingsButton({ onRefresh }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { openUserSettings } = useUserSettingsSheet();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { top: insets.top + SCREEN_TOP_BAR_TOP_GAP }]}
    >
      <ScreenTopButton
        icon="settings-outline"
        label={t("settings_title")}
        onPress={() => openUserSettings({ fromGameplay: true, onRefresh })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: SCREEN_TOP_BAR_GUTTER,
    zIndex: 10020,
    elevation: 10020,
  },
});
