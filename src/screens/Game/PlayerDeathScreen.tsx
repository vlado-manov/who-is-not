import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  View,
  Dimensions,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CommonActions,
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";

import { GameMode } from "../../api/analytics";
import { sendMultiplayerRelay } from "../../api/multiplayerRelay";
import { GameStackParamList } from "../../navigation/types";
import { useGameStore } from "../../store/useGameStore";
import { useHeroesStore } from "../../store/useHeroesStore";
import { usePreventBack } from "../../hooks/usePreventBack";
import AppImage from "../../components/AppImage";
import FullBleedStack from "../../components/FullBleedStack";
import ImageBackgroundWithLoadGate from "../../components/ImageBackgroundWithLoadGate";
import DeathAmbienceOverlay from "../../components/game/DeathAmbienceOverlay";
import GameEventFeed from "../../components/game/GameEventFeed";
import GamePhaseAutoReady from "../../components/game/GamePhaseAutoReady";
import CustomText from "../../components/common/CustomText";
import { useGameEventFeed } from "../../hooks/useGameEventFeed";
import { game_images } from "../../../assets/images";
import {
  DEATH_BG_URI,
  DEATH_HEART_BROKEN_URI,
  DEATH_HEART_FULL_URI,
  DEV_LAB_DEATH_HERO_GHOST_URI,
  YOU_GOT_COOKED_TITLE_URI,
} from "../../constants/deathScreen";
import { PLAYER_LEFT_GAME_MESSAGE_TYPE } from "../../constants/onlineLobby";
import AudioManager from "../../utils/audioManager";
import { HERO_PICKER_TITLE_TO_HERO_GAP } from "../HeroPicker/constants/heroPicker.constants";

type Nav = StackNavigationProp<GameStackParamList, "PlayerDeath">;
type R = RouteProp<GameStackParamList, "PlayerDeath">;

const { width: SCREEN_W } = Dimensions.get("window");
const HEART_COUNT = 3;
const HEARTS_ROW_HEIGHT = 68;
const HEARTS_START_AFTER_TITLE_MS = 750;
const HEARTS_CENTER_SCALE = 1.45;
const HEARTS_INTRO_FADE_MS = 320;
const HEARTS_MOVE_TO_SLOT_MS = 480;
const BG_BLUR_IN_MS = 420;
const BG_BLUR_OUT_MS = 480;
const HEART_BREAK_FIRST_MS = 400;
const HEART_BREAK_STAGGER_MS = 650;
const HEART_BREAK_SCALE_UP_MS = 240;
const HEART_BREAK_SCALE_DOWN_MS = 320;
const HEART_SHAKE_MS = 65;
const HEARTS_BREAK_SEQUENCE_MS =
  HEART_BREAK_FIRST_MS +
  (HEART_COUNT - 1) * HEART_BREAK_STAGGER_MS +
  HEART_BREAK_SCALE_UP_MS +
  HEART_BREAK_SCALE_DOWN_MS +
  HEART_SHAKE_MS * 3;
const HERO_VISUAL_SCALE = 1.422;
const TITLE_FLY_START_SCALE = 5;
const TITLE_LAND_MS = 360;
const TITLE_LAND_SOUND_LEAD_MS = 500;

function runTitleShake(shake: Animated.Value) {
  return Animated.sequence([
    Animated.timing(shake, {
      toValue: 1,
      duration: 60,
      useNativeDriver: true,
    }),
    Animated.timing(shake, {
      toValue: -1,
      duration: 60,
      useNativeDriver: true,
    }),
    Animated.timing(shake, {
      toValue: 1,
      duration: 60,
      useNativeDriver: true,
    }),
    Animated.timing(shake, {
      toValue: 0,
      duration: 60,
      useNativeDriver: true,
    }),
  ]);
}

function startAnim(a: Animated.CompositeAnimation) {
  return new Promise<void>((resolve) => a.start(() => resolve()));
}

