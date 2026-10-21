// src/components/store/DonationThanksComponent.tsx
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Vibration, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import CamButton from "../cam/CamButton";
import CamText from "../cam/CamText";
import ConfettiRain from "./ConfettiRain";
import PurchaseFireworks from "./PurchaseFireworks";
import { TT } from "../../constants/tiktokTheme";
import AudioManager from "../../utils/audioManager";

type Props = {
  onContinue: () => void;
};

const HEART = 148;
/** The fanfare comes in three beats after the first chime. */
const FANFARE_MS = [450, 1300, 2200] as const;

/**
 * Thank-you after a donation: the grander sibling of the hero purchase
 * confirmation — twice the fireworks, confetti raining down, a beating heart,
 * a fanfare in several beats — and a warm thank-you instead of a receipt.
 */
export default function DonationThanksComponent({ onContinue }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const backdrop = useRef(new Animated.Value(0)).current;
  const heart = useRef(new Animated.Value(0)).current;
  const beat = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const texts = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AudioManager.playHeroBuy();
    Vibration.vibrate();
    const fanfare = [
      setTimeout(() => AudioManager.playWinnerStart01(), FANFARE_MS[0]),
      setTimeout(() => AudioManager.playWinnerStart02(), FANFARE_MS[1]),
      setTimeout(() => AudioManager.playWinnerStart03(), FANFARE_MS[2]),
    ];

    const intro = Animated.sequence([
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(heart, {
          toValue: 1,
          speed: 8,
          bounciness: 14,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(texts, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    // A heartbeat: two quick pulses, then a rest.
    const beating = Animated.loop(
      Animated.sequence([
        Animated.timing(beat, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.timing(beat, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(beat, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.timing(beat, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.delay(520),
      ]),
    );
    const pulse = Animated.loop(
      Animated.timing(halo, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    intro.start();
    beating.start();
    pulse.start();
    return () => {
      fanfare.forEach(clearTimeout);
      intro.stop();
      beating.stop();
      pulse.stop();
    };
  }, [backdrop, beat, halo, heart, texts]);

  const textStyle = {
    opacity: texts,
    transform: [
      {
        translateY: texts.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: backdrop }]}>
      <PurchaseFireworks grand />
      <ConfettiRain />

      <View style={styles.center}>
        <View style={styles.heartWrap}>
          {[0, 1].map((ring) => (
            <Animated.View
              key={ring}
              style={[
                styles.halo,
                {
                  opacity: halo.interpolate({
                    inputRange: [0, 1],
                    outputRange: [ring === 0 ? 0.5 : 0.28, 0],
                  }),
                  transform: [
                    {
                      scale: halo.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, ring === 0 ? 1.5 : 1.95],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
          <Animated.View
            style={[
              styles.heart,
              {
                opacity: heart,
                transform: [
                  {
                    scale: Animated.multiply(
                      heart.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 1],
                      }),
                      beat.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.1],
                      }),
                    ),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="heart" size={78} color={TT.text} />
          </Animated.View>
        </View>

        <Animated.View style={[styles.texts, textStyle]}>
          <CamText variant="subtitle" center style={styles.eyebrow}>
            {t("store_donate_thanks_eyebrow")}
          </CamText>
          <CamText variant="question" center style={styles.title}>
            {t("store_donate_thanks_title")}
          </CamText>
          <CamText variant="subtitle" center style={styles.body}>
            {t("store_donate_thanks_body")}
          </CamText>
        </Animated.View>
      </View>

      <Animated.View
        style={[styles.footer, { paddingBottom: insets.bottom + 16 }, textStyle]}
      >
        <CamButton title={t("continue_btn")} onPress={onContinue} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.92)",
    zIndex: 9999,
    elevation: 9999,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 32,
  },
  heartWrap: {
    width: HEART,
    height: HEART,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    width: HEART,
    height: HEART,
    borderRadius: HEART / 2,
    backgroundColor: TT.primary,
  },
  heart: {
    width: HEART,
    height: HEART,
    borderRadius: HEART / 2,
    backgroundColor: TT.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
  },
  texts: {
    alignItems: "center",
    gap: 8,
  },
  eyebrow: {
    fontSize: 13,
    lineHeight: 18,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 40,
    lineHeight: 48,
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
    opacity: 0.9,
  },
  footer: {
    paddingHorizontal: 16,
  },
});
