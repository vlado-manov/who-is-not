// src/components/store/SuccessComponent.tsx
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  ImageSourcePropType,
  StyleSheet,
  Vibration,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import AppImage from "../AppImage";
import CamButton from "../cam/CamButton";
import CamText from "../cam/CamText";
import PurchaseFireworks from "./PurchaseFireworks";
import { TT } from "../../constants/tiktokTheme";
import { ICharacter } from "../../types/character";
import AudioManager from "../../utils/audioManager";

type Props = {
  visible: boolean;
  hero: ICharacter | null;
  onContinue: () => void;
};

const AVATAR = 176;
const BADGE = 44;
const BACKDROP_FADE_MS = 220;

const toSrc = (img: string | ImageSourcePropType): ImageSourcePropType =>
  typeof img === "string" ? { uri: img } : img;

/**
 * Purchase confirmation for a hero: fireworks, the hero's portrait springing in
 * with a pulsing halo and a tick, then the name and a Continue button.
 */
export default function SuccessComponent({ visible, hero, onContinue }: Props) {
  if (!visible || !hero) return null;
  return <HeroPurchaseFlow hero={hero} onContinue={onContinue} />;
}

function HeroPurchaseFlow({
  hero,
  onContinue,
}: {
  hero: ICharacter;
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AudioManager.playHeroBuy();
    Vibration.vibrate();
    const fade = Animated.timing(backdrop, {
      toValue: 1,
      duration: BACKDROP_FADE_MS,
      useNativeDriver: true,
    });
    fade.start();
    return () => fade.stop();
  }, [backdrop]);

  return (
    <Animated.View style={[styles.overlay, { opacity: backdrop }]}>
      <PurchaseFireworks />
      <HeroRevealCard
        hero={hero}
        eyebrow={t("store_purchase_success")}
        sub={t("store_hero_owned_sub")}
      >
        <CamButton title={t("continue_btn")} onPress={onContinue} />
      </HeroRevealCard>
    </Animated.View>
  );
}

/**
 * A newly unlocked hero: portrait springing in with a pulsing halo and a tick,
 * a small line above the name, a note under it, and the given buttons below.
 * Shared by the single-hero and the bundle confirmation.
 */
export function HeroRevealCard({
  hero,
  eyebrow,
  sub,
  children,
}: {
  hero: ICharacter;
  eyebrow: string;
  sub: string;
  /** Buttons shown at the bottom. */
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const avatar = useRef(new Animated.Value(0)).current;
  const badge = useRef(new Animated.Value(0)).current;
  const texts = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const intro = Animated.sequence([
      Animated.spring(avatar, {
        toValue: 1,
        speed: 9,
        bounciness: 12,
        useNativeDriver: true,
      }),
      Animated.spring(badge, {
        toValue: 1,
        speed: 16,
        bounciness: 14,
        useNativeDriver: true,
      }),
      Animated.timing(texts, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    const pulse = Animated.loop(
      Animated.timing(halo, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    intro.start();
    pulse.start();
    return () => {
      intro.stop();
      pulse.stop();
    };
  }, [avatar, badge, halo, texts]);

  const textStyle = {
    opacity: texts,
    transform: [
      {
        translateY: texts.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  };

  return (
    <View style={styles.fill}>
      <View style={styles.center}>
        <View style={styles.avatarWrap}>
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
                      outputRange: [1, 1.45],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.avatar,
              {
                opacity: avatar,
                transform: [
                  {
                    scale: avatar.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <AppImage
              source={toSrc(hero.profileImage || hero.main_image)}
              contentFit="cover"
              style={styles.avatarImage}
            />
          </Animated.View>
          <Animated.View style={[styles.badge, { transform: [{ scale: badge }] }]}>
            <Ionicons name="checkmark" size={26} color={TT.text} />
          </Animated.View>
        </View>

        <Animated.View style={[styles.texts, textStyle]}>
          <CamText variant="subtitle" center style={styles.eyebrow}>
            {eyebrow}
          </CamText>
          <CamText variant="question" center numberOfLines={1} adjustsFontSizeToFit>
            {hero.name}
          </CamText>
          <CamText variant="subtitle" center>
            {sub}
          </CamText>
        </Animated.View>
      </View>

      <Animated.View
        style={[styles.footer, { paddingBottom: insets.bottom + 16 }, textStyle]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.92)",
    zIndex: 9999,
    elevation: 9999,
  },
  fill: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 28,
  },
  avatarWrap: {
    width: AVATAR,
    height: AVATAR,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: TT.primary,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 3,
    borderColor: TT.text,
    backgroundColor: TT.onLight,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: TT.primary,
    borderWidth: 3,
    borderColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  texts: {
    alignItems: "center",
    gap: 6,
  },
  eyebrow: {
    fontSize: 13,
    lineHeight: 18,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  footer: {
    paddingHorizontal: 16,
    gap: 10,
  },
});