function DeathHeartSlot({
  breakAtMs,
  active,
  onBreak,
  forceBroken = false,
}: {
  breakAtMs: number;
  active: boolean;
  onBreak?: () => void;
  forceBroken?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const onBreakRef = useRef(onBreak);
  const hasBrokenRef = useRef(false);
  const [broken, setBroken] = useState(forceBroken);

  onBreakRef.current = onBreak;

  useEffect(() => {
    if (forceBroken) return;
    if (!active) {
      hasBrokenRef.current = false;
      setBroken(false);
      scale.setValue(1);
      shake.setValue(0);
      return;
    }
    if (hasBrokenRef.current) return;
    const timer = setTimeout(() => {
      if (hasBrokenRef.current) return;
      hasBrokenRef.current = true;
      onBreakRef.current?.();
      setBroken(true);
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.28,
          duration: HEART_BREAK_SCALE_UP_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: HEART_BREAK_SCALE_DOWN_MS,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(shake, {
              toValue: 1,
              duration: HEART_SHAKE_MS,
              useNativeDriver: true,
            }),
            Animated.timing(shake, {
              toValue: -1,
              duration: HEART_SHAKE_MS,
              useNativeDriver: true,
            }),
            Animated.timing(shake, {
              toValue: 0,
              duration: HEART_SHAKE_MS,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    }, breakAtMs);
    return () => clearTimeout(timer);
  }, [active, breakAtMs, forceBroken, scale, shake]);

  const isBroken = forceBroken || broken;

  return (
    <Animated.View
      style={{
        transform: [
          { scale },
          {
            translateX: shake.interpolate({
              inputRange: [-1, 1],
              outputRange: [-4, 4],
            }),
          },
        ],
      }}
    >
      <AppImage
        source={{ uri: isBroken ? DEATH_HEART_BROKEN_URI : DEATH_HEART_FULL_URI }}
        style={styles.heartIcon}
        contentFit="contain"
      />
    </Animated.View>
  );
}

function DeathActionButton({
  label,
  icon,
  variant,
  onPress,
  delayMs,
  compact,
}: {
  label: string;
  icon: ImageSourcePropType;
  variant: "primary" | "ghost";
  onPress: () => void;
  delayMs: number;
  compact: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const iconBob = useRef(new Animated.Value(0)).current;
  const iconTilt = useRef(new Animated.Value(0)).current;
  const iconLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const enterTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, delayMs);

    iconLoopRef.current = Animated.loop(
      Animated.sequence([
        variant === "primary"
          ? Animated.parallel([
              Animated.timing(iconBob, {
                toValue: 1,
                duration: 680,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(iconTilt, {
                toValue: 1,
                duration: 680,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ])
          : Animated.timing(iconTilt, {
              toValue: 1,
              duration: 900,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
        variant === "primary"
          ? Animated.parallel([
              Animated.timing(iconBob, {
                toValue: 0,
                duration: 680,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(iconTilt, {
                toValue: 0,
                duration: 680,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ])
          : Animated.timing(iconTilt, {
              toValue: 0,
              duration: 900,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
      ]),
    );
    iconLoopRef.current.start();

    return () => {
      clearTimeout(enterTimer);
      iconLoopRef.current?.stop();
    };
  }, [delayMs, iconBob, iconTilt, opacity, translateY, variant]);

  const iconTransform =
    variant === "primary"
      ? [
          {
            translateY: iconBob.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -5],
            }),
          },
          {
            rotate: iconTilt.interpolate({
              inputRange: [0, 1],
              outputRange: ["-6deg", "6deg"],
            }),
          },
        ]
      : [
          {
            translateX: iconTilt.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 4],
            }),
          },
          {
            rotate: iconTilt.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", "-8deg"],
            }),
          },
        ];

  return (
    <Animated.View
      style={[
        compact ? styles.actionCellRow : styles.actionCellStack,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <Pressable
        onPress={() => {
          AudioManager.playButtonClick();
          onPress();
        }}
        style={({ pressed }) => [
          styles.actionPressable,
          pressed && styles.actionPressablePressed,
        ]}
      >
        {variant === "primary" ? (
          <LinearGradient
            colors={["#3ddc84", "#16a34a", "#15803d"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.actionPrimary,
              compact && styles.actionPrimaryCompact,
            ]}
          >
            <Animated.View style={{ transform: iconTransform }}>
              <AppImage
                source={icon}
                style={styles.actionIconImage}
                contentFit="contain"
              />
            </Animated.View>
            <CustomText
              variant="p"
              style={[
                styles.actionPrimaryText,
                compact && styles.actionTextCompact,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {label}
            </CustomText>
          </LinearGradient>
        ) : (
          <View
            style={[styles.actionGhost, compact && styles.actionGhostCompact]}
          >
            <Animated.View style={{ transform: iconTransform }}>
              <AppImage
                source={icon}
                style={styles.actionIconImageGhost}
                contentFit="contain"
              />
            </Animated.View>
            <CustomText
              variant="p"
              style={[
                styles.actionGhostText,
                compact && styles.actionTextCompact,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {label}
            </CustomText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function PlayerDeathScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { variant, deadPlayerId } = route.params;
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  usePreventBack();

  const mode = useGameStore((s) => s.mode) as GameMode;
  const gameId = useGameStore((s) => s.gameId);
  const players = useGameStore((s) => s.players);
  const heroes = useHeroesStore((s) => s.heroes);

  const feedActive = variant === "continue" && showActionButtons;
  const feedEvents = useGameEventFeed(feedActive);

  const titleFlyScale = useRef(new Animated.Value(TITLE_FLY_START_SCALE)).current;
  const titleFlyY = useRef(new Animated.Value(0)).current;
  const titleShake = useRef(new Animated.Value(0)).current;
  const titleStaticOpacity = useRef(new Animated.Value(0)).current;

  const heroOpacity = useRef(new Animated.Value(0)).current;

  const heartsFlyY = useRef(new Animated.Value(0)).current;
  const heartsFlyScale = useRef(new Animated.Value(HEARTS_CENTER_SCALE)).current;
  const heartsFlyOpacity = useRef(new Animated.Value(0)).current;
  const heartsStaticOpacity = useRef(new Animated.Value(0)).current;
  const bgBlurOpacity = useRef(new Animated.Value(0)).current;
  const heartsFinalYRef = useRef(0);
  const heartsSlotRef = useRef<View>(null);

  const [showFlyingTitle, setShowFlyingTitle] = useState(true);
  const [showFlyingHearts, setShowFlyingHearts] = useState(false);
  const [heartsActive, setHeartsActive] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(false);

  const deadPlayer = useMemo(
    () => players.find((p) => p.id === deadPlayerId),
    [players, deadPlayerId],
  );

  const hero = useMemo(
    () =>
      deadPlayer?.characterId
        ? heroes.find((h) => h.id === deadPlayer.characterId)
        : undefined,
    [deadPlayer?.characterId, heroes],
  );

  const loseImage: ImageSourcePropType | null = useMemo(() => {
    if (gameId?.startsWith("dev_")) {
      return { uri: DEV_LAB_DEATH_HERO_GHOST_URI };
    }
    if (!hero) return null;
    const byVar = hero.loseImagesByVariant?.NORMAL;
    const pool = byVar && byVar.length > 0 ? byVar : (hero.loseImages ?? []);
    if (pool.length > 0) return pool[0] as ImageSourcePropType;
    return (hero.main_image ?? hero.profileImage) as ImageSourcePropType;
  }, [gameId, hero]);

  const titleHeight = Math.min(400, Math.round(windowWidth * 0.74));
  const titleTop = insets.top + Math.max(0, Math.round(windowHeight * 0.004) - 14);
  const titleFinalTranslateY =
    titleTop + titleHeight / 2 - windowHeight / 2;
  const heroTitleGap = Math.max(
    0,
    Math.round(windowHeight * HERO_PICKER_TITLE_TO_HERO_GAP) - 22,
  );


  const measureHeartsSlot = () => {
    heartsSlotRef.current?.measureInWindow((_x, y, _w, h) => {
      heartsFinalYRef.current = y + h / 2 - windowHeight / 2;
    });
  };

  const measureHeartsFinalY = () =>
    new Promise<number>((resolve) => {
      if (!heartsSlotRef.current) {
        resolve(heartsFinalYRef.current);
        return;
      }
      heartsSlotRef.current.measureInWindow((_x, y, _w, h) => {
        const finalY = y + h / 2 - windowHeight / 2;
        heartsFinalYRef.current = finalY;
        resolve(finalY);
      });
    });

  useEffect(() => {
    let cancelled = false;
    let titleSoundTimer: ReturnType<typeof setTimeout> | undefined;

    const run = async () => {
      setShowFlyingTitle(true);
      setShowFlyingHearts(false);
      setHeartsActive(false);
      setShowActionButtons(false);

      titleFlyScale.setValue(TITLE_FLY_START_SCALE);
      titleFlyY.setValue(0);
      titleShake.setValue(0);
      titleStaticOpacity.setValue(0);
      heroOpacity.setValue(0);
      heartsFlyY.setValue(0);
      heartsFlyScale.setValue(HEARTS_CENTER_SCALE);
      heartsFlyOpacity.setValue(0);
      heartsStaticOpacity.setValue(0);
      bgBlurOpacity.setValue(0);

      const titleSoundAtMs = Math.max(
        0,
        80 + TITLE_LAND_MS - TITLE_LAND_SOUND_LEAD_MS,
      );
      titleSoundTimer = setTimeout(() => {
        if (cancelled) return;
        AudioManager.playRevealTitleSplash();
        AudioManager.playImposterLossSound();
      }, titleSoundAtMs);

      await startAnim(Animated.delay(80));
      if (cancelled) return;

      await startAnim(
        Animated.parallel([
          Animated.timing(titleFlyScale, {
            toValue: 1,
            duration: TITLE_LAND_MS,
            easing: Easing.out(Easing.back(2.4)),
            useNativeDriver: true,
          }),
          Animated.timing(titleFlyY, {
            toValue: titleFinalTranslateY,
            duration: TITLE_LAND_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      );
      if (cancelled) return;

      setShowFlyingTitle(false);
      titleStaticOpacity.setValue(1);

      runTitleShake(titleShake).start();

      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      await startAnim(Animated.delay(HEARTS_START_AFTER_TITLE_MS));
      if (cancelled) return;

      measureHeartsSlot();
      setShowFlyingHearts(true);
      setHeartsActive(true);

      await startAnim(
        Animated.parallel([
          Animated.timing(heartsFlyOpacity, {
            toValue: 1,
            duration: HEARTS_INTRO_FADE_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(bgBlurOpacity, {
            toValue: 1,
            duration: BG_BLUR_IN_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      );
      if (cancelled) return;

      await startAnim(Animated.delay(HEARTS_BREAK_SEQUENCE_MS));
      if (cancelled) return;

      const heartsFinalY = await measureHeartsFinalY();
      if (cancelled) return;

      AudioManager.playAnswerPop();

      await startAnim(
        Animated.parallel([
          Animated.timing(heartsFlyY, {
            toValue: heartsFinalY,
            duration: HEARTS_MOVE_TO_SLOT_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(heartsFlyScale, {
            toValue: 1,
            duration: HEARTS_MOVE_TO_SLOT_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(Math.max(0, HEARTS_MOVE_TO_SLOT_MS - BG_BLUR_OUT_MS)),
            Animated.timing(bgBlurOpacity, {
              toValue: 0,
              duration: BG_BLUR_OUT_MS,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
      if (cancelled) return;

      setShowFlyingHearts(false);
      heartsStaticOpacity.setValue(1);
      setHeartsActive(false);

      await startAnim(Animated.delay(120));
      if (cancelled) return;

      if (variant === "gameOver") return;

      setShowActionButtons(true);
    };

    void run();
    return () => {
      cancelled = true;
      if (titleSoundTimer) clearTimeout(titleSoundTimer);
    };
  }, [
    bgBlurOpacity,
    heartsFlyOpacity,
    heartsFlyScale,
    heartsFlyY,
    heartsStaticOpacity,
    heroOpacity,
    titleFinalTranslateY,
    titleFlyScale,
    titleFlyY,
    titleShake,
    titleStaticOpacity,
    variant,
    windowHeight,
  ]);

  const handleQuit = () => {
    if (mode === "ONLINE") {
      sendMultiplayerRelay({ type: PLAYER_LEFT_GAME_MESSAGE_TYPE });
    }
    useGameStore.getState().reset();
    const parent = navigation.getParent();
    parent?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Onboarding", params: { screen: "Menu" } }],
      }),
    );
  };

  const showContinueOptions = variant === "continue" && showActionButtons;
  const titleShakeX = titleShake.interpolate({
    inputRange: [-1, 1],
    outputRange: [-10, 10],
  });

  return (
    <SafeAreaView style={styles.safe} edges={["right", "left"]}>
      <FullBleedStack
        rootStyle={styles.root}
        backdrop={
          <ImageBackgroundWithLoadGate
            source={{ uri: DEATH_BG_URI }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            showChildrenWhileLoading
            underlayColor="#120818"
          >
            <LinearGradient
              colors={[
                "rgba(8,2,16,0.12)",
                "rgba(8,2,16,0.45)",
                "rgba(4,0,10,0.78)",
              ]}
              style={StyleSheet.absoluteFill}
            />
            <DeathAmbienceOverlay />
          </ImageBackgroundWithLoadGate>
        }
      >
        <View style={[styles.content, { paddingBottom: insets.bottom + 8 }]}>
          <View style={[styles.titleArea, { marginTop: titleTop, height: titleHeight }]}>
            <Animated.View
              style={[
                styles.titleStaticWrap,
                {
                  opacity: titleStaticOpacity,
                  transform: [{ translateX: titleShakeX }],
                },
              ]}
              pointerEvents="none"
            >
              <AppImage
                source={{ uri: YOU_GOT_COOKED_TITLE_URI }}
                style={[styles.titleImg, { height: titleHeight }]}
                contentFit="contain"
                accessibilityLabel={t("player_death_title")}
              />
            </Animated.View>
          </View>

          <View style={[styles.heroZone, { marginTop: heroTitleGap }]}>
            {loseImage && (
              <Animated.View
                style={[
                  styles.heroImageWrap,
                  {
                    opacity: heroOpacity,
                    transform: [{ scale: HERO_VISUAL_SCALE }],
                  },
                ]}
              >
                <AppImage
                  source={loseImage}
                  style={styles.heroImage}
                  contentFit="contain"
                />
              </Animated.View>
            )}
          </View>

          <View
            ref={heartsSlotRef}
            style={styles.heartsSlot}
            onLayout={measureHeartsSlot}
          >
            <Animated.View
              style={[styles.heartsRow, { opacity: heartsStaticOpacity }]}
            >
              {Array.from({ length: HEART_COUNT }).map((_, i) => (
                <DeathHeartSlot
                  key={`heart-static-${i}`}
                  breakAtMs={0}
                  active={false}
                  forceBroken
                />
              ))}
            </Animated.View>
          </View>

          {variant === "continue" && (
            <View
              style={[
                styles.opts,
                { minHeight: 72 },
              ]}
            >
              {showContinueOptions && (
                <DeathActionButton
                  label={t("player_death_quit_lobby")}
                  icon={game_images.leaveGameIcon}
                  variant="primary"
                  onPress={handleQuit}
                  delayMs={0}
                  compact
                />
              )}
            </View>
          )}
        </View>

        <Animated.View
          pointerEvents="none"
          style={[styles.bgBlurOverlay, { opacity: bgBlurOpacity }]}
        >
          {Platform.OS === "web" ? (
            <View style={styles.bgBlurWebFallback} />
          ) : (
            <>
              <BlurView intensity={52} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.bgBlurTint} />
            </>
          )}
        </Animated.View>

        {showFlyingHearts && (
          <Animated.View style={styles.heartsFlyOverlay} pointerEvents="none">
            <Animated.View
              style={{
                opacity: heartsFlyOpacity,
                transform: [
                  { translateY: heartsFlyY },
                  { scale: heartsFlyScale },
                ],
              }}
            >
              <View style={styles.heartsRow}>
                {Array.from({ length: HEART_COUNT }).map((_, i) => (
                  <DeathHeartSlot
                    key={`heart-fly-${i}`}
                    breakAtMs={HEART_BREAK_FIRST_MS + i * HEART_BREAK_STAGGER_MS}
                    active={heartsActive}
                    onBreak={() => void AudioManager.playLosingLiveSound()}
                  />
                ))}
              </View>
            </Animated.View>
          </Animated.View>
        )}

        {showFlyingTitle && (
          <Animated.View style={styles.titleFlyOverlay} pointerEvents="none">
            <Animated.View
              style={{
                transform: [
                  { translateY: titleFlyY },
                  { scale: titleFlyScale },
                  { translateX: titleShakeX },
                ],
              }}
            >
              <AppImage
                source={{ uri: YOU_GOT_COOKED_TITLE_URI }}
                style={[styles.titleImg, { height: titleHeight }]}
                contentFit="contain"
              />
            </Animated.View>
          </Animated.View>
        )}
      <GameEventFeed
        events={feedEvents}
        bottomOffset={insets.bottom + 8 + HEARTS_ROW_HEIGHT + 10 + 72}
      />
      {feedActive && <GamePhaseAutoReady />}
      </FullBleedStack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0610" },
  root: { flex: 1, backgroundColor: "#0a0610" },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  titleArea: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  titleStaticWrap: {
    width: "100%",
    alignItems: "center",
  },
  titleFlyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  titleImg: {
    width: SCREEN_W,
    alignSelf: "center",
  },
  heroZone: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    position: "relative",
    overflow: "visible",
  },
  heroImageWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heartsSlot: {
    height: HEARTS_ROW_HEIGHT,
    alignSelf: "center",
    justifyContent: "center",
  },
  heartsFlyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 45,
  },
  bgBlurOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
  },
  bgBlurWebFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 4, 18, 0.62)",
  },
  bgBlurTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8, 2, 16, 0.16)",
  },
  heartsRow: {
    height: HEARTS_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    alignSelf: "center",
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(244,114,182,0.38)",
    backgroundColor: "rgba(12,4,18,0.68)",
  },
  heartIcon: {
    width: 46,
    height: 46,
  },
  opts: {
    marginTop: 10,
    width: "100%",
  },

  actionCellRow: {
    flex: 1,
    minWidth: 0,
  },
  actionCellStack: {
    width: "100%",
  },
  actionPressable: {
    borderRadius: 16,
  },
  actionPressablePressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  actionPrimary: {
    minHeight: 58,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "rgba(187,247,208,0.5)",
  },
  actionPrimaryCompact: {
    minHeight: 56,
    paddingHorizontal: 10,
  },
  actionGhost: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "rgba(244,114,182,0.55)",
    backgroundColor: "rgba(24,8,32,0.78)",
  },
  actionGhostCompact: {
    minHeight: 54,
    paddingHorizontal: 10,
  },
  actionIconImage: {
    width: 52,
    height: 52,
  },
  actionIconImageGhost: {
    width: 48,
    height: 48,
  },
  actionPrimaryText: {
    flex: 1,
    color: "#ecfdf5",
    fontWeight: "800",
    letterSpacing: 0.4,
    fontSize: 17,
  },
  actionGhostText: {
    flex: 1,
    color: "#fbcfe8",
    fontWeight: "800",
    letterSpacing: 0.4,
    fontSize: 17,
  },
  actionTextCompact: {
    fontSize: 15,
  },
});
