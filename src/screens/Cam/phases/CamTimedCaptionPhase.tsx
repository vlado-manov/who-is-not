import React from "react";
import { StyleSheet, View } from "react-native";

import CamCaption from "../../../components/cam/CamCaption";
import CamCountdown from "../../../components/cam/CamCountdown";
import { CAM_LAYOUT, CAM_TIMING } from "../cam.constants";

type Props = {
  caption: string;
  /** e.g. ["3", "2", "1", "NOW"] */
  steps: string[];
  /** How long the last step stays before `onDone`. */
  holdMs: number;
  onDone: () => void;
};

/** Top caption over the live camera with a slow countdown on the line below. */
export default function CamTimedCaptionPhase({
  caption,
  steps,
  holdMs,
  onDone,
}: Props) {
  return (
    <View style={styles.root}>
      <CamCaption text={caption} size="lg" />
      <CamCountdown
        boxed
        steps={steps}
        stepMs={CAM_TIMING.slowCountStepMs}
        holdMs={holdMs}
        onDone={onDone}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: CAM_LAYOUT.captionTop,
    gap: 12,
  },
});
