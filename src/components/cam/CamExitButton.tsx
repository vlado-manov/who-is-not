import React from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";

import CamIconButton from "./CamIconButton";

type Props = {
  onExit: () => void;
};

/** Close button; asks for confirmation with the system alert before leaving. */
export default function CamExitButton({ onExit }: Props) {
  const { t } = useTranslation();

  const confirmExit = () =>
    Alert.alert(t("cam_exit_title"), t("cam_exit_body"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("cam_exit"), style: "destructive", onPress: onExit },
    ]);

  return (
    <CamIconButton
      icon="close"
      size={36}
      accessibilityLabel={t("cam_exit")}
      onPress={confirmExit}
    />
  );
}
