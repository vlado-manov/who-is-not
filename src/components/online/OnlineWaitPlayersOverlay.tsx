import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useTranslation } from "react-i18next";
import CustomText from "../common/CustomText";

type Props = {
  visible: boolean;
  /** i18n key (default: waiting at round start / votes). */
  messageKey?: string;
};

export default function OnlineWaitPlayersOverlay({
  visible,
  messageKey = "online_wait_other_players",
}: Props) {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <View
      pointerEvents="auto"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
        backgroundColor: "rgba(0,0,0,0.55)",
        paddingHorizontal: 24,
      }}
    >
      <ActivityIndicator size="large" color="#ffffff" />
      <CustomText
        variant="p"
        className="text-center mt-6 text-white px-4"
      >
        {t(messageKey)}
      </CustomText>
    </View>
  );
}
