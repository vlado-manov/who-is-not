// src/screens/Game/LivesRevealScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { CommonActions, useNavigation } from "@react-navigation/native";

import { GameStackParamList } from "../../navigation/types";
import { useGameStore } from "../../store/useGameStore";
import { useHeroesStore } from "../../store/useHeroesStore";
import { usePreventBack } from "../../hooks/usePreventBack";
import { useTranslation } from "react-i18next";

import AppImage from "../../components/AppImage";
import CustomButton from "../../components/common/CustomButton";
import CustomText from "../../components/common/CustomText";
import AudioManager from "../../utils/audioManager";
import { backgrounds } from "../../../assets/backgrounds";
import { getRevealVariant } from "../../utils/revealQuotes";
import LottieView from "lottie-react-native";
import { lottie } from "../../../assets/lottie";

type Nav = StackNavigationProp<GameStackParamList, "LivesReveal">;

type PlayerUi = {
  id: string;
  name: string;
  image?: any;
};

const OVERLAP_RATIO = 1 / 3;
const WIN_SLOW_FACTOR = 2;
const { width: SCREEN_W } = Dimensions.get("window");
const MINUS_ONE_LIVE_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/b358fa09-3908-4736-9bd5-18a01c7b0e2a--1live.webp";
const HEART_FULL_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/9c43592c-f28a-4922-bf8f-8e33529a6227-heart1.webp";
const HEART_EMPTY_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/44a82900-4469-4558-b968-50208d4fb581-heart2.webp";
const X_PART_1_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/61d7faf3-5a8a-4aa8-babd-c20a6b82c588-xpart1.webp";
const X_PART_2_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/ec0c25c5-748e-4689-9742-b6a211bf0a2b-xpart2.webp";
const CENTER_DEATH_SLOW_MULTIPLIER = 1.5;
const GRID_DEATH_FAST_MULTIPLIER = 0.75;
const HAPPY_JUMP_EXTRA_DURATION = 500;
const FOCUS_BLUR_IN_MS = 560;
const FOCUS_BLUR_OUT_MS = 620;
const FOCUS_SPOTLIGHT_SCALE = 1.14;
const CENTER_FOCUS_SLOT_HEIGHT = 320;
const WINNER_BG_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/3a93c0b5-d3f5-4f42-a996-6c58992cc8ae-IMG_4043.webp";
const WINNER_TEXT_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/1aea25ff-4f32-458c-9623-59374130ff96-winnerText_en.webp";
const WINNER_PLATFORM_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/5051b921-dc67-4c52-a68b-f065ac5eb93d-HeroPickerBottomWinner.webp";
const LIVES_REVEAL_ACTION_BG_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/5a7412ac-af25-4288-a026-54e8c9020e95-livesRevealActionBackground.webp";
const LIVES_REVEAL_STANDINGS_BG_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/a139ba52-e82f-4b13-b10b-25b962ce9785-livesRevealBackground.webp";

const CARD_ACCENTS = [
  {
    border: "#4da6ff",
    glow: "rgba(77,166,255,0.55)",
    ribbon: ["#3b8fd9", "#1e5fa8"] as [string, string],
    avatarRing: "#5bb8ff",
  },
  {
    border: "#ffb84d",
    glow: "rgba(255,184,77,0.55)",
    ribbon: ["#f0a020", "#c87800"] as [string, string],
    avatarRing: "#ffcc66",
  },
  {
    border: "#c084fc",
    glow: "rgba(192,132,252,0.55)",
    ribbon: ["#a855f7", "#7e22ce"] as [string, string],
    avatarRing: "#d8b4fe",
  },
  {
    border: "#34d399",
    glow: "rgba(52,211,153,0.55)",
    ribbon: ["#10b981", "#047857"] as [string, string],
    avatarRing: "#6ee7b7",
  },
  {
    border: "#fb7185",
    glow: "rgba(251,113,133,0.55)",
    ribbon: ["#f43f5e", "#be123c"] as [string, string],
    avatarRing: "#fda4af",
  },
  {
    border: "#22d3ee",
    glow: "rgba(34,211,238,0.55)",
    ribbon: ["#06b6d4", "#0e7490"] as [string, string],
    avatarRing: "#67e8f9",
  },
  {
    border: "#facc15",
    glow: "rgba(250,204,21,0.55)",
    ribbon: ["#eab308", "#a16207"] as [string, string],
    avatarRing: "#fde047",
  },
  {
    border: "#818cf8",
    glow: "rgba(129,140,248,0.55)",
    ribbon: ["#6366f1", "#4338ca"] as [string, string],
    avatarRing: "#a5b4fc",
  },
  {
    border: "#e879f9",
    glow: "rgba(232,121,249,0.55)",
    ribbon: ["#d946ef", "#a21caf"] as [string, string],
    avatarRing: "#f0abfc",
  },
  {
    border: "#84cc16",
    glow: "rgba(132,204,22,0.55)",
    ribbon: ["#65a30d", "#3f6212"] as [string, string],
    avatarRing: "#bef264",
  },
] as const;

type Phase = "focus" | "grid";
type HeartPlateVariant = "center" | "grid";

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function calcAvatarSize(count: number, containerWidth: number) {
  if (count <= 1) return 90;
  const denominator = 1 + (count - 1) * (1 - OVERLAP_RATIO);
  const raw = containerWidth / denominator;
  return clamp(raw, 54, 90);
}

