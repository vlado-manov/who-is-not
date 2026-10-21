// src/components/PreRevealLoadingLayer.tsx
// Full-screen splash before the reveal: the suspense picture, a button, and a
// slot-machine reel of the players that spins and stops on the impostor.

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Easing,
  useWindowDimensions,
  type ImageSourcePropType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { backgrounds } from "../../assets/backgrounds";
import AppImage from "./AppImage";
import CustomButton from "./common/CustomButton";
import CustomText from "./common/CustomText";
import { prefetchExpoImageUri } from "../utils/prefetchExpoImage";
import AudioManager from "../utils/audioManager";

/** Most phones / tablets: standard composition */
const PRE_REVEAL_BG_DEFAULT =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/1610859b-0622-44bb-b82d-e022668a6c08-IMG_4089.webp";
/** Taller / large format (e.g. 1320×2868 class) */
const PRE_REVEAL_BG_TALL =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/d54269d6-7963-4249-a9e0-56d64daa6ec6-IMG_4090.webp";
/** Tablet (width >= 768) */
const PRE_REVEAL_BG_TABLET =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/6fb679b7-e1c8-482e-a1d0-3a3624b430e0-tabletLoadingReveal.webp";

/** Reel: size of one player tile and how the spin runs. */
const REEL_ITEM = 128;
const REEL_AVATAR = 84;
/** Thickness of the gold cabinet around the window. */
const REEL_FRAME = 10;
/**
 * The reel always travels exactly this many players before it stops, whoever
 * is playing. Each ending's sound file has one drop per player at the matching
 * moments — change this or anything in `REEL_ENDINGS` and the files must be
 * rebuilt with `python3 scripts/make-reel-spin.py`.
 */
const REEL_TILES = 30;
/** Extra tiles above the start and below the stop, so the strip never ends in view. */
const REEL_LEAD_TILES = 1;
const REEL_TAIL_TILES = 3;

/** The reel brakes for a long time and creeps over the last tiles. */
const EASING_BRAKE = Easing.bezier(0.3, 0, 0.06, 1);
/** The reel is still at full speed when it stops. */
const EASING_FULL_SPEED = Easing.bezier(0.3, 0, 1, 1);

export type ReelEnding = "overshoot" | "short" | "snap";

/**
 * The three ways a spin can end, so the players cannot tell what is coming:
 *  - `overshoot`: brakes, slides half a tile PAST the result, hangs, comes back;
 *  - `short`: brakes, stops half a tile BEFORE the result as if it had landed
 *    on the player before, hangs, then hops forward onto the result;
 *  - `snap`: no braking at all — stops dead on the result at full speed.
 * `offset` is where the spin ends relative to the result, in tiles.
 */
const REEL_ENDINGS: Record<
  ReelEnding,
  {
    easing: (t: number) => number;
    spinMs: number;
    offset: number;
    holdMs: number;
    settleMs: number;
  }
> = {
  overshoot: {
    easing: EASING_BRAKE,
    spinMs: 4200,
    offset: 0.5,
    holdMs: 200,
    settleMs: 380,
  },
  short: {
    easing: EASING_BRAKE,
    spinMs: 4200,
    offset: -0.5,
    holdMs: 200,
    settleMs: 380,
  },
  snap: {
    easing: EASING_FULL_SPEED,
    spinMs: 2600,
    offset: 0,
    holdMs: 0,
    settleMs: 0,
  },
};
export const REEL_ENDING_NAMES = Object.keys(REEL_ENDINGS) as ReelEnding[];

/** The reel rests on the result this long before the next screen. */
const REEL_HOLD_MS = 700;
/** Online there is no button: the reel starts by itself after this. */
const AUTO_START_MS = 900;
/** Lights along the top and bottom of the cabinet. */
const REEL_BULBS = 7;
const GOLD = ["#FFE27A", "#F5B301", "#B87400"] as const;

function usePreRevealBackgroundUri(): string {
  const { width, height } = useWindowDimensions();
  const w = Math.min(width, height);
  const h = Math.max(width, height);
  const isPortrait = height >= width;
  if (width >= 768 && width > height) {
    return PRE_REVEAL_BG_TABLET;
  }
  if (isPortrait && h / Math.max(1, w) >= 2) {
    return PRE_REVEAL_BG_TALL;
  }
  return PRE_REVEAL_BG_DEFAULT;
}

