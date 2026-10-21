import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { useEvent, useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useTranslation } from "react-i18next";

import CamText from "./CamText";
import { CAM_TEXT, CAM_UI } from "../../screens/Cam/cam.constants";

type Props = {
  uri: string;
  /** The page is the one on screen: it plays; other pages are paused. */
  active: boolean;
  muted: boolean;
  bottomInset: number;
};

const TIME_UPDATE_SECONDS = 0.25;

function formatTime(totalSeconds: number): string {
  const whole = Math.max(0, Math.floor(totalSeconds));
  const seconds = whole % 60;
  return `${Math.floor(whole / 60)}:${seconds < 10 ? "0" : ""}${seconds}`;
}

/**
 * TikTok-like video page: tap anywhere to play / pause (a large play icon shows
 * in the middle while paused) and a draggable timeline along the bottom.
 */
export default function CamGalleryVideo({
  uri,
  active,
  muted,
  bottomInset,
}: Props) {
  const { t } = useTranslation();
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = TIME_UPDATE_SECONDS;
  });
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);

  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    if (!scrubbing) setPosition(currentTime);
    if (player.duration > 0) setDuration(player.duration);
  });

  useEffect(() => {
    if (active) player.play();
    else player.pause();
  }, [active, player]);

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
      return;
    }
    // At the end, start over instead of doing nothing.
    if (duration > 0 && position >= duration - TIME_UPDATE_SECONDS) {
      player.currentTime = 0;
    }
    player.play();
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
      />
      <Pressable
        style={[StyleSheet.absoluteFill, styles.center]}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? t("cam_video_pause") : t("cam_video_play")}
        onPress={togglePlay}
      >
        {!isPlaying && (
          <View style={styles.playBadge}>
            <Ionicons name="play" size={44} color={CAM_TEXT} />
          </View>
        )}
      </Pressable>

      <View style={[styles.timeline, { bottom: bottomInset + 8 }]}>
        <CamText variant="subtitle" style={styles.time}>
          {formatTime(position)}
        </CamText>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={Math.max(duration, TIME_UPDATE_SECONDS)}
          value={position}
          minimumTrackTintColor={CAM_TEXT}
          maximumTrackTintColor={CAM_UI.secondaryBorder}
          thumbTintColor={CAM_TEXT}
          onSlidingStart={() => setScrubbing(true)}
          onValueChange={setPosition}
          onSlidingComplete={(value) => {
            player.currentTime = value;
            setScrubbing(false);
          }}
        />
        <CamText variant="subtitle" style={styles.time}>
          {formatTime(duration)}
        </CamText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  playBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 6,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  timeline: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 32,
  },
  time: {
    fontSize: 13,
    opacity: 1,
  },
});
