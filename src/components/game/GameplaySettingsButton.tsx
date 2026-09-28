import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AudioManager from "../../utils/audioManager";
import { useUserSettingsSheet } from "../../context/UserSettingsModalContext";

type Props = {
  onRefresh: () => void;
};

export default function GameplaySettingsButton({ onRefresh }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { openUserSettings } = useUserSettingsSheet();

  const handlePress = () => {
    AudioManager.playButtonClick();
    openUserSettings({ fromGameplay: true, onRefresh });
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + 12 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("settings_title")}
        onPress={handlePress}
        hitSlop={14}
        style={({ pressed }) => [
          styles.button,
          pressed ? styles.buttonPressed : null,
        ]}
      >
        <Ionicons name="settings-outline" size={22} color="#fff7ec" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 14,
    zIndex: 10020,
    elevation: 10020,
  },
  button: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.38)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  buttonPressed: {
    opacity: 0.74,
    transform: [{ scale: 0.96 }],
  },
});
