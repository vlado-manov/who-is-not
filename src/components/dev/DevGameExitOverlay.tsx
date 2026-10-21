import React, { useRef } from "react";
import { Animated, PanResponder, Pressable, StyleSheet } from "react-native";
import { CommonActions, useNavigation } from "@react-navigation/native";

import { useGameStore } from "../../store/useGameStore";
import CustomText from "../common/CustomText";
import AudioManager from "../../utils/audioManager";

/** Finger travel before a touch counts as a drag instead of a tap. */
const DRAG_THRESHOLD = 4;

/**
 * Floating exit when a dev-seeded game is active (gameId prefix dev_).
 * It can be dragged anywhere on the screen, like the Expo dev-menu button, so
 * it never covers the part of the game being checked; a tap still exits.
 */
export default function DevGameExitOverlay() {
  const navigation = useNavigation();
  const gameId = useGameStore((s) => s.gameId);
  const position = useRef(new Animated.ValueXY()).current;

  const dragResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > DRAG_THRESHOLD || Math.abs(g.dy) > DRAG_THRESHOLD,
      // Continue from where the button was left last time.
      onPanResponderGrant: () => position.extractOffset(),
      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        { useNativeDriver: false },
      ),
      onPanResponderRelease: () => position.extractOffset(),
      onPanResponderTerminate: () => position.extractOffset(),
    }),
  ).current;

  if (!__DEV__ || !gameId?.startsWith("dev_")) return null;

  const exit = () => {
    void AudioManager.stopBackground();
    void AudioManager.stopTensionLoop();
    useGameStore.getState().reset();
    // Overlay sits outside Stack.Navigator; useNavigation() may already be the
    // root navigator, so getParent() is undefined and nothing ran before.
    const targetNav = navigation.getParent() ?? navigation;
    targetNav.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: "Onboarding",
            state: {
              routes: [{ name: "DevMultiplayerLab" }],
              index: 0,
            },
          },
        ],
      })
    );
  };

  return (
    <Animated.View
      style={[styles.wrap, { transform: position.getTranslateTransform() }]}
      {...dragResponder.panHandlers}
    >
      <Pressable
        onPress={exit}
        style={styles.btn}
        accessibilityLabel="Exit dev screen lab"
      >
        <CustomText variant="p-small" textColor="#1a0a05">
          Exit lab
        </CustomText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 52,
    right: 12,
    zIndex: 100000,
    elevation: 100000,
  },
  btn: {
    backgroundColor: "rgba(255, 230, 160, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(120, 60, 20, 0.35)",
  },
});
