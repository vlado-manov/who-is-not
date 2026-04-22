import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import CustomText from "../common/CustomText";
import { useRoomNotificationStore } from "../../store/useRoomNotificationStore";

const AUTO_HIDE_MS = 4500;

/**
 * Top banner for room events (disconnect, player left). Dismissible.
 */
export default function OnlineRoomBanner() {
  const { t } = useTranslation();
  const message = useRoomNotificationStore((s) => s.message);
  const clear = useRoomNotificationStore((s) => s.clear);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message) {
      opacity.setValue(0);
      return;
    }
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => clear());
    }, AUTO_HIDE_MS);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [message, clear, opacity]);

  if (!message) return null;

  let display = message;
  if (message.startsWith("player_disconnected:")) {
    const parts = message.split(":");
    const name = parts[2] ?? "?";
    display = t("online_notify_disconnected", { name });
  } else if (message.startsWith("player_left:")) {
    const parts = message.split(":");
    const name = parts[2] ?? "?";
    display = t("online_notify_left_game", { name });
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { opacity }]}
    >
      <Pressable onPress={() => clear()} style={styles.inner}>
        <CustomText variant="p-small" className="text-center" textColor="#fff7ec">
          {display}
        </CustomText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 48,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  inner: {
    backgroundColor: "rgba(40, 18, 8, 0.94)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(251, 192, 32, 0.45)",
  },
});
