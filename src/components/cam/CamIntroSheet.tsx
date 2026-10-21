import React from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import CamButton from "./CamButton";
import CamSheet from "./CamSheet";
import CamText from "./CamText";

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/** Short explanation of Cam Mode, shown before the camera permission is asked. */
export default function CamIntroSheet({ visible, onClose, onConfirm }: Props) {
  const { t } = useTranslation();
  const steps = t("cam_intro_body").split("\n");

  return (
    <CamSheet
      visible={visible}
      onClose={onClose}
      title={t("cam_mode_btn")}
      closeLabel={t("cancel")}
    >
      <View style={styles.steps}>
        {steps.map((step) => (
          <CamText key={step} variant="body">
            {step}
          </CamText>
        ))}
      </View>
      <CamButton
        title={t("cam_intro_confirm")}
        icon="videocam"
        onPress={onConfirm}
      />
    </CamSheet>
  );
}

const styles = StyleSheet.create({
  steps: {
    gap: 12,
  },
});
