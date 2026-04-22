// src/screens/Game/LivesRevealScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
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
const HEART_RED_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/eb11ec00-734c-4d5a-b982-69ce7f9d0245-heartRed.webp";
const HEART_BLACK_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/ea21d9fe-366e-41fe-867b-cc57ddd3ad6d-heartBlack.webp";
const X_PART_1_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/61d7faf3-5a8a-4aa8-babd-c20a6b82c588-xpart1.webp";
const X_PART_2_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/ec0c25c5-748e-4689-9742-b6a211bf0a2b-xpart2.webp";
const CENTER_DEATH_SLOW_MULTIPLIER = 1.5;
const GRID_DEATH_FAST_MULTIPLIER = 0.75;
const HAPPY_JUMP_EXTRA_DURATION = 500;
const WINNER_BG_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/3a93c0b5-d3f5-4f42-a996-6c58992cc8ae-IMG_4043.webp";
const WINNER_TEXT_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/1aea25ff-4f32-458c-9623-59374130ff96-winnerText_en.webp";
const WINNER_PLATFORM_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/5051b921-dc67-4c52-a68b-f065ac5eb93d-HeroPickerBottomWinner.webp";

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

function startAnim(animation: Animated.CompositeAnimation) {
  return new Promise<void>((resolve) => {
    animation.start(() => resolve());
  });
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
  const [burningHeartIndex, setBurningHeartIndex] = useState<number | null>(
    null
  );
  const [gridBurningPlayerId, setGridBurningPlayerId] = useState<string | null>(
    null
  );
  const [gridBurningHeartIndex, setGridBurningHeartIndex] = useState<
    number | null
  >(null);

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

  const others = useMemo(
    () => playersUi.filter((p) => p.id !== oddOneId),
    [oddOneId, playersUi]
  );

  const focusRows = useMemo(() => {
    if (others.length <= 5) return [others];
    const firstRowCount = Math.ceil(others.length / 2);
    return [others.slice(0, firstRowCount), others.slice(firstRowCount)];
  }, [others]);

  const gridRows = useMemo(() => {
    const rows: PlayerUi[][] = [];
    for (let i = 0; i < playersUi.length; i += 2) {
      rows.push(playersUi.slice(i, i + 2));
    }
    return rows;
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

  const renderHeartsPlate = (
    count: number,
    burningIndex: number | null = null,
    variant: HeartPlateVariant = "center"
  ) => (
    <ImageBackground
      source={backgrounds.bg005}
      resizeMode="stretch"
      imageStyle={{ borderRadius: 14 }}
      style={[styles.heartsPlate, variant === "grid" && styles.heartsPlateGrid]}
    >
      <View style={styles.heartsRow}>
        {Array.from({ length: maxLives }, (_, i) => {
          const isBurning = burningIndex === i;
          const pulseScale = isBurning
            ? burningHeartPulse.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.45],
              })
            : 1;
          const heartSize =
            maxLives >= 5
              ? variant === "grid"
                ? 26
                : 32
              : variant === "grid"
                ? 44
                : 54;
          const horizontalGap =
            maxLives >= 5
              ? variant === "grid"
                ? 1.5
                : 2.5
              : variant === "grid"
                ? 3
                : 4;

          return (
            <Animated.View
              key={`heart-${i}`}
              style={{
                transform: [{ scale: pulseScale }],
                opacity: 1,
                marginHorizontal: horizontalGap,
              }}
            >
              <AppImage
                source={{ uri: i < count ? HEART_RED_URI : HEART_BLACK_URI }}
                contentFit="contain"
                style={{
                  width: heartSize,
                  height: heartSize,
                }}
              />
            </Animated.View>
          );
        })}
      </View>
    </ImageBackground>
  );

  const decrementLife = (playerId: string) => {
    const current = displayLivesRef.current[playerId] ?? maxLives;
    const next = {
      ...displayLivesRef.current,
      [playerId]: Math.max(0, current - 1),
    };
    displayLivesRef.current = next;
    setDisplayLives(next);
  };

  const animateHeartBurnThenDecrease = async (
    playerId: string,
    slow = false
  ) => {
    const before = displayLivesRef.current[playerId] ?? 0;
    const rightMostActive = before - 1;

    if (rightMostActive < 0) return;

    setBurningHeartIndex(rightMostActive);
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
      ])
    );

    decrementLife(playerId);
    setBurningHeartIndex(null);
  };

  const animateGridHeartBurnThenDecrease = async (
    playerId: string,
    slow = false
  ) => {
    const before = displayLivesRef.current[playerId] ?? 0;
    const rightMostActive = before - 1;
    if (rightMostActive < 0) return;

    setGridBurningPlayerId(playerId);
    setGridBurningHeartIndex(rightMostActive);
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
      ])
    );

    decrementLife(playerId);
    setGridBurningHeartIndex(null);
    setGridBurningPlayerId(null);
  };

  const animateLifeLoss = async (playerId: string, slow = false) => {
    const d = (base: number) =>
      Math.max(70, Math.round(base * (slow ? WIN_SLOW_FACTOR : 1)));

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
          duration: 90,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(centerScale, {
          toValue: 0.92,
          duration: 90,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    setActiveCenterId(playerId);
    centerShakeX.setValue(0);
    centerDeathShakeX.setValue(0);
    centerDeathGray.setValue(0);
    centerDeathX1.setValue(0);
    centerDeathX2.setValue(0);
    setCenterDeadId(null);

    await startAnim(
      Animated.parallel([
        Animated.timing(centerFade, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(centerScale, {
          toValue: 1,
          speed: 15,
          bounciness: 5,
          useNativeDriver: true,
        }),
      ])
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

    playersUi.forEach((p) => {
      const v = gridItemAnimsRef.current[p.id];
      if (v) v.setValue(0);
    });

    const animations = playersUi
      .map((p) => gridItemAnimsRef.current[p.id])
      .filter(Boolean)
      .map((v) =>
        Animated.spring(v, {
          toValue: 1,
          speed: 15,
          bounciness: 7,
          useNativeDriver: true,
        })
      );

    await startAnim(Animated.stagger(65, animations));
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
    ids: string[]
  ) => {
    for (const id of ids) {
      const lostHeartIndex = (beforeLives[id] ?? 0) - 1;
      if (lostHeartIndex < 0) continue;

      setGridBurningPlayerId(id);
      setGridBurningHeartIndex(lostHeartIndex);
      burningHeartPulse.setValue(0);

      const d = (base: number) => Math.max(60, Math.round(base * 0.75));
      await startAnim(
        Animated.sequence([
          Animated.timing(burningHeartPulse, {
            toValue: 1,
            duration: d(210),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(burningHeartPulse, {
            toValue: 0,
            duration: d(220),
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      );

      setGridBurningHeartIndex(null);
      setGridBurningPlayerId(null);
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
      if (!oddOneId) {
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
          await happyJumpDiagonal();
          await switchCenterTo(oddOneId);
        }
        await animateLifeLoss(oddOneId, true);
        if ((displayLivesRef.current[oddOneId] ?? 0) <= 0) {
          await animateDeadPlayerInCenter(oddOneId);
        }
      } else if (isOnlineSpotlight && onlinePlayerId) {
        const orderedLosingIds = losingIds.includes(onlinePlayerId)
          ? [
              onlinePlayerId,
              ...losingIds.filter((id) => id !== onlinePlayerId),
            ]
          : losingIds;

        await switchCenterTo(onlinePlayerId);
        await happyJumpDiagonal();
        for (const id of orderedLosingIds) {
          await switchCenterTo(id);
          await animateLifeLoss(id, true);
          if ((displayLivesRef.current[id] ?? 0) <= 0) {
            await animateDeadPlayerInCenter(id);
          }
        }
        await switchCenterTo(oddOneId);
      } else {
        await happyJumpDiagonal();
        for (const id of losingIds) {
          await switchCenterTo(id);
          await animateLifeLoss(id, true);
          if ((displayLivesRef.current[id] ?? 0) <= 0) {
            await animateDeadPlayerInCenter(id);
          }
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

      if (aliveCount <= 2) {
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
    applyRoundLives,
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
      setGameState({
        players: alivePlayers,
        lives: aliveLives,
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
    goNextRound();
  };

  const handleSkip = () => {
    if (showGameOver) return;
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

  return (
    <SafeAreaView className="flex-1 bg-primary-700" edges={["right", "left"]}>
      <ImageBackground
        source={showGameOver ? { uri: WINNER_BG_URI } : backgrounds.bg023}
        style={styles.bg}
        resizeMode="cover"
      >
        {!showGameOver && (
          <View style={styles.skipWrap}>
            <Pressable onPress={handleSkip} hitSlop={16}>
              <CustomText className="h3-headline">
                {t("skip", { defaultValue: "Skip" })}
              </CustomText>
            </Pressable>
          </View>
        )}

        {!showGameOver && (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces
          >
            <View style={styles.content}>
              {phase === "focus" && centerPlayer && (
                <Animated.View
                  style={[
                    styles.centerBlock,
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
                        { scale: centerScale },
                      ],
                    },
                  ]}
                >
                  {renderHeartsPlate(centerLives, burningHeartIndex)}
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
                      style={[
                        styles.grayFilterLayer,
                        {
                          opacity: centerDeathGray,
                        },
                      ]}
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
                    <CustomButton
                      title={centerPlayer.name}
                      appearance="tertiary"
                      btnSize="xs"
                      fontSize="sm"
                      backgroundImage={
                        centerDeadId === centerPlayer.id || centerLives <= 0
                          ? backgrounds.bg016
                          : backgrounds.bg018
                      }
                      glow
                      fullWidth
                      onPress={() => {}}
                      glowColor="rgba(255,204,0,1)"
                      shadowColor="#834400"
                      buttonClassName="-mt-4"
                    />
                  </View>
                </Animated.View>
              )}

              {phase === "focus" && (
                <View style={[styles.othersWrap, { width: containerWidth }]}>
                  {focusRows.map((row, rowIdx) => {
                    const avatarSize = calcAvatarSize(
                      row.length,
                      containerWidth
                    );
                    const overlap = avatarSize * OVERLAP_RATIO;

                    return (
                      <View
                        key={`row-${rowIdx}`}
                        style={[styles.rowCenter, { width: containerWidth }]}
                      >
                        {row.map((p, idx) => (
                          <View
                            key={p.id}
                            style={{
                              marginLeft: idx === 0 ? 0 : -overlap,
                              width: avatarSize,
                              height: avatarSize,
                              // borderRadius: avatarSize / 2,
                              overflow: "hidden",
                              zIndex: row.length - idx,
                            }}
                          >
                            {p.image && (
                              <AppImage
                                source={p.image}
                                contentFit="cover"
                                style={{ width: "100%", height: "100%" }}
                              />
                            )}
                          </View>
                        ))}
                      </View>
                    );
                  })}
                </View>
              )}

              {phase === "grid" && (
                <View style={[styles.gridWrap, { width: containerWidth }]}>
                  {gridRows.map((row, rowIdx) => (
                    <View key={`grid-row-${rowIdx}`} style={styles.gridRow}>
                      {row.map((p) => {
                        const v =
                          gridItemAnimsRef.current[p.id] ??
                          new Animated.Value(1);
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
                        return (
                          <Animated.View
                            key={p.id}
                            style={[
                              styles.gridCard,
                              {
                                opacity: v,
                                transform: [
                                  {
                                    translateY: v.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [16, 0],
                                    }),
                                  },
                                  {
                                    scale: v.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [0.92, 1],
                                    }),
                                  },
                                  {
                                    translateX: shake.interpolate({
                                      inputRange: [
                                        0, 0.16, 0.32, 0.48, 0.64, 0.8, 1,
                                      ],
                                      outputRange: [0, -10, 10, -8, 8, -4, 0],
                                    }),
                                  },
                                ],
                              },
                            ]}
                          >
                            {renderHeartsPlate(
                              displayLives[p.id] ?? 0,
                              gridBurningPlayerId === p.id
                                ? gridBurningHeartIndex
                                : null,
                              "grid"
                            )}
                            <View style={styles.gridImageWrap}>
                              {p.image && (
                                <AppImage
                                  source={p.image}
                                  contentFit="cover"
                                  style={styles.gridImage}
                                />
                              )}
                              <Animated.View
                                pointerEvents="none"
                                style={[
                                  styles.grayFilterLayer,
                                  {
                                    opacity: gray,
                                  },
                                ]}
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
                            <View style={styles.gridNameBtnWrap}>
                              <CustomButton
                                title={p.name}
                                appearance="tertiary"
                                btnSize="xs"
                                fontSize="sm"
                                backgroundImage={
                                  isDead ? backgrounds.bg016 : backgrounds.bg018
                                }
                                glow
                                fullWidth
                                onPress={() => {}}
                                glowColor="rgba(255,204,0,1)"
                                shadowColor="#834400"
                                buttonClassName="-mt-4"
                              />
                            </View>
                          </Animated.View>
                        );
                      })}
                      {row.length === 1 && <View style={styles.gridCard} />}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
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
          <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + 12 }]}>
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
          </View>
        )}
      </ImageBackground>
    </SafeAreaView>
  );
};

export default LivesRevealScreen;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  skipWrap: {
    position: "absolute",
    top: 48,
    right: 16,
    zIndex: 20,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  centerBlock: {
    width: "100%",
    alignItems: "center",
    marginBottom: 14,
  },
  centerImageWrap: {
    width: "62%",
    aspectRatio: 1,
    // borderRadius: 999,
    overflow: "hidden",
  },
  centerImage: {
    width: "100%",
    height: "100%",
  },
  centerImageGray: {
    width: "100%",
    height: "100%",
    tintColor: "rgba(160,160,160,0.5)",
    opacity: 0.95,
  },
  heartsPlate: {
    minWidth: 220,
    paddingHorizontal: 22,
    paddingVertical: 10,
    marginBottom: 8,
  },
  heartsPlateGrid: {
    minWidth: 188,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: -16,
  },
  heartsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  centerNameBtnWrap: {
    width: 220,
    marginTop: 8,
  },
  minusOne: {
    position: "absolute",
    right: 18,
    top: "34%",
    zIndex: 10,
  },
  minusOneImage: {
    width: 180,
    height: 74,
  },
  othersWrap: {
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
    marginTop: 14,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  gridWrap: {
    marginTop: 8,
    gap: 44,
  },
  gridRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  gridCard: {
    flex: 1,
    alignItems: "center",
  },
  gridImageWrap: {
    width: "88%",
    aspectRatio: 1,
    // borderRadius: 999,
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridImageGray: {
    width: "100%",
    height: "100%",
    tintColor: "rgba(160,160,160,0.5)",
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
  crossLineImage: {
    width: "92%",
    height: "92%",
  },
  centerCrossLineImage: {
    width: "90%",
    height: "90%",
  },
  gridNameBtnWrap: {
    width: "92%",
    marginTop: -18,
  },
  gameOverWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  gameOverTitle: {
    color: "#fff",
    textAlign: "center",
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
  winnerHeroImage: {
    width: "100%",
    height: "60%",
    // marginBottom: -42,
    zIndex: 3,
  },
  winnerPlatformImage: {
    width: "100%",
    height: 180,
    zIndex: 2,
  },
  winnerConfettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
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
