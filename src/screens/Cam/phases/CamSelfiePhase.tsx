import React from "react";
import { StyleSheet, View } from "react-native";

import CamCaption from "../../../components/cam/CamCaption";
import CamShutterButton from "../../../components/cam/CamShutterButton";
import { CAM_LAYOUT } from "../cam.constants";

type Props = {
  caption: string;
  busy: boolean;
  onShutter: () => void;
};

export default function CamSelfiePhase({ caption, busy, onShutter }: Props) {
  return (
    <View style={styles.root}>
      <CamCaption text={caption} />
      <View style={styles.shutter}>
        <CamShutterButton
          disabled={busy}
          accessibilityLabel={caption}
          onPress={onShutter}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: CAM_LAYOUT.captionTop,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  shutter: {
    alignItems: "center",
  },
});
