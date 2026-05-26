import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AudioManager from "../../utils/audioManager";
import PurpleConfirmModal from "../common/PurpleConfirmModal";

type Props = {
  onRefresh: () => void;
};

export default function GameplayRefreshButton({ onRefresh }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const openConfirm = () => {
    AudioManager.playButtonClick();
    setConfirmVisible(true);
  };

  const refreshCurrentScreen = () => {
    AudioManager.playButtonClick();
    setConfirmVisible(false);
    onRefresh();
  };

  return (
    <>
      <View
        pointerEvents="box-none"
        style={[styles.wrap, { top: insets.top + 12 }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("gameplay_refresh")}
          onPress={openConfirm}
          hitSlop={14}
          style={({ pressed }) => [
            styles.button,
            pressed ? styles.buttonPressed : null,
          ]}
        >
          <Ionicons name="refresh" size={24} color="#fff7ec" />
        </Pressable>
      </View>
      <PurpleConfirmModal
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        emoji="🔄"
        title={t("gameplay_refresh_title")}
        body={t("gameplay_refresh_body")}
        cancelLabel={t("settings_cancel")}
        confirmLabel={t("gameplay_refresh_confirm")}
        confirmColors={["#22c55e", "#15803d"]}
        onConfirm={refreshCurrentScreen}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 14,
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
