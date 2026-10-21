import React from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { CamGlass, useCamPressScale } from "./CamButton";
import CamText from "./CamText";
import { CAM_LAYOUT, CAM_TEXT, CAM_UI } from "../../screens/Cam/cam.constants";
import type { CamRecorder } from "../../screens/Cam/useCamRecorder";

type Props = {
  recorder: CamRecorder;
};

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

/**
 * Record control with two actions only: Start and Pause. Idle shows a red dot;
 * recording shows a red pill with the pause icon and the time; paused keeps
 * the time next to the red dot, ready to start again. There is no Stop — the
 * recording ends by itself with the round.
 */
export default function CamRecordButton({ recorder }: Props) {
  const { t } = useTranslation();
  const press = useCamPressScale();
  const { status } = recorder;
  const isRecording = status === "recording";
  const isPaused = status === "paused";
  const size = CAM_LAYOUT.recordButtonSize;

  return (
    <Animated.View style={{ transform: [{ scale: press.scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isRecording ? t("cam_record_pause") : t("cam_record_start")
        }
        hitSlop={8}
        disabled={status === "starting"}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        onPress={() => void (isRecording ? recorder.pause() : recorder.start())}
      >
        {/* Styled on a plain View so the look never depends on Pressable's style. */}
        <View
          style={[
            styles.button,
            { height: size, minWidth: size, borderRadius: size / 2 },
            isRecording && styles.recording,
            isPaused && styles.paused,
          ]}
        >
          {!isRecording && <CamGlass />}
          {isRecording ? (
            <Ionicons name="pause" size={16} color={CAM_TEXT} />
          ) : (
            <View style={styles.dot} />
          )}
          {(isRecording || isPaused) && (
            <CamText variant="body" style={styles.time}>
              {formatTime(recorder.seconds)}
            </CamText>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CAM_UI.secondaryBorder,
  },
  recording: {
    backgroundColor: CAM_UI.primary,
    paddingHorizontal: 12,
    borderWidth: 0,
  },
  paused: {
    paddingHorizontal: 12,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: CAM_UI.primary,
  },
  time: {
    fontSize: 15,
  },
});
