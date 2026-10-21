// src/components/store/BundleSuccessComponent.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ImageSourcePropType,
  StyleSheet,
  Vibration,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import AppImage from "../AppImage";
import CamButton from "../cam/CamButton";
import CamText from "../cam/CamText";
import PurchaseFireworks from "./PurchaseFireworks";
import { HeroRevealCard } from "./SuccessComponent";
import { TT } from "../../constants/tiktokTheme";
import { CHEST_CLOSED_IMAGE, CHEST_OPEN_IMAGE } from "../../data/bundles";
import { IBundle } from "../../types/bundle";
import { ICharacter } from "../../types/character";
import AudioManager from "../../utils/audioManager";

type Props = {
  bundle: IBundle;
  /** Heroes this purchase unlocked, in the order they are revealed. */
  heroes: ICharacter[];
  onContinue: () => void;
};

type Stage = "chest" | "heroes" | "overview";

const TIMING = {
  chestDropMs: 420,
  chestWaitMs: 500,
  shakeStepMs: 70,
  shakeSteps: 8,
  openHoldMs: 350,
  flashInMs: 260,
  flashHoldMs: 140,
  flashOutMs: 420,
  overviewStaggerMs: 70,
} as const;

const MAIN_AVATAR = 132;
const SMALL_AVATAR = 64;

const toSrc = (img: string | ImageSourcePropType | { uri: string }): ImageSourcePropType =>
  typeof img === "string" ? { uri: img } : (img as ImageSourcePropType);

/**
 * Purchase confirmation for a bundle: the chest drops in, shakes and opens, a
 * burst of white light fills the screen, then the unlocked heroes are shown one
 * by one like a single-hero purchase. "Skip" jumps to an overview with the
 * first hero on top and everyone's portrait lined up underneath.
 */
export default function BundleSuccessComponent({
  bundle,
  heroes,
  onContinue,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // With no hero data to show, go from the chest straight to the overview.
  const afterChest: Stage = heroes.length > 0 ? "heroes" : "overview";
  const [stage, setStage] = useState<Stage>("chest");
  const [index, setIndex] = useState(0);
  const backdrop = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fade = Animated.timing(backdrop, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    });
    fade.start();
    return () => fade.stop();
  }, [backdrop]);

  /** White light covers the screen; the stage changes while it is fully white. */
  const flashTo = (next: Stage) => {
    Animated.timing(flash, {
      toValue: 1,
      duration: TIMING.flashInMs,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      AudioManager.playHeroBuy();
      Vibration.vibrate();
      setStage(next);
      Animated.timing(flash, {
        toValue: 0,
        duration: TIMING.flashOutMs,
        delay: TIMING.flashHoldMs,
        useNativeDriver: true,
      }).start();
    });
  };

  const hero = heroes[index];
  const isLast = index >= heroes.length - 1;

  return (
    <Animated.View style={[styles.overlay, { opacity: backdrop }]}>
      {stage === "chest" && <Chest onOpened={() => flashTo(afterChest)} />}

      {stage === "heroes" && hero && (
        <>
          {/* Keyed by hero so the fireworks and the card start over each time. */}
          <PurchaseFireworks key={`fireworks-${hero.id}`} />
          <HeroRevealCard
            key={hero.id}
            hero={hero}
            eyebrow={t("store_bundle_hero_of", {
              n: index + 1,
              total: heroes.length,
            })}
            sub={t("store_hero_owned_sub")}
          >
            <CamButton
              title={isLast ? t("continue_btn") : t("store_bundle_next")}
              onPress={() => (isLast ? onContinue() : setIndex(index + 1))}
            />
            {!isLast && (
              <CamButton
                title={t("htp_skip")}
                variant="secondary"
                onPress={() => setStage("overview")}
              />
            )}
          </HeroRevealCard>
        </>
      )}

      {stage === "overview" && (
        <View style={styles.fill}>
          <PurchaseFireworks />
          <View style={styles.overviewCenter}>
            {heroes[0] && (
              <View style={styles.mainAvatar}>
                <AppImage
                  source={toSrc(heroes[0].profileImage || heroes[0].main_image)}
                  contentFit="cover"
                  style={styles.avatarImage}
                />
              </View>
            )}
            <View style={styles.overviewTexts}>
              <CamText variant="subtitle" center style={styles.eyebrow}>
                {t("store_purchase_success")}
              </CamText>
              <CamText variant="question" center numberOfLines={2} adjustsFontSizeToFit>
                {bundle.title}
              </CamText>
              {heroes.length > 0 && (
                <CamText variant="subtitle" center>
                  {t("store_bundle_unlocked_count", { count: heroes.length })}
                </CamText>
              )}
            </View>
            <View style={styles.grid}>
              {heroes.map((h, i) => (
                <PoppingAvatar key={h.id} hero={h} order={i} />
              ))}
            </View>
          </View>
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <CamButton title={t("continue_btn")} onPress={onContinue} />
          </View>
        </View>
      )}

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.flash, { opacity: flash }]}
      />
    </Animated.View>
  );
}

