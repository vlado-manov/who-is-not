// src/hooks/useScreenMusic.ts
import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";

import AudioManager from "../utils/audioManager";

/**
 * Claims the gameplay music every time the screen comes into focus. Every game
 * screen states its own music — none relies on what the previous screen left
 * playing — so the same track is heard however the screen was reached
 * (normal flow, a dev-lab jump, a reconnect). The claim is lazy: when the
 * gameplay music is already playing it simply carries on.
 */
export function useGameplayMusic(): void {
  useFocusEffect(
    useCallback(() => {
      void AudioManager.playBackgroundGame();
    }, []),
  );
}
