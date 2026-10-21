import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Image } from "expo-image";

import CamCaption from "./CamCaption";
import CamHearts from "./CamHearts";
import { CamNameRibbon } from "./CamRosterGrid";
import AudioManager from "../../utils/audioManager";
import { CAM_LAYOUT, CAM_TIMING } from "../../screens/Cam/cam.constants";
import type { CamPlayer } from "../../screens/Cam/cam.types";

export type CamLivesCard = {
  player: CamPlayer;
  /** Lives after this round. */
  lives: number;
  losing: boolean;
  /** Lines shown under the photo, e.g. "X was the impostor", "X loses a life". */
  captions: string[];
};

type Props = {
  cards: CamLivesCard[];
  maxLives: number;
  insets: { top: number; bottom: number };
  onDone: () => void;
};

/**
 * Shows the round result one player at a time, full screen: the impostor first
 * (losing a life or not), then everyone else who loses one.
 */
export default function CamLivesReveal({
  cards,
  maxLives,
  insets,
  onDone,
}: Props) {
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const card = cards[index];

  useEffect(() => {
    if (!card) {
      onDoneRef.current();
      return;
    }
    fade.setValue(0);
    const anim = Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    });
    anim.start();

    const sound = setTimeout(() => {
      if (card.losing) AudioManager.playHeartDeath();
      else AudioManager.playImposterNotLosingLiveSound();
    }, CAM_TIMING.heartLossDelayMs);
    const next = setTimeout(
      () => setIndex((i) => i + 1),
      CAM_TIMING.livesCardMs,
    );
    return () => {
      anim.stop();
      clearTimeout(sound);
      clearTimeout(next);
    };
  }, [card, fade]);

  if (!card || !card.player.photoUri) return null;

  return (
    <Animated.View
      key={card.player.id}
      style={[
        StyleSheet.absoluteFill,
        styles.card,
        { borderColor: card.player.color, opacity: fade },
      ]}
    >
      <Image
        source={{ uri: card.player.photoUri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <CamNameRibbon
        name={card.player.name}
        color={card.player.color}
        topInset={insets.top}
      />
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        {card.captions.map((caption, i) => (
          <CamCaption key={`${i}-${caption}`} text={caption} size="lg" />
        ))}
        <View style={styles.hearts}>
          <CamHearts
            count={card.lives}
            max={maxLives}
            size={CAM_LAYOUT.heartSizeCard}
            losing={card.losing}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0a0a0a",
    borderWidth: CAM_LAYOUT.cellBorderWidth,
  },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    gap: 8,
  },
  hearts: {
    marginTop: 12,
  },
});
