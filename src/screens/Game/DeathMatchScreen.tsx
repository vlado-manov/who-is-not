import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { GameStackParamList } from "../../navigation/types";
import { useGameStore } from "../../store/useGameStore";
import { useHeroesStore } from "../../store/useHeroesStore";
import { usePreventBack } from "../../hooks/usePreventBack";
import { GameMode } from "../../api/analytics";
import {
  sendMultiplayerRelay,
  subscribeMultiplayerRelay,
} from "../../api/multiplayerRelay";
import {
  DEATHMATCH_DONE_MESSAGE_TYPE,
  DEATHMATCH_GUESS_MESSAGE_TYPE,
  DEATHMATCH_SECRET_MESSAGE_TYPE,
} from "../../constants/onlineLobby";
import { backgrounds } from "../../../assets/backgrounds";
import AppImage from "../../components/AppImage";
import CustomButton from "../../components/common/CustomButton";
import CustomText from "../../components/common/CustomText";

type Nav = StackNavigationProp<GameStackParamList, "DeathMatch">;

// ── CDN assets ────────────────────────────────────────────────────────────────

const DM_BG_URIS = [
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/b30773e3-19df-4706-aab1-bc6ca324bc1b-dm-bg-01.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/698c0470-d671-475a-80dd-34c779b02967-dm-bg-02.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/ba1ec846-c12e-4320-bd41-6cb619666378-dm-bg-03.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/9c371ad0-6dfa-404f-81d4-141f2046debb-dm-bg-04.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/839f2429-2933-42cf-8c3a-8fefb8d8eb8f-dm-bg-05.webp",
] as const;

const DM_SUDDEN_DEATH_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/a4cbe88e-1f68-468e-a674-4fb857d919c1-suddendeath.webp";
const DM_VS_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/a9b2f7a2-cd72-4623-a06b-d674b9f24a39-vs.webp";

// ── Types ─────────────────────────────────────────────────────────────────────

type GuessEntry = {
  value: number;
  hint: "higher" | "lower" | "correct";
};

type PendingResult = {
  hint: GuessEntry["hint"];
  nextTurnIdx: number;
  isGameOver: boolean;
  winnerIds: string[];
};

const ONLINE_RESULT_DELAY_MS = 1600;

type Phase =
  | "intro"
  | "setup_p0"
  | "pass_to_p1"
  | "setup_p1"
  | "pass_to_start"
  | "guessing"
  | "pass_between"
  | "setup_online"
  | "online_wait";

function computeValidRange(history: GuessEntry[]): [number, number] {
  let lo = 1;
  let hi = 100;
  for (const e of history) {
    if (e.hint === "higher" && e.value + 1 > lo) lo = e.value + 1;
    if (e.hint === "lower" && e.value - 1 < hi) hi = e.value - 1;
  }
  return [lo, hi];
}

function startAnim(anim: Animated.CompositeAnimation): Promise<void> {
  return new Promise((resolve) => anim.start(() => resolve()));
}

// ── Numpad ────────────────────────────────────────────────────────────────────

const KEYPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["C", "0", "⌫"],
] as const;