type ReelTilesProps = { tiles: PreRevealPlayer[]; width: number };

/**
 * The tiles of the strip. Memoised: the screen re-renders when the spin
 * starts and stops, and redrawing thirty pictures then made the start stutter.
 */
const ReelTiles = memo(function ReelTiles({ tiles, width }: ReelTilesProps) {
  return (
    <>
      {tiles.map((player, i) => (
        <View key={i} style={[styles.reelItem, { width }]}>
          <View style={styles.reelAvatar}>
            {player.image ? (
              <AppImage
                source={player.image}
                contentFit="cover"
                contentPosition="top"
                style={StyleSheet.absoluteFill}
              />
            ) : null}
          </View>
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1}
            style={[styles.reelName, { width: width - 24 }]}
          >
            {player.name}
          </Text>
        </View>
      ))}
    </>
  );
});

export type PreRevealPlayer = {
  id: string;
  name: string;
  image: ImageSourcePropType | null;
};

type Props = {
  /** Everyone on the reel. */
  players: PreRevealPlayer[];
  /** The player the reel stops on (the impostor). */
  targetId: string | null;
  /**
   * Pass & play: a button starts the spin. Online every phone is on this
   * screen at once, so the spin starts by itself to keep them together.
   */
  autoStart: boolean;
  /** How this spin ends (see `REEL_ENDINGS`). */
  ending: ReelEnding;
  onDone: () => void;
};

type Phase = "idle" | "spinning" | "landed";

