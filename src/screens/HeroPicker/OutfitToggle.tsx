// src/screens/HeroPicker/OutfitToggle.tsx
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import AudioManager from "../../utils/audioManager";

type Props = {
  /** 0 = the hero's classic look, 1.. = its skins. */
  index: number;
  total: number;
  /** The look on screen is locked (a small padlock on the button). */
  locked: boolean;
  onPress: () => void;
};

/**
 * Beside a hero that has skins: a round outfit button that switches to the next
 * look, with dots showing which of the looks is on screen.
 */
export default function OutfitToggle({ index, total, locked, onPress }: Props) {
  const { t } = useTranslation();
  const pop = useRef(new Animated.Value(1)).current;

  const press = () => {
    AudioManager.playSwoosh();
    Animated.sequence([
      Animated.timing(pop, { toValue: 0.82, duration: 80, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, speed: 18, bounciness: 14, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("hero_picker_outfit_a11y")}
        accessibilityValue={{ text: t("hero_picker_outfit_counter", { current: index + 1, total }) }}
        hitSlop={8}
        onPress={press}
      >
        <Animated.View style={[styles.button, { transform: [{ scale: pop }] }]}>
          <Ionicons name="shirt" size={24} color="#FFFFFF" />
          {locked ? (
            <View style={styles.lockDot}>
              <Ionicons name="lock-closed" size={10} color="#3A2400" />
            </View>
          ) : null}
        </Animated.View>
      </Pressable>
      <View style={styles.dots}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotOn]} />
        ))}
      </View>
      <Text style={styles.caption} numberOfLines={1}>
        {t("hero_picker_outfit_counter", { current: index + 1, total })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    gap: 5,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C44CD7",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    boxShadow: "0px 3px 0px #7A2486, 0px 0px 14px rgba(196,76,215,0.6)",
  },
  lockDot: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD966",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  dots: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotOn: {
    width: 14,
    backgroundColor: "#FFFFFF",
  },
  caption: {
    color: "#FFFFFF",
    fontFamily: "Onest-Bold",
    fontSize: 11,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 3,
  },
});