/** The chest drops in, waits a beat, shakes harder and harder, then opens. */
function Chest({ onOpened }: { onOpened: () => void }) {
  const { width } = useWindowDimensions();
  const size = Math.min(width * 0.72, 320);
  const drop = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const grow = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const [open, setOpen] = useState(false);
  const onOpenedRef = useRef(onOpened);
  onOpenedRef.current = onOpened;

  useEffect(() => {
    AudioManager.playItemDrop();
    const shakeSteps = Array.from({ length: TIMING.shakeSteps }, (_, i) =>
      Animated.timing(shake, {
        // Alternates side to side, a little wider every time.
        toValue: (i % 2 === 0 ? 1 : -1) * (0.4 + (i / TIMING.shakeSteps) * 0.6),
        duration: TIMING.shakeStepMs,
        useNativeDriver: true,
      }),
    );
    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    const anim = Animated.sequence([
      Animated.spring(drop, {
        toValue: 1,
        speed: 10,
        bounciness: 12,
        useNativeDriver: true,
      }),
      Animated.delay(TIMING.chestWaitMs),
      Animated.parallel([
        Animated.sequence([
          ...shakeSteps,
          Animated.timing(shake, {
            toValue: 0,
            duration: TIMING.shakeStepMs,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(grow, {
          toValue: 1.14,
          duration: TIMING.shakeStepMs * (TIMING.shakeSteps + 1),
          useNativeDriver: true,
        }),
      ]),
    ]);
    anim.start(({ finished }) => {
      if (!finished) return;
      setOpen(true);
      Animated.timing(glow, {
        toValue: 1,
        duration: TIMING.openHoldMs,
        useNativeDriver: true,
      }).start();
      holdTimer = setTimeout(() => onOpenedRef.current(), TIMING.openHoldMs);
    });
    return () => {
      anim.stop();
      if (holdTimer) clearTimeout(holdTimer);
    };
  }, [drop, glow, grow, shake]);

  return (
    <View style={styles.chestCenter}>
      {/* Light building up behind the open chest, just before the flash. */}
      <Animated.View
        style={[
          styles.chestGlow,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: glow,
            transform: [
              {
                scale: glow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1.6],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={{
          opacity: drop,
          transform: [
            {
              translateY: drop.interpolate({
                inputRange: [0, 1],
                outputRange: [-220, 0],
              }),
            },
            {
              rotate: shake.interpolate({
                inputRange: [-1, 1],
                outputRange: ["-9deg", "9deg"],
              }),
            },
            { scale: grow },
          ],
        }}
      >
        <AppImage
          source={toSrc(open ? CHEST_OPEN_IMAGE : CHEST_CLOSED_IMAGE)}
          contentFit="contain"
          style={{ width: size, height: size * 0.75 }}
        />
      </Animated.View>
    </View>
  );
}

/** Small portrait in the overview; they pop in one after another. */
function PoppingAvatar({ hero, order }: { hero: ICharacter; order: number }) {
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.spring(pop, {
      toValue: 1,
      speed: 18,
      bounciness: 12,
      delay: 200 + order * TIMING.overviewStaggerMs,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [order, pop]);

  return (
    <Animated.View
      style={[styles.smallAvatar, { opacity: pop, transform: [{ scale: pop }] }]}
    >
      <AppImage
        source={toSrc(hero.profileImage || hero.main_image)}
        contentFit="cover"
        style={styles.avatarImage}
      />
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
  fill: {
    flex: 1,
  },
  flash: {
    backgroundColor: "#FFFFFF",
  },
  chestCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chestGlow: {
    position: "absolute",
    backgroundColor: "rgba(255,244,200,0.55)",
  },
  overviewCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 20,
  },
  overviewTexts: {
    alignItems: "center",
    gap: 6,
  },
  eyebrow: {
    fontSize: 13,
    lineHeight: 18,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  mainAvatar: {
    width: MAIN_AVATAR,
    height: MAIN_AVATAR,
    borderRadius: MAIN_AVATAR / 2,
    borderWidth: 3,
    borderColor: TT.text,
    backgroundColor: TT.onLight,
    overflow: "hidden",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  smallAvatar: {
    width: SMALL_AVATAR,
    height: SMALL_AVATAR,
    borderRadius: SMALL_AVATAR / 2,
    borderWidth: 2,
    borderColor: TT.primary,
    backgroundColor: TT.onLight,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  footer: {
    paddingHorizontal: 16,
  },
});