function getRoundOutcome(
  votes: Record<string, string>,
  oddOneId: string | undefined,
  players: { id: string }[],
  lives: Record<string, number>,
  maxLives: number
) {
  if (!oddOneId) {
    return {
      impostorLost: false,
      losingIds: [] as string[],
      nextLives: { ...lives },
    };
  }

  const votedWinner = Object.entries(votes).reduce(
    (acc, [voterId, targetId]) => {
      if (voterId === oddOneId) return acc;
      acc[targetId] = (acc[targetId] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const maxVotes = Math.max(0, ...Object.values(votedWinner));
  const topTargets = Object.entries(votedWinner)
    .filter(([, v]) => v === maxVotes && maxVotes > 0)
    .map(([id]) => id);
  const impostorLost = topTargets.length === 1 && topTargets[0] === oddOneId;

  const losingIds = impostorLost
    ? [oddOneId]
    : players.filter((p) => p.id !== oddOneId).map((p) => p.id);

  const nextLives: Record<string, number> = { ...lives };
  players.forEach((p) => {
    if (nextLives[p.id] == null) nextLives[p.id] = maxLives;
  });
  losingIds.forEach((id) => {
    nextLives[id] = Math.max(0, (nextLives[id] ?? maxLives) - 1);
  });

  return { impostorLost, losingIds, nextLives };
}

function buildStaggeredGridRows(players: PlayerUi[]) {
  const rows: { players: PlayerUi[]; centered: boolean }[] = [];
  let i = 0;
  while (i < players.length) {
    const remaining = players.length - i;
    if (remaining === 1) {
      rows.push({ players: [players[i]], centered: true });
      i += 1;
    } else {
      rows.push({ players: players.slice(i, i + 2), centered: false });
      i += 2;
    }
  }
  return rows;
}

function startAnim(animation: Animated.CompositeAnimation) {
  return new Promise<void>((resolve) => {
    animation.start(() => resolve());
  });
}

type GameShowTitleTone = "danger" | "gold";

/** Chunky stacked-outline title — Cyrillic-safe (AmaticSC-Bold). */
function GameShowTitle({
  text,
  tone,
  fontSize,
  style,
}: {
  text: string;
  tone: GameShowTitleTone;
  fontSize: number;
  style?: ViewStyle;
}) {
  const fill = tone === "danger" ? "#fffdf8" : "#ffe047";
  const stroke = tone === "danger" ? "#9b0a0a" : "#6b3200";
  const deep = tone === "danger" ? "#4a0202" : "#3a1800";
  const highlight = tone === "gold" ? "#fff9b8" : "#ffffff";

  const outlineLayers =
    tone === "danger"
      ? [
          { dx: 0, dy: 5, color: deep },
          { dx: 0, dy: 4, color: stroke },
          { dx: 3, dy: 4, color: stroke },
          { dx: -3, dy: 4, color: stroke },
          { dx: 2, dy: 3, color: stroke },
          { dx: -2, dy: 3, color: stroke },
        ]
      : [
          { dx: 0, dy: 6, color: deep },
          { dx: 0, dy: 5, color: stroke },
          { dx: 3, dy: 5, color: stroke },
          { dx: -3, dy: 5, color: stroke },
          { dx: 2, dy: 4, color: "#9a4e00" },
          { dx: -2, dy: 4, color: "#9a4e00" },
        ];

  const baseTextStyle = {
    fontFamily: "AmaticSC-Bold",
    fontSize,
    lineHeight: fontSize * 1.05,
    letterSpacing: tone === "gold" ? 2 : 1,
    textAlign: "center" as const,
    includeFontPadding: false,
  };

  return (
    <View style={[styles.gameShowTitleWrap, { minHeight: fontSize * 1.15 }, style]}>
      {outlineLayers.map((layer, i) => (
        <Text
          key={`stroke-${i}`}
          style={[
            baseTextStyle,
            styles.gameShowTitleLayer,
            {
              color: layer.color,
              transform: [{ translateX: layer.dx }, { translateY: layer.dy }],
            },
          ]}
        >
          {text}
        </Text>
      ))}
      <Text
        style={[
          baseTextStyle,
          styles.gameShowTitleLayer,
          {
            color: fill,
            textShadowColor: tone === "gold" ? "#ff9900" : "#ff5555",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: tone === "gold" ? 6 : 4,
          },
        ]}
      >
        {text}
      </Text>
      <Text
        style={[
          baseTextStyle,
          styles.gameShowTitleLayer,
          styles.gameShowTitleHighlight,
          { color: highlight },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

/** Bold ribbon label with slight skew — Cyrillic-safe (OpenSans-ExtraBold). */
function RibbonLabel({
  text,
  style,
  compact = false,
}: {
  text: string;
  style?: ViewStyle;
  compact?: boolean;
}) {
  const fontSize = compact ? 13 : 16;
  return (
    <View style={[styles.ribbonLabelWrap, style]}>
      <Text style={[styles.ribbonLabelStroke, { fontSize, lineHeight: fontSize + 4 }]}>
        {text}
      </Text>
      <Text style={[styles.ribbonLabelFill, { fontSize, lineHeight: fontSize + 4 }]}>
        {text}
      </Text>
    </View>
  );
}

const LivesRevealScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  usePreventBack();

  const players = useGameStore((s) => s.players);
  const heroes = useHeroesStore((s) => s.heroes);
  const votes = useGameStore((s) => s.votes);
  const oddOneId = useGameStore((s) => s.oddOneId);
  const mode = useGameStore((s) => s.mode);
  const onlinePlayerId = useGameStore((s) => s.onlinePlayerId);
  const lives = useGameStore((s) => s.lives);
  const gameSettings = useGameStore((s) => s.gameSettings);
  const applyRoundLives = useGameStore((s) => s.applyRoundLives);
  const goToNextRound = useGameStore((s) => s.goToNextRound);
  const restartWithSamePlayersAndHeroes = useGameStore(
    (s) => s.restartWithSamePlayersAndHeroes
  );
  const setGameState = useGameStore((s) => s.set);
  const resetGameState = useGameStore((s) => s.reset);
  const round = useGameStore((s) => s.round);
  const maxLives = gameSettings?.livesPerPlayer ?? 3;

  const didStartRef = useRef(false);

  const centerShakeX = useRef(new Animated.Value(0)).current;
  const centerJumpX = useRef(new Animated.Value(0)).current;
  const centerJumpY = useRef(new Animated.Value(0)).current;
  const centerFade = useRef(new Animated.Value(1)).current;
  const centerScale = useRef(new Animated.Value(1)).current;
  const centerDeathShakeX = useRef(new Animated.Value(0)).current;
  const centerDeathGray = useRef(new Animated.Value(0)).current;
  const centerDeathX1 = useRef(new Animated.Value(0)).current;
  const centerDeathX2 = useRef(new Animated.Value(0)).current;

  const minusOneOpacity = useRef(new Animated.Value(0)).current;
  const minusOneY = useRef(new Animated.Value(8)).current;
  const minusOneScale = useRef(new Animated.Value(0.82)).current;

  const burningHeartPulse = useRef(new Animated.Value(0)).current;
  const [burningHeart, setBurningHeart] = useState<{
    playerId: string;
    index: number;
  } | null>(null);

  const [phase, setPhase] = useState<Phase>("focus");
  const initialCenterId =
    mode === "ONLINE" && onlinePlayerId ? onlinePlayerId : oddOneId ?? null;
  const [activeCenterId, setActiveCenterId] = useState<string | null>(
    initialCenterId
  );
  const [displayLives, setDisplayLives] = useState<Record<string, number>>({});
  const displayLivesRef = useRef<Record<string, number>>({});
  const [canContinue, setCanContinue] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [deadIds, setDeadIds] = useState<string[]>([]);
  const [centerDeadId, setCenterDeadId] = useState<string | null>(null);
  const [showWinnerButtons, setShowWinnerButtons] = useState(false);
  const [confettiBurstKey, setConfettiBurstKey] = useState(0);

  const winnerScreenOpacity = useRef(new Animated.Value(0)).current;
  const winnerScreenScale = useRef(new Animated.Value(1.08)).current;
  const winnerScreenY = useRef(new Animated.Value(36)).current;
  const winnerHeroY = useRef(new Animated.Value(0)).current;
  const winnerButtonsOpacity = useRef(new Animated.Value(0)).current;
  const winnerButtonsY = useRef(new Animated.Value(28)).current;

  /* ── Screen chrome animations ─────────────────────────────────────────── */
  const titleOp = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(-28)).current;
  const titleScale = useRef(new Animated.Value(0.88)).current;
  const subtitleOp = useRef(new Animated.Value(0)).current;
  const spotlightPulse = useRef(new Animated.Value(0)).current;
  const ctaOp = useRef(new Animated.Value(0)).current;
  const ctaY = useRef(new Animated.Value(24)).current;
  const gridHeaderOp = useRef(new Animated.Value(0)).current;
  const focusOtherAnimsRef = useRef<Record<string, Animated.Value>>({});
  const gridSlideRef = useRef<Record<string, Animated.Value>>({});
  const spotlightLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const bgActionOp = useRef(new Animated.Value(1)).current;
  const bgStandingsOp = useRef(new Animated.Value(0)).current;
  const bgBlurOpacity = useRef(new Animated.Value(0)).current;
  const focusSpotlightScale = useRef(new Animated.Value(1)).current;
  const titleWobble = useRef(new Animated.Value(0)).current;
  const titlePulse = useRef(new Animated.Value(0)).current;
  const titleWobbleLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const titlePulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const playersUi = useMemo(() => {
    return players.map((p) => {
      const hero = heroes.find((h) => h.id === p.characterId);
      return {
        id: p.id,
        name: p.name,
        image: hero?.profileImage,
      } as PlayerUi;
    });
  }, [heroes, players]);

  const playerById = useMemo(() => {
    const map: Record<string, PlayerUi> = {};
    playersUi.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [playersUi]);

  const waitingOthers = useMemo(
    () => playersUi.filter((p) => p.id !== activeCenterId),
    [activeCenterId, playersUi]
  );

  const focusRows = useMemo(() => {
    if (waitingOthers.length <= 5) return [waitingOthers];
    const firstRowCount = Math.ceil(waitingOthers.length / 2);
    return [
      waitingOthers.slice(0, firstRowCount),
      waitingOthers.slice(firstRowCount),
    ];
  }, [waitingOthers]);

  const staggeredGridRows = useMemo(
    () => buildStaggeredGridRows(playersUi),
    [playersUi]
  );

  const playerAccentIndex = useMemo(() => {
    const map: Record<string, number> = {};
    playersUi.forEach((p, i) => {
      map[p.id] = i % CARD_ACCENTS.length;
    });
    return map;
  }, [playersUi]);

  const gridItemAnimsRef = useRef<Record<string, Animated.Value>>({});
  const deathShakeRef = useRef<Record<string, Animated.Value>>({});
  const deathGrayRef = useRef<Record<string, Animated.Value>>({});
  const deathX1Ref = useRef<Record<string, Animated.Value>>({});
  const deathX2Ref = useRef<Record<string, Animated.Value>>({});
  useEffect(() => {
    playersUi.forEach((p) => {
      if (!gridItemAnimsRef.current[p.id]) {
        gridItemAnimsRef.current[p.id] = new Animated.Value(0);
      }
      if (!gridSlideRef.current[p.id]) {
        gridSlideRef.current[p.id] = new Animated.Value(0);
      }
      if (!focusOtherAnimsRef.current[p.id]) {
        focusOtherAnimsRef.current[p.id] = new Animated.Value(0);
      }
      if (!deathShakeRef.current[p.id]) {
        deathShakeRef.current[p.id] = new Animated.Value(0);
      }
      if (!deathGrayRef.current[p.id]) {
        deathGrayRef.current[p.id] = new Animated.Value(0);
      }
      if (!deathX1Ref.current[p.id]) {
        deathX1Ref.current[p.id] = new Animated.Value(0);
      }
      if (!deathX2Ref.current[p.id]) {
        deathX2Ref.current[p.id] = new Animated.Value(0);
      }
    });
  }, [playersUi]);

  /* Spotlight pulse loop during focus phase */
  useEffect(() => {
    if (phase !== "focus") {
      spotlightLoopRef.current?.stop();
      spotlightLoopRef.current = null;
      spotlightPulse.setValue(0);
      return;
    }
    spotlightPulse.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(spotlightPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(spotlightPulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    spotlightLoopRef.current = loop;
    loop.start();
    return () => {
      loop.stop();
    };
  }, [phase, spotlightPulse]);

  /* Title idle motion — subtle wobble + pulse while visible */
  useEffect(() => {
    titleWobbleLoopRef.current?.stop();
    titlePulseLoopRef.current?.stop();
    titleWobble.setValue(0);
    titlePulse.setValue(0);

    const wobbleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(titleWobble, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(titleWobble, {
          toValue: -1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(titleWobble, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(titlePulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(titlePulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    titleWobbleLoopRef.current = wobbleLoop;
    titlePulseLoopRef.current = pulseLoop;
    wobbleLoop.start();
    pulseLoop.start();

    return () => {
      wobbleLoop.stop();
      pulseLoop.stop();
    };
  }, [phase, titlePulse, titleWobble]);

  /* Continue button entrance */
  useEffect(() => {
    if (!canContinue) return;
    ctaOp.setValue(0);
    ctaY.setValue(24);
    Animated.parallel([
      Animated.timing(ctaOp, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(ctaY, {
        toValue: 0,
        speed: 16,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, [canContinue, ctaOp, ctaY]);

  const containerWidth = Math.min(SCREEN_W - 32, 380);

  const roundOutcome = useMemo(
    () => getRoundOutcome(votes, oddOneId, players, lives, maxLives),
    [lives, maxLives, oddOneId, players, votes]
  );
  const impostorLost = roundOutcome.impostorLost;
  const losingIds = roundOutcome.losingIds;

  const centerPlayer = activeCenterId ? playerById[activeCenterId] : null;
  const centerLives = activeCenterId ? (displayLives[activeCenterId] ?? 0) : 0;
  const alivePlayers = useMemo(
    () => players.filter((p) => (displayLives[p.id] ?? 0) > 0),
    [displayLives, players]
  );

  const winnerPlayer = useMemo(() => {
    if (!alivePlayers.length) return null;
    const sorted = [...alivePlayers].sort(
      (a, b) => (displayLives[b.id] ?? 0) - (displayLives[a.id] ?? 0)
    );
    return sorted[0] ?? alivePlayers[0];
  }, [alivePlayers, displayLives]);

  const winnerRevealVariant = useMemo(() => {
    if (!oddOneId) return "NORMAL" as const;
    const totalEligibleVoters = players.length > 0 ? players.length - 1 : 0;
    const votesForImpostor = Object.entries(votes).filter(
      ([voterId, targetId]) => voterId !== oddOneId && targetId === oddOneId
    ).length;
    const impostorWonThisRound = !impostorLost;
    return getRevealVariant(
      votesForImpostor,
      totalEligibleVoters,
      impostorWonThisRound
    );
  }, [impostorLost, oddOneId, players.length, votes]);

  const winnerHeroImage = useMemo(() => {
    if (!winnerPlayer) return null;
    const hero = heroes.find((h) => h.id === winnerPlayer.characterId);
    if (!hero) return null;

    const isImpostorWinner = winnerPlayer.id === oddOneId && !impostorLost;
    const usePerfect =
      isImpostorWinner && winnerRevealVariant === "PERFECT_BLUFF";

    const pickRandom = (arr: any[] | undefined) => {
      if (!arr || arr.length === 0) return null;
      return arr[Math.floor(Math.random() * arr.length)];
    };

    const byVariant = hero.winImagesByVariant;
    const perfect = pickRandom(byVariant?.PERFECT_BLUFF);
    const normal = pickRandom(byVariant?.NORMAL) ?? pickRandom(hero.winImages);

    return (
      (usePerfect ? perfect : null) ??
      normal ??
      hero.main_image ??
      hero.profileImage ??
      null
    );
  }, [heroes, impostorLost, oddOneId, winnerPlayer, winnerRevealVariant]);

  useEffect(() => {
    displayLivesRef.current = displayLives;
  }, [displayLives]);

  const animateTitleEntrance = useCallback(async () => {
    titleOp.setValue(0);
    titleY.setValue(-28);
    titleScale.setValue(0.88);
    subtitleOp.setValue(0);
    await startAnim(
      Animated.parallel([
        Animated.timing(titleOp, {
          toValue: 1,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(titleScale, {
          toValue: 1,
          speed: 18,
          bounciness: 7,
          useNativeDriver: true,
        }),
        Animated.timing(titleY, {
          toValue: 0,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    await startAnim(
      Animated.timing(subtitleOp, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
  }, [subtitleOp, titleOp, titleScale, titleY]);

  const animateFocusOthersIn = useCallback(async () => {
    const ids = waitingOthers.map((p) => p.id);
    ids.forEach((id) => focusOtherAnimsRef.current[id]?.setValue(0));
    const anims = ids
      .map((id) => focusOtherAnimsRef.current[id])
      .filter(Boolean)
      .map((v) =>
        Animated.spring(v!, {
          toValue: 1,
          speed: 20,
          bounciness: 8,
          useNativeDriver: true,
        }),
      );
    if (!anims.length) return;
    await startAnim(Animated.stagger(55, anims));
  }, [waitingOthers]);

  const getDisplayName = useCallback(
    (playerId: string, fallback: string) => {
      if (mode === "ONLINE" && onlinePlayerId && playerId === onlinePlayerId) {
        return t("lives_reveal_you");
      }
      return fallback;
    },
    [mode, onlinePlayerId, t],
  );

  const enterFocusSpotlight = useCallback(async () => {
    await startAnim(
      Animated.parallel([
        Animated.timing(bgBlurOpacity, {
          toValue: 1,
          duration: FOCUS_BLUR_IN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(focusSpotlightScale, {
          toValue: FOCUS_SPOTLIGHT_SCALE,
          speed: 13,
          bounciness: 7,
          useNativeDriver: true,
        }),
      ]),
    );
  }, [bgBlurOpacity, focusSpotlightScale]);

  const exitFocusSpotlight = useCallback(async () => {
    await startAnim(
      Animated.timing(bgBlurOpacity, {
        toValue: 0,
        duration: FOCUS_BLUR_OUT_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    await startAnim(
      Animated.spring(focusSpotlightScale, {
        toValue: 1,
        speed: 20,
        bounciness: 2,
        useNativeDriver: true,
      }),
    );
    focusSpotlightScale.setValue(1);
  }, [bgBlurOpacity, focusSpotlightScale]);

  const runFocusSpotlightMoment = useCallback(
    async (moment: () => Promise<void>) => {
      await enterFocusSpotlight();
      await moment();
      await exitFocusSpotlight();
    },
    [enterFocusSpotlight, exitFocusSpotlight],
  );

  const renderHeartsPlate = (
    count: number,
    playerId: string,
    variant: HeartPlateVariant = "center",
    isDead = false,
  ) => {
    const heartSize =
      maxLives >= 5
        ? variant === "grid"
          ? 22
          : 28
        : variant === "grid"
          ? 34
          : 42;
    const horizontalGap =
      maxLives >= 5
        ? variant === "grid"
          ? 2
          : 3
        : variant === "grid"
          ? 4
          : 5;

    return (
      <View
        style={[
          styles.heartsPlate,
          variant === "center" && styles.heartsPlateFocus,
          variant === "grid" && styles.heartsPlateGrid,
          isDead && styles.heartsPlateDead,
        ]}
      >
        <View style={styles.heartsRow}>
          {Array.from({ length: maxLives }, (_, i) => {
            const isBurning =
              burningHeart?.playerId === playerId && burningHeart.index === i;
            const pulseScale = isBurning
              ? burningHeartPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.45],
                })
              : 1;
            const pulseGlow = isBurning
              ? burningHeartPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.75],
                })
              : 0;

            return (
              <Animated.View
                key={`heart-${playerId}-${i}`}
                style={{
                  transform: [{ scale: pulseScale }],
                  marginHorizontal: horizontalGap,
                }}
              >
                {isBurning && (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.heartBurnGlow,
                      {
                        width: heartSize + 14,
                        height: heartSize + 14,
                        borderRadius: (heartSize + 14) / 2,
                        opacity: pulseGlow,
                      },
                    ]}
                  />
                )}
                <AppImage
                  source={{
                    uri: i < count ? HEART_FULL_URI : HEART_EMPTY_URI,
                  }}
                  contentFit="contain"
                  style={{ width: heartSize, height: heartSize }}
                />
              </Animated.View>
            );
          })}
        </View>
      </View>
    );
  };

  const decrementLife = (playerId: string) => {
    const current = displayLivesRef.current[playerId] ?? maxLives;
    const next = {
      ...displayLivesRef.current,
      [playerId]: Math.max(0, current - 1),
    };
    displayLivesRef.current = next;
    setDisplayLives(next);
  };

  const runHeartLossSequence = async (
    playerId: string,
    opts?: { slow?: boolean; visualOnly?: boolean; heartIndex?: number },
  ) => {
    const slow = opts?.slow ?? false;
    const visualOnly = opts?.visualOnly ?? false;
    const before = displayLivesRef.current[playerId] ?? 0;
    const idx = opts?.heartIndex ?? before - 1;
    if (idx < 0) return;

    setBurningHeart({ playerId, index: idx });
    burningHeartPulse.setValue(0);

    const d = (base: number) =>
      Math.max(70, Math.round(base * (slow ? WIN_SLOW_FACTOR : 1)));

    await startAnim(
      Animated.sequence([
        Animated.timing(burningHeartPulse, {
          toValue: 1,
          duration: d(200),
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(burningHeartPulse, {
          toValue: 0,
          duration: d(220),
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    if (!visualOnly) decrementLife(playerId);
    setBurningHeart(null);
    burningHeartPulse.setValue(0);
  };

  const animateHeartBurnThenDecrease = async (
    playerId: string,
    slow = false,
  ) => {
    await runHeartLossSequence(playerId, { slow });
  };

  const animateGridHeartBurnThenDecrease = async (
    playerId: string,
    slow = false,
  ) => {
    await runHeartLossSequence(playerId, { slow });
  };

  const animateLifeLoss = async (playerId: string, slow = false) => {
    const d = (base: number) =>
      Math.max(70, Math.round(base * (slow ? WIN_SLOW_FACTOR : 1)));

    // Sound fires as the shake + "-1 live" animation begins
    void AudioManager.playLosingLiveSound();

    minusOneOpacity.setValue(0);
    minusOneY.setValue(10);
    minusOneScale.setValue(0.82);

    await startAnim(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(centerShakeX, {
            toValue: 12,
            duration: d(70),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(centerShakeX, {
            toValue: -12,
            duration: d(70),
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(centerShakeX, {
            toValue: 9,
            duration: d(65),
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(centerShakeX, {
            toValue: -7,
            duration: d(65),
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(centerShakeX, {
            toValue: 0,
            duration: d(90),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(minusOneOpacity, {
            toValue: 1,
            duration: d(170),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(minusOneY, {
            toValue: -26,
            duration: d(320),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(minusOneScale, {
            toValue: 1.15,
            duration: d(290),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    await animateHeartBurnThenDecrease(playerId, slow);

    await startAnim(
      Animated.timing(minusOneOpacity, {
        toValue: 0,
        duration: d(180),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );
  };

  const switchCenterTo = async (playerId: string) => {
    if (activeCenterId === playerId) return;

    await startAnim(
      Animated.parallel([
        Animated.timing(centerFade, {
          toValue: 0,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(centerScale, {
          toValue: 0.86,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(focusSpotlightScale, {
          toValue: 0.92,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    setActiveCenterId(playerId);
    centerShakeX.setValue(0);
    centerDeathShakeX.setValue(0);
    centerDeathGray.setValue(0);
    centerDeathX1.setValue(0);
    centerDeathX2.setValue(0);
    setCenterDeadId(null);
    centerScale.setValue(1);
    focusSpotlightScale.setValue(1);
    void AudioManager.playAnswerPop();

    await startAnim(
      Animated.timing(centerFade, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
  };

  const happyJumpDiagonal = async () => {
    const d = (base: number) =>
      base + Math.round(HAPPY_JUMP_EXTRA_DURATION / 6);
    centerJumpX.setValue(0);
    centerJumpY.setValue(0);
    await startAnim(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(centerJumpX, {
            toValue: -24,
            duration: d(48),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(centerJumpY, {
            toValue: -26,
            duration: d(48),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(centerJumpX, {
            toValue: 24,
            duration: d(48),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(centerJumpY, {
            toValue: -22,
            duration: d(48),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(centerJumpX, {
            toValue: -18,
            duration: d(44),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(centerJumpY, {
            toValue: 14,
            duration: d(44),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(centerJumpX, {
            toValue: 14,
            duration: d(42),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(centerJumpY, {
            toValue: 10,
            duration: d(42),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(centerJumpX, {
            toValue: -8,
            duration: d(38),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(centerJumpY, {
            toValue: -6,
            duration: d(38),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(centerJumpX, {
            toValue: 0,
            duration: d(38),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(centerJumpY, {
            toValue: 0,
            duration: d(38),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
  };

  const unfoldGrid = async () => {
    setPhase("grid");
    bgBlurOpacity.setValue(0);
    focusSpotlightScale.setValue(1);
    gridHeaderOp.setValue(0);
    titleOp.setValue(0);
    titleY.setValue(-20);
    titleScale.setValue(0.9);
    subtitleOp.setValue(0);

    playersUi.forEach((p, idx) => {
      const v = gridItemAnimsRef.current[p.id];
      const slide = gridSlideRef.current[p.id];
      if (v) v.setValue(0);
      if (slide) slide.setValue(idx % 2 === 0 ? -1 : 1);
    });

    Animated.parallel([
      Animated.timing(bgActionOp, {
        toValue: 0,
        duration: 480,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(bgStandingsOp, {
        toValue: 1,
        duration: 480,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    await startAnim(
      Animated.parallel([
        Animated.timing(titleOp, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(titleScale, {
          toValue: 1,
          speed: 16,
          bounciness: 6,
          useNativeDriver: true,
        }),
        Animated.timing(titleY, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.timing(subtitleOp, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.timing(gridHeaderOp, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const cardAnims = playersUi.map((p) => {
      const v = gridItemAnimsRef.current[p.id]!;
      const slide = gridSlideRef.current[p.id]!;
      return Animated.parallel([
        Animated.spring(v, {
          toValue: 1,
          speed: 18,
          bounciness: 9,
          useNativeDriver: true,
        }),
        Animated.spring(slide, {
          toValue: 0,
          speed: 18,
          bounciness: 8,
          useNativeDriver: true,
        }),
      ]);
    });

    for (let i = 0; i < cardAnims.length; i++) {
      void AudioManager.playAnswerPop();
      await startAnim(cardAnims[i]);
      await startAnim(Animated.delay(50));
    }
  };

  const animateDeadPlayerInGrid = async (playerId: string) => {
    const shake = deathShakeRef.current[playerId];
    const gray = deathGrayRef.current[playerId];
    const x1 = deathX1Ref.current[playerId];
    const x2 = deathX2Ref.current[playerId];
    if (!shake || !gray || !x1 || !x2) return;

    shake.setValue(0);
    gray.setValue(0);
    x1.setValue(0);
    x2.setValue(0);

    const d = (base: number) =>
      Math.max(90, Math.round(base * GRID_DEATH_FAST_MULTIPLIER));

    await startAnim(
      Animated.sequence([
        Animated.timing(shake, {
          toValue: 1,
          duration: d(520),
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(gray, {
            toValue: 1,
            duration: d(480),
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(d(130)),
            Animated.timing(x1, {
              toValue: 1,
              duration: d(280),
              easing: Easing.out(Easing.back(1.2)),
              useNativeDriver: true,
            }),
            Animated.delay(d(60)),
            Animated.timing(x2, {
              toValue: 1,
              duration: d(280),
              easing: Easing.out(Easing.back(1.2)),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ])
    );
  };

  const animateDeadPlayerInCenter = async (playerId: string) => {
    setCenterDeadId(playerId);
    centerDeathShakeX.setValue(0);
    centerDeathGray.setValue(0);
    centerDeathX1.setValue(0);
    centerDeathX2.setValue(0);

    const d = (base: number) =>
      Math.max(100, Math.round(base * CENTER_DEATH_SLOW_MULTIPLIER));

    await startAnim(
      Animated.sequence([
        Animated.timing(centerDeathShakeX, {
          toValue: 1,
          duration: d(520),
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(centerDeathGray, {
            toValue: 1,
            duration: d(520),
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(d(150)),
            Animated.timing(centerDeathX1, {
              toValue: 1,
              duration: d(320),
              easing: Easing.out(Easing.back(1.2)),
              useNativeDriver: true,
            }),
            Animated.delay(d(90)),
            Animated.timing(centerDeathX2, {
              toValue: 1,
              duration: d(320),
              easing: Easing.out(Easing.back(1.2)),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ])
    );
  };

  const replayGridLostHeartLift = async (
    beforeLives: Record<string, number>,
    ids: string[],
  ) => {
    for (const id of ids) {
      const lostHeartIndex = (beforeLives[id] ?? 0) - 1;
      if (lostHeartIndex < 0) continue;
      await runHeartLossSequence(id, {
        visualOnly: true,
        heartIndex: lostHeartIndex,
      });
    }
  };

  const animateWinnerHeroBounce = async () => {
    await startAnim(
      Animated.sequence([
        Animated.spring(winnerHeroY, {
          toValue: -24,
          speed: 18,
          bounciness: 12,
          useNativeDriver: true,
        }),
        Animated.spring(winnerHeroY, {
          toValue: 0,
          speed: 16,
          bounciness: 9,
          useNativeDriver: true,
        }),
        Animated.spring(winnerHeroY, {
          toValue: -18,
          speed: 18,
          bounciness: 11,
          useNativeDriver: true,
        }),
        Animated.spring(winnerHeroY, {
          toValue: 0,
          speed: 16,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.spring(winnerHeroY, {
          toValue: -12,
          speed: 18,
          bounciness: 10,
          useNativeDriver: true,
        }),
        Animated.spring(winnerHeroY, {
          toValue: 0,
          speed: 16,
          bounciness: 8,
          useNativeDriver: true,
        }),
      ])
    );
  };

  const playWinnerScreenSequence = async () => {
    winnerScreenOpacity.setValue(0);
    winnerScreenScale.setValue(1.08);
    winnerScreenY.setValue(36);
    winnerHeroY.setValue(0);
    winnerButtonsOpacity.setValue(0);
    winnerButtonsY.setValue(28);
    setShowWinnerButtons(false);
    setConfettiBurstKey((k) => k + 1);

    await startAnim(
      Animated.parallel([
        Animated.timing(winnerScreenOpacity, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(winnerScreenScale, {
          toValue: 1,
          speed: 14,
          bounciness: 5,
          useNativeDriver: true,
        }),
        Animated.timing(winnerScreenY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    await animateWinnerHeroBounce();

    setShowWinnerButtons(true);
    await startAnim(
      Animated.parallel([
        Animated.timing(winnerButtonsOpacity, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(winnerButtonsY, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );
  };

  useEffect(() => {
    if (didStartRef.current) return;
    didStartRef.current = true;

    const before = { ...lives };
    players.forEach((p) => {
      if (before[p.id] == null) before[p.id] = maxLives;
    });
    setDisplayLives(before);
    displayLivesRef.current = before;

    if (oddOneId) {
      if (mode === "ONLINE" && onlinePlayerId) {
        setActiveCenterId(onlinePlayerId);
      } else {
        setActiveCenterId(oddOneId);
      }
    }

    applyRoundLives();

    const isOnlineSpotlight =
      mode === "ONLINE" && typeof onlinePlayerId === "string";

    const run = async () => {
      await animateTitleEntrance();
      void animateFocusOthersIn();

      if (!oddOneId) {
        bgActionOp.setValue(0);
        bgStandingsOp.setValue(1);
        await unfoldGrid();
        setCanContinue(true);
        return;
      }

      if (impostorLost) {
        if (
          isOnlineSpotlight &&
          onlinePlayerId &&
          onlinePlayerId !== oddOneId
        ) {
          await runFocusSpotlightMoment(happyJumpDiagonal);
          await switchCenterTo(oddOneId);
        }
        await runFocusSpotlightMoment(async () => {
          await animateLifeLoss(oddOneId, true);
          if ((displayLivesRef.current[oddOneId] ?? 0) <= 0) {
            await animateDeadPlayerInCenter(oddOneId);
          }
        });
      } else if (isOnlineSpotlight && onlinePlayerId) {
        const orderedLosingIds = losingIds.includes(onlinePlayerId)
          ? [
              onlinePlayerId,
              ...losingIds.filter((id) => id !== onlinePlayerId),
            ]
          : losingIds;

        await switchCenterTo(onlinePlayerId);
        void AudioManager.playImposterNotLosingLiveSound();
        await runFocusSpotlightMoment(happyJumpDiagonal);
        for (const id of orderedLosingIds) {
          await switchCenterTo(id);
          await runFocusSpotlightMoment(async () => {
            await animateLifeLoss(id, true);
            if ((displayLivesRef.current[id] ?? 0) <= 0) {
              await animateDeadPlayerInCenter(id);
            }
          });
        }
        await switchCenterTo(oddOneId);
      } else {
        void AudioManager.playImposterNotLosingLiveSound();
        await runFocusSpotlightMoment(happyJumpDiagonal);
        for (const id of losingIds) {
          await switchCenterTo(id);
          await runFocusSpotlightMoment(async () => {
            await animateLifeLoss(id, true);
            if ((displayLivesRef.current[id] ?? 0) <= 0) {
              await animateDeadPlayerInCenter(id);
            }
          });
        }
        await switchCenterTo(oddOneId);
      }

      await unfoldGrid();
      displayLivesRef.current = roundOutcome.nextLives;
      setDisplayLives(roundOutcome.nextLives);
      await replayGridLostHeartLift(before, losingIds);
      const deadThisRound = players
        .filter(
          (p) =>
            (before[p.id] ?? maxLives) > 0 &&
            (roundOutcome.nextLives[p.id] ?? 0) === 0
        )
        .map((p) => p.id);

      if (deadThisRound.length) {
        setDeadIds((prev) => Array.from(new Set([...prev, ...deadThisRound])));
        for (const deadId of deadThisRound) {
          await animateDeadPlayerInGrid(deadId);
        }
      }

      const aliveCount = players.filter(
        (p) => (roundOutcome.nextLives[p.id] ?? 0) > 0
      ).length;

      const localDiedThisRound =
        mode === "ONLINE" &&
        typeof onlinePlayerId === "string" &&
        deadThisRound.includes(onlinePlayerId);

      if (localDiedThisRound) {
        await startAnim(Animated.delay(350));
        const variant = aliveCount <= 2 ? "gameOver" : "continue";
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: "PlayerDeath",
                params: {
                  variant,
                  deadPlayerId: onlinePlayerId,
                },
              },
            ],
          })
        );
        return;
      }

      if (aliveCount === 2) {
        await startAnim(Animated.delay(350));
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "DeathMatch" }],
          })
        );
        return;
      }

      if (aliveCount < 2) {
        await startAnim(Animated.delay(350));
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Winner" }],
          })
        );
        return;
      }

      setCanContinue(true);
    };

    void run();
  }, [
    animateFocusOthersIn,
    animateTitleEntrance,
    applyRoundLives,
    happyJumpDiagonal,
    impostorLost,
    lives,
    losingIds,
    mode,
    oddOneId,
    onlinePlayerId,
    playersUi,
    roundOutcome.nextLives,
    maxLives,
    players,
    navigation,
    runFocusSpotlightMoment,
  ]);

  const goNextRound = () => {
    const livesAfterRound = displayLivesRef.current;
    if (mode === "ONLINE") {
      setGameState({
        players,
        lives: { ...livesAfterRound },
      });
    } else {
      const alivePlayers = players.filter(
        (p) => (livesAfterRound[p.id] ?? 0) > 0
      );
      const aliveLives: Record<string, number> = {};
      alivePlayers.forEach((p) => {
        aliveLives[p.id] = livesAfterRound[p.id] ?? 0;
      });
      const someoneJustDied = alivePlayers.length < players.length;
      const currentOriginal = useGameStore.getState().originalPlayers;
      setGameState({
        players: alivePlayers,
        lives: aliveLives,
        // Preserve the full roster the first time someone is eliminated so
        // "restart with same players" can bring everyone back.
        ...(someoneJustDied && !currentOriginal ? { originalPlayers: players } : {}),
      });
    }
    goToNextRound();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Round" }],
      })
    );
  };

  const handleContinue = () => {
    if (!canContinue) return;
    void AudioManager.playTransitionBetweenRounds();
    goNextRound();
  };

  const handleStartNewGame = () => {
    restartWithSamePlayersAndHeroes();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Round" }],
      })
    );
  };

  const handleStartWithDifferentHeroes = () => {
    resetGameState();
    const parent = navigation.getParent();
    parent?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: "CreateGame",
            state: {
              index: 0,
              routes: [{ name: "PlayersNumber" }],
            },
          },
        ],
      })
    );
  };

  const titleMotionRotate = titleWobble.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-1.4deg", "0deg", "1.4deg"],
  });
  const titleMotionScale = titlePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.045],
  });

  return (
    <SafeAreaView className="flex-1 bg-primary-700" edges={["right", "left"]}>
      <View style={styles.bg}>
        {/* Focus phase background (life loss — purple/orange stage) */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgActionOp }]}>
          <ImageBackground
            source={{ uri: LIVES_REVEAL_STANDINGS_BG_URI }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Grid phase background (standings — red radial burst) */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: bgStandingsOp }]}
        >
          <ImageBackground
            source={{ uri: LIVES_REVEAL_ACTION_BG_URI }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        </Animated.View>

        {showGameOver && (
          <ImageBackground
            source={{ uri: WINNER_BG_URI }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        )}

        <BlurView
          intensity={20}
          tint="dark"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {!showGameOver && (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces
          >
            <View style={styles.content}>
              {/* ── FOCUS HEADER ─────────────────────────────────────────── */}
              {phase === "focus" && (
                <Animated.View
                  style={[
                    styles.focusHeader,
                    {
                      opacity: titleOp,
                      transform: [
                        { translateY: titleY },
                        { scale: Animated.multiply(titleScale, titleMotionScale) },
                        { rotate: titleMotionRotate },
                      ],
                    },
                  ]}
                >
                  <GameShowTitle
                    text={t("lives_reveal_life_lost_title")}
                    tone="danger"
                    fontSize={56}
                  />
                  <Animated.View style={{ opacity: subtitleOp, width: "100%" }}>
                    <LinearGradient
                      colors={["#f02828", "#9b0f0f"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.focusRibbon}
                    >
                      <RibbonLabel text={t("lives_reveal_subtitle_focus")} />
                    </LinearGradient>
                  </Animated.View>
                </Animated.View>
              )}

              {/* ── GRID HEADER ──────────────────────────────────────────── */}
              {phase === "grid" && (
                <Animated.View
                  style={[
                    styles.gridHeader,
                    {
                      opacity: titleOp,
                      transform: [
                        { translateY: titleY },
                        { scale: Animated.multiply(titleScale, titleMotionScale) },
                        { rotate: titleMotionRotate },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={["#b855f7", "#6b21a8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.roundRibbon}
                  >
                    <RibbonLabel
                      text={t("lives_reveal_round_label", {
                        round: Math.max(1, round),
                      })}
                      compact
                    />
                  </LinearGradient>
                  <GameShowTitle
                    text={t("lives_reveal_title")}
                    tone="gold"
                    fontSize={64}
                    style={styles.livesHeroTitle}
                  />
                  <Animated.View style={[styles.standingsRow, { opacity: subtitleOp }]}>
                    <View style={styles.standingsLine} />
                    <Text style={styles.standingsText}>
                      {t("lives_reveal_subtitle_grid")}
                    </Text>
                    <View style={styles.standingsLine} />
                  </Animated.View>
                </Animated.View>
              )}

              {phase === "focus" && centerPlayer && (
                <View style={styles.centerFocusSlot} />
              )}

              {phase === "focus" && waitingOthers.length > 0 && (
                <View style={[styles.othersWrap, { width: containerWidth }]}>
                  <CustomText variant="p-xsmall" style={styles.othersLabel}>
                    {t("lives_reveal_waiting")}
                  </CustomText>
                  {focusRows.map((row, rowIdx) => {
                    const avatarSize = calcAvatarSize(row.length, containerWidth);
                    const overlap = avatarSize * OVERLAP_RATIO;

                    return (
                      <View
                        key={`row-${rowIdx}`}
                        style={[styles.rowCenter, { width: containerWidth }]}
                      >
                        {row.map((p, idx) => {
                          const otherAnim =
                            focusOtherAnimsRef.current[p.id] ??
                            new Animated.Value(1);
                          return (
                            <Animated.View
                              key={p.id}
                              style={{
                                marginLeft: idx === 0 ? 0 : -overlap,
                                width: avatarSize,
                                height: avatarSize,
                                borderRadius: avatarSize / 2,
                                overflow: "hidden",
                                zIndex: row.length - idx,
                                borderWidth: 2,
                                borderColor: "rgba(255,200,80,0.45)",
                                opacity: otherAnim,
                                transform: [
                                  {
                                    scale: otherAnim.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [0.6, 1],
                                    }),
                                  },
                                  {
                                    translateY: otherAnim.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [12, 0],
                                    }),
                                  },
                                ],
                              }}
                            >
                              {p.image && (
                                <AppImage
                                  source={p.image}
                                  contentFit="cover"
                                  style={{ width: "100%", height: "100%" }}
                                />
                              )}
                            </Animated.View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              )}

              {phase === "grid" && (
                <Animated.View
                  style={[
                    styles.gridWrap,
                    { width: containerWidth, opacity: gridHeaderOp },
                  ]}
                >
                  {staggeredGridRows.map((row, rowIdx) => (
                    <View
                      key={`grid-row-${rowIdx}`}
                      style={[
                        styles.gridRow,
                        row.centered && styles.gridRowCentered,
                      ]}
                    >
                      {row.players.map((p) => {
                        const v =
                          gridItemAnimsRef.current[p.id] ??
                          new Animated.Value(1);
                        const slide =
                          gridSlideRef.current[p.id] ?? new Animated.Value(0);
                        const shake =
                          deathShakeRef.current[p.id] ?? new Animated.Value(0);
                        const gray =
                          deathGrayRef.current[p.id] ?? new Animated.Value(0);
                        const x1 =
                          deathX1Ref.current[p.id] ?? new Animated.Value(0);
                        const x2 =
                          deathX2Ref.current[p.id] ?? new Animated.Value(0);
                        const isDead =
                          (displayLives[p.id] ?? 0) <= 0 ||
                          deadIds.includes(p.id);
                        const accentIdx = playerAccentIndex[p.id] ?? 0;
                        const accent = CARD_ACCENTS[accentIdx];
                        const cardWidth =
                          row.players.length === 1
                            ? containerWidth * 0.52
                            : (containerWidth - 12) / 2;

                        return (
                          <Animated.View
                            key={p.id}
                            style={[
                              styles.gridCard,
                              {
                                width: cardWidth,
                                borderColor: isDead
                                  ? "rgba(180,60,60,0.55)"
                                  : accent.border,
                                shadowColor: isDead ? "#b03030" : accent.border,
                              },
                              isDead && styles.gridCardDead,
                              {
                                opacity: v,
                                transform: [
                                  {
                                    translateY: v.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [36, 0],
                                    }),
                                  },
                                  {
                                    scale: v.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [0.78, 1],
                                    }),
                                  },
                                  {
                                    translateX: Animated.add(
                                      slide.interpolate({
                                        inputRange: [-1, 0, 1],
                                        outputRange: [-40, 0, 40],
                                      }),
                                      shake.interpolate({
                                        inputRange: [
                                          0, 0.16, 0.32, 0.48, 0.64, 0.8, 1,
                                        ],
                                        outputRange: [0, -10, 10, -8, 8, -4, 0],
                                      }),
                                    ),
                                  },
                                  {
                                    rotate: v.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: ["-4deg", "0deg"],
                                    }),
                                  },
                                ],
                              },
                            ]}
                          >
                            <LinearGradient
                              colors={["rgba(25,12,40,0.92)", "rgba(12,6,22,0.96)"]}
                              style={styles.gridCardInner}
                            >
                              <LinearGradient
                                colors={accent.ribbon}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gridNameRibbon}
                              >
                                <CustomText
                                  variant="p-small"
                                  style={styles.gridNameRibbonText}
                                  numberOfLines={1}
                                >
                                  {getDisplayName(p.id, p.name)}
                                </CustomText>
                              </LinearGradient>

                              {renderHeartsPlate(
                                displayLives[p.id] ?? 0,
                                p.id,
                                "grid",
                                isDead,
                              )}

                              <View
                                style={[
                                  styles.gridImageWrap,
                                  {
                                    borderColor: isDead
                                      ? "rgba(180,80,80,0.5)"
                                      : accent.avatarRing,
                                  },
                                ]}
                              >
                                {p.image && (
                                  <AppImage
                                    source={p.image}
                                    contentFit="cover"
                                    style={styles.gridImage}
                                  />
                                )}
                                <Animated.View
                                  pointerEvents="none"
                                  style={[styles.grayFilterLayer, { opacity: gray }]}
                                >
                                  {p.image && (
                                    <AppImage
                                      source={p.image}
                                      contentFit="cover"
                                      style={styles.gridImageGray}
                                    />
                                  )}
                                </Animated.View>
                                <Animated.View
                                  pointerEvents="none"
                                  style={[
                                    styles.crossLineWrap,
                                    {
                                      opacity: x1,
                                      transform: [
                                        {
                                          scale: x1.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.86, 1],
                                          }),
                                        },
                                      ],
                                    },
                                  ]}
                                >
                                  <AppImage
                                    source={{ uri: X_PART_1_URI }}
                                    contentFit="contain"
                                    style={styles.crossLineImage}
                                  />
                                </Animated.View>
                                <Animated.View
                                  pointerEvents="none"
                                  style={[
                                    styles.crossLineWrap,
                                    {
                                      opacity: x2,
                                      transform: [
                                        {
                                          scale: x2.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.86, 1],
                                          }),
                                        },
                                      ],
                                    },
                                  ]}
                                >
                                  <AppImage
                                    source={{ uri: X_PART_2_URI }}
                                    contentFit="contain"
                                    style={styles.crossLineImage}
                                  />
                                </Animated.View>
                              </View>
                            </LinearGradient>
                          </Animated.View>
                        );
                      })}
                    </View>
                  ))}
                </Animated.View>
              )}
            </View>
          </ScrollView>
        )}

        {phase === "focus" && !showGameOver && (
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
        )}

        {phase === "focus" && !showGameOver && centerPlayer && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.centerFocusOverlay,
              { paddingTop: insets.top + 118 },
              {
                opacity: centerFade,
                transform: [
                  { translateX: centerShakeX },
                  {
                    translateX: centerDeathShakeX.interpolate({
                      inputRange: [0, 0.16, 0.32, 0.48, 0.64, 0.8, 1],
                      outputRange: [0, -12, 12, -10, 10, -5, 0],
                    }),
                  },
                  { translateX: centerJumpX },
                  { translateY: centerJumpY },
                  {
                    scale: Animated.multiply(centerScale, focusSpotlightScale),
                  },
                ],
              },
            ]}
          >
            <View style={styles.centerBlock}>
              {renderHeartsPlate(
                centerLives,
                centerPlayer.id,
                "center",
                centerDeadId === centerPlayer.id || centerLives <= 0,
              )}

              <View style={styles.centerSpotlightWrap}>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.spotlightRing,
                    {
                      opacity: spotlightPulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.35, 0.75],
                      }),
                      transform: [
                        {
                          scale: spotlightPulse.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.06],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <View style={styles.centerImageWrap}>
                  {centerPlayer.image && (
                    <AppImage
                      source={centerPlayer.image}
                      contentFit="cover"
                      style={styles.centerImage}
                    />
                  )}
                  <Animated.View
                    pointerEvents="none"
                    style={[styles.grayFilterLayer, { opacity: centerDeathGray }]}
                  >
                    {centerPlayer.image && (
                      <AppImage
                        source={centerPlayer.image}
                        contentFit="cover"
                        style={styles.centerImageGray}
                      />
                    )}
                  </Animated.View>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.crossLineWrap,
                      {
                        opacity: centerDeathX1,
                        transform: [
                          {
                            scale: centerDeathX1.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.86, 1],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <AppImage
                      source={{ uri: X_PART_1_URI }}
                      contentFit="contain"
                      style={styles.centerCrossLineImage}
                    />
                  </Animated.View>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.crossLineWrap,
                      {
                        opacity: centerDeathX2,
                        transform: [
                          {
                            scale: centerDeathX2.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.86, 1],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <AppImage
                      source={{ uri: X_PART_2_URI }}
                      contentFit="contain"
                      style={styles.centerCrossLineImage}
                    />
                  </Animated.View>
                </View>
              </View>

              <Animated.View
                style={[
                  styles.minusOne,
                  {
                    opacity: minusOneOpacity,
                    transform: [
                      { translateY: minusOneY },
                      { scale: minusOneScale },
                      {
                        rotate: minusOneScale.interpolate({
                          inputRange: [0.82, 1.15],
                          outputRange: ["-8deg", "0deg"],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <AppImage
                  source={{ uri: MINUS_ONE_LIVE_URI }}
                  contentFit="contain"
                  style={styles.minusOneImage}
                />
              </Animated.View>

              <View style={styles.centerNameBtnWrap}>
                <LinearGradient
                  colors={["#e02020", "#9b0f0f"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.focusNameRibbon}
                >
                  <CustomText variant="p" style={styles.focusNameRibbonText}>
                    {getDisplayName(centerPlayer.id, centerPlayer.name)}
                  </CustomText>
                </LinearGradient>
              </View>
            </View>
          </Animated.View>
        )}

        {showGameOver && (
          <Animated.View
            style={[
              styles.gameOverWrap,
              {
                opacity: winnerScreenOpacity,
                transform: [
                  { translateY: winnerScreenY },
                  { scale: winnerScreenScale },
                ],
              },
            ]}
          >
            <View
              key={`confetti-${confettiBurstKey}`}
              pointerEvents="none"
              style={styles.winnerConfettiLayer}
            >
              <LottieView
                source={lottie.confettiTop}
                autoPlay
                loop={false}
                style={styles.confettiTopCenter}
              />
              <LottieView
                source={lottie.confettiTop}
                autoPlay
                loop={false}
                style={styles.confettiTopLeft}
              />
              <LottieView
                source={lottie.confettiTop}
                autoPlay
                loop={false}
                style={styles.confettiTopRight}
              />
              <LottieView
                source={lottie.confettiTop}
                autoPlay
                loop={false}
                style={styles.confettiMidLeft}
              />
              <LottieView
                source={lottie.confettiTop}
                autoPlay
                loop={false}
                style={styles.confettiMidRight}
              />
            </View>

            <AppImage
              source={{ uri: WINNER_TEXT_URI }}
              contentFit="contain"
              style={styles.winnerTitleImage}
            />

            <Animated.View
              style={[
                styles.winnerHeroWrap,
                {
                  transform: [{ translateY: winnerHeroY }],
                },
              ]}
            >
              {winnerHeroImage && (
                <AppImage
                  source={winnerHeroImage}
                  contentFit="contain"
                  style={styles.winnerHeroImage}
                />
              )}
              <AppImage
                source={{ uri: WINNER_PLATFORM_URI }}
                contentFit="contain"
                style={styles.winnerPlatformImage}
              />
            </Animated.View>

            {showWinnerButtons && (
              <Animated.View
                style={[
                  styles.gameOverBtnWrap,
                  {
                    opacity: winnerButtonsOpacity,
                    transform: [{ translateY: winnerButtonsY }],
                  },
                ]}
              >
                <CustomButton
                  title={t("winner_start_new_game_btn")}
                  fullWidth
                  onPress={handleStartNewGame}
                  backgroundImage={backgrounds.bg026}
                  glow
                  glowColor="rgba(41,255,25,0.8)"
                  shadowColor="#005f07"
                />
                <CustomButton
                  title={t("winner_start_diff_heroes_btn")}
                  fullWidth
                  onPress={handleStartWithDifferentHeroes}
                  backgroundImage={backgrounds.bg016}
                  buttonClassName="mt-3"
                  glow
                  glowColor="rgba(255,188,79,0.7)"
                  shadowColor="#834400"
                />
              </Animated.View>
            )}
          </Animated.View>
        )}

        {!showGameOver && (
          <Animated.View
            style={[
              styles.ctaWrap,
              {
                paddingBottom: insets.bottom + 12,
                opacity: canContinue ? ctaOp : 0,
                transform: [{ translateY: canContinue ? ctaY : 24 }],
              },
            ]}
            pointerEvents={canContinue ? "auto" : "none"}
          >
            <CustomButton
              title={t("continue_btn")}
              fullWidth
              onPress={handleContinue}
              backgroundImage={backgrounds.bg026}
              glow
              glowColor="rgba(41,255,25,0.8)"
              shadowColor="#005f07"
              disabled={!canContinue}
            />
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default LivesRevealScreen;

const styles = StyleSheet.create({
  bg: { flex: 1 },
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
  centerFocusOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    alignItems: "center",
    pointerEvents: "none",
  },
  centerFocusSlot: {
    width: "100%",
    height: CENTER_FOCUS_SLOT_HEIGHT,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  /* Focus header */
  focusHeader: {
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  gameShowTitleWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
    paddingHorizontal: 8,
  },
  gameShowTitleLayer: {
    position: "absolute",
    textAlign: "center",
  },
  gameShowTitleHighlight: {
    opacity: 0.2,
    transform: [{ translateY: -1 }],
  },
  livesHeroTitle: {
    marginTop: 2,
    marginBottom: 4,
  },
  ribbonLabelWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  ribbonLabelStroke: {
    position: "absolute",
    fontFamily: "OpenSans-ExtraBold",
    fontSize: 16,
    lineHeight: 20,
    color: "#3a0505",
    textAlign: "center",
    letterSpacing: 0.6,
    transform: [{ translateX: 1 }, { translateY: 2 }],
  },
  ribbonLabelFill: {
    fontFamily: "OpenSans-ExtraBold",
    fontSize: 16,
    lineHeight: 20,
    color: "#fff",
    textAlign: "center",
    letterSpacing: 0.6,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  focusRibbon: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(255,160,160,0.55)",
    alignSelf: "center",
    minWidth: "72%",
    transform: [{ skewX: "-2deg" }],
  },

  /* Grid header */
  gridHeader: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  roundRibbon: {
    paddingHorizontal: 22,
    paddingVertical: 7,
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "rgba(220,180,255,0.5)",
    transform: [{ skewX: "-1deg" }],
  },
  standingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    maxWidth: 320,
  },
  standingsLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: "rgba(255,220,160,0.35)",
  },
  standingsText: {
    color: "#fff8e8",
    fontFamily: "OpenSans-ExtraBold",
    fontSize: 15,
    letterSpacing: 0.8,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  /* Focus center */
  centerBlock: {
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
  centerSpotlightWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 6,
  },
  spotlightRing: {
    position: "absolute",
    width: "72%",
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: "rgba(255,60,40,0.75)",
    backgroundColor: "rgba(255,40,20,0.1)",
    ...Platform.select({
      ios: {
        shadowColor: "#ff2200",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
    }),
  },
  centerImageWrap: {
    width: "64%",
    aspectRatio: 1,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#ff4444",
  },
  centerImage: { width: "100%", height: "100%" },
  centerImageGray: {
    width: "100%",
    height: "100%",
    tintColor: "rgba(120,120,120,0.6)",
    opacity: 0.95,
  },

  /* Hearts */
  heartsPlate: {
    minWidth: 180,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 8,
    borderRadius: 999,
    backgroundColor: "rgba(10,5,15,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heartsPlateFocus: {
    minWidth: 200,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  heartsPlateGrid: {
    minWidth: 0,
    width: "88%",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    marginTop: 4,
    borderRadius: 999,
  },
  heartsPlateDead: {
    borderColor: "rgba(180,60,60,0.35)",
    backgroundColor: "rgba(20,8,8,0.8)",
  },
  heartsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  heartBurnGlow: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(255,60,20,0.55)",
    top: -7,
    left: -7,
  },

  centerNameBtnWrap: { width: 240, marginTop: 12, alignItems: "center" },
  focusNameRibbon: {
    paddingHorizontal: 32,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,120,120,0.45)",
    minWidth: 180,
    alignItems: "center",
  },
  focusNameRibbonText: {
    color: "#fff",
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.5,
  },

  minusOne: {
    position: "absolute",
    right: "6%",
    top: "40%",
    zIndex: 10,
  },
  minusOneImage: { width: 150, height: 62 },

  /* Focus others */
  othersWrap: {
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
    marginTop: 20,
    backgroundColor: "rgba(8,4,16,0.72)",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  othersLabel: {
    color: "rgba(255,220,180,0.55)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Grid cards */
  gridWrap: { marginTop: 4, gap: 14 },
  gridRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  gridRowCentered: {
    justifyContent: "center",
  },
  gridCard: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2.5,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  gridCardDead: { opacity: 0.82 },
  gridCardInner: {
    alignItems: "center",
    paddingBottom: 14,
    paddingTop: 0,
  },
  gridNameRibbon: {
    alignSelf: "stretch",
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  gridNameRibbonText: {
    width: "100%",
    color: "#fff",
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.4,
  },
  gridImageWrap: {
    width: "78%",
    aspectRatio: 1,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 3,
    marginTop: 4,
  },
  gridImage: { width: "100%", height: "100%" },
  gridImageGray: {
    width: "100%",
    height: "100%",
    tintColor: "rgba(120,120,120,0.6)",
    opacity: 0.95,
  },
  grayFilterLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  crossLineWrap: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  crossLineImage: { width: "92%", height: "92%" },
  centerCrossLineImage: { width: "90%", height: "90%" },

  /* Winner (legacy) */
  gameOverWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  gameOverBtnWrap: {
    width: "100%",
    marginTop: 18,
    paddingHorizontal: 8,
  },
  winnerTitleImage: {
    width: "100%",
    height: 320,
    marginTop: 56,
    marginBottom: 8,
  },
  winnerHeroWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 6,
  },
  winnerHeroImage: { width: "100%", height: "60%", zIndex: 3 },
  winnerPlatformImage: { width: "100%", height: 180, zIndex: 2 },
  winnerConfettiLayer: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  confettiTopCenter: {
    position: "absolute",
    top: -20,
    left: "6%",
    width: "88%",
    height: 260,
  },
  confettiTopLeft: {
    position: "absolute",
    top: 24,
    left: -70,
    width: 260,
    height: 260,
    transform: [{ rotate: "-8deg" }],
  },
  confettiTopRight: {
    position: "absolute",
    top: 24,
    right: -70,
    width: 260,
    height: 260,
    transform: [{ rotate: "8deg" }],
  },
  confettiMidLeft: {
    position: "absolute",
    top: 180,
    left: -40,
    width: 220,
    height: 220,
    transform: [{ rotate: "-14deg" }],
  },
  confettiMidRight: {
    position: "absolute",
    top: 180,
    right: -40,
    width: 220,
    height: 220,
    transform: [{ rotate: "14deg" }],
  },
  ctaWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
  },
});
