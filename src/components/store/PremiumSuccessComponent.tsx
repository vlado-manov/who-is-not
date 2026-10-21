// src/components/store/PremiumSuccessComponent.tsx
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Vibration, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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

const BADGE = 148;
const GOLD = ["#FFE27A", "#FFB020", "#FF8A00"] as const;
const GOLD_SOLID = "#FFC53D";
const FANFARE_MS = 450;
const BENEFIT_STAGGER_MS = 140;

/** What Premium gives, in the order it is listed (existing store texts). */
const BENEFIT_KEYS = [
  "store_premium_no_ads",
  "store_premium_custom_packs",
  "store_premium_custom_refill",
  "store_premium_cam_questions",
] as const;

/**
 * Confirmation after buying Premium: a gold badge springing in with a light
 * sweeping across it, fireworks and a light fall of confetti behind, then the
 * headline and the list of what is now unlocked, ticked off one by one.
 */
export default function PremiumSuccessComponent({ onContinue }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const backdrop = useRef(new Animated.Value(0)).current;
  const badge = useRef(new Animated.Value(0)).current;
  const shine = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const texts = useRef(new Animated.Value(0)).current;
  const benefits = useRef(BENEFIT_KEYS.map(() => new Animated.Value(0))).current;
  const footer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AudioManager.playHeroBuy();
    Vibration.vibrate();
    const fanfare = setTimeout(
      () => AudioManager.playWinnerStart01(),
      FANFARE_MS,
    );

    const rise = (value: Animated.Value) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    const intro = Animated.sequence([
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(badge, {
          toValue: 1,
          speed: 8,
          bounciness: 12,
          useNativeDriver: true,
        }),
      ]),
      rise(texts),
      Animated.stagger(BENEFIT_STAGGER_MS, benefits.map(rise)),
      rise(footer),
    ]);
    // A band of light crosses the badge, rests, and crosses again.
    const sweeping = Animated.loop(
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(shine, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shine, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(1400),
      ]),
    );
    const pulse = Animated.loop(
      Animated.timing(halo, {
        toValue: 1,
        duration: 1700,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    intro.start();
    sweeping.start();
    pulse.start();
    return () => {
      clearTimeout(fanfare);
      intro.stop();
      sweeping.stop();
      pulse.stop();
    };
  }, [backdrop, badge, benefits, footer, halo, shine, texts]);

  const riseStyle = (value: Animated.Value) => ({
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity: backdrop }]}>
      <PurchaseFireworks />
      <ConfettiRain count={26} rounds={2} />

      <View style={styles.center}>
        <View style={styles.badgeWrap}>
          <Animated.View
            style={[
              styles.halo,
              {
                opacity: halo.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.45, 0],
                }),
                transform: [
                  {
                    scale: halo.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.6],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.badge,
              {
                opacity: badge,
                transform: [
                  {
                    scale: badge.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={GOLD}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="star" size={76} color="#FFFFFF" />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.shine,
                {
                  transform: [
                    {
                      translateX: shine.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-BADGE, BADGE],
                      }),
                    },
                    { rotate: "20deg" },
                  ],
                },
              ]}
            />
          </Animated.View>
        </View>

        <Animated.View style={[styles.texts, riseStyle(texts)]}>
          <CamText variant="subtitle" center color={GOLD_SOLID} style={styles.eyebrow}>
            {t("premium_title")}
          </CamText>
          <CamText variant="question" center style={styles.title}>
            {t("store_success_premium_title")}
          </CamText>
        </Animated.View>

        <View style={styles.benefits}>
          {BENEFIT_KEYS.map((key, i) => (
            <Animated.View key={key} style={[styles.benefit, riseStyle(benefits[i])]}>
              <View style={styles.tick}>
                <Ionicons name="checkmark" size={14} color={TT.onLight} />
              </View>
              <CamText variant="body" style={styles.benefitText}>
                {t(key)}
              </CamText>
            </Animated.View>
          ))}
        </View>
      </View>

      <Animated.View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 16 },
          riseStyle(footer),
        ]}
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
    gap: 28,
  },
  badgeWrap: {
    width: BADGE,
    height: BADGE,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: GOLD_SOLID,
  },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  shine: {
    position: "absolute",
    top: -BADGE / 2,
    width: 36,
    height: BADGE * 2,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  texts: {
    alignItems: "center",
    gap: 6,
  },
  eyebrow: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 2,
    opacity: 1,
  },
  title: {
    fontSize: 38,
    lineHeight: 46,
  },
  benefits: {
    alignSelf: "stretch",
    borderRadius: TT.cardRadius,
    backgroundColor: TT.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tick: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GOLD_SOLID,
  },
  benefitText: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
  },
});
