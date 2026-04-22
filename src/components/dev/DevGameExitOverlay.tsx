import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { CommonActions, useNavigation } from "@react-navigation/native";

import { useGameStore } from "../../store/useGameStore";
import CustomText from "../common/CustomText";

/**
 * Floating exit when a dev-seeded game is active (gameId prefix dev_).
 */
export default function DevGameExitOverlay() {
  const navigation = useNavigation();
  const gameId = useGameStore((s) => s.gameId);

  if (!__DEV__ || !gameId?.startsWith("dev_")) return null;

  const exit = () => {
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
    <View pointerEvents="box-none" style={styles.wrap}>
      <Pressable
        onPress={exit}
        style={styles.btn}
        accessibilityLabel="Exit dev screen lab"
      >
        <CustomText variant="p-small" textColor="#1a0a05">
          Exit lab
        </CustomText>
      </Pressable>
    </View>
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
