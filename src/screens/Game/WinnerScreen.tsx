import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  ImageBackground,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import LottieView from "lottie-react-native";

import { GameStackParamList } from "../../navigation/types";
import { GameMode } from "../../api/analytics";
import {
  disconnectMultiplayerRelay,
  sendMultiplayerRelay,
  subscribeMultiplayerRelay,
} from "../../api/multiplayerRelay";
import {
  HOST_CLOSE_SESSION_MESSAGE_TYPE,
  HOST_SESSION_NEW_HEROES_MESSAGE_TYPE,
  HOST_SESSION_RESTART_MESSAGE_TYPE,
  WINNER_FACT_DISMISSED_MESSAGE_TYPE,
} from "../../constants/onlineLobby";
import { useGameStore } from "../../store/useGameStore";
import { useAuthStore } from "../../store/useUserStore";
import { useHeroesStore } from "../../store/useHeroesStore";
import { usePreventBack } from "../../hooks/usePreventBack";
import { getRevealVariant } from "../../utils/revealQuotes";
import { fetchRandomFunFact } from "../../api/questions";
import { useTrackGameFinishedMutation } from "../../api/hooks/useAnalyticsMutations";
import AppImage from "../../components/AppImage";
import CustomButton from "../../components/common/CustomButton";
import CustomText from "../../components/common/CustomText";
import { backgrounds } from "../../../assets/backgrounds";
import { lottie } from "../../../assets/lottie";
import EliminatedGameEndView from "../../components/game/EliminatedGameEndView";

type Nav = StackNavigationProp<GameStackParamList, "Winner">;

const WINNER_BG_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/3a93c0b5-d3f5-4f42-a996-6c58992cc8ae-IMG_4043.webp";
const WINNER_TEXT_EN_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/1aea25ff-4f32-458c-9623-59374130ff96-winnerText_en.webp";
const WINNER_TEXT_BG_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/9cafabf4-04f7-4e20-99b3-5ae2d7955e32-winnerText_bg.webp";
const WINNER_TEXT_FR_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/d79d51cd-5a0d-4cef-a367-5f571255012e-winnerText_fr.webp";
const WINNER_TEXT_ES_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/d9695ece-16c5-48a9-a61a-db6638a1718a-winnerText_es.webp";
const WINNER_PLATFORM_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/33c7abd1-9ef1-40a7-9609-6e1b2eb78ce1-winnerScreenPlatform.webp";
const ALSO_WINNER_STICKER_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/0896451f-3ad4-403f-943d-ae9e973f5b3f-gg.webp";
const DEFAULT_FUN_FACT = "Bananas are berries, but strawberries are not.";
const WINNER_HERO_HEIGHT_PCT = 0.62;
const WINNER_HERO_BOTTOM_PCT = 0.08;
const WINNER_PLATFORM_HEIGHT_PCT = 0.3;
const WINNER_PLATFORM_BOTTOM_PCT = 0;
const WINNER_TITLE_TO_STAGE_GAP_PCT = 0.04;
const CONFETTI_RENDER_MODE =
  Platform.OS === "android" ? "SOFTWARE" : "AUTOMATIC";

function startAnim(animation: Animated.CompositeAnimation) {
  return new Promise<void>((resolve) => animation.start(() => resolve()));
}

