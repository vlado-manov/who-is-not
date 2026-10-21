import React from "react";
import { StyleSheet, View } from "react-native";

import CamCountdown from "../../../components/cam/CamCountdown";
import { CAM_TIMING } from "../cam.constants";

type Props = {
  onDone: () => void;
};

const STEPS = ["1", "2", "3"];

export default function CamPeekCountdownPhase({ onDone }: Props) {
  return (
    <View style={styles.root}>
      <CamCountdown
        steps={STEPS}
        stepMs={CAM_TIMING.peekCountStepMs}
        holdMs={CAM_TIMING.peekCountStepMs}
        onDone={onDone}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
