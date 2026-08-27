import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  Animated,
  Easing,
  FlatList,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
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
import { BlurView } from "expo-blur";
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";

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

const DM_HANDTHEPHONE_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/e86bcb13-5463-487b-b64c-82c41450a8f1-handthephone.webp";

const DM_LIGHTBULB_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/c3099520-38f6-405d-ac02-f02f7bb56573-lighbulb.webp";

const DM_SUDDEN_DEATH_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/a4cbe88e-1f68-468e-a674-4fb857d919c1-suddendeath.webp";
const DM_VS_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/a9b2f7a2-cd72-4623-a06b-d674b9f24a39-vs.webp";
const DM_VS_BATTLE_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/d56ed126-ca7b-4bcc-9457-4fde83e11772-vs.webp";

// ── How To Play assets ────────────────────────────────────────────────────────

const HTP_TITLE_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/8cef58e9-b795-4c6e-abfd-1f0ab05fea59-htp.webp";

const HTP_RULES = [
  {
    uri: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/184ce12b-dbc0-41bc-8900-8e2ceba5f180-icon1.webp",
    text: "Each player secretly chooses a number between 1 and 100.",
  },
  {
    uri: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/cfeced22-484b-4ea8-b6d6-f1a4a50c4108-icon3.webp",
    text: "Take turns guessing each other's number.",
  },
  {
    uri: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/993dcfb0-9e88-4030-be9f-389bb6ba5959-icon2.webp",
    text: "After each guess you'll know if the number is Higher or Lower.",
  },
  {
    uri: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/3281e41c-b1b6-476c-99c3-b87b2930e984-icon4.webp",
    text: "First player to guess correctly wins the duel!",
  },
] as const;

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
const DRUM_ITEM_H = 64;

type Phase =
  | "intro"
  | "how_to_play"      // Rules screen (both modes)
  | "player_intro"     // LOCAL: "IT'S YOUR TURN" — player picks up phone
  | "setup_opp"        // LOCAL: opponent (p1) sets number
  | "setup_you"        // LOCAL: you (p0) set number
  | "setup_good_job"   // LOCAL: "Good Job & Good Luck" after picking number
  | "pass_1"           // LOCAL: pass device to next player
  | "local_lets_go"    // LOCAL: "Let the game begin!" screen
  | "guessing"
  | "opp_confirm"     // LOCAL: opponent confirms LOWER/CORRECT/HIGHER
  | "setup_online"    // ONLINE: drum picker
  | "online_wait";    // ONLINE: waiting for opponent

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

// ── Drum picker (online setup) ─────────────────────────────────────────────────

function DrumPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const VISIBLE = 5;
  const PAD = Math.floor(VISIBLE / 2);
  const listRef = useRef<FlatList<number>>(null);
  const items = useMemo(() => Array.from({ length: 100 }, (_, i) => i + 1), []);

  useEffect(() => {
    const timer = setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: (value - 1) * DRUM_ITEM_H, animated: false });
    }, 80);
    return () => clearTimeout(timer);
  // only on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.drumWrap}>
      {/* center highlight bar */}
      <View pointerEvents="none" style={styles.drumHighlight} />
      {/* top fade */}
      <View pointerEvents="none" style={[styles.drumFade, { top: 0 }]} />
      {/* bottom fade */}
      <View pointerEvents="none" style={[styles.drumFade, { bottom: 0 }]} />
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(n) => n.toString()}
        snapToInterval={DRUM_ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: PAD * DRUM_ITEM_H }}
        getItemLayout={(_, index) => ({ length: DRUM_ITEM_H, offset: DRUM_ITEM_H * index, index })}
        renderItem={({ item: n }) => (
          <View style={styles.drumItem}>
            <CustomText
              variant={n === value ? "h3" : "h5"}
              textColor={n === value ? "#22c55e" : "rgba(255,255,255,0.28)"}
            >
              {n.toString()}
            </CustomText>
          </View>
        )}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / DRUM_ITEM_H);
          onChange(Math.max(1, Math.min(100, idx + 1)));
        }}
      />
    </View>
  );
}

// ── Hero avatar circle ─────────────────────────────────────────────────────────

function HeroCircle({
  source,
  name,
  active,
  size = 72,
  label,
  noBorder,
  nameColor,
}: {
  source: any;
  name: string;
  active: boolean;
  size?: number;
  label?: string;
  noBorder?: boolean;
  nameColor?: string;
}) {
  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <View
        style={[
          styles.heroCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: active ? "#22c55e" : "rgba(255,255,255,0.18)",
            borderWidth: noBorder ? 0 : undefined,
            opacity: active ? 1 : 0.42,
          },
        ]}
      >
        {source ? (
          <AppImage
            source={source}
            contentFit="cover"
            style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: size / 2 }]} />
        )}
      </View>
      {label ? (
        <View style={[styles.avatarLabelBadge, { borderColor: active ? "#22c55e" : "rgba(255,255,255,0.18)", backgroundColor: active ? "rgba(34,197,94,0.15)" : "rgba(0,0,0,0.3)" }]}>
          <CustomText variant="p-small" textColor={active ? "#22c55e" : "rgba(255,255,255,0.55)"}>{label}</CustomText>
        </View>
      ) : (
        <CustomText variant="p-small" textColor={nameColor ?? (active ? "#fff" : "rgba(255,255,255,0.45)")}>{name}</CustomText>
      )}
    </View>
  );
}

// ── Result banner (online) ─────────────────────────────────────────────────────

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

// ── Gradient guess circle ─────────────────────────────────────────────────────
// Border: green (left) → transparent (top) → red (right) → transparent (bottom)
// Achieved via 4 quarter-arcs, each with a chord-aligned linearGradient so the
// colour transitions are accurate at every cardinal point.