export default function WinnerScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { i18n, t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  usePreventBack();

  const players = useGameStore((s) => s.players);
  const lives = useGameStore((s) => s.lives);
  const oddOneId = useGameStore((s) => s.oddOneId);
  const votes = useGameStore((s) => s.votes);
  const mode = useGameStore((s) => s.mode) as GameMode;
  const onlinePlayerId = useGameStore((s) => s.onlinePlayerId);
  const onlineIsHost = useGameStore((s) => s.onlineIsHost);
  const heroes = useHeroesStore((s) => s.heroes);
  const restartWithSamePlayersAndHeroes = useGameStore(
    (s) => s.restartWithSamePlayersAndHeroes,
  );
  const resetGameState = useGameStore((s) => s.reset);
  const round = useGameStore((s) => s.round);
  const gameId = useGameStore((s) => s.gameId);
  const updateSettings = useAuthStore((s) => s.updateSettings);
  const userId = useAuthStore((s) => s.user.id);
  const trackGameFinishedMutation = useTrackGameFinishedMutation();
  const gameFinishedSentRef = useRef(false);

  useEffect(() => {
    if (gameId?.startsWith("dev_")) return;
    updateSettings({ hasCompletedAnyGame: true });
  }, [gameId, updateSettings]);

  const [showButtons, setShowButtons] = useState(false);
  const [showRevealButton, setShowRevealButton] = useState(false);
  const [showSurpriseOverlay, setShowSurpriseOverlay] = useState(false);
  const [showSurpriseContent, setShowSurpriseContent] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [confettiBursts, setConfettiBursts] = useState(1);
  const [showSecondWave, setShowSecondWave] = useState(false);
  const [showThirdWave, setShowThirdWave] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [winnerStageIndex, setWinnerStageIndex] = useState(0);
  const [funFactText, setFunFactText] = useState(DEFAULT_FUN_FACT);

  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenScale = useRef(new Animated.Value(1.08)).current;
  const screenY = useRef(new Animated.Value(36)).current;
  const heroY = useRef(new Animated.Value(0)).current;
  const titleX = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsY = useRef(new Animated.Value(28)).current;
  const revealBtnOpacity = useRef(new Animated.Value(0)).current;
  const revealBtnY = useRef(new Animated.Value(28)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const surprisePlateScale = useRef(new Animated.Value(40)).current;
  const surprisePlateOpacity = useRef(new Animated.Value(0)).current;
  const surpriseShake = useRef(new Animated.Value(0)).current;
  const surpriseHeightAnim = useRef(new Animated.Value(110)).current;
  const surpriseContentOpacity = useRef(new Animated.Value(0)).current;
  const closeBtnOpacity = useRef(new Animated.Value(0)).current;
  const closeBtnY = useRef(new Animated.Value(18)).current;
  const coWinnerStickerOpacity = useRef(new Animated.Value(0)).current;
  const coWinnerStickerScale = useRef(new Animated.Value(1.55)).current;
  const coWinnerStickerY = useRef(new Animated.Value(-34)).current;
  const stageFunFactsRef = useRef<Record<string, string>>({});
  const hasTwoWinnersRef = useRef(false);
  const winnerFactDismissRecvRef = useRef(0);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const alivePlayers = useMemo(
    () => players.filter((p) => (lives[p.id] ?? 0) > 0),
    [lives, players],
  );
  const winnerPlayers = useMemo(() => {
    if (!alivePlayers.length) return [];
    const sorted = [...alivePlayers].sort((a, b) => {
      const livesDiff = (lives[b.id] ?? 0) - (lives[a.id] ?? 0);
      if (livesDiff !== 0) return livesDiff;
      return (
        players.findIndex((p) => p.id === a.id) -
        players.findIndex((p) => p.id === b.id)
      );
    });
    const topLives = lives[sorted[0]?.id] ?? 0;
    const secondLives = lives[sorted[1]?.id] ?? 0;
    const exactlyTwoAlive = sorted.length === 2;
    const tiedAtTop = exactlyTwoAlive && topLives === secondLives;
    return tiedAtTop ? sorted : sorted.slice(0, 1);
  }, [alivePlayers, lives, players]);
  const hasTwoWinners = winnerPlayers.length === 2;
  hasTwoWinnersRef.current = hasTwoWinners;

  const isLocalEliminated =
    mode === "ONLINE" &&
    onlinePlayerId != null &&
    lives[onlinePlayerId] != null &&
    lives[onlinePlayerId] <= 0;

  const effectiveWinnerStageIndex = useMemo(() => {
    if (mode === "ONLINE" && hasTwoWinners && onlinePlayerId) {
      const idx = winnerPlayers.findIndex((p) => p.id === onlinePlayerId);
      if (idx >= 0) return idx;
    }
    return winnerStageIndex;
  }, [mode, hasTwoWinners, onlinePlayerId, winnerPlayers, winnerStageIndex]);

  const winnerPlayer =
    winnerPlayers[effectiveWinnerStageIndex] ?? winnerPlayers[0] ?? null;

  /** Pass-and-play only: both winner stages on one device. Online co-winners each stay on their own stage. */
  const shouldShowContinueButton =
    hasTwoWinners && winnerStageIndex === 0 && mode !== "ONLINE";

  const canSeeWinnerSurpriseOnline =
    mode !== "ONLINE" || !onlinePlayerId || winnerPlayer?.id === onlinePlayerId;

  const shouldShowCoWinnerSticker =
    hasTwoWinners && mode !== "ONLINE" && winnerStageIndex === 1;

  const maybeTrackGameFinished = useCallback(() => {
    if (!gameId) return;
    if (gameFinishedSentRef.current) return;
    if (mode === "ONLINE" && !onlineIsHost) return;
    gameFinishedSentRef.current = true;
    trackGameFinishedMutation.mutate(
      { gameId, mode, userId },
      {
        onError: (e) => {
          gameFinishedSentRef.current = false;
          console.warn("track GAME_FINISHED failed", e);
        },
      },
    );
  }, [gameId, mode, onlineIsHost, trackGameFinishedMutation, userId]);

  useEffect(() => {
    if (!showButtons) return;
    if (shouldShowContinueButton) return;
    maybeTrackGameFinished();
  }, [showButtons, shouldShowContinueButton, maybeTrackGameFinished]);

  const votedWinner = useMemo(() => {
    if (!oddOneId) return null;
    const votedWinnerMap = Object.entries(votes).reduce(
      (acc, [voterId, targetId]) => {
        if (voterId === oddOneId) return acc;
        acc[targetId] = (acc[targetId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const maxVotes = Math.max(0, ...Object.values(votedWinnerMap));
    const topTargets = Object.entries(votedWinnerMap)
      .filter(([, v]) => v === maxVotes && maxVotes > 0)
      .map(([id]) => id);
    if (topTargets.length !== 1) return null;
    return topTargets[0];
  }, [oddOneId, votes]);

  const impostorLost = !!oddOneId && votedWinner === oddOneId;
  const totalEligibleVoters = players.length > 0 ? players.length - 1 : 0;
  const votesForImpostor = Object.entries(votes).filter(
    ([voterId, targetId]) => voterId !== oddOneId && targetId === oddOneId,
  ).length;
  const revealVariant = getRevealVariant(
    votesForImpostor,
    totalEligibleVoters,
    !impostorLost,
  );

  const winnerHeroImage = useMemo(() => {
    if (!winnerPlayer) return null;
    const hero = heroes.find((h) => h.id === winnerPlayer.characterId);
    if (!hero) return null;

    const pickRandom = (arr: any[] | undefined) =>
      arr && arr.length > 0
        ? arr[Math.floor(Math.random() * arr.length)]
        : null;

    const isImpostorWinner = winnerPlayer.id === oddOneId && !impostorLost;
    const perfect = pickRandom(hero.winImagesByVariant?.PERFECT_BLUFF);
    const normal =
      pickRandom(hero.winImagesByVariant?.NORMAL) ?? pickRandom(hero.winImages);

    if (isImpostorWinner && revealVariant === "PERFECT_BLUFF") {
      return perfect ?? normal ?? hero.main_image ?? hero.profileImage ?? null;
    }
    return normal ?? hero.main_image ?? hero.profileImage ?? null;
  }, [heroes, impostorLost, oddOneId, revealVariant, winnerPlayer]);

  const winnerTitleUri = useMemo(() => {
    const lang = (i18n.language ?? "en").toLowerCase();
    if (lang.startsWith("bg")) return WINNER_TEXT_BG_URI;
    if (lang.startsWith("fr")) return WINNER_TEXT_FR_URI;
    if (lang.startsWith("es")) return WINNER_TEXT_ES_URI;
    return WINNER_TEXT_EN_URI;
  }, [i18n.language]);
  const surpriseTargetHeight = useMemo(
    () => Math.max(320, Math.round(windowHeight * 0.55)),
    [windowHeight],
  );
  const winnerTitleHeight = useMemo(
    () => Math.round(windowHeight * 0.3),
    [windowHeight],
  );
  const winnerHeroHeight = useMemo(
    () => Math.round(windowHeight * WINNER_HERO_HEIGHT_PCT),
    [windowHeight],
  );
  const winnerPlatformHeight = useMemo(
    () => Math.round(windowHeight * WINNER_PLATFORM_HEIGHT_PCT),
    [windowHeight],
  );
  const heroBottomOffset = useMemo(
    () => Math.round(windowHeight * WINNER_HERO_BOTTOM_PCT),
    [windowHeight],
  );
  /** Stage vertical offset from screen bottom (percentage of screen height). */
  const platformBottomOffset = useMemo(
    () => Math.round(windowHeight * WINNER_PLATFORM_BOTTOM_PCT),
    [windowHeight],
  );
  const titleTopOffset = useMemo(
    () => Math.round(windowHeight * 0.002),
    [windowHeight],
  );
  const stageTopOffset = useMemo(
    () => Math.round(windowHeight * WINNER_TITLE_TO_STAGE_GAP_PCT),
    [windowHeight],
  );

  useEffect(() => {
    stageFunFactsRef.current = {};
  }, [i18n.language]);

  useEffect(() => {
    if (isLocalEliminated) return;

    let cancelled = false;
    const fallbackPrimary = t("winner_fun_fact_fallback", DEFAULT_FUN_FACT);
    const fallbackSecondary = t(
      "winner_fun_fact_fallback_alt",
      "Octopuses have three hearts.",
    );
    const pickFallbackDifferent = (excluded?: string) => {
      const candidates = [fallbackPrimary, fallbackSecondary].map((s) =>
        s.trim(),
      );
      const found = candidates.find((s) => s && s !== excluded);
      return found || fallbackPrimary;
    };

    const cacheKey = winnerPlayer?.id ?? `_stage_${winnerStageIndex}`;

    const loadFunFact = async () => {
      const cached = stageFunFactsRef.current[cacheKey];
      if (cached) {
        if (!cancelled) setFunFactText(cached);
        return;
      }

      const firstId = winnerPlayers[0]?.id;
      const excludedFirstWinnerFact =
        hasTwoWinners && winnerStageIndex === 1 && mode !== "ONLINE" && firstId
          ? stageFunFactsRef.current[firstId]
          : undefined;
      try {
        const attempts =
          excludedFirstWinnerFact && excludedFirstWinnerFact.trim() ? 8 : 1;
        let pickedText: string | null = null;

        for (let i = 0; i < attempts; i += 1) {
          const seedBase = winnerPlayer?.id
            ? `${winnerPlayer.id}-${round ?? 0}`
            : `r${round ?? 0}-s${winnerStageIndex}`;
          const fact = await fetchRandomFunFact(i18n.language, {
            seed: `${seedBase}-${i}`,
          });
          const text = fact?.text?.trim();
          if (!text) continue;
          if (excludedFirstWinnerFact && text === excludedFirstWinnerFact) {
            continue;
          }
          pickedText = text;
          break;
        }

        const safeText =
          pickedText || pickFallbackDifferent(excludedFirstWinnerFact);
        stageFunFactsRef.current[cacheKey] = safeText;
        if (!cancelled) setFunFactText(safeText);
      } catch {
        const safeText = pickFallbackDifferent(excludedFirstWinnerFact);
        stageFunFactsRef.current[cacheKey] = safeText;
        if (!cancelled) setFunFactText(safeText);
      }
    };

    setFunFactText(pickFallbackDifferent());
    void loadFunFact();

    return () => {
      cancelled = true;
    };
  }, [
    hasTwoWinners,
    i18n.language,
    isLocalEliminated,
    mode,
    round,
    t,
    winnerPlayer?.id,
    winnerPlayers,
    winnerStageIndex,
  ]);

  const funFactDisplay = useMemo(
    () =>
      funFactText
        .replace(/\r?\n/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim(),
    [funFactText],
  );

  const animateTitleBurst = async () => {
    await startAnim(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(titleX, {
            toValue: -26,
            duration: 70,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(titleY, {
            toValue: -22,
            duration: 70,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(titleX, {
            toValue: 24,
            duration: 70,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(titleY, {
            toValue: -18,
            duration: 70,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(titleX, {
            toValue: -18,
            duration: 70,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(titleY, {
            toValue: 14,
            duration: 70,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(titleX, {
            toValue: 16,
            duration: 70,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(titleY, {
            toValue: 10,
            duration: 70,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(titleX, {
            toValue: -10,
            duration: 60,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(titleY, {
            toValue: -8,
            duration: 60,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(titleX, {
            toValue: 0,
            duration: 60,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(titleY, {
            toValue: 0,
            duration: 60,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(titleX, {
            toValue: -8,
            duration: 50,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(titleY, {
            toValue: -6,
            duration: 50,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(titleX, {
            toValue: 0,
            duration: 50,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(titleY, {
            toValue: 0,
            duration: 50,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
  };

  const triggerNextBurst = (idx: number) => {
    timersRef.current.push(
      setTimeout(
        () => {
          setConfettiBursts((v) => Math.max(v, idx + 1));
        },
        650 * (idx + 1),
      ),
    );
  };

  const prepareConfettiBursts = () => {
    setConfettiBursts(1);
    // plus 3 more bursts one after another
    triggerNextBurst(1);
    triggerNextBurst(2);
    triggerNextBurst(3);
  };

  useEffect(() => {
    if (isLocalEliminated) return;

    const run = async () => {
      screenOpacity.setValue(0);
      screenScale.setValue(1.08);
      screenY.setValue(36);
      buttonsOpacity.setValue(0);
      buttonsY.setValue(28);
      revealBtnOpacity.setValue(0);
      revealBtnY.setValue(28);
      overlayOpacity.setValue(0);
      surprisePlateScale.setValue(40);
      surprisePlateOpacity.setValue(0);
      surpriseShake.setValue(0);
      surpriseHeightAnim.setValue(110);
      surpriseContentOpacity.setValue(0);
      closeBtnOpacity.setValue(0);
      closeBtnY.setValue(18);
      coWinnerStickerOpacity.setValue(0);
      coWinnerStickerScale.setValue(1.55);
      coWinnerStickerY.setValue(-34);
      titleX.setValue(0);
      titleY.setValue(0);
      setShowButtons(false);
      setShowRevealButton(false);
      setShowSurpriseOverlay(false);
      setShowSurpriseContent(false);
      setShowCloseButton(false);
      setConfettiKey((k) => k + 1);
      setShowSecondWave(false);
      setShowThirdWave(false);
      prepareConfettiBursts();

      await startAnim(
        Animated.parallel([
          Animated.timing(screenOpacity, {
            toValue: 1,
            duration: 560,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(screenScale, {
            toValue: 1,
            speed: 14,
            bounciness: 5,
            useNativeDriver: true,
          }),
          Animated.timing(screenY, {
            toValue: 0,
            duration: 440,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      );

      void animateTitleBurst();
      if (shouldShowCoWinnerSticker) {
        timersRef.current.push(
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(coWinnerStickerOpacity, {
                toValue: 1,
                duration: 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.spring(coWinnerStickerScale, {
                toValue: 1,
                speed: 16,
                bounciness: 7,
                useNativeDriver: true,
              }),
              Animated.timing(coWinnerStickerY, {
                toValue: 0,
                duration: 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]).start();
          }, 520),
        );
      }

      timersRef.current.push(
        setTimeout(() => {
          setShowSecondWave(true);
        }, 1500),
      );
      timersRef.current.push(
        setTimeout(() => {
          setShowThirdWave(true);
        }, 3200),
      );
      timersRef.current.push(
        setTimeout(() => {
          setConfettiBursts(0);
          setShowSecondWave(false);
          setShowThirdWave(false);
        }, 6400),
      );
      timersRef.current.push(
        setTimeout(() => {
          if (!canSeeWinnerSurpriseOnline) return;
          setShowRevealButton(true);
          Animated.parallel([
            Animated.timing(revealBtnOpacity, {
              toValue: 1,
              duration: 320,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            }),
            Animated.timing(revealBtnY, {
              toValue: 0,
              duration: 320,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            }),
          ]).start();
        }, 6500),
      );
    };

    void run();
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [
    buttonsOpacity,
    buttonsY,
    closeBtnOpacity,
    closeBtnY,
    coWinnerStickerOpacity,
    coWinnerStickerScale,
    coWinnerStickerY,
    hasTwoWinners,
    overlayOpacity,
    revealBtnOpacity,
    revealBtnY,
    screenOpacity,
    screenScale,
    screenY,
    surpriseContentOpacity,
    surpriseHeightAnim,
    surprisePlateOpacity,
    surprisePlateScale,
    surpriseTargetHeight,
    surpriseShake,
    shouldShowCoWinnerSticker,
    titleX,
    titleY,
    winnerStageIndex,
    canSeeWinnerSurpriseOnline,
    mode,
    onlinePlayerId,
    winnerPlayer?.id,
    isLocalEliminated,
  ]);

  const animateFinalButtonsIn = useCallback(() => {
    setShowButtons(true);
    Animated.parallel([
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(buttonsY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [buttonsOpacity, buttonsY]);

  useEffect(() => {
    if (mode !== "ONLINE" || isLocalEliminated) return;
    winnerFactDismissRecvRef.current = 0;
    const unsub = subscribeMultiplayerRelay((raw) => {
      const d = raw as { type?: string };
      if (d.type !== WINNER_FACT_DISMISSED_MESSAGE_TYPE) return;
      if (!useGameStore.getState().onlineIsHost) return;
      winnerFactDismissRecvRef.current += 1;
      const need = hasTwoWinnersRef.current ? 2 : 1;
      if (winnerFactDismissRecvRef.current >= need) {
        animateFinalButtonsIn();
      }
    });
    return unsub;
  }, [animateFinalButtonsIn, isLocalEliminated, mode]);

  const handleRevealSurprise = () => {
    setShowRevealButton(false);
    Animated.parallel([
      Animated.timing(revealBtnOpacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(revealBtnY, {
        toValue: 18,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(() => {
      setShowSurpriseOverlay(true);
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      Animated.sequence([
        Animated.parallel([
          Animated.timing(surprisePlateScale, {
            toValue: 1,
            duration: 840,
            easing: Easing.out(Easing.back(3)),
            useNativeDriver: false,
          }),
          Animated.timing(surprisePlateOpacity, {
            toValue: 1,
            duration: 440,
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.timing(surpriseShake, {
            toValue: 1,
            duration: 120,
            useNativeDriver: false,
          }),
          Animated.timing(surpriseShake, {
            toValue: -1,
            duration: 120,
            useNativeDriver: false,
          }),
          Animated.timing(surpriseShake, {
            toValue: 1,
            duration: 120,
            useNativeDriver: false,
          }),
          Animated.timing(surpriseShake, {
            toValue: 0,
            duration: 120,
            useNativeDriver: false,
          }),
        ]),
        Animated.timing(surpriseHeightAnim, {
          toValue: surpriseTargetHeight,
          duration: 840,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start(() => {
        setShowSurpriseContent(true);
        Animated.timing(surpriseContentOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();

        timersRef.current.push(
          setTimeout(() => {
            setShowCloseButton(true);
            Animated.parallel([
              Animated.timing(closeBtnOpacity, {
                toValue: 1,
                duration: 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
              }),
              Animated.timing(closeBtnY, {
                toValue: 0,
                duration: 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
              }),
            ]).start();
          }, 1000),
        );
      });
    });
  };

  const handleCloseSurprise = () => {
    Animated.parallel([
      Animated.timing(closeBtnOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(closeBtnY, {
        toValue: 18,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(surpriseContentOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(() => {
      setShowCloseButton(false);
      setShowSurpriseContent(false);
      Animated.parallel([
        Animated.timing(surprisePlateOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(surprisePlateScale, {
          toValue: 0.6,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(surpriseHeightAnim, {
          toValue: 110,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start(() => {
        setShowSurpriseOverlay(false);
        if (mode === "ONLINE") {
          sendMultiplayerRelay({ type: WINNER_FACT_DISMISSED_MESSAGE_TYPE });
        } else {
          animateFinalButtonsIn();
        }
      });
    });
  };

  const handleStartNewGame = () => {
    restartWithSamePlayersAndHeroes();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Round" }],
      }),
    );
    if (mode === "ONLINE" && onlineIsHost) {
      sendMultiplayerRelay({ type: HOST_SESSION_RESTART_MESSAGE_TYPE });
    }
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
      }),
    );
    if (mode === "ONLINE" && onlineIsHost) {
      sendMultiplayerRelay({ type: HOST_SESSION_NEW_HEROES_MESSAGE_TYPE });
    }
  };

  const handleCloseSessionForEveryone = () => {
    if (mode === "ONLINE" && onlineIsHost) {
      sendMultiplayerRelay({ type: HOST_CLOSE_SESSION_MESSAGE_TYPE });
    }
    disconnectMultiplayerRelay();
    resetGameState();
    const parent = navigation.getParent();
    parent?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Onboarding", params: { screen: "Menu" } }],
      }),
    );
  };
  const handleContinueToSecondWinner = () => {
    setWinnerStageIndex(1);
  };

  if (isLocalEliminated && onlinePlayerId) {
    return <EliminatedGameEndView playerId={onlinePlayerId} />;
  }

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={{ uri: WINNER_BG_URI }}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.bgOverlay} />
        <Animated.View
          style={[
            styles.screenLayer,
            {
              opacity: screenOpacity,
              transform: [{ translateY: screenY }, { scale: screenScale }],
            },
          ]}
        >
          {confettiBursts > 0 && (
            <View
              key={`confetti-${confettiKey}`}
              pointerEvents="none"
              style={styles.confettiLayer}
            >
              <LottieView
                source={lottie.confettiTop}
                autoPlay
                loop={false}
                renderMode={CONFETTI_RENDER_MODE}
                speed={0.7}
                style={styles.confettiA}
              />
              <LottieView
                source={lottie.confettiTop}
                autoPlay
                loop={false}
                renderMode={CONFETTI_RENDER_MODE}
                speed={1.35}
                style={styles.confettiB}
              />
              <LottieView
                source={lottie.confettiTop}
                autoPlay
                loop={false}
                renderMode={CONFETTI_RENDER_MODE}
                speed={0.9}
                style={styles.confettiC}
              />
              <LottieView
                source={lottie.confettiTop}
                autoPlay
                loop={false}
                renderMode={CONFETTI_RENDER_MODE}
                speed={1.6}
                style={styles.confettiD}
              />
              <LottieView
                source={lottie.confettiTop}
                autoPlay
                loop={false}
                renderMode={CONFETTI_RENDER_MODE}
                speed={0.8}
                style={styles.confettiE}
              />
              <LottieView
                source={lottie.confettiTop}
                autoPlay
                loop={false}
                renderMode={CONFETTI_RENDER_MODE}
                speed={1.2}
                style={styles.confettiF}
              />
              <LottieView
                source={lottie.confettiTop}
                autoPlay
                loop={false}
                renderMode={CONFETTI_RENDER_MODE}
                speed={1.05}
                style={styles.confettiG}
              />
              <LottieView
                source={lottie.confettiTop}
                autoPlay
                loop={false}
                renderMode={CONFETTI_RENDER_MODE}
                speed={1.75}
                style={styles.confettiK}
              />
              <LottieView
                source={lottie.confettiTop}
                autoPlay
                loop={false}
                renderMode={CONFETTI_RENDER_MODE}
                speed={0.65}
                style={styles.confettiL}
              />
              <LottieView
                source={lottie.confettiTop}
                autoPlay
                loop={false}
                renderMode={CONFETTI_RENDER_MODE}
                speed={1.45}
                style={styles.confettiM}
              />
              {confettiBursts > 1 && (
                <LottieView
                  source={lottie.confettiTop}
                  autoPlay
                  loop={false}
                  renderMode={CONFETTI_RENDER_MODE}
                  speed={1.3}
                  style={styles.confettiH}
                />
              )}
              {confettiBursts > 2 && (
                <LottieView
                  source={lottie.confettiTop}
                  autoPlay
                  loop={false}
                  renderMode={CONFETTI_RENDER_MODE}
                  speed={0.75}
                  style={styles.confettiI}
                />
              )}
              {confettiBursts > 3 && (
                <LottieView
                  source={lottie.confettiTop}
                  autoPlay
                  loop={false}
                  renderMode={CONFETTI_RENDER_MODE}
                  speed={1.55}
                  style={styles.confettiJ}
                />
              )}
              {showSecondWave && (
                <>
                  <LottieView
                    source={lottie.confettiTop}
                    autoPlay
                    loop={false}
                    renderMode={CONFETTI_RENDER_MODE}
                    speed={1.1}
                    style={styles.confettiWave2A}
                  />
                  <LottieView
                    source={lottie.confettiTop}
                    autoPlay
                    loop={false}
                    renderMode={CONFETTI_RENDER_MODE}
                    speed={0.85}
                    style={styles.confettiWave2B}
                  />
                  <LottieView
                    source={lottie.confettiTop}
                    autoPlay
                    loop={false}
                    renderMode={CONFETTI_RENDER_MODE}
                    speed={1.4}
                    style={styles.confettiWave2C}
                  />
                </>
              )}
              {showThirdWave && (
                <>
                  <LottieView
                    source={lottie.confettiTop}
                    autoPlay
                    loop
                    renderMode={CONFETTI_RENDER_MODE}
                    speed={0.95}
                    style={styles.confettiWave3A}
                  />
                  <LottieView
                    source={lottie.confettiTop}
                    autoPlay
                    loop
                    renderMode={CONFETTI_RENDER_MODE}
                    speed={1.2}
                    style={styles.confettiWave3B}
                  />
                  <LottieView
                    source={lottie.confettiTop}
                    autoPlay
                    loop
                    renderMode={CONFETTI_RENDER_MODE}
                    speed={0.78}
                    style={styles.confettiWave3C}
                  />
                </>
              )}
            </View>
          )}

          <View
            style={[
              styles.mainStageLayout,
              {
                paddingTop: insets.top + titleTopOffset,
                paddingHorizontal: 8,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.topTitleWrap,
                {
                  transform: [{ translateX: titleX }, { translateY: titleY }],
                },
              ]}
            >
              <AppImage
                source={{ uri: winnerTitleUri }}
                contentFit="contain"
                style={[styles.winnerTitle, { height: winnerTitleHeight }]}
              />
              {shouldShowCoWinnerSticker && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.coWinnerStickerWrap,
                    {
                      top: Math.max(120, winnerTitleHeight - 70),
                      opacity: coWinnerStickerOpacity,
                      transform: [
                        { translateY: coWinnerStickerY },
                        { scale: coWinnerStickerScale },
                      ],
                    },
                  ]}
                >
                  <AppImage
                    source={{ uri: ALSO_WINNER_STICKER_URI }}
                    contentFit="contain"
                    style={styles.coWinnerSticker}
                  />
                </Animated.View>
              )}
            </Animated.View>

            <View style={[styles.stageWrap, { marginTop: stageTopOffset }]}>
              <View
                pointerEvents="none"
                style={[
                  styles.winnerPlatformWrap,
                  {
                    left: -8 - insets.left,
                    right: -8 - insets.right,
                    height: winnerPlatformHeight,
                    bottom: platformBottomOffset,
                  },
                ]}
              >
                <AppImage
                  source={{ uri: WINNER_PLATFORM_URI }}
                  contentFit="cover"
                  contentPosition="bottom"
                  style={styles.winnerPlatform}
                />
              </View>

              <Animated.View
                style={[
                  styles.heroWrap,
                  {
                    // Keep the hero anchored to a fixed viewport percentage
                    // instead of shifting upward on devices with larger bottom insets.
                    bottom: heroBottomOffset,
                    transform: [{ translateY: heroY }],
                  },
                ]}
              >
                {winnerHeroImage && (
                  <AppImage
                    source={winnerHeroImage}
                    contentFit="contain"
                    contentPosition="bottom"
                    style={[styles.winnerHero, { height: winnerHeroHeight }]}
                  />
                )}
              </Animated.View>
            </View>
          </View>

          {showRevealButton && (
            <Animated.View
              style={[
                styles.revealButtonWrap,
                {
                  opacity: revealBtnOpacity,
                  transform: [{ translateY: revealBtnY }],
                },
              ]}
            >
              <CustomButton
                title={t("winner_reveal_surprise_btn")}
                fullWidth
                onPress={handleRevealSurprise}
                backgroundImage={backgrounds.bg026}
                glow
                btnSize="sm"
                fontSize="sm"
                glowColor="rgba(255,188,79,0.75)"
                shadowColor="#834400"
              />
            </Animated.View>
          )}

          {showSurpriseOverlay && (
            <Animated.View
              style={[styles.surpriseOverlay, { opacity: overlayOpacity }]}
            >
              <Animated.View
                style={{
                  transform: [
                    {
                      translateX: surpriseShake.interpolate({
                        inputRange: [-1, 1],
                        outputRange: [-8, 8],
                      }),
                    },
                  ],
                }}
              >
                <Animated.View
                  style={[
                    styles.surprisePlateShadow,
                    {
                      opacity: surprisePlateOpacity,
                      transform: [{ scale: surprisePlateScale }],
                      height: surpriseHeightAnim,
                    },
                  ]}
                >
                  <ImageBackground
                    source={backgrounds.bg005}
                    resizeMode="stretch"
                    imageStyle={{ borderRadius: 18 }}
                    style={styles.surprisePlate}
                  >
                    <Animated.View
                      style={[
                        styles.surpriseContentWrap,
                        { opacity: surpriseContentOpacity },
                      ]}
                    >
                      <CustomText
                        variant="p-small"
                        className="text-center"
                        textColor="#762a05"
                      >
                        {t("winner_fun_fact_subtitle")}
                      </CustomText>
                      <View style={styles.surpriseDivider} />
                      <CustomText
                        variant="h5"
                        className="text-center"
                        textColor="#592410"
                        allowWrap
                      >
                        {funFactDisplay}
                      </CustomText>
                      <View style={styles.surpriseDivider} />
                      <CustomText
                        variant="p-small"
                        className="text-center"
                        textColor="#762a05"
                      >
                        {t("winner_fun_fact_title")}
                      </CustomText>
                    </Animated.View>
                  </ImageBackground>
                </Animated.View>
              </Animated.View>

              {showCloseButton && (
                <Animated.View
                  style={[
                    styles.closeButtonWrap,
                    {
                      opacity: closeBtnOpacity,
                      transform: [{ translateY: closeBtnY }],
                    },
                  ]}
                >
                  <CustomButton
                    title={t("close")}
                    fullWidth
                    onPress={handleCloseSurprise}
                    backgroundImage={backgrounds.bg015}
                    glow
                    btnSize="sm"
                    fontSize="sm"
                    glowColor="rgba(255,188,79,0.7)"
                    shadowColor="#540d0d"
                  />
                </Animated.View>
              )}
            </Animated.View>
          )}

          {showButtons && (
            <Animated.View
              style={[
                styles.buttonsWrap,
                {
                  paddingBottom: insets.bottom + 14,
                  opacity: buttonsOpacity,
                  transform: [{ translateY: buttonsY }],
                },
              ]}
            >
              {shouldShowContinueButton ? (
                <CustomButton
                  title={t("continue_btn")}
                  fullWidth
                  onPress={handleContinueToSecondWinner}
                  backgroundImage={backgrounds.bg026}
                  glow
                  btnSize="sm"
                  fontSize="sm"
                  glowColor="rgba(41,255,25,0.8)"
                  shadowColor="#005f07"
                />
              ) : mode === "ONLINE" && !onlineIsHost ? (
                <CustomText
                  variant="p"
                  className="text-center px-4"
                  textColor="#fff7ec"
                >
                  {t("winner_waiting_host")}
                </CustomText>
              ) : (
                <>
                  <CustomButton
                    title={t("winner_start_new_game_btn")}
                    fullWidth
                    onPress={handleStartNewGame}
                    backgroundImage={backgrounds.bg026}
                    glow
                    btnSize="sm"
                    fontSize="sm"
                    glowColor="rgba(41,255,25,0.8)"
                    shadowColor="#005f07"
                  />
                  <CustomButton
                    title={t("winner_start_diff_heroes_btn")}
                    fullWidth
                    onPress={handleStartWithDifferentHeroes}
                    btnSize="sm"
                    fontSize="sm"
                    buttonClassName="mt-4"
                    glow
                    backgroundImage={backgrounds.bg015}
                    shadowColor="#540d0d"
                  />
                  <CustomButton
                    title={t("winner_close_session_btn")}
                    fullWidth
                    onPress={handleCloseSessionForEveryone}
                    btnSize="sm"
                    fontSize="sm"
                    buttonClassName="mt-4"
                    glow
                    backgroundImage={backgrounds.bg015}
                    shadowColor="#2a0a0a"
                  />
                </>
              )}
            </Animated.View>
          )}

          {mode === "ONLINE" && !canSeeWinnerSurpriseOnline && !showButtons && (
            <View style={styles.waitingFactHint} pointerEvents="none">
              <CustomText
                variant="p-small"
                className="text-center px-6"
                textColor="#f5e6d8"
              >
                {t("winner_waiting_fact")}
              </CustomText>
            </View>
          )}
        </Animated.View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  waitingFactHint: {
    position: "absolute",
    bottom: 120,
    left: 8,
    right: 8,
    zIndex: 8,
  },
  bg: {
    flex: 1,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
    zIndex: 0,
  },
  screenLayer: {
    flex: 1,
  },
  mainStageLayout: {
    flex: 1,
    width: "100%",
    position: "relative",
  },
  topTitleWrap: {
    zIndex: 6,
    alignItems: "center",
    width: "100%",
    position: "relative",
  },
  winnerTitle: {
    width: "100%",
  },
  coWinnerStickerWrap: {
    position: "absolute",
    top: 180,
    right: 0,
    alignItems: "center",
    zIndex: 7,
  },
  coWinnerSticker: {
    width: 196,
    height: 82,
  },
  stageWrap: {
    flex: 1,
    minHeight: 0,
    overflow: "visible",
    position: "relative",
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 5,
  },
  heroWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 7,
  },
  winnerHero: {
    width: "100%",
  },
  winnerPlatformWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
  },
  winnerPlatform: {
    width: "100%",
    height: "100%",
    zIndex: 4,
  },
  buttonsWrap: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 0,
    zIndex: 8,
  },
  revealButtonWrap: {
    position: "absolute",
    left: 8,
    right: 8,
    top: "50%",
    marginTop: -26,
    zIndex: 9,
  },
  surpriseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    zIndex: 30,
  },
  surprisePlateShadow: {
    width: "100%",
    maxWidth: 420,
    shadowColor: "#fff",
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 14,
    zIndex: 31,
  },
  surprisePlate: {
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    shadowColor: "#ffd800",
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(251,192,32,1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(160,110,60,0.7)",
  },
  surpriseContentWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  surpriseDivider: {
    width: "88%",
    height: 1,
    marginVertical: 8,
    backgroundColor: "rgba(89,36,16,0.5)",
  },
  closeButtonWrap: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 36,
    zIndex: 32,
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  confettiA: {
    position: "absolute",
    top: -120,
    left: "-48%",
    width: "210%",
    height: 900,
  },
  confettiB: {
    position: "absolute",
    top: -70,
    left: -320,
    width: 900,
    height: 900,
    transform: [{ rotate: "-8deg" }],
  },
  confettiC: {
    position: "absolute",
    top: -70,
    right: -320,
    width: 900,
    height: 900,
    transform: [{ rotate: "8deg" }],
  },
  confettiD: {
    position: "absolute",
    top: 90,
    left: -230,
    width: 780,
    height: 780,
    transform: [{ rotate: "-14deg" }],
  },
  confettiE: {
    position: "absolute",
    top: 90,
    right: -230,
    width: 780,
    height: 780,
    transform: [{ rotate: "14deg" }],
  },
  confettiF: {
    position: "absolute",
    top: 230,
    left: "0%",
    width: 720,
    height: 720,
    transform: [{ rotate: "-6deg" }],
  },
  confettiG: {
    position: "absolute",
    top: 230,
    right: "0%",
    width: 720,
    height: 720,
    transform: [{ rotate: "6deg" }],
  },
  confettiH: {
    position: "absolute",
    top: -20,
    left: "15%",
    width: 780,
    height: 780,
    transform: [{ rotate: "-3deg" }],
  },
  confettiI: {
    position: "absolute",
    top: 20,
    right: "15%",
    width: 780,
    height: 780,
    transform: [{ rotate: "4deg" }],
  },
  confettiJ: {
    position: "absolute",
    top: 240,
    left: "28%",
    width: 720,
    height: 720,
    transform: [{ rotate: "-2deg" }],
  },
  confettiK: {
    position: "absolute",
    top: -90,
    left: "30%",
    width: 960,
    height: 960,
    transform: [{ rotate: "11deg" }],
  },
  confettiL: {
    position: "absolute",
    top: 170,
    left: "-25%",
    width: 840,
    height: 840,
    transform: [{ rotate: "-18deg" }],
  },
  confettiM: {
    position: "absolute",
    top: 170,
    right: "-25%",
    width: 840,
    height: 840,
    transform: [{ rotate: "18deg" }],
  },
  confettiWave2A: {
    position: "absolute",
    top: 10,
    left: "38%",
    width: 900,
    height: 900,
    transform: [{ rotate: "-9deg" }],
  },
  confettiWave2B: {
    position: "absolute",
    top: 250,
    left: "-30%",
    width: 840,
    height: 840,
    transform: [{ rotate: "13deg" }],
  },
  confettiWave2C: {
    position: "absolute",
    top: 250,
    right: "-30%",
    width: 840,
    height: 840,
    transform: [{ rotate: "-13deg" }],
  },
  confettiWave3A: {
    position: "absolute",
    top: -40,
    left: "-10%",
    width: 960,
    height: 960,
    transform: [{ rotate: "7deg" }],
  },
  confettiWave3B: {
    position: "absolute",
    top: 120,
    right: "-12%",
    width: 920,
    height: 920,
    transform: [{ rotate: "-9deg" }],
  },
  confettiWave3C: {
    position: "absolute",
    top: 280,
    left: "20%",
    width: 900,
    height: 900,
    transform: [{ rotate: "3deg" }],
  },
});