function Numpad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const handle = (key: string) => {
    if (key === "⌫") { onChange(value.slice(0, -1)); return; }
    if (key === "C") { onChange(""); return; }
    if (value.length >= 3) return;
    const next = value + key;
    if (parseInt(next, 10) > 100) return;
    onChange(next);
  };
  return (
    <View style={styles.numpad}>
      {KEYPAD_ROWS.map((row, ri) => (
        <View key={ri} style={styles.numpadRow}>
          {row.map((key) => (
            <Pressable
              key={key}
              style={({ pressed }) => [
                styles.numpadKey,
                pressed && styles.numpadKeyPressed,
                (key === "C" || key === "⌫") && styles.numpadKeyUtil,
              ]}
              onPress={() => handle(key)}
            >
              <CustomText variant="h4" textColor="#fff">{key}</CustomText>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

// ── Result banner ─────────────────────────────────────────────────────────────

function ResultBanner({ hint }: { hint: GuessEntry["hint"] }) {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, speed: 22, bounciness: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [hint, opacityAnim, scaleAnim]);

  const isCorrect = hint === "correct";
  const isHigher = hint === "higher";
  const emoji = isCorrect ? "✓" : isHigher ? "↑" : "↓";
  const label = isCorrect
    ? t("deathmatch_hint_correct")
    : isHigher
    ? t("deathmatch_hint_higher")
    : t("deathmatch_hint_lower");
  const color = isCorrect ? "#f5c518" : isHigher ? "#4caf8a" : "#e07050";

  return (
    <Animated.View
      style={[
        styles.resultBanner,
        { borderColor: color, backgroundColor: color + "22", transform: [{ scale: scaleAnim }], opacity: opacityAnim },
      ]}
    >
      <CustomText variant="h2" textColor={color}>{emoji}</CustomText>
      <CustomText variant="h4" textColor={color}>{label}</CustomText>
    </Animated.View>
  );
}

// ── Hint badge ────────────────────────────────────────────────────────────────

function HintBadge({ hint }: { hint: GuessEntry["hint"] }) {
  const { t } = useTranslation();
  const color = hint === "correct" ? "#f5c518" : hint === "higher" ? "#4caf8a" : "#e07050";
  const label =
    hint === "correct" ? t("deathmatch_hint_correct")
    : hint === "higher" ? t("deathmatch_hint_higher")
    : t("deathmatch_hint_lower");
  return (
    <View style={[styles.hintBadge, { backgroundColor: color + "33", borderColor: color }]}>
      <CustomText variant="p-small" textColor={color}>{label}</CustomText>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function DeathMatchScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth >= 768;
  const hPad = (isTablet ? Math.max(8, Math.floor((windowWidth - 560) / 2)) : 8) + 8;
  usePreventBack();

  const players = useGameStore((s) => s.players);
  const lives = useGameStore((s) => s.lives);
  const mode = useGameStore((s) => s.mode) as GameMode;
  const onlinePlayerId = useGameStore((s) => s.onlinePlayerId);
  const onlineIsHost = useGameStore((s) => s.onlineIsHost);
  const setDeathMatchWinners = useGameStore((s) => s.setDeathMatchWinners);
  const heroes = useHeroesStore((s) => s.heroes);

  const alivePlayers = useMemo(
    () => players.filter((p) => (lives[p.id] ?? 0) > 0),
    [lives, players],
  );
  const p0 = alivePlayers[0];
  const p1 = alivePlayers[1];

  // Pick a random background once on mount
  const dmBgUri = useMemo(
    () => DM_BG_URIS[Math.floor(Math.random() * DM_BG_URIS.length)],
    [],
  );

  // Title dimensions — same proportions as WinnerScreen
  const titleHeight = useMemo(() => Math.round(windowHeight * 0.28), [windowHeight]);
  const titleTopOffset = useMemo(() => Math.round(windowHeight * 0.002), [windowHeight]);
  // translateY to move title from absolute center to its final top position
  const titleRevealTargetY = useMemo(
    () => (insets.top + titleTopOffset) + titleHeight / 2 - windowHeight / 2,
    [insets.top, titleTopOffset, titleHeight, windowHeight],
  );

  // Hero deathmatch images
  const p0HeroImage = useMemo(() => {
    if (!p0) return null;
    return heroes.find((h) => h.id === p0.characterId)?.deathmatch_image ?? null;
  }, [heroes, p0]);

  const p1HeroImage = useMemo(() => {
    if (!p1) return null;
    return heroes.find((h) => h.id === p1.characterId)?.deathmatch_image ?? null;
  }, [heroes, p1]);

  // ── State ────────────────────────────────────────────────────────────────────
  const secretsRef = useRef<Record<string, number>>({});
  const [secretsReady, setSecretsReady] = useState<Set<string>>(new Set());
  const [histories, setHistories] = useState<Record<string, GuessEntry[]>>({});
  const [turnIdx, setTurnIdx] = useState(0);
  const firstCorrectIdRef = useRef<string | null>(null);
  const [firstCorrectId, setFirstCorrectIdState] = useState<string | null>(null);
  const doneRef = useRef(false);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>(
    mode === "ONLINE" ? "setup_online" : "intro",
  );
  const [pendingResult, setPendingResult] = useState<PendingResult | null>(null);

  // ── Intro animation refs ──────────────────────────────────────────────────
  const heroLeftX = useRef(new Animated.Value(-windowWidth)).current;
  const heroRightX = useRef(new Animated.Value(windowWidth)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const vsScale = useRef(new Animated.Value(0.3)).current;
  const vsTranslateY = useRef(new Animated.Value(-80)).current;
  const vsOpacity = useRef(new Animated.Value(0)).current;
  const letsGoOpacity = useRef(new Animated.Value(0)).current;
  const letsGoY = useRef(new Animated.Value(40)).current;

  // Title animation (same pattern as WinnerScreen)
  const animTitleScale = useRef(new Animated.Value(80)).current;
  const animTitleTranslateY = useRef(new Animated.Value(0)).current;
  const animTitleRotate = useRef(new Animated.Value(0)).current;
  const animTitleShakeX = useRef(new Animated.Value(0)).current;
  const animBlurOpacity = useRef(new Animated.Value(0)).current;
  const animShockwaveScale = useRef(new Animated.Value(0.3)).current;
  const animShockwaveOpacity = useRef(new Animated.Value(0)).current;
  const animShockwaveScale2 = useRef(new Animated.Value(0.3)).current;
  const animShockwaveOpacity2 = useRef(new Animated.Value(0)).current;
  const animImpactFlash = useRef(new Animated.Value(0)).current;
  const staticTitleOpacity = useRef(new Animated.Value(0)).current;
  const [hideAnimTitle, setHideAnimTitle] = useState(false);

  // Game container slide-in when coming from intro
  const gameSlideY = useRef(new Animated.Value(0)).current;
  const cameFromIntroRef = useRef(false);

  // ── Shake (for wrong input) ───────────────────────────────────────────────
  const shakeX = useRef(new Animated.Value(0)).current;
  const pulseBanner = useRef(new Animated.Value(1)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeX, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (!firstCorrectId) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseBanner, { toValue: 1.04, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulseBanner, { toValue: 1.0, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [firstCorrectId, pulseBanner]);

  // ── Intro animation sequence ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "intro") return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const runIntro = async () => {
      // Reset all values
      heroLeftX.setValue(-windowWidth);
      heroRightX.setValue(windowWidth);
      heroOpacity.setValue(0);
      vsScale.setValue(1);
      vsTranslateY.setValue(0);
      vsOpacity.setValue(0);
      letsGoOpacity.setValue(0);
      letsGoY.setValue(40);
      animTitleScale.setValue(80);
      animTitleTranslateY.setValue(0);
      animTitleRotate.setValue(0);
      animTitleShakeX.setValue(0);
      animBlurOpacity.setValue(0);
      animShockwaveScale.setValue(0.3);
      animShockwaveOpacity.setValue(0);
      animShockwaveScale2.setValue(0.3);
      animShockwaveOpacity2.setValue(0);
      animImpactFlash.setValue(0);
      staticTitleOpacity.setValue(0);
      setHideAnimTitle(false);

      if (cancelled) return;

      // Step 1: Title zoom in (scale 80→1, spin)
      await startAnim(
        Animated.parallel([
          Animated.timing(animTitleScale, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(animTitleRotate, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(animBlurOpacity, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      );

      if (cancelled) return;

      // Step 2: Title pulse (vibrate)
      await startAnim(
        Animated.sequence([
          Animated.timing(animTitleScale, { toValue: 1.15, duration: 110, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(animTitleScale, { toValue: 0.93, duration: 110, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(animTitleScale, { toValue: 1.09, duration: 100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(animTitleScale, { toValue: 1.0, duration: 100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
      );

      if (cancelled) return;

      // Step 3: Title springs to top with shockwaves + flash + shake
      animShockwaveOpacity.setValue(1);
      animShockwaveOpacity2.setValue(1);

      startAnim(
        Animated.parallel([
          Animated.spring(animTitleTranslateY, {
            toValue: titleRevealTargetY,
            speed: 18,
            bounciness: 5,
            useNativeDriver: true,
          }),
          Animated.timing(animBlurOpacity, {
            toValue: 0,
            duration: 340,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(animShockwaveScale, { toValue: 2.2, duration: 540, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(animShockwaveOpacity, { toValue: 0, duration: 540, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(animShockwaveScale2, { toValue: 2.6, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(animShockwaveOpacity2, { toValue: 0, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(animImpactFlash, { toValue: 1, duration: 80, useNativeDriver: true }),
            Animated.timing(animImpactFlash, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(animTitleShakeX, { toValue: -20, duration: 70, useNativeDriver: true }),
            Animated.timing(animTitleShakeX, { toValue: 18, duration: 70, useNativeDriver: true }),
            Animated.timing(animTitleShakeX, { toValue: -13, duration: 65, useNativeDriver: true }),
            Animated.timing(animTitleShakeX, { toValue: 9, duration: 60, useNativeDriver: true }),
            Animated.timing(animTitleShakeX, { toValue: 0, duration: 55, useNativeDriver: true }),
          ]),
        ]),
      ).then(() => {
        if (!cancelled) {
          staticTitleOpacity.setValue(1);
          setHideAnimTitle(true);
        }
      });

      if (cancelled) return;

      // Wait for title to start moving before heroes enter
      await new Promise<void>((res) => { timers.push(setTimeout(res, 350)); });
      if (cancelled) return;

      // Step 4: Heroes slide in from sides — fighting-game style with bounce
      await startAnim(
        Animated.parallel([
          Animated.timing(heroOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
          Animated.spring(heroLeftX, { toValue: 0, speed: 9, bounciness: 10, useNativeDriver: true }),
          Animated.spring(heroRightX, { toValue: 0, speed: 9, bounciness: 10, useNativeDriver: true }),
        ]),
      );

      if (cancelled) return;

      // Brief dramatic pause before VS
      await new Promise<void>((res) => { timers.push(setTimeout(res, 320)); });
      if (cancelled) return;

      // Step 5: VS slams in — starts huge (fills screen), snaps to final size
      vsScale.setValue(9);
      await startAnim(
        Animated.parallel([
          Animated.timing(vsOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.spring(vsScale, { toValue: 1, speed: 24, bounciness: 3, useNativeDriver: true }),
        ]),
      );

      if (cancelled) return;

      // Step 6: "Let's Go" button slides up
      await new Promise<void>((res) => { timers.push(setTimeout(res, 180)); });
      if (cancelled) return;

      Animated.parallel([
        Animated.timing(letsGoOpacity, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(letsGoY, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    };

    void runIntro();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Let's Go handler ──────────────────────────────────────────────────────
  const handleLetsGo = useCallback(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(heroLeftX, { toValue: -windowWidth, speed: 14, bounciness: 0, useNativeDriver: true }),
      Animated.spring(heroRightX, { toValue: windowWidth, speed: 14, bounciness: 0, useNativeDriver: true }),
      Animated.timing(vsOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(letsGoOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      cameFromIntroRef.current = true;
      gameSlideY.setValue(windowHeight);
      setPhase("setup_p0");
      Animated.spring(gameSlideY, {
        toValue: 0,
        speed: 14,
        bounciness: 4,
        useNativeDriver: true,
      }).start();
    });
  }, [heroLeftX, heroOpacity, heroRightX, letsGoOpacity, vsOpacity, windowHeight, gameSlideY]);

  // ── Navigate to WinnerScreen ─────────────────────────────────────────────
  const finish = useCallback(
    (winnerIds: string[]) => {
      if (doneRef.current) return;
      doneRef.current = true;
      setDeathMatchWinners(winnerIds);
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Winner" }] }));
    },
    [navigation, setDeathMatchWinners],
  );

  // ── Online: auto-advance after showing result ─────────────────────────────
  useEffect(() => {
    if (mode !== "ONLINE" || !pendingResult) return;
    const { isGameOver, winnerIds, nextTurnIdx } = pendingResult;
    const timer = setTimeout(() => {
      setPendingResult(null);
      setInput("");
      if (isGameOver) {
        finish(winnerIds);
      } else {
        setTurnIdx(nextTurnIdx);
      }
    }, ONLINE_RESULT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [finish, mode, pendingResult]);

  // ── Advance after result (local mode) ────────────────────────────────────
  const handleAdvanceAfterResult = useCallback(() => {
    if (!pendingResult) return;
    const { isGameOver, winnerIds, nextTurnIdx } = pendingResult;
    setPendingResult(null);
    setInput("");
    if (isGameOver) {
      finish(winnerIds);
      return;
    }
    setTurnIdx(nextTurnIdx);
    setPhase("pass_between");
  }, [finish, pendingResult]);

  // ── Core guess resolution ─────────────────────────────────────────────────
  const applyGuess = useCallback(
    (guesserId: string, guessValue: number): void => {
      const target = alivePlayers.find((p) => p.id !== guesserId);
      if (!target) return;
      const secret = secretsRef.current[target.id];
      if (secret == null) return;

      const hint: GuessEntry["hint"] =
        guessValue === secret ? "correct"
        : guessValue < secret ? "higher"
        : "lower";

      setHistories((prev) => ({
        ...prev,
        [guesserId]: [...(prev[guesserId] ?? []), { value: guessValue, hint }],
      }));

      const prevFirstCorrect = firstCorrectIdRef.current;
      const nextTurnIdx = alivePlayers[0].id === guesserId ? 1 : 0;
      let isGameOver = false;
      let winnerIds: string[] = [];

      if (hint === "correct") {
        if (prevFirstCorrect !== null && prevFirstCorrect !== guesserId) {
          isGameOver = true;
          winnerIds = [prevFirstCorrect, guesserId];
          if (mode === "ONLINE" && onlineIsHost) {
            sendMultiplayerRelay({ type: DEATHMATCH_DONE_MESSAGE_TYPE, winnerIds });
          }
        } else if (prevFirstCorrect === null) {
          if (guesserId === alivePlayers[0].id) {
            firstCorrectIdRef.current = guesserId;
            setFirstCorrectIdState(guesserId);
          } else {
            isGameOver = true;
            winnerIds = [guesserId];
            if (mode === "ONLINE" && onlineIsHost) {
              sendMultiplayerRelay({ type: DEATHMATCH_DONE_MESSAGE_TYPE, winnerIds });
            }
          }
        }
      } else if (prevFirstCorrect !== null) {
        isGameOver = true;
        winnerIds = [prevFirstCorrect];
        if (mode === "ONLINE" && onlineIsHost) {
          sendMultiplayerRelay({ type: DEATHMATCH_DONE_MESSAGE_TYPE, winnerIds });
        }
      }

      setPendingResult({ hint, nextTurnIdx, isGameOver, winnerIds });
      setInput("");
    },
    [alivePlayers, mode, onlineIsHost],
  );

  // ── Online relay ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "ONLINE") return;
    const unsub = subscribeMultiplayerRelay((raw) => {
      const d = raw as Record<string, unknown>;
      if (d.type === DEATHMATCH_SECRET_MESSAGE_TYPE) {
        const pid = d.playerId as string;
        if (pid === onlinePlayerId) return;
        secretsRef.current[pid] = d.secret as number;
        setSecretsReady((prev) => new Set([...prev, pid]));
      }
      if (d.type === DEATHMATCH_GUESS_MESSAGE_TYPE) {
        const guesserId = d.guesserId as string;
        if (guesserId === onlinePlayerId) return;
        applyGuess(guesserId, d.guess as number);
      }
      if (d.type === DEATHMATCH_DONE_MESSAGE_TYPE) {
        finish(d.winnerIds as string[]);
      }
    });
    return unsub;
  }, [applyGuess, finish, mode, onlinePlayerId]);

  useEffect(() => {
    if (mode !== "ONLINE" || !p0 || !p1) return;
    if (secretsReady.has(p0.id) && secretsReady.has(p1.id)) {
      setPhase("guessing");
    }
  }, [mode, p0, p1, secretsReady]);

  // ── Submit handlers ───────────────────────────────────────────────────────
  const handleConfirmSecret = () => {
    const num = parseInt(input, 10);
    if (!num || num < 1 || num > 100) { shake(); return; }

    if (mode === "ONLINE") {
      const myId = onlinePlayerId!;
      secretsRef.current[myId] = num;
      setSecretsReady((prev) => new Set([...prev, myId]));
      sendMultiplayerRelay({
        type: DEATHMATCH_SECRET_MESSAGE_TYPE,
        playerId: myId,
        secret: num,
      });
      setInput("");
      setPhase("online_wait");
    } else {
      const setupPlayer = phase === "setup_p0" ? p0 : p1;
      if (!setupPlayer) return;
      secretsRef.current[setupPlayer.id] = num;
      setInput("");
      setPhase(phase === "setup_p0" ? "pass_to_p1" : "pass_to_start");
    }
  };

  const handleSubmitGuess = () => {
    if (doneRef.current || pendingResult) return;
    const num = parseInt(input, 10);
    if (!num || num < 1 || num > 100) { shake(); return; }

    const guesser =
      mode === "ONLINE"
        ? alivePlayers.find((p) => p.id === onlinePlayerId)
        : alivePlayers[turnIdx];
    if (!guesser) return;

    if (mode === "ONLINE") {
      sendMultiplayerRelay({
        type: DEATHMATCH_GUESS_MESSAGE_TYPE,
        guesserId: guesser.id,
        guess: num,
      });
    }
    applyGuess(guesser.id, num);
  };

  // ── Derived UI ────────────────────────────────────────────────────────────
  const currentGuesser = alivePlayers[turnIdx] ?? p0;
  const currentTarget = alivePlayers.find((p) => p.id !== currentGuesser?.id) ?? null;
  const isMyOnlineTurn = mode === "ONLINE" && currentGuesser?.id === onlinePlayerId;
  const isOnlineWaiting = mode === "ONLINE" && !isMyOnlineTurn;
  const currentHistory: GuessEntry[] = currentGuesser ? (histories[currentGuesser.id] ?? []) : [];
  const [rangeLo, rangeHi] = computeValidRange(currentHistory);
  const firstCorrectPlayer = firstCorrectId
    ? alivePlayers.find((p) => p.id === firstCorrectId) ?? null
    : null;
  const nextPlayer = pendingResult ? alivePlayers[pendingResult.nextTurnIdx] : null;

  const renderNumberDisplay = () => (
    <Animated.View style={[styles.display, { transform: [{ translateX: shakeX }] }]}>
      <CustomText variant="h2" textColor={input ? "#fff" : "rgba(255,255,255,0.28)"}>
        {input || "–"}
      </CustomText>
    </Animated.View>
  );

  // ── Persistent title rendered in all non-intro phases ─────────────────────
  const renderPersistentTitle = () => (
    <View
      pointerEvents="none"
      style={[styles.persistentTitleWrap, { top: insets.top + titleTopOffset }]}
    >
      <AppImage
        source={{ uri: DM_SUDDEN_DEATH_URI }}
        contentFit="contain"
        style={{ width: "100%", height: titleHeight }}
      />
    </View>
  );

  // ── Phase: Intro ──────────────────────────────────────────────────────────
  if (phase === "intro") {
    const heroSize = windowWidth * 0.5 * 2.5;

    return (
      <SafeAreaView style={styles.fill} edges={["right", "left"]}>
        <ImageBackground source={{ uri: dmBgUri }} style={styles.bg} resizeMode="cover">
          {/* Static title shown once animation completes */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.persistentTitleWrap,
              { top: insets.top + titleTopOffset - 20, opacity: staticTitleOpacity },
            ]}
          >
            <AppImage
              source={{ uri: DM_SUDDEN_DEATH_URI }}
              contentFit="contain"
              style={{ width: "100%", height: titleHeight }}
            />
          </Animated.View>

          {/* Hero images — top 24px below title, inner edge at center-40 */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.introHeroBase,
              {
                width: heroSize,
                height: heroSize * 1.6,
                top: insets.top + titleTopOffset + titleHeight - 140,
                left: windowWidth / 2 - heroSize + 120,
                opacity: heroOpacity,
                transform: [{ translateX: heroLeftX }],
              },
            ]}
          >
            {p0HeroImage && (
              <AppImage source={p0HeroImage} contentFit="contain" style={StyleSheet.absoluteFill} />
            )}
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={[
              styles.introHeroBase,
              {
                width: heroSize,
                height: heroSize * 1.6,
                top: insets.top + titleTopOffset + titleHeight - 140,
                left: windowWidth / 2 - 120,
                opacity: heroOpacity,
                transform: [{ translateX: heroRightX }, { scaleX: -1 }],
              },
            ]}
          >
            {p1HeroImage && (
              <AppImage source={p1HeroImage} contentFit="contain" style={StyleSheet.absoluteFill} />
            )}
          </Animated.View>

          {/* VS image — centered, shifted down */}
          <View pointerEvents="none" style={styles.vsWrap}>
            <Animated.View
              style={{
                width: windowWidth * 0.36,
                height: windowWidth * 0.36,
                marginTop: 60,
                opacity: vsOpacity,
                transform: [{ scale: vsScale }],
              }}
            >
              <AppImage source={{ uri: DM_VS_URI }} contentFit="contain" style={StyleSheet.absoluteFill} />
            </Animated.View>
          </View>

          {/* Animated title overlay (disappears once it reaches top) */}
          {!hideAnimTitle && (
            <>
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: "rgba(0,0,0,0.60)", opacity: animBlurOpacity, zIndex: 50 },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[styles.shockwaveRing, {
                  top: insets.top + titleTopOffset,
                  height: titleHeight * 0.85,
                  borderColor: "rgba(255,80,80,1)",
                  opacity: animShockwaveOpacity,
                  zIndex: 51,
                  transform: [{ scale: animShockwaveScale }],
                }]}
              />
              <Animated.View
                pointerEvents="none"
                style={[styles.shockwaveRing, {
                  top: insets.top + titleTopOffset,
                  height: titleHeight * 0.85,
                  borderColor: "rgba(255,50,50,0.8)",
                  opacity: animShockwaveOpacity2,
                  zIndex: 51,
                  transform: [{ scale: animShockwaveScale2 }],
                }]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: "rgba(255,100,80,0.45)", opacity: animImpactFlash, zIndex: 52 },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.animTitleOverlay,
                  {
                    zIndex: 53,
                    transform: [
                      { translateX: animTitleShakeX },
                      { translateY: animTitleTranslateY },
                      { scale: animTitleScale },
                      {
                        rotate: animTitleRotate.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["-900deg", "0deg"],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <AppImage
                  source={{ uri: DM_SUDDEN_DEATH_URI }}
                  contentFit="contain"
                  style={{ width: "100%", height: titleHeight }}
                />
              </Animated.View>
            </>
          )}

          {/* Let's Go button */}
          <Animated.View
            style={[
              styles.letsGoWrap,
              {
                bottom: insets.bottom + 40,
                paddingHorizontal: hPad,
                opacity: letsGoOpacity,
                transform: [{ translateY: letsGoY }],
                zIndex: 60,
              },
            ]}
          >
            <CustomButton
              title={t("deathmatch_lets_go")}
              fullWidth
              btnSize="md"
              fontSize="md"
              onPress={handleLetsGo}
              backgroundImage={backgrounds.bg026}
              glow
              glowColor="rgba(255,80,40,0.9)"
              shadowColor="#7a0000"
            />
          </Animated.View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  // ── Phase: Setup ──────────────────────────────────────────────────────────
  if (phase === "setup_p0" || phase === "setup_p1" || phase === "setup_online") {
    const setupPlayer =
      phase === "setup_online"
        ? alivePlayers.find((p) => p.id === onlinePlayerId)
        : phase === "setup_p0" ? p0 : p1;

    return (
      <SafeAreaView style={styles.fill} edges={["right", "left"]}>
        <ImageBackground source={{ uri: dmBgUri }} style={styles.bg} resizeMode="cover">
          <View style={styles.bgDim} />
          {renderPersistentTitle()}
          <Animated.View
            style={[
              styles.container,
              {
                paddingTop: insets.top + titleHeight + titleTopOffset + 16,
                paddingBottom: insets.bottom + 16,
                paddingHorizontal: hPad,
                transform: [{ translateY: gameSlideY }],
              },
            ]}
          >
            <View style={styles.playerBadge}>
              <CustomText variant="h5" textColor="#fff" className="text-center">
                {setupPlayer?.name ?? ""}
              </CustomText>
            </View>
            <CustomText variant="h5" textColor="#fff" className="text-center">
              {t("deathmatch_setup_heading")}
            </CustomText>
            <CustomText variant="p-small" textColor="rgba(255,255,255,0.5)" className="text-center">
              {t("deathmatch_setup_range")}
            </CustomText>
            <CustomText variant="p-small" textColor="#e07050" className="text-center">
              {t("deathmatch_setup_hint")}
            </CustomText>
            {renderNumberDisplay()}
            <Numpad value={input} onChange={setInput} />
            <View style={styles.actionRow}>
              <CustomButton
                title={t("deathmatch_setup_confirm")}
                fullWidth
                onPress={handleConfirmSecret}
                backgroundImage={backgrounds.bg026}
                glow btnSize="md" fontSize="md"
                glowColor="rgba(255,180,40,0.7)"
                shadowColor="#7a4000"
              />
            </View>
          </Animated.View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  // ── Phase: Online waiting for opponent's secret ───────────────────────────
  if (phase === "online_wait") {
    const other = alivePlayers.find((p) => p.id !== onlinePlayerId);
    return (
      <SafeAreaView style={styles.fill} edges={["right", "left"]}>
        <ImageBackground source={{ uri: dmBgUri }} style={styles.bg} resizeMode="cover">
          <View style={styles.bgDim} />
          {renderPersistentTitle()}
          <View
            style={[
              styles.container,
              styles.centeredContent,
              {
                paddingTop: insets.top + titleHeight + titleTopOffset + 24,
                paddingHorizontal: hPad,
              },
            ]}
          >
            <CustomText variant="h5" textColor="#fff" className="text-center" allowWrap>
              {t("deathmatch_online_setup_done", { name: other?.name ?? "…" })}
            </CustomText>
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  // ── Phase: Pass device overlay ────────────────────────────────────────────
  if (phase === "pass_to_p1" || phase === "pass_to_start" || phase === "pass_between") {
    const targetName =
      phase === "pass_to_p1" ? p1?.name
      : phase === "pass_to_start" ? p0?.name
      : alivePlayers[turnIdx]?.name;

    const onReady = () => {
      setInput("");
      setPhase(phase === "pass_to_p1" ? "setup_p1" : "guessing");
    };

    return (
      <SafeAreaView style={styles.fill} edges={["right", "left"]}>
        <ImageBackground source={{ uri: dmBgUri }} style={styles.bg} resizeMode="cover">
          <View style={styles.bgDim} />
          {renderPersistentTitle()}
          <View
            style={[
              styles.container,
              styles.centeredContent,
              {
                paddingTop: insets.top + titleHeight + titleTopOffset + 24,
                paddingBottom: insets.bottom + 16,
                paddingHorizontal: hPad,
              },
            ]}
          >
            <CustomText variant="h4" textColor="#fff" className="text-center" allowWrap>
              {t("deathmatch_pass_to", { name: targetName ?? "…" })}
            </CustomText>
            <View style={styles.actionRow}>
              <CustomButton
                title={phase === "pass_to_start" ? t("deathmatch_pass_start_guess") : t("deathmatch_pass_ready")}
                fullWidth
                onPress={onReady}
                backgroundImage={backgrounds.bg026}
                glow btnSize="md" fontSize="md"
                glowColor="rgba(255,180,40,0.7)"
                shadowColor="#7a4000"
              />
            </View>
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  // ── Phase: Guessing ───────────────────────────────────────────────────────
  const showingResult = pendingResult !== null;

  return (
    <SafeAreaView style={styles.fill} edges={["right", "left"]}>
      <ImageBackground source={{ uri: dmBgUri }} style={styles.bg} resizeMode="cover">
        <View style={styles.bgDim} />
        {renderPersistentTitle()}
        <View
          style={[
            styles.container,
            {
              paddingTop: insets.top + titleHeight + titleTopOffset + 12,
              paddingBottom: insets.bottom + 12,
              paddingHorizontal: hPad,
            },
          ]}
        >
          {/* Last-chance banner */}
          {firstCorrectId && firstCorrectPlayer && (
            <Animated.View style={[styles.lastChanceBanner, { transform: [{ scale: pulseBanner }] }]}>
              <CustomText variant="p-small" textColor="#fff" className="text-center" allowWrap>
                {t("deathmatch_guess_last_chance", { name: firstCorrectPlayer.name })}
              </CustomText>
            </Animated.View>
          )}

          {/* Turn label */}
          {isOnlineWaiting && !showingResult ? (
            <CustomText variant="h5" textColor="rgba(255,255,255,0.65)" className="text-center" allowWrap>
              {t("deathmatch_waiting_opponent", { name: currentGuesser?.name ?? "…" })}
            </CustomText>
          ) : (
            <>
              <CustomText variant="h5" textColor="#fff" className="text-center">
                {t("deathmatch_guess_heading", { name: currentGuesser?.name ?? "" })}
              </CustomText>
              {!showingResult && (
                <CustomText variant="p-small" textColor="rgba(255,255,255,0.55)" className="text-center" allowWrap>
                  {t("deathmatch_guess_subheading", { target: currentTarget?.name ?? "" })}
                </CustomText>
              )}
            </>
          )}

          {/* Result banner */}
          {showingResult && pendingResult && (
            <ResultBanner hint={pendingResult.hint} />
          )}

          {/* Valid range */}
          {currentHistory.length > 0 && !showingResult && (
            <View style={styles.rangeRow}>
              <CustomText variant="p-small" textColor="rgba(255,255,255,0.45)">
                {t("deathmatch_range_label")}
              </CustomText>
              <CustomText variant="p-small" textColor="#4caf8a">
                {`  ${rangeLo} – ${rangeHi}`}
              </CustomText>
            </View>
          )}

          {/* Guess history */}
          <View style={styles.historyWrap}>
            {currentHistory.length === 0 ? (
              <CustomText variant="p-small" textColor="rgba(255,255,255,0.28)" className="text-center">
                {t("deathmatch_history_empty")}
              </CustomText>
            ) : (
              <ScrollView
                style={styles.historyScroll}
                contentContainerStyle={styles.historyContent}
                showsVerticalScrollIndicator={false}
              >
                {currentHistory.map((entry, idx) => {
                  const isLatest = idx === currentHistory.length - 1;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.historyRow,
                        isLatest && showingResult && styles.historyRowLatest,
                      ]}
                    >
                      <CustomText variant="p-small" textColor={isLatest && showingResult ? "#fff" : "rgba(255,255,255,0.8)"}>
                        {`#${idx + 1}   ${entry.value}`}
                      </CustomText>
                      <HintBadge hint={entry.hint} />
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Bottom action area */}
          {showingResult ? (
            mode !== "ONLINE" ? (
              <View style={styles.actionRow}>
                <CustomButton
                  title={
                    pendingResult!.isGameOver
                      ? t("continue_btn")
                      : t("deathmatch_pass_to", { name: nextPlayer?.name ?? "…" })
                  }
                  fullWidth
                  onPress={handleAdvanceAfterResult}
                  backgroundImage={backgrounds.bg026}
                  glow btnSize="md" fontSize="md"
                  glowColor="rgba(255,180,40,0.7)"
                  shadowColor="#7a4000"
                />
              </View>
            ) : (
              <CustomText variant="p-small" textColor="rgba(255,255,255,0.45)" className="text-center">
                …
              </CustomText>
            )
          ) : (
            !isOnlineWaiting && (
              <>
                {renderNumberDisplay()}
                <Numpad value={input} onChange={setInput} />
                <View style={styles.actionRow}>
                  <CustomButton
                    title={t("deathmatch_guess_submit")}
                    fullWidth
                    onPress={handleSubmitGuess}
                    backgroundImage={backgrounds.bg026}
                    glow btnSize="md" fontSize="md"
                    glowColor="rgba(255,180,40,0.7)"
                    shadowColor="#7a4000"
                  />
                </View>
              </>
            )
          )}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  bg: { flex: 1 },
  bgDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.52)",
  },
  bgDimLight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  container: {
    flex: 1,
    gap: 10,
  },
  centeredContent: {
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  playerBadge: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  display: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingVertical: 10,
    minHeight: 60,
  },
  numpad: { gap: 7 },
  numpadRow: { flexDirection: "row", gap: 7, justifyContent: "center" },
  numpadKey: {
    flex: 1,
    maxWidth: 110,
    aspectRatio: 1.7,
    backgroundColor: "rgba(255,255,255,0.11)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  numpadKeyPressed: { backgroundColor: "rgba(255,255,255,0.22)" },
  numpadKeyUtil: { backgroundColor: "rgba(255,255,255,0.05)" },
  actionRow: { gap: 10 },
  resultBanner: {
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 4,
  },
  lastChanceBanner: {
    backgroundColor: "rgba(220,60,30,0.82)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e07050",
  },
  rangeRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  historyWrap: {
    flex: 1,
    minHeight: 50,
    maxHeight: 220,
    justifyContent: "flex-start",
  },
  historyScroll: { flex: 1 },
  historyContent: { gap: 5, paddingVertical: 2 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  historyRowLatest: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  hintBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },

  // ── Intro styles ──────────────────────────────────────────────────────────
  introHeroBase: {
    position: "absolute",
  },
  vsWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  letsGoWrap: {
    position: "absolute",
    left: 0,
    right: 0,
  },

  // ── Shared title styles ───────────────────────────────────────────────────
  persistentTitleWrap: {
    position: "absolute",
    left: 8,
    right: 8,
    zIndex: 10,
    pointerEvents: "none",
  },
  animTitleOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  shockwaveRing: {
    position: "absolute",
    left: "5%",
    right: "5%",
    borderWidth: 3,
    borderRadius: 14,
  },
});
