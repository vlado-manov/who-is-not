import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

import CamCaption from "../../../components/cam/CamCaption";
import { CAM_LAYOUT, CAM_TIMING } from "../cam.constants";

type Props = {
  caption: string;
  nowLabel: string;
  captured: boolean;
  onCapture: () => void;
  onShown: () => void;
};

/** Keeps "NOW" on screen, takes the keepsake photo, then waits for it to land. */
export default function CamKeepsakePhase({
  caption,
  nowLabel,
  captured,
  onCapture,
  onShown,
}: Props) {
  const onCaptureRef = useRef(onCapture);
  onCaptureRef.current = onCapture;
  const onShownRef = useRef(onShown);
  onShownRef.current = onShown;

  const capturedAtMountRef = useRef(captured);

  useEffect(() => {
    if (capturedAtMountRef.current) return;
    const timer = setTimeout(
      () => onCaptureRef.current(),
      CAM_TIMING.keepsakeDelayMs,
    );
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!captured) return;
    const timer = setTimeout(
      () => onShownRef.current(),
      CAM_TIMING.keepsakeHoldMs,
    );
    return () => clearTimeout(timer);
  }, [captured]);

  return (
    <View style={styles.root}>
      <CamCaption text={caption} size="lg" />
      <CamCaption text={nowLabel} size="lg" />
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
