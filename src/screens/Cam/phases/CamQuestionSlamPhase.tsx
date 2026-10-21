import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import CamButton from "../../../components/cam/CamButton";
import CamCaption from "../../../components/cam/CamCaption";
import { usePlateSlamAnimation } from "../../../hooks/usePlateSlamAnimation";
import AudioManager from "../../../utils/audioManager";
import { CAM_LAYOUT, CAM_TIMING } from "../cam.constants";

type Props = {
  /** The question everyone except the impostor saw. */
  text: string;
  /** The photo of who pointed at whom was already taken for this phase. */
  captured: boolean;
  onCapture: () => void;
  onContinue: () => void;
};

/**
 * The shared question slams in while a photo of everyone pointing is taken;
 * then "Who is the impostor?" appears with a Continue button above it.
 */
export default function CamQuestionSlamPhase({
  text,
  captured,
  onCapture,
  onContinue,
}: Props) {
  const { t } = useTranslation();
  const [promptVisible, setPromptVisible] = useState(false);
  const { plateScale, plateOpacity, shakeX } = usePlateSlamAnimation();
  const capturedAtMountRef = useRef(captured);
  const onCaptureRef = useRef(onCapture);
  onCaptureRef.current = onCapture;

  useEffect(() => {
    void AudioManager.playRevealTitleSplash();
    if (!capturedAtMountRef.current) onCaptureRef.current();
    const timer = setTimeout(
      () => setPromptVisible(true),
      CAM_TIMING.impostorPromptDelayMs,
    );
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.root}>
      {/* Only the plate shakes — the camera layer stays still. */}
      <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
        <Animated.View
          style={{ opacity: plateOpacity, transform: [{ scale: plateScale }] }}
        >
          <CamCaption text={text} size="xl" />
        </Animated.View>
      </Animated.View>

      {promptVisible && (
        <View style={styles.bottom}>
          <CamButton
            title={t("continue_btn")}
            style={styles.button}
            onPress={onContinue}
          />
          <CamCaption text={t("cam_who_is_impostor")} />
        </View>
      )}
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
  bottom: {
    gap: 12,
  },
  button: {
    marginHorizontal: 24,
  },
});
