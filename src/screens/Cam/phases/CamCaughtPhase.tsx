import React from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import CamButton from "../../../components/cam/CamButton";
import CamCaption from "../../../components/cam/CamCaption";
import { CAM_LAYOUT } from "../cam.constants";

type Props = {
  onAnswer: (caught: boolean) => void;
};

export default function CamCaughtPhase({ onAnswer }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <View style={styles.captions}>
        <CamCaption text={t("cam_caught")} size="lg" />
        <CamCaption text={t("cam_impostor_reveal")} />
      </View>
      <View style={styles.buttons}>
        <CamButton
          title={t("cam_no")}
          variant="secondary"
          style={styles.button}
          onPress={() => onAnswer(false)}
        />
        <CamButton
          title={t("cam_yes")}
          style={styles.button}
          onPress={() => onAnswer(true)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: CAM_LAYOUT.captionTop,
    paddingBottom: 16,
    justifyContent: "space-between",
  },
  captions: {
    gap: 10,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
  },
  button: {
    flex: 1,
  },
});
