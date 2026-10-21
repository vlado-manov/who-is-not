import React from "react";
import { StyleSheet, View } from "react-native";

import CamButton from "../../../components/cam/CamButton";
import CamCaption from "../../../components/cam/CamCaption";
import { CAM_LAYOUT } from "../cam.constants";

type Props = {
  caption: string;
  buttonLabel: string;
  onPress: () => void;
};

/** Instruction over the live camera that waits for a confirmation at the bottom. */
export default function CamCaptionButtonPhase({
  caption,
  buttonLabel,
  onPress,
}: Props) {
  return (
    <View style={styles.root}>
      <CamCaption text={caption} size="lg" />
      <CamButton title={buttonLabel} style={styles.button} onPress={onPress} />
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
  button: {
    marginHorizontal: 24,
  },
});