function GradientGuessCircle({ children }: { children: React.ReactNode }) {
  const innerSize = 170;
  const pad = 32;
  const svgSize = innerSize + pad * 2;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const r = innerSize / 2 - 2; // inset by half stroke-width
  const sw = 3.5;

  // 4 clockwise quarter-arcs between the 4 cardinal points
  const top   = [cx,     cy - r] as const;
  const right  = [cx + r, cy    ] as const;
  const bottom = [cx,     cy + r] as const;
  const left   = [cx - r, cy    ] as const;

  const arc = (from: readonly [number, number], to: readonly [number, number]) =>
    `M ${from[0]},${from[1]} A ${r},${r} 0 0,1 ${to[0]},${to[1]}`;

  const arcTR = arc(top,    right );  // transparent → red
  const arcRB = arc(right,  bottom);  // red → transparent
  const arcBL = arc(bottom, left  );  // transparent → green
  const arcLT = arc(left,   top   );  // green → transparent

  return (
    <View style={{ width: innerSize, height: innerSize, alignItems: "center", justifyContent: "center" }}>
      <Svg
        width={svgSize}
        height={svgSize}
        style={{ position: "absolute", top: -pad, left: -pad }}
        pointerEvents="none"
      >
        <Defs>
          {/* Each gradient runs along the chord of its quarter-arc */}
          <SvgLinearGradient id="gTR" x1={cx} y1={cy - r} x2={cx + r} y2={cy} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#ef4444" stopOpacity="0" />
            <Stop offset="1" stopColor="#ef4444" stopOpacity="1" />
          </SvgLinearGradient>
          <SvgLinearGradient id="gRB" x1={cx + r} y1={cy} x2={cx} y2={cy + r} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#ef4444" stopOpacity="1" />
            <Stop offset="1" stopColor="#ef4444" stopOpacity="0" />
          </SvgLinearGradient>
          <SvgLinearGradient id="gBL" x1={cx} y1={cy + r} x2={cx - r} y2={cy} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#22c55e" stopOpacity="0" />
            <Stop offset="1" stopColor="#22c55e" stopOpacity="1" />
          </SvgLinearGradient>
          <SvgLinearGradient id="gLT" x1={cx - r} y1={cy} x2={cx} y2={cy - r} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#22c55e" stopOpacity="1" />
            <Stop offset="1" stopColor="#22c55e" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        {/* Glow — uses the same gradients so it also fades at top/bottom */}
        {([arcTR, "gTR", arcRB, "gRB", arcBL, "gBL", arcLT, "gLT"] as const).reduce<React.ReactNode[]>((acc, _, i, arr) => {
          if (i % 2 !== 0) return acc;
          const d = arr[i] as string;
          const id = arr[i + 1] as string;
          return [
            ...acc,
            <Path key={`g3-${id}`} d={d} fill="none" stroke={`url(#${id})`} strokeWidth={sw + 22} strokeOpacity={0.04} strokeLinecap="butt" />,
            <Path key={`g2-${id}`} d={d} fill="none" stroke={`url(#${id})`} strokeWidth={sw + 12} strokeOpacity={0.09} strokeLinecap="butt" />,
            <Path key={`g1-${id}`} d={d} fill="none" stroke={`url(#${id})`} strokeWidth={sw + 5}  strokeOpacity={0.20} strokeLinecap="butt" />,
          ];
        }, [])}

        {/* Main border */}
        <Path d={arcTR} fill="none" stroke="url(#gTR)" strokeWidth={sw} strokeLinecap="butt" />
        <Path d={arcRB} fill="none" stroke="url(#gRB)" strokeWidth={sw} strokeLinecap="butt" />
        <Path d={arcBL} fill="none" stroke="url(#gBL)" strokeWidth={sw} strokeLinecap="butt" />
        <Path d={arcLT} fill="none" stroke="url(#gLT)" strokeWidth={sw} strokeLinecap="butt" />
      </Svg>
      {children}
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

  const dmBgUri = useMemo(
    () => DM_BG_URIS[Math.floor(Math.random() * DM_BG_URIS.length)],
    [],
  );

  const titleHeight = useMemo(() => Math.round(windowHeight * 0.28), [windowHeight]);
  const titleTopOffset = useMemo(() => Math.round(windowHeight * 0.002), [windowHeight]);
  const titleRevealTargetY = useMemo(
    () => (insets.top + titleTopOffset) + titleHeight / 2 - windowHeight / 2,
    [insets.top, titleTopOffset, titleHeight, windowHeight],
  );

  // Hero images
  const p0HeroImage = useMemo(() => {
    if (!p0) return null;
    return heroes.find((h) => h.id === p0.characterId)?.deathmatch_image ?? null;
  }, [heroes, p0]);
  const p1HeroImage = useMemo(() => {
    if (!p1) return null;
    return heroes.find((h) => h.id === p1.characterId)?.deathmatch_image ?? null;
  }, [heroes, p1]);
  const p0ProfileImage = useMemo(() => {
    if (!p0) return null;
    return heroes.find((h) => h.id === p0.characterId)?.profileImage ?? null;
  }, [heroes, p0]);
  const p1ProfileImage = useMemo(() => {
    if (!p1) return null;
    return heroes.find((h) => h.id === p1.characterId)?.profileImage ?? null;
  }, [heroes, p1]);

  // ── State ────────────────────────────────────────────────────────────────────
  const secretsRef = useRef<Record<string, number>>({});
  const [secretsReady, setSecretsReady] = useState<Set<string>>(new Set());
  const [histories, setHistories] = useState<Record<string, GuessEntry[]>>({});
  const [turnIdx, setTurnIdx] = useState(0);
  const firstCorrectIdRef = useRef<string | null>(null);
  const [firstCorrectId, setFirstCorrectIdState] = useState<string | null>(null);
  const doneRef = useRef(false);

  // Numpad input (setup phases + opp_confirm entry)
  const [input, setInput] = useState("");

  // Stepper guess value (guessing phase)
  const [guess, setGuess] = useState(50);

  // Online drum picker value
  const [onlinePickerValue, setOnlinePickerValue] = useState(50);

  const peekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pending results
  const [pendingResult, setPendingResult] = useState<PendingResult | null>(null);

  const [phase, setPhase] = useState<Phase>(
    mode === "ONLINE" ? "how_to_play" : "intro",
  );
  // which player is shown in the "player_intro" screen (1 = p1 picks first, 0 = p0 picks second)
  const [introPlayerIdx, setIntroPlayerIdx] = useState<0 | 1>(1);

  // ── Intro animation refs ──────────────────────────────────────────────────
  const heroLeftX = useRef(new Animated.Value(-windowWidth)).current;
  const heroRightX = useRef(new Animated.Value(windowWidth)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const vsScale = useRef(new Animated.Value(0.3)).current;
  const vsTranslateY = useRef(new Animated.Value(-80)).current;
  const vsOpacity = useRef(new Animated.Value(0)).current;
  const letsGoOpacity = useRef(new Animated.Value(0)).current;
  const letsGoY = useRef(new Animated.Value(40)).current;

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

  const gameSlideY = useRef(new Animated.Value(0)).current;
  const cameFromIntroRef = useRef(false);

  // ── Setup circle animation refs ───────────────────────────────────────────
  const setupCircleY = useRef(new Animated.Value(-400)).current;
  const setupCircleScale = useRef(new Animated.Value(0.4)).current;
  const setupBtnTranslateY = useRef(new Animated.Value(120)).current;
  const setupBtnOpacity = useRef(new Animated.Value(0)).current;
  const setupPulseAnim = useRef(new Animated.Value(1)).current;
  const setupTextInputRef = useRef<TextInput>(null);

  // ── Let's go → guessing transition refs ──────────────────────────────────
  const letsGoTitleY = useRef(new Animated.Value(0)).current;
  const letsGoProfilesY = useRef(new Animated.Value(0)).current;
  const guessCircleDropY = useRef(new Animated.Value(-400)).current;
  const guessCircleDropScale = useRef(new Animated.Value(0.4)).current;
  const guessBtnTranslateY2 = useRef(new Animated.Value(120)).current;
  const guessBtnOpacity2 = useRef(new Animated.Value(0)).current;
  const resultOverlayOpacity = useRef(new Animated.Value(0)).current;

  const [showingLocalResult, setShowingLocalResult] = useState(false);
  const [localResultHintState, setLocalResultHintState] = useState<GuessEntry["hint"] | null>(null);

  // ── Setup success: where to go after "Good Job" screen ───────────────────
  const [setupSuccessTarget, setSetupSuccessTarget] = useState<"pass_1" | "local_lets_go" | null>(null);

  // ── How To Play animation refs ────────────────────────────────────────────
  const htpTitleScale = useRef(new Animated.Value(10)).current;
  const htpTitleRotate = useRef(new Animated.Value(0)).current;
  const htpTitleOpacity = useRef(new Animated.Value(0)).current;
  const htpFlash = useRef(new Animated.Value(0)).current;
  const htpRuleAnims = useRef(
    Array.from({ length: 4 }, () => ({
      opacity: new Animated.Value(0),
      x: new Animated.Value(-50),
    })),
  ).current;
  const htpGotItOpacity = useRef(new Animated.Value(0)).current;

  // ── Shake ─────────────────────────────────────────────────────────────────
  const shakeX = useRef(new Animated.Value(0)).current;
  const pulseBanner = useRef(new Animated.Value(1)).current;

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeX, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeX]);

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

  useEffect(() => {
    return () => { if (peekTimerRef.current) clearTimeout(peekTimerRef.current); };
  }, []);

  // ── Guessing circle drop animation ────────────────────────────────────────
  // Re-triggers on each new turn (turnIdx change) and when result overlay clears
  useEffect(() => {
    if (phase !== "guessing" || showingLocalResult) return;
    guessCircleDropY.setValue(-400);
    guessCircleDropScale.setValue(0.4);
    guessBtnTranslateY2.setValue(120);
    guessBtnOpacity2.setValue(0);

    const spring = Animated.parallel([
      Animated.spring(guessCircleDropY, { toValue: 0, speed: 14, bounciness: 8, useNativeDriver: true }),
      Animated.spring(guessCircleDropScale, { toValue: 1, speed: 14, bounciness: 8, useNativeDriver: true }),
    ]);
    spring.start(() => {
      Animated.parallel([
        Animated.timing(guessBtnTranslateY2, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(guessBtnOpacity2, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
    });
    return () => spring.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, turnIdx, showingLocalResult]);

  // ── Intro animation sequence ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "intro") return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const runIntro = async () => {
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

      await startAnim(
        Animated.sequence([
          Animated.timing(animTitleScale, { toValue: 1.15, duration: 110, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(animTitleScale, { toValue: 0.93, duration: 110, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(animTitleScale, { toValue: 1.09, duration: 100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(animTitleScale, { toValue: 1.0, duration: 100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
      );

      if (cancelled) return;

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

      await new Promise<void>((res) => { timers.push(setTimeout(res, 350)); });
      if (cancelled) return;

      await startAnim(
        Animated.parallel([
          Animated.timing(heroOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
          Animated.spring(heroLeftX, { toValue: 0, speed: 9, bounciness: 10, useNativeDriver: true }),
          Animated.spring(heroRightX, { toValue: 0, speed: 9, bounciness: 10, useNativeDriver: true }),
        ]),
      );

      if (cancelled) return;

      await new Promise<void>((res) => { timers.push(setTimeout(res, 320)); });
      if (cancelled) return;

      vsScale.setValue(9);
      await startAnim(
        Animated.parallel([
          Animated.timing(vsOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.spring(vsScale, { toValue: 1, speed: 24, bounciness: 3, useNativeDriver: true }),
        ]),
      );

      if (cancelled) return;

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

  // ── How To Play animation ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "how_to_play") return;

    // Reset
    htpTitleScale.setValue(10);
    htpTitleRotate.setValue(0);
    htpTitleOpacity.setValue(0);
    htpFlash.setValue(0);
    htpGotItOpacity.setValue(0);
    htpRuleAnims.forEach((a) => { a.opacity.setValue(0); a.x.setValue(-50); });

    let cancelled = false;
    const run = async () => {
      // Title slams in
      await startAnim(
        Animated.parallel([
          Animated.timing(htpTitleOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(htpTitleScale, {
            toValue: 1,
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(htpTitleRotate, {
            toValue: 1,
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      );
      if (cancelled) return;

      // Bounce
      await startAnim(
        Animated.sequence([
          Animated.timing(htpTitleScale, { toValue: 1.08, duration: 100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(htpTitleScale, { toValue: 1.0, duration: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
      );
      if (cancelled) return;

      // Flash
      Animated.sequence([
        Animated.timing(htpFlash, { toValue: 0.6, duration: 70, useNativeDriver: true }),
        Animated.timing(htpFlash, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();

      // Rules slide in sequentially
      for (let i = 0; i < htpRuleAnims.length; i++) {
        if (cancelled) return;
        await startAnim(
          Animated.parallel([
            Animated.timing(htpRuleAnims[i].opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
            Animated.timing(htpRuleAnims[i].x, {
              toValue: 0,
              duration: 320,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        );
        // small pause between rules
        if (i < htpRuleAnims.length - 1) {
          await new Promise<void>((res) => setTimeout(res, 80));
        }
      }
      if (cancelled) return;

      // GOT IT button
      Animated.timing(htpGotItOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    };

    void run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Let's Go ──────────────────────────────────────────────────────────────
  const handleLetsGo = useCallback(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(heroLeftX, { toValue: -windowWidth, speed: 14, bounciness: 0, useNativeDriver: true }),
      Animated.spring(heroRightX, { toValue: windowWidth, speed: 14, bounciness: 0, useNativeDriver: true }),
      Animated.timing(vsOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(letsGoOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      cameFromIntroRef.current = true;
      // Show How To Play before setup
      setPhase("how_to_play");
    });
  }, [heroLeftX, heroOpacity, heroRightX, letsGoOpacity, vsOpacity]);

  // ── Finish ────────────────────────────────────────────────────────────────
  const finish = useCallback(
    (winnerIds: string[]) => {
      if (doneRef.current) return;
      doneRef.current = true;
      setDeathMatchWinners(winnerIds);
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Winner" }] }));
    },
    [navigation, setDeathMatchWinners],
  );

  // ── Online auto-advance ───────────────────────────────────────────────────
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
        setGuess(50);
      }
    }, ONLINE_RESULT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [finish, mode, pendingResult]);

  // ── Local: apply guess result immediately (no opp_confirm screen) ────────
  const applyLocalGuessResult = useCallback((
    guesserId: string,
    value: number,
    computedHint: GuessEntry["hint"],
  ) => {
    setHistories((prev) => ({
      ...prev,
      [guesserId]: [...(prev[guesserId] ?? []), { value, hint: computedHint }],
    }));

    const prevFirstCorrect = firstCorrectIdRef.current;
    const nextTurnIdx = alivePlayers[0].id === guesserId ? 1 : 0;
    let isGameOver = false;
    let winnerIds: string[] = [];

    if (computedHint === "correct") {
      if (prevFirstCorrect !== null && prevFirstCorrect !== guesserId) {
        isGameOver = true;
        winnerIds = [prevFirstCorrect, guesserId];
      } else if (prevFirstCorrect === null) {
        if (guesserId === alivePlayers[0].id) {
          firstCorrectIdRef.current = guesserId;
          setFirstCorrectIdState(guesserId);
        } else {
          isGameOver = true;
          winnerIds = [guesserId];
        }
      }
    } else if (prevFirstCorrect !== null) {
      isGameOver = true;
      winnerIds = [prevFirstCorrect];
    }

    if (isGameOver) {
      finish(winnerIds);
    } else {
      const nextGuesser = alivePlayers[nextTurnIdx];
      const nextHistory = histories[nextGuesser?.id ?? ""] ?? [];
      const [lo, hi] = computeValidRange(nextHistory);
      setGuess(Math.round((lo + hi) / 2));
      setTurnIdx(nextTurnIdx);
    }
  }, [alivePlayers, finish, histories]);

  // ── Online applyGuess ─────────────────────────────────────────────────────
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

  // ── Confirm secret (setup phases) ─────────────────────────────────────────
  const handleConfirmSecret = useCallback(() => {
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
      // LOCAL: setup_you = p0 sets first, setup_opp = p1 sets second
      const setupPlayer = phase === "setup_opp" ? p1 : p0;
      if (!setupPlayer) return;
      secretsRef.current[setupPlayer.id] = num;
      setInput("");
      setSetupSuccessTarget(phase === "setup_you" ? "pass_1" : "local_lets_go");
      setPhase("setup_good_job");
    }
  }, [input, mode, onlinePlayerId, phase, p0, p1, shake]);


  // ── Setup circle: dramatic drop animation ─────────────────────────────────
  useEffect(() => {
    if (phase !== "setup_opp" && phase !== "setup_you") return;

    setupCircleY.setValue(-400);
    setupCircleScale.setValue(0.4);
    setupBtnTranslateY.setValue(120);
    setupBtnOpacity.setValue(0);
    setupPulseAnim.setValue(1);

    Animated.parallel([
      Animated.spring(setupCircleY, { toValue: 0, speed: 7, bounciness: 16, useNativeDriver: true }),
      Animated.spring(setupCircleScale, { toValue: 1, speed: 7, bounciness: 16, useNativeDriver: true }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(setupPulseAnim, { toValue: 0.25, duration: 950, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(setupPulseAnim, { toValue: 1, duration: 950, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Setup button: reveal when valid number entered ────────────────────────
  useEffect(() => {
    if (phase !== "setup_opp" && phase !== "setup_you") return;
    const num = parseInt(input, 10);
    const valid = input.length > 0 && !isNaN(num) && num >= 1 && num <= 100;
    if (valid) {
      Animated.parallel([
        Animated.spring(setupBtnTranslateY, { toValue: 0, speed: 16, bounciness: 6, useNativeDriver: true }),
        Animated.timing(setupBtnOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(setupBtnTranslateY, { toValue: 120, duration: 180, useNativeDriver: true }),
        Animated.timing(setupBtnOpacity, { toValue: 0, duration: 140, useNativeDriver: true }),
      ]).start();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, phase]);

  // ── Setup circle +/- handlers ─────────────────────────────────────────────
  const handleSetupMinus = useCallback(() => {
    const current = parseInt(input, 10);
    if (isNaN(current)) return;
    if (current <= 1) { shake(); return; }
    setInput(String(current - 1));
  }, [input, shake]);

  const handleSetupPlus = useCallback(() => {
    const current = parseInt(input, 10);
    if (isNaN(current)) { setInput("1"); return; }
    if (current >= 100) { shake(); return; }
    setInput(String(current + 1));
  }, [input, shake]);


  // ── Submit guess ──────────────────────────────────────────────────────────
  const handleSubmitGuess = useCallback(() => {
    if (doneRef.current || pendingResult) return;
    const [lo, hi] = computeValidRange(
      histories[(mode === "ONLINE"
        ? alivePlayers.find((p) => p.id === onlinePlayerId)?.id
        : alivePlayers[turnIdx]?.id) ?? ""] ?? [],
    );
    if (guess < lo || guess > hi) { shake(); return; }

    if (mode === "ONLINE") {
      const guesser = alivePlayers.find((p) => p.id === onlinePlayerId);
      if (!guesser) return;
      sendMultiplayerRelay({
        type: DEATHMATCH_GUESS_MESSAGE_TYPE,
        guesserId: guesser.id,
        guess,
      });
      applyGuess(guesser.id, guess);
    } else {
      // LOCAL: compute hint, show result overlay, then apply
      const guesser = alivePlayers[turnIdx];
      if (!guesser) return;
      const target = alivePlayers.find((p) => p.id !== guesser.id);
      if (!target) return;
      const secret = secretsRef.current[target.id];
      if (secret == null) return;

      const computedHint: GuessEntry["hint"] =
        guess === secret ? "correct"
        : guess < secret ? "higher"
        : "lower";

      const guesserId = guesser.id;
      const guessValue = guess;

      setLocalResultHintState(computedHint);
      setShowingLocalResult(true);

      Animated.sequence([
        Animated.timing(resultOverlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(900),
        Animated.timing(resultOverlayOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start(() => {
        setShowingLocalResult(false);
        setLocalResultHintState(null);
        applyLocalGuessResult(guesserId, guessValue, computedHint);
      });
    }
  }, [alivePlayers, applyGuess, applyLocalGuessResult, guess, histories, mode, onlinePlayerId, pendingResult, resultOverlayOpacity, shake, turnIdx]);

  // ── Derived UI ────────────────────────────────────────────────────────────
  const currentGuesser = alivePlayers[turnIdx] ?? p0;
  const isMyOnlineTurn = mode === "ONLINE" && currentGuesser?.id === onlinePlayerId;
  const isOnlineWaiting = mode === "ONLINE" && !isMyOnlineTurn;
  const currentHistory: GuessEntry[] = currentGuesser ? (histories[currentGuesser.id] ?? []) : [];
  const [rangeLo, rangeHi] = computeValidRange(currentHistory);
  const firstCorrectPlayer = firstCorrectId
    ? alivePlayers.find((p) => p.id === firstCorrectId) ?? null
    : null;

  // ── Persistent title ──────────────────────────────────────────────────────
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

  const gameContentTop = insets.top + titleHeight + titleTopOffset + 16;

  // ── Phase: How To Play ────────────────────────────────────────────────────
  if (phase === "how_to_play") {
    const handleGotIt = () => {
      if (mode === "ONLINE") {
        setPhase("setup_online");
      } else {
        setIntroPlayerIdx(0);
        setPhase("player_intro");
      }
    };

    const htpTitleW = Math.min(windowWidth * 0.94, 480);
    const btnBottom = insets.bottom + 20;

    return (
      <SafeAreaView style={styles.fill} edges={["right", "left"]}>
        <ImageBackground source={{ uri: dmBgUri }} style={styles.bg} resizeMode="cover">
          {/* Darker background dim */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.70)" }]} />

          {/* Blur overlay */}
          <BlurView
            intensity={28}
            tint="dark"
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Impact flash */}
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: "#fff", opacity: htpFlash, zIndex: 20 }]}
          />

          {/* Scrollable content — extra bottom padding so rules don't hide under the button */}
          <ScrollView
            contentContainerStyle={[
              styles.htpScroll,
              {
                paddingTop: insets.top + 24,
                paddingBottom: btnBottom + 100,
                paddingHorizontal: hPad,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Animated title */}
            <Animated.View
              style={[
                styles.htpTitleWrap,
                {
                  opacity: htpTitleOpacity,
                  transform: [
                    { scale: htpTitleScale },
                    {
                      rotate: htpTitleRotate.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["-360deg", "0deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              <AppImage
                source={{ uri: HTP_TITLE_URI }}
                contentFit="contain"
                style={{ width: htpTitleW, height: htpTitleW * 0.42 }}
              />
            </Animated.View>

            {/* Rules */}
            <View style={styles.htpRulesList}>
              {HTP_RULES.map((rule, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.htpRuleRow,
                    {
                      opacity: htpRuleAnims[i].opacity,
                      transform: [{ translateX: htpRuleAnims[i].x }],
                    },
                  ]}
                >
                  <View style={styles.htpIconWrap}>
                    <AppImage
                      source={{ uri: rule.uri }}
                      contentFit="contain"
                      style={{ width: 96, height: 96 }}
                    />
                  </View>
                  <CustomText
                    variant="p-small"
                    sizeDelta={4}
                    textColor="rgba(255,255,255,0.92)"
                    allowWrap
                    style={{ flex: 1, lineHeight: 22 }}
                  >
                    {rule.text}
                  </CustomText>
                </Animated.View>
              ))}
            </View>
          </ScrollView>

          {/* GOT IT — pinned to bottom */}
          <Animated.View
            style={[
              styles.htpBtnFixed,
              { bottom: btnBottom, paddingHorizontal: hPad, opacity: htpGotItOpacity },
            ]}
          >
            <CustomButton
              title="GOT IT!"
              fullWidth
              onPress={handleGotIt}
              backgroundImage={backgrounds.bg026}
              glow
              btnSize="md"
              fontSize="md"
              glowColor="rgba(34,197,94,0.8)"
              shadowColor="#004400"
            />
          </Animated.View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  // ── Phase: Player Intro ───────────────────────────────────────────────────
  if (phase === "player_intro") {
    const introPlayer = introPlayerIdx === 1 ? p1 : p0;
    const introHeroImage = introPlayerIdx === 1 ? p1HeroImage : p0HeroImage;
    const btnBottom = insets.bottom + 20;

    const handleGotPhone = () => {
      setInput("");
      if (introPlayerIdx === 1) {
        setPhase("setup_opp");
      } else {
        setPhase("setup_you");
      }
    };

    return (
      <SafeAreaView style={styles.fill} edges={["right", "left"]}>
        <ImageBackground source={{ uri: dmBgUri }} style={styles.bg} resizeMode="cover">
          {/* Dark overlay */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.72)" }]} />

          {/* Blur overlay */}
          <BlurView
            intensity={28}
            tint="dark"
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Hero art — lower portion of screen */}
          {introHeroImage && (
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                { top: windowHeight * 0.30, alignItems: "center", justifyContent: "flex-start" },
              ]}
            >
              <AppImage
                source={introHeroImage}
                contentFit="contain"
                style={{ width: windowWidth * 1.1, height: windowHeight * 0.72 }}
              />
            </View>
          )}

          {/* Top content */}
          <View
            style={[
              styles.playerIntroTop,
              { paddingTop: insets.top + 32, paddingHorizontal: hPad },
            ]}
          >
            {/* Player chip badge */}
            <View style={styles.playerIntroChip}>
              <CustomText variant="h6-headline" textColor="#22c55e">
                {introPlayer?.name ?? ""}
              </CustomText>
            </View>

            <CustomText variant="h3" textColor="#fff" className="text-center" allowWrap>
              {"YOUR TURN"}
            </CustomText>

            <CustomText
              variant="p-small"
              sizeDelta={2}
              textColor="rgba(255,255,255,0.70)"
              className="text-center"
              allowWrap
            >
              {"Pick a number between 1 and 100"}
            </CustomText>
          </View>

          {/* Button pinned at bottom */}
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: btnBottom,
              paddingHorizontal: hPad,
            }}
          >
            <CustomButton
              title={"I'VE GOT THE PHONE"}
              fullWidth
              onPress={handleGotPhone}
              backgroundImage={backgrounds.bg026}
              glow
              btnSize="md"
              fontSize="md"
              glowColor="rgba(34,197,94,0.8)"
              shadowColor="#004400"
            />
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  // ── Phase: Intro ──────────────────────────────────────────────────────────
  if (phase === "intro") {
    const heroSize = windowWidth * 0.5 * 2.25;

    return (
      <SafeAreaView style={styles.fill} edges={["right", "left"]}>
        <ImageBackground source={{ uri: dmBgUri }} style={styles.bg} resizeMode="cover">
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

          <Animated.View
            pointerEvents="none"
            style={[
              styles.introHeroBase,
              {
                width: heroSize,
                height: heroSize * 1.6,
                top: insets.top + titleTopOffset + titleHeight - 140,
                left: windowWidth / 2 - heroSize + 110,
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
                left: windowWidth / 2 - 110,
                opacity: heroOpacity,
                transform: [{ translateX: heroRightX }, { scaleX: -1 }],
              },
            ]}
          >
            {p1HeroImage && (
              <AppImage source={p1HeroImage} contentFit="contain" style={StyleSheet.absoluteFill} />
            )}
          </Animated.View>

          <View pointerEvents="none" style={[styles.vsWrap, { justifyContent: "flex-start", paddingTop: windowHeight * 0.6 }]}>
            <Animated.View
              style={{
                width: windowWidth * 0.42,
                height: windowWidth * 0.42,
                opacity: vsOpacity,
                transform: [{ scale: vsScale }],
              }}
            >
              <AppImage source={{ uri: DM_VS_URI }} contentFit="contain" style={StyleSheet.absoluteFill} />
            </Animated.View>
          </View>

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

  // ── Phase: Online setup (drum picker) ────────────────────────────────────
  if (phase === "setup_online") {
    return (
      <SafeAreaView style={styles.fill} edges={["right", "left"]}>
        <ImageBackground source={{ uri: dmBgUri }} style={styles.bg} resizeMode="cover">
          <View style={styles.bgDim} />
          {renderPersistentTitle()}
          <Animated.View
            style={[
              styles.container,
              {
                paddingTop: gameContentTop,
                paddingBottom: insets.bottom + 16,
                paddingHorizontal: hPad,
                transform: [{ translateY: gameSlideY }],
              },
            ]}
          >
            <CustomText variant="h4" textColor="#fff" className="text-center" allowWrap>
              {"CHOOSE\nYOUR NUMBER"}
            </CustomText>
            <CustomText variant="p-small" textColor="rgba(255,255,255,0.55)" className="text-center">
              {"Pick a number between 1 and 100"}
            </CustomText>
            <DrumPicker value={onlinePickerValue} onChange={setOnlinePickerValue} />
            <CustomText variant="p-small" textColor="rgba(255,255,255,0.4)" className="text-center">
              {"Your number is hidden from your opponent"}
            </CustomText>
            <View style={styles.actionRow}>
              <CustomButton
                title="LOCK IN"
                fullWidth
                onPress={() => {
                  const myId = onlinePlayerId!;
                  secretsRef.current[myId] = onlinePickerValue;
                  setSecretsReady((prev) => new Set([...prev, myId]));
                  sendMultiplayerRelay({
                    type: DEATHMATCH_SECRET_MESSAGE_TYPE,
                    playerId: myId,
                    secret: onlinePickerValue,
                  });
                  setPhase("online_wait");
                }}
                backgroundImage={backgrounds.bg026}
                glow btnSize="md" fontSize="md"
                glowColor="rgba(34,197,94,0.7)"
                shadowColor="#004400"
              />
            </View>
          </Animated.View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  // ── Phase: Local setup (dramatic circle picker) ───────────────────────────
  if (phase === "setup_opp" || phase === "setup_you") {
    const isYou = phase === "setup_you";
    const setupPlayer = isYou ? p0 : p1;
    const setupHeroImage = isYou ? p0HeroImage : p1HeroImage;
    return (
      <SafeAreaView style={styles.fill} edges={["right", "left"]}>
        <ImageBackground source={{ uri: dmBgUri }} style={styles.bg} resizeMode="cover">

          {/* Hero art — UNDER the overlay */}
          {setupHeroImage && (
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                { top: windowHeight * 0.28, alignItems: "center", justifyContent: "flex-start" },
              ]}
            >
              <AppImage
                source={setupHeroImage}
                contentFit="contain"
                style={{ width: windowWidth * 1.1, height: windowHeight * 0.74 }}
              />
            </View>
          )}

          {/* Dark overlay */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.76)" }]} />
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />

          {/* Hidden TextInput — keyboard trigger only */}
          <TextInput
            ref={setupTextInputRef}
            value={input}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, "");
              if (cleaned.length > 3) return;
              if (cleaned !== "" && parseInt(cleaned, 10) > 100) return;
              setInput(cleaned);
            }}
            keyboardType="number-pad"
            style={{ position: "absolute", opacity: 0, left: -9999, width: 1, height: 1 }}
          />

          {/* Top content */}
          <View style={[styles.playerIntroTop, { paddingTop: insets.top + 28, paddingHorizontal: hPad }]}>
            <View style={styles.playerIntroChip}>
              <CustomText variant="h6-headline" textColor="#22c55e">
                {setupPlayer?.name ?? ""}
              </CustomText>
            </View>
            <CustomText variant="h5-headline" textColor="#fff" className="text-center" allowWrap>
              {"PICK YOUR SECRET NUMBER"}
            </CustomText>
            <CustomText variant="p-small" sizeDelta={-1} textColor="rgba(255,255,255,0.5)" className="text-center" allowWrap>
              {"Between 1 and 100 — don't let the other player see!"}
            </CustomText>
          </View>

          {/* Center area */}
          <View style={{ flex: 1 }}>
            <View style={styles.setupCenterArea}>
              <Animated.View
                style={{
                  alignItems: "center",
                  transform: [
                    { translateY: setupCircleY },
                    { scale: setupCircleScale },
                  ],
                }}
              >
                {/* Lightbulb */}
                <AppImage
                  source={{ uri: DM_LIGHTBULB_URI }}
                  contentFit="contain"
                  style={{ width: 72, height: 72, zIndex: 0, marginBottom: -12 }}
                />

                {/* − circle + row */}
                <View style={[styles.setupStepperRow, { zIndex: 1 }]}>
                  <Pressable
                    style={({ pressed }) => [styles.setupStepBtn, styles.setupMinusBtn, pressed && { opacity: 0.6 }]}
                    onPress={handleSetupMinus}
                    onLongPress={() => {
                      const n = parseInt(input, 10);
                      if (!isNaN(n) && n > 5) setInput(String(n - 5));
                      else if (!isNaN(n)) setInput("1");
                    }}
                  >
                    <CustomText variant="h2" textColor="#ef4444">{"−"}</CustomText>
                  </Pressable>

                  <Pressable onPress={() => setupTextInputRef.current?.focus()}>
                    <GradientGuessCircle>
                      <Animated.View style={[styles.setupCircle, { borderWidth: 0, transform: [{ translateX: shakeX }] }]}>
                        <CustomText
                          variant="h2"
                          sizeDelta={input.length <= 1 ? -10 : input.length === 2 ? -16 : -20}
                          textColor={input ? "#fff" : "rgba(255,255,255,0.2)"}
                        >
                          {input || "?"}
                        </CustomText>
                      </Animated.View>
                    </GradientGuessCircle>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.setupStepBtn, styles.setupPlusBtn, pressed && { opacity: 0.6 }]}
                    onPress={handleSetupPlus}
                    onLongPress={() => {
                      const n = parseInt(input, 10);
                      if (isNaN(n)) setInput("5");
                      else if (n <= 95) setInput(String(n + 5));
                      else setInput("100");
                    }}
                  >
                    <CustomText variant="h2" textColor="#22c55e">{"+"}</CustomText>
                  </Pressable>
                </View>

                <Animated.View style={{ opacity: setupPulseAnim, marginTop: 18, zIndex: 1 }}>
                  <CustomText variant="p-small" textColor="#fff" className="text-center">
                    {"Tap the circle to type"}
                  </CustomText>
                </Animated.View>
              </Animated.View>
            </View>
          </View>

          {/* Confirm button */}
          <Animated.View
            style={[
              styles.setupBtnWrap,
              {
                bottom: insets.bottom + 24,
                paddingHorizontal: hPad,
                opacity: setupBtnOpacity,
                transform: [{ translateY: setupBtnTranslateY }],
              },
            ]}
            pointerEvents={input.length > 0 ? "auto" : "none"}
          >
            <CustomButton
              title={"NUMBER LOCKED IN ✓"}
              fullWidth
              onPress={handleConfirmSecret}
              backgroundImage={backgrounds.bg026}
              glow btnSize="md" fontSize="md"
              glowColor="rgba(34,197,94,0.85)"
              shadowColor="#004400"
            />
          </Animated.View>

        </ImageBackground>
      </SafeAreaView>
    );
  }

  // ── Phase: Good Job (after picking number) ───────────────────────────────
  if (phase === "setup_good_job") {
    const goodJobForP0 = setupSuccessTarget === "pass_1";
    const goodJobPlayer = goodJobForP0 ? p0 : p1;
    const goodJobHeroImage = goodJobForP0 ? p0HeroImage : p1HeroImage;
    const btnBottom = insets.bottom + 20;

    const handleContinue = () => {
      const target = setupSuccessTarget!;
      setSetupSuccessTarget(null);
      setPhase(target);
    };

    return (
      <SafeAreaView style={styles.fill} edges={["right", "left"]}>
        <ImageBackground source={{ uri: dmBgUri }} style={styles.bg} resizeMode="cover">
          {/* Dark overlay */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.72)" }]} />
          {/* Blur overlay */}
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
          {/* Hero art */}
          {goodJobHeroImage && (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { top: windowHeight * 0.30, alignItems: "center", justifyContent: "flex-start" }]}
            >
              <AppImage
                source={goodJobHeroImage}
                contentFit="contain"
                style={{ width: windowWidth * 1.1, height: windowHeight * 0.72 }}
              />
            </View>
          )}
          {/* Top content */}
          <View style={[styles.playerIntroTop, { paddingTop: insets.top + 32, paddingHorizontal: hPad }]}>
            <View style={styles.playerIntroChip}>
              <CustomText variant="h6-headline" textColor="#22c55e">
                {goodJobPlayer?.name ?? ""}
              </CustomText>
            </View>
            <CustomText variant="h3" textColor="#fff" className="text-center" allowWrap>
              {"GOOD JOB"}
            </CustomText>
            <CustomText variant="p-small" sizeDelta={2} textColor="rgba(255,255,255,0.70)" className="text-center" allowWrap>
              {"...and good luck!"}
            </CustomText>
          </View>
          {/* Button pinned at bottom */}
          <View style={{ position: "absolute", left: 0, right: 0, bottom: btnBottom, paddingHorizontal: hPad }}>
            <CustomButton
              title={"CONTINUE"}
              fullWidth
              onPress={handleContinue}
              backgroundImage={backgrounds.bg026}
              glow btnSize="md" fontSize="md"
              glowColor="rgba(34,197,94,0.8)"
              shadowColor="#004400"
            />
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  // ── Phase: Pass device (LOCAL) ────────────────────────────────────────────
  if (phase === "pass_1") {
    const targetName = p1?.name ?? "Opponent";
    const btnBottom = insets.bottom + 20;

    return (
      <SafeAreaView style={styles.fill} edges={["right", "left"]}>
        <ImageBackground source={{ uri: dmBgUri }} style={styles.bg} resizeMode="cover">
          {/* Dark overlay */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.72)" }]} />
          {/* Blur overlay */}
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
          {/* Hand-the-phone image — same position as hero in player_intro */}
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { top: windowHeight * 0.30, alignItems: "center", justifyContent: "flex-start" }]}
          >
            <AppImage
              source={{ uri: DM_HANDTHEPHONE_URI }}
              contentFit="contain"
              style={{ width: windowWidth, height: windowHeight * 0.72 }}
            />
          </View>
          {/* Top content */}
          <View style={[styles.playerIntroTop, { paddingTop: insets.top + 32, paddingHorizontal: hPad }]}>
            <View style={styles.playerIntroChip}>
              <CustomText variant="h6-headline" textColor="#22c55e">
                {targetName}
              </CustomText>
            </View>
            <CustomText variant="h3" textColor="#fff" className="text-center" allowWrap>
              {"PASS THE PHONE"}
            </CustomText>
            <CustomText variant="p-small" sizeDelta={2} textColor="rgba(255,255,255,0.70)" className="text-center" allowWrap>
              {`Give it to ${targetName} to pick their secret number`}
            </CustomText>
          </View>
          {/* Skip — subtle top right */}
          <Pressable
            onPress={() => { setInput(""); setPhase("setup_opp"); }}
            style={{ position: "absolute", top: insets.top + 14, right: hPad, zIndex: 20, padding: 10 }}
          >
            <CustomText variant="p-small" textColor="rgba(255,255,255,0.30)">{"Skip →"}</CustomText>
          </Pressable>
          {/* Button pinned at bottom */}
          <View style={{ position: "absolute", left: 0, right: 0, bottom: btnBottom, paddingHorizontal: hPad }}>
            <CustomButton
              title={"I'VE GOT IT"}
              fullWidth
              onPress={() => { setIntroPlayerIdx(1); setPhase("player_intro"); }}
              backgroundImage={backgrounds.bg026}
              glow btnSize="md" fontSize="md"
              glowColor="rgba(34,197,94,0.7)"
              shadowColor="#004400"
            />
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  // ── Phase: Let the game begin (LOCAL) ─────────────────────────────────────
  if (phase === "local_lets_go") {
    const handleLetsGo = () => {
      // Profiles center Y ≈ halfway between gameContentTop and bottom padding
      const profAreaTop = gameContentTop;
      const profAreaBottom = windowHeight - (insets.bottom + 96);
      const profCenterY = (profAreaTop + profAreaBottom) / 2;
      // Target: center of title area
      const titleCenterY = insets.top + titleTopOffset + titleHeight / 2;
      const profileMoveUp = profCenterY - titleCenterY;

      Animated.parallel([
        Animated.timing(letsGoTitleY, {
          toValue: -(titleHeight + insets.top + 100),
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(letsGoProfilesY, {
          toValue: -profileMoveUp,
          speed: 10,
          bounciness: 2,
          useNativeDriver: true,
        }),
      ]).start(() => {
        letsGoTitleY.setValue(0);
        letsGoProfilesY.setValue(0);
        setTurnIdx(0);
        setGuess(50);
        setPhase("guessing");
      });
    };

    const letsGoAvailW = windowWidth - 2 * hPad;
    // VS takes ~27% of available width, capped at 139px
    const letsGoVsSize = Math.min(139, Math.floor(letsGoAvailW * 0.27));
    const letsGoColGap = 8;
    // Both player columns are equal: fill the remaining space split in half
    const letsGoColW = Math.floor((letsGoAvailW - letsGoVsSize - letsGoColGap * 2) / 2);
    // Circle scales with column, capped at 142px
    const letsGoCircleSize = Math.min(142, letsGoColW);

    const renderLetsGoPlayer = (
      source: typeof p0ProfileImage,
      name: string,
      isP1: boolean,
    ) => (
      <View style={{ width: letsGoColW, alignItems: "center" }}>
        {/* Circle — lower zIndex so the button renders on top of the overlap */}
        <View style={{ width: letsGoCircleSize, height: letsGoCircleSize, overflow: "hidden", zIndex: 0 }}>
          {source
            ? <AppImage source={source} contentFit="cover" style={StyleSheet.absoluteFill} />
            : <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.08)" }]} />}
        </View>
        {/* Button overlaps circle by 16px, renders on top */}
        <View style={{ zIndex: 1, width: "100%", marginTop: -16 }}>
          <CustomButton
            title={name}
            fullWidth
            btnSize="xs"
            fontSize="sm"
            glow
            {...(isP1
              ? { appearance: "danger" as const }
              : { backgroundImage: backgrounds.bg026, glowColor: "rgba(34,197,94,0.7)", shadowColor: "#004400" }
            )}
          />
        </View>
      </View>
    );

    return (
      <SafeAreaView style={styles.fill} edges={["right", "left"]}>
        <ImageBackground source={{ uri: dmBgUri }} style={styles.bg} resizeMode="cover">
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.72)" }]} />
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />

          {/* Animated title — slides up on button press */}
          <Animated.View
            pointerEvents="none"
            style={[styles.persistentTitleWrap, { top: insets.top + titleTopOffset, transform: [{ translateY: letsGoTitleY }] }]}
          >
            <AppImage source={{ uri: DM_SUDDEN_DEATH_URI }} contentFit="contain" style={{ width: "100%", height: titleHeight }} />
          </Animated.View>

          {/* Center: always a single row, sizes scale to fit; animates up on button press */}
          <Animated.View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: gameContentTop, paddingBottom: insets.bottom + 96, paddingHorizontal: hPad, transform: [{ translateY: letsGoProfilesY }] }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: letsGoColGap, width: "100%" }}>
              {renderLetsGoPlayer(p0ProfileImage, p0?.name ?? "", false)}
              <View style={{ width: letsGoVsSize, alignItems: "center", flexShrink: 0 }}>
                <AppImage source={{ uri: DM_VS_BATTLE_URI }} contentFit="contain" style={{ width: letsGoVsSize, height: letsGoVsSize }} />
              </View>
              {renderLetsGoPlayer(p1ProfileImage, p1?.name ?? "", true)}
            </View>
          </Animated.View>

          {/* Button pinned at bottom */}
          <View style={{ position: "absolute", left: 0, right: 0, bottom: insets.bottom + 24, paddingHorizontal: hPad }}>
            <CustomButton
              title={"LET THE GAME BEGIN!"}
              fullWidth
              onPress={handleLetsGo}
              backgroundImage={backgrounds.bg026}
              glow btnSize="md" fontSize="md"
              glowColor="rgba(34,197,94,0.7)"
              shadowColor="#004400"
            />
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  // ── Phase: Online wait ────────────────────────────────────────────────────
  if (phase === "online_wait") {
    const me = alivePlayers.find((p) => p.id === onlinePlayerId);
    const opponent = alivePlayers.find((p) => p.id !== onlinePlayerId);
    const meProfile = me?.id === p0?.id ? p0ProfileImage : p1ProfileImage;
    const oppProfile = opponent?.id === p0?.id ? p0ProfileImage : p1ProfileImage;

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
                paddingTop: gameContentTop,
                paddingBottom: insets.bottom + 24,
                paddingHorizontal: hPad,
              },
            ]}
          >
            <CustomText variant="h3" textColor="#fff" className="text-center" allowWrap>
              {"WAITING FOR\nOPPONENT"}
            </CustomText>

            {/* Avatars with status */}
            <View style={styles.avatarRow}>
              <HeroCircle
                source={meProfile}
                name={me?.name ?? "You"}
                active
                size={88}
                label={"Number locked ✓"}
              />
              <View style={styles.vsBigWrap}>
                <CustomText variant="h5-headline" textColor="#f5a623">VS</CustomText>
              </View>
              <HeroCircle
                source={oppProfile}
                name={opponent?.name ?? "Opponent"}
                active={false}
                size={88}
                label={"Choosing number..."}
              />
            </View>

            {/* Tip box */}
            <View style={styles.tipBox}>
              <CustomText variant="p-small" textColor="#f5c518" className="text-center">{"TIP"}</CustomText>
              <CustomText variant="p-small" textColor="rgba(255,255,255,0.65)" className="text-center" allowWrap>
                {"The lower the number, the easier to guess? Not always..."}
              </CustomText>
            </View>
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  // ── Phase: Guessing ───────────────────────────────────────────────────────
  const showingOnlineResult = pendingResult !== null;
  const activeGuesserId = currentGuesser?.id;
  const p0IsActive = activeGuesserId === p0?.id;
  const p1IsActive = activeGuesserId === p1?.id;

  // Guess history badge colour
  const badgeColor = (hint: GuessEntry["hint"]) =>
    hint === "higher" ? "#22c55e" : hint === "lower" ? "#ef4444" : "#f5c518";

  // Result overlay display values
  const resColor = localResultHintState === "higher" ? "#22c55e" : localResultHintState === "lower" ? "#ef4444" : "#f5c518";
  const resArrow = localResultHintState === "higher" ? "↑" : localResultHintState === "lower" ? "↓" : "✓";
  const resLabel = localResultHintState === "higher" ? "HIGHER" : localResultHintState === "lower" ? "LOWER" : "CORRECT!";

  // Profile column sizes — identical to local_lets_go
  const guessAvailW = windowWidth - 2 * hPad;
  const guessVsSize = Math.min(139, Math.floor(guessAvailW * 0.27));
  const guessColGap = 8;
  const guessColW = Math.floor((guessAvailW - guessVsSize - guessColGap * 2) / 2);
  const guessCircleSize = Math.min(142, guessColW);

  const renderGuessPlayer = (
    source: typeof p0ProfileImage,
    name: string,
    isP1: boolean,
    isActive: boolean,
    playerHistory: GuessEntry[],
  ) => (
    <View style={{ width: guessColW, alignItems: "center", transform: [{ scale: isActive ? 1.08 : 0.8 }], opacity: isActive ? 1 : 0.65 }}>
      {/* Circle — lower zIndex so the button renders on top */}
      <View style={{ width: guessCircleSize, height: guessCircleSize, overflow: "hidden", zIndex: 0 }}>
        {source
          ? <AppImage source={source} contentFit="cover" style={StyleSheet.absoluteFill} />
          : <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.08)" }]} />}
      </View>
      {/* Button overlaps circle by 16px, identical to local_lets_go */}
      <View style={{ zIndex: 1, width: "100%", marginTop: -16 }}>
        <CustomButton
          title={name}
          fullWidth
          btnSize="xs"
          fontSize="sm"
          glow
          {...(isP1
            ? { appearance: "danger" as const }
            : { backgroundImage: backgrounds.bg026, glowColor: "rgba(34,197,94,0.7)", shadowColor: "#004400" }
          )}
        />
      </View>
      {/* Guess history badges — 2.5× larger so they're readable */}
      {playerHistory.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 12, paddingHorizontal: 4 }}>
          {playerHistory.map((entry, idx) => (
            <View key={idx} style={{ backgroundColor: badgeColor(entry.hint) + "cc", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 }}>
              <CustomText variant="p-small" sizeDelta={10} textColor="#fff">{entry.value}</CustomText>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.fill} edges={["right", "left"]}>
      <ImageBackground source={{ uri: dmBgUri }} style={styles.bg} resizeMode="cover">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.72)" }]} />
        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />

        {/* Profile header — same layout as local_lets_go, sized by content */}
        <View style={[styles.guessingHeader, { paddingTop: insets.top + titleTopOffset + 8, paddingBottom: 8, paddingHorizontal: hPad }]}>
          {renderGuessPlayer(p0ProfileImage, p0?.name ?? "", false, p0IsActive, histories[p0?.id ?? ""] ?? [])}
          <View style={{ width: guessVsSize, alignItems: "center", flexShrink: 0, gap: guessColGap }}>
            <AppImage source={{ uri: DM_VS_BATTLE_URI }} contentFit="contain" style={{ width: guessVsSize, height: guessVsSize }} />
          </View>
          {renderGuessPlayer(p1ProfileImage, p1?.name ?? "", true, p1IsActive, histories[p1?.id ?? ""] ?? [])}
        </View>

        {/* Last-chance banner */}
        {firstCorrectId && firstCorrectPlayer && (
          <Animated.View style={[styles.lastChanceBanner, { transform: [{ scale: pulseBanner }], marginHorizontal: hPad }]}>
            <CustomText variant="p-small" textColor="#fff" className="text-center" allowWrap>
              {`LAST CHANCE — ${firstCorrectPlayer.name} already got it!`}
            </CustomText>
          </Animated.View>
        )}

        {/* Online: result banner + waiting */}
        {showingOnlineResult && pendingResult && mode === "ONLINE" && (
          <View style={{ paddingHorizontal: hPad }}>
            <ResultBanner hint={pendingResult.hint} />
          </View>
        )}
        {isOnlineWaiting && !showingOnlineResult && (
          <View style={{ paddingHorizontal: hPad, paddingTop: 24, alignItems: "center" }}>
            <CustomText variant="p-small" textColor="rgba(255,255,255,0.45)" className="text-center" allowWrap>
              {`Waiting for ${currentGuesser?.name ?? "opponent"} to guess…`}
            </CustomText>
          </View>
        )}

        {/* Guessing circle — drops in, 24px above the LOCK IN button */}
        {!isOnlineWaiting && !showingOnlineResult && !showingLocalResult && (
          <View style={styles.guessingCircleArea}>
            <Animated.View style={{ alignItems: "center", transform: [{ translateY: guessCircleDropY }, { scale: guessCircleDropScale }] }}>
              <View style={styles.setupStepperRow}>
                <Pressable
                  style={({ pressed }) => [styles.setupStepBtn, styles.setupMinusBtn, pressed && { opacity: 0.6 }]}
                  onPress={() => setGuess((g) => Math.max(rangeLo, g - 1))}
                  onLongPress={() => setGuess((g) => Math.max(rangeLo, g - 5))}
                >
                  <CustomText variant="h2" textColor="#ef4444">{"−"}</CustomText>
                </Pressable>
                <GradientGuessCircle>
                  <Animated.View style={[styles.setupCircle, { borderWidth: 0, transform: [{ translateX: shakeX }] }]}>
                    <CustomText variant="h2" sizeDelta={guess >= 100 ? -20 : guess >= 10 ? -16 : -10} textColor="#fff">
                      {guess}
                    </CustomText>
                  </Animated.View>
                </GradientGuessCircle>
                <Pressable
                  style={({ pressed }) => [styles.setupStepBtn, styles.setupPlusBtn, pressed && { opacity: 0.6 }]}
                  onPress={() => setGuess((g) => Math.min(rangeHi, g + 1))}
                  onLongPress={() => setGuess((g) => Math.min(rangeHi, g + 5))}
                >
                  <CustomText variant="h2" textColor="#22c55e">{"+"}</CustomText>
                </Pressable>
              </View>
              <CustomText variant="p-small" sizeDelta={-1} textColor="rgba(255,255,255,0.5)" className="text-center" allowWrap style={{ marginTop: 14 }}>
                {"Choose a number to guess\nyour opponent's secret"}
              </CustomText>
            </Animated.View>
          </View>
        )}

        {/* LOCK IN button — 24px above safe area bottom, always visible */}
        {!isOnlineWaiting && !showingOnlineResult && !showingLocalResult && (
          <Animated.View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: insets.bottom + 24,
              paddingHorizontal: hPad,
              opacity: guessBtnOpacity2,
              transform: [{ translateY: guessBtnTranslateY2 }],
            }}
          >
            <CustomButton
              title={"LOCK IN MY GUESS"}
              fullWidth
              onPress={handleSubmitGuess}
              backgroundImage={backgrounds.bg026}
              glow btnSize="md" fontSize="md"
              glowColor="rgba(34,197,94,0.7)"
              shadowColor="#004400"
            />
          </Animated.View>
        )}

        {/* LOCAL result overlay — blurs and darkens, shows HIGHER / LOWER / CORRECT */}
        {showingLocalResult && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: resultOverlayOpacity }]} pointerEvents="none">
            <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", gap: 8 }]}>
              <CustomText variant="h1" textColor={resColor}>{resArrow}</CustomText>
              <CustomText variant="h3" textColor={resColor}>{resLabel}</CustomText>
            </View>
          </Animated.View>
        )}
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
  container: {
    flex: 1,
    gap: 12,
  },
  centeredContent: {
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  guessingContent: {
    gap: 14,
  },
  guessingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  guessingCircleArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
  },

  // ── Setup ─────────────────────────────────────────────────────────────────
  dontPeekRow: {
    alignSelf: "center",
    backgroundColor: "rgba(34,197,94,0.1)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
  },
  confirmNumberBtn: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  display: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingVertical: 12,
    minHeight: 64,
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

  // ── Drum picker ───────────────────────────────────────────────────────────
  drumWrap: {
    height: DRUM_ITEM_H * 5,
    overflow: "hidden",
    alignSelf: "center",
    width: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  drumHighlight: {
    position: "absolute",
    top: DRUM_ITEM_H * 2,
    left: 0,
    right: 0,
    height: DRUM_ITEM_H,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: "rgba(34,197,94,0.6)",
    backgroundColor: "rgba(34,197,94,0.08)",
    zIndex: 1,
    pointerEvents: "none",
  },
  drumFade: {
    position: "absolute",
    left: 0,
    right: 0,
    height: DRUM_ITEM_H * 1.5,
    zIndex: 2,
    pointerEvents: "none",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  drumItem: {
    height: DRUM_ITEM_H,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Hero circle / avatar bar ──────────────────────────────────────────────
  heroCircle: {
    overflow: "hidden",
    borderWidth: 3,
  },
  avatarLabelBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    maxWidth: 120,
  },
  avatarBar: {
    alignItems: "center",
    gap: 6,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  vsMiniWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(245,166,35,0.15)",
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  vsBigWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  // ── Let game begin / waiting ──────────────────────────────────────────────
  firstGuessBadge: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(245,197,24,0.4)",
    backgroundColor: "rgba(245,197,24,0.08)",
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  passIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 2,
    borderColor: "rgba(34,197,94,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  tipBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245,197,24,0.3)",
    backgroundColor: "rgba(245,197,24,0.08)",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 6,
    alignItems: "center",
    width: "100%",
  },

  // ── Opp confirm ───────────────────────────────────────────────────────────
  hintButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  hintButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 14,
    alignItems: "center",
    gap: 4,
  },

  // ── Guessing stepper ──────────────────────────────────────────────────────
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  stepperBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnPressed: {
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  stepperCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(34,197,94,0.08)",
    borderWidth: 3,
    borderColor: "rgba(34,197,94,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  rangeLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    maxWidth: 120,
  },

  // ── History ───────────────────────────────────────────────────────────────
  historySection: {
    gap: 8,
  },
  historyList: { gap: 6 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  historyRowLatest: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  hintBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },

  // ── Result banner (online) ────────────────────────────────────────────────
  resultBanner: {
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 4,
  },

  // ── Last chance banner ────────────────────────────────────────────────────
  lastChanceBanner: {
    backgroundColor: "rgba(220,60,30,0.82)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e07050",
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

  // ── Player Intro ──────────────────────────────────────────────────────────
  playerIntroTop: {
    alignItems: "center",
    gap: 14,
  },
  playerIntroChip: {
    backgroundColor: "rgba(34,197,94,0.12)",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(34,197,94,0.40)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
  },

  // ── Setup circle picker ───────────────────────────────────────────────────
  setupCenterArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  setupStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  setupStepBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3.5,
    alignItems: "center",
    justifyContent: "center",
  },
  setupMinusBtn: {
    borderColor: "#ef4444",
    backgroundColor: "rgba(239,68,68,0.1)",
  },
  setupPlusBtn: {
    borderColor: "#22c55e",
    backgroundColor: "rgba(34,197,94,0.1)",
  },
  setupCircleGlow: {
    width: 186,
    height: 186,
    borderRadius: 93,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  setupCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.82)",
    alignItems: "center",
    justifyContent: "center",
  },
  setupBtnWrap: {
    position: "absolute",
    left: 0,
    right: 0,
  },

  // ── How To Play ───────────────────────────────────────────────────────────
  htpScroll: {
    flexGrow: 1,
    alignItems: "center",
    gap: 28,
  },
  htpTitleWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  htpRulesList: {
    width: "100%",
    gap: 12,
  },
  htpRuleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  htpIconWrap: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  htpBtnFixed: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});