export default function PreRevealLoadingLayer({
  players,
  targetId,
  autoStart,
  ending,
  onDone,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: windowW } = useWindowDimensions();
  const bgUri = usePreRevealBackgroundUri();
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const rootOpacity = useRef(new Animated.Value(0)).current;
  const bgScale = useRef(new Animated.Value(1.1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(34)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const reelOpacity = useRef(new Animated.Value(0)).current;
  const reelY = useRef(new Animated.Value(0)).current;
  const landedPulse = useRef(new Animated.Value(0)).current;
  const bulbs = useRef(new Animated.Value(0)).current;
  const [bgReady, setBgReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  /**
   * The strip that scrolls through the window: the players repeated until it
   * is long enough, ending so that the target is the tile that stops in the
   * middle (one more tile after it fills the bottom of the window).
   */
  const strip = useMemo(() => {
    if (players.length === 0) return { tiles: [], stopIndex: 0 };
    const n = players.length;
    const targetAt = Math.max(
      0,
      players.findIndex((p) => p.id === targetId),
    );
    // The window must never show the end of the strip: one extra tile above
    // the start and a few below the stop (the reel runs past it). The strip
    // starts on whichever player makes tile number `REEL_TILES` the target,
    // and keeps the players' order, so it reads as an endless loop.
    const stopIndex = REEL_TILES;
    const first = targetAt - stopIndex;
    const tiles: PreRevealPlayer[] = [];
    for (let i = -REEL_LEAD_TILES; i <= stopIndex + REEL_TAIL_TILES; i++) {
      tiles.push(players[(((first + i) % n) + n) % n]);
    }
    return { tiles, stopIndex };
  }, [players, targetId]);

  useEffect(() => {
    let active = true;
    void prefetchExpoImageUri(bgUri)
      .catch(() => false)
      .then(() => {
        if (active) setBgReady(true);
      });
    return () => {
      active = false;
    };
  }, [bgUri]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      AudioManager.stopReelSpin();
    },
    [],
  );

  const finish = useCallback(() => {
    Animated.sequence([
      Animated.timing(flashOpacity, {
        toValue: 0.85,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rootOpacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bgScale, {
          toValue: 1.04,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) onDoneRef.current();
    });
  }, [bgScale, flashOpacity, rootOpacity]);

  const spin = useCallback(() => {
    if (phase !== "idle") return;
    // No impostor to land on (or nobody to show): go straight on rather than
    // stop the reel on someone at random.
    if (strip.tiles.length === 0 || !players.some((p) => p.id === targetId)) {
      finish();
      return;
    }
    setPhase("spinning");
    // The first tile starts in the middle of the three-tile window.
    const distance = strip.stopIndex * REEL_ITEM;
    reelY.setValue(0);
    Animated.timing(reelOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    const end = REEL_ENDINGS[ending];
    Animated.sequence([
      Animated.timing(reelY, {
        toValue: -(distance + REEL_ITEM * end.offset),
        duration: end.spinMs,
        easing: end.easing,
        useNativeDriver: true,
      }),
      // Past or short of the result: hang there, then move onto it. (A snap
      // ending is already on it — both of these take no time.)
      Animated.delay(end.holdMs),
      Animated.timing(reelY, {
        toValue: -distance,
        duration: end.settleMs,
        easing: Easing.out(Easing.back(1.6)),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      setPhase("landed");
      // The reel has settled on the result.
      AudioManager.playImposterNotLosingLiveSound();
      Animated.sequence([
        Animated.timing(landedPulse, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(landedPulse, {
          toValue: 0.5,
          speed: 10,
          bounciness: 14,
          useNativeDriver: true,
        }),
      ]).start();
      timers.current.push(setTimeout(finish, REEL_HOLD_MS));
    });
    // One sound for the whole spin, with a drop as each player passes.
    AudioManager.playReelSpin(ending);
    // The cabinet lights chase while it spins.
    Animated.loop(
      Animated.sequence([
        Animated.timing(bulbs, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(bulbs, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [
    bulbs,
    ending,
    finish,
    landedPulse,
    phase,
    players,
    reelOpacity,
    reelY,
    strip,
    targetId,
  ]);

  // Entrance, and the automatic start online.
  useEffect(() => {
    if (!bgReady) return;
    // The quiet bed plays for the whole screen.
    void AudioManager.playPreRevealBg();
    // Loaded now, so the spin's sound starts with the reel, not after it.
    AudioManager.prepareReelSpin();
    Animated.parallel([
      Animated.timing(rootOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(bgScale, {
        toValue: 1,
        duration: 2800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(contentTranslateY, {
        toValue: 0,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 340,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgReady]);

  const spinRef = useRef(spin);
  spinRef.current = spin;
  useEffect(() => {
    if (!bgReady || !autoStart) return;
    const timer = setTimeout(() => spinRef.current(), AUTO_START_MS);
    return () => clearTimeout(timer);
  }, [autoStart, bgReady]);

  if (!bgReady) {
    return <View style={[styles.root, { backgroundColor: "#000" }]} />;
  }

  const reelWidth = Math.min(windowW - 72, 280);

  return (
    <Animated.View
      style={[styles.root, { opacity: rootOpacity }]}
      pointerEvents="auto"
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ scale: bgScale }] }]}
      >
        <Image
          source={bgUri}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
          cachePolicy="memory-disk"
          transition={200}
          priority="high"
        />
      </Animated.View>
      <View style={styles.vignette} pointerEvents="none" />

      {/* The reel: a gold cabinet around a three-tile window; the middle
          tile, between the two pointers, is the result. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.reelArea, { opacity: reelOpacity }]}
      >
        <Animated.View
          style={{
            transform: [
              {
                scale: landedPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.07],
                }),
              },
            ],
          }}
        >
          <LinearGradient
            colors={GOLD}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.cabinet, { width: reelWidth + REEL_FRAME * 2 }]}
          >
            {/* Lights along the top edge. */}
            <View style={styles.bulbRow}>
              {Array.from({ length: REEL_BULBS }, (_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.bulb,
                    {
                      // Neighbouring bulbs light up in turn.
                      opacity: bulbs.interpolate({
                        inputRange: [0, 1],
                        outputRange: i % 2 === 0 ? [1, 0.25] : [0.25, 1],
                      }),
                    },
                  ]}
                />
              ))}
            </View>

            <View style={[styles.reelWindow, { width: reelWidth }]}>
              <Animated.View
                style={{
                  width: reelWidth,
                  // Starts with the first player in the middle row and the
                  // lead tile in the row above it.
                  marginTop: REEL_ITEM * (1 - REEL_LEAD_TILES),
                  transform: [{ translateY: reelY }],
                }}
              >
                <ReelTiles tiles={strip.tiles} width={reelWidth} />
              </Animated.View>

              {/* Curved-drum shading: dark at the top and bottom edges. */}
              <LinearGradient
                colors={["rgba(0,0,0,0.92)", "rgba(0,0,0,0)"]}
                style={[styles.reelShade, styles.reelShadeTop]}
              />
              <LinearGradient
                colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.92)"]}
                style={[styles.reelShade, styles.reelShadeBottom]}
              />
              {/* Payline: the row that counts. */}
              <View
                style={[
                  styles.payline,
                  phase === "landed" && styles.paylineLanded,
                ]}
              />
            </View>

            {/* Lights along the bottom edge. */}
            <View style={styles.bulbRow}>
              {Array.from({ length: REEL_BULBS }, (_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.bulb,
                    {
                      // Neighbouring bulbs light up in turn.
                      opacity: bulbs.interpolate({
                        inputRange: [0, 1],
                        outputRange: i % 2 === 0 ? [1, 0.25] : [0.25, 1],
                      }),
                    },
                  ]}
                />
              ))}
            </View>

            {/* Pointers on both sides of the payline. */}
            <View style={[styles.pointer, styles.pointerLeft]} />
            <View style={[styles.pointer, styles.pointerRight]} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={[
          styles.bottomBlock,
          {
            paddingBottom: Math.max(insets.bottom, 20) + 8,
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.textBlock}>
          <CustomText
            variant="h5-headline"
            className="text-center"
            textColor="#fff8ec"
            shadow
            allowWrap
          >
            {t("pre_reveal_title")}
          </CustomText>
          <CustomText
            variant="p-small"
            className="mt-2 px-1 text-center"
            textColor="rgba(255,247,236,0.92)"
            allowWrap
          >
            {phase === "idle" && !autoStart
              ? t("pre_reveal_press")
              : t("pre_reveal_spinning")}
          </CustomText>
        </View>
        {phase === "idle" && !autoStart ? (
          <CustomButton
            title={t("pre_reveal_btn")}
            fullWidth
            btnSize="md"
            fontSize="md"
            backgroundImage={backgrounds.bg026}
            glow
            glowColor="rgba(41,255,25,0.8)"
            shadowColor="#005f07"
            onPress={spin}
          />
        ) : null}
      </Animated.View>
      <Animated.View
        style={[styles.flash, { opacity: flashOpacity }]}
        pointerEvents="none"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  flash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#fff4cf",
  },
  reelArea: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  cabinet: {
    borderRadius: 30,
    paddingHorizontal: REEL_FRAME,
    alignItems: "center",
    boxShadow: "0px 0px 34px rgba(255,190,40,0.55)",
  },
  bulbRow: {
    height: 22,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  bulb: {
    width: 9,
    height: 9,
    borderRadius: 5,
    // No glow: fourteen blinking shadows were redrawn on every blink.
    backgroundColor: "#FFFDF0",
  },
  // No border here: a border would shift the tiles off the payline.
  reelWindow: {
    height: REEL_ITEM * 3,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#140A18",
  },
  reelItem: {
    height: REEL_ITEM,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  reelAvatar: {
    width: REEL_AVATAR,
    height: REEL_AVATAR,
    borderRadius: REEL_AVATAR / 2,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 3,
    borderColor: "#FFE27A",
  },
  reelName: {
    color: "#FFF8EC",
    fontFamily: "Onest-ExtraBold",
    fontSize: 19,
    lineHeight: 24,
    textAlign: "center",
  },
  reelShade: {
    position: "absolute",
    left: 0,
    right: 0,
    height: REEL_ITEM,
  },
  reelShadeTop: { top: 0 },
  reelShadeBottom: { bottom: 0 },
  payline: {
    position: "absolute",
    left: 0,
    right: 0,
    top: REEL_ITEM,
    height: REEL_ITEM,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: "rgba(255,226,122,0.9)",
    backgroundColor: "rgba(255,226,122,0.06)",
  },
  paylineLanded: {
    borderColor: "#FF4D4D",
    backgroundColor: "rgba(255,77,77,0.22)",
  },
  // Triangles pointing at the payline from the cabinet's sides.
  pointer: {
    position: "absolute",
    top: 22 + REEL_ITEM * 1.5 - 12,
    width: 0,
    height: 0,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  pointerLeft: {
    left: 0,
    borderLeftWidth: 16,
    borderLeftColor: "#FF4D4D",
  },
  pointerRight: {
    right: 0,
    borderRightWidth: 16,
    borderRightColor: "#FF4D4D",
  },
  bottomBlock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  textBlock: {
    marginBottom: 16,
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
});
