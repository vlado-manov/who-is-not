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
import AudioManager from "../../utils/audioManager";
import { BlurView } from "expo-blur";
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
import WinnerAmbienceOverlay from "../../components/game/WinnerAmbienceOverlay";

type Nav = StackNavigationProp<GameStackParamList, "Winner">;

const WINNER_BG_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/a4cf8439-4a5b-4e08-91b9-6f2279d8b73a-winner-test-bg.webp";
const WINNER_BG_TABLET_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/a4cf8439-4a5b-4e08-91b9-6f2279d8b73a-winner-test-bg.webp";
const WINNER_TEXT_EN_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/c9783d23-e057-4549-b4a3-ff7a4256f350-winner_en.webp";
const WINNER_TEXT_BG_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/2dada90f-dc5c-4aff-a135-42db5af9efda-winner_bg.webp";
const WINNER_TEXT_FR_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/f25ab702-f763-4278-8b39-042d07e657fd-winner_fr.webp";
const WINNER_TEXT_ES_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/7d99cb67-4307-4922-8295-b67bacc8dc3b-winner_es.webp";
const WINNER_NAMEPLATE_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/786a78da-ae7c-4663-bebd-304dd8b0f548-nameplate.webp";
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
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 768 && windowWidth > windowHeight;
  const tabletBtnPad = isTablet ? Math.max(8, Math.floor((windowWidth - 560) / 2)) : 8;
  usePreventBack();

  const players = useGameStore((s) => s.players);
  const lives = useGameStore((s) => s.lives);
  const oddOneId = useGameStore((s) => s.oddOneId);
  const deathMatchWinnerIds = useGameStore((s) => s.deathMatchWinnerIds);
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
  const [hideAnimTitle, setHideAnimTitle] = useState(false);

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
  const titleRevealAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const alivePlayers = useMemo(
    () => players.filter((p) => (lives[p.id] ?? 0) > 0),
    [lives, players],
  );
  const winnerPlayers = useMemo(() => {
    // Deathmatch result takes priority over lives-based calculation
    if (deathMatchWinnerIds?.length) {
      return players.filter((p) => deathMatchWinnerIds.includes(p.id));
    }
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
  }, [alivePlayers, deathMatchWinnerIds, lives, players]);
  const hasTwoWinners = winnerPlayers.length === 2;
  hasTwoWinnersRef.current = hasTwoWinners;

  const isLocalEliminated = (() => {
    if (mode !== "ONLINE" || onlinePlayerId == null) return false;
    // Eliminated by lives (standard path)
    if (lives[onlinePlayerId] != null && lives[onlinePlayerId] <= 0) return true;
    // Lost the deathmatch
    if (deathMatchWinnerIds?.length && !deathMatchWinnerIds.includes(onlinePlayerId)) return true;
    return false;
  })();

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
  const titleRevealTargetY = useMemo(
    () => (insets.top + titleTopOffset) + winnerTitleHeight / 2 - windowHeight / 2,
    [insets.top, titleTopOffset, winnerTitleHeight, windowHeight],
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

  const runTitleRevealAnim = async () => {
    animTitleScale.setValue(80);
    animTitleRotate.setValue(0);
    animTitleTranslateY.setValue(0);
    animTitleShakeX.setValue(0);
    animBlurOpacity.setValue(0);
    animShockwaveScale.setValue(0.3);
    animShockwaveOpacity.setValue(0);
    animShockwaveScale2.setValue(0.3);
    animShockwaveOpacity2.setValue(0);
    animImpactFlash.setValue(0);
    setHideAnimTitle(false);

    timersRef.current.push(
      setTimeout(() => void AudioManager.playRevealTitleSplash(), 1240),
    );

    // Phase 1: zoom from 80x to 1x + spin + backdrop fade in
    const phase1 = Animated.parallel([
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
    ]);
    titleRevealAnimRef.current = phase1;
    await startAnim(phase1);

    // Phase 2: pulse
    const phase2 = Animated.sequence([
      Animated.timing(animTitleScale, { toValue: 1.15, duration: 110, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(animTitleScale, { toValue: 0.93, duration: 110, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(animTitleScale, { toValue: 1.09, duration: 100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(animTitleScale, { toValue: 1.0, duration: 100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    titleRevealAnimRef.current = phase2;
    await startAnim(phase2);

    // Phase 3: spring slam to top + shockwaves + flash + shake
    animShockwaveOpacity.setValue(1);
    animShockwaveOpacity2.setValue(1);

    const phase3 = Animated.parallel([
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
    ]);
    titleRevealAnimRef.current = phase3;
    phase3.start(() => {
      staticTitleOpacity.setValue(1);
      setHideAnimTitle(true);
    });
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

      void runTitleRevealAnim();
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
        }, 1200),
      );
      timersRef.current.push(
        setTimeout(() => {
          setShowThirdWave(true);
        }, 2000),
      );
      timersRef.current.push(
        setTimeout(() => {
          setConfettiBursts(0);
          setShowSecondWave(false);
          setShowThirdWave(false);
        }, 7800),
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
      titleRevealAnimRef.current?.stop();
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
    titleRevealTargetY,
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
        source={{ uri: isTablet ? WINNER_BG_TABLET_URI : WINNER_BG_URI }}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.bgOverlay} />
        <BlurView
          intensity={10}
          tint="dark"
          style={[StyleSheet.absoluteFillObject, { zIndex: 0 }]}
          pointerEvents="none"
        />
        <Animated.View
          style={[
            styles.screenLayer,
            {
              opacity: screenOpacity,
              transform: [{ translateY: screenY }, { scale: screenScale }],
            },
          ]}
        >
          <WinnerAmbienceOverlay />

          {confettiBursts > 0 && (
            <>
              {/* Behind the hero — no zIndex so it falls behind mainStageLayout in tree order */}
              <View
                key={`confetti-back-${confettiKey}`}
                pointerEvents="none"
                style={styles.confettiLayerBack}
              >
                <LottieView source={lottie.confettiTop} autoPlay loop={false} renderMode={CONFETTI_RENDER_MODE} speed={0.7}  style={styles.confettiA} />
                <LottieView source={lottie.confettiTop} autoPlay loop={false} renderMode={CONFETTI_RENDER_MODE} speed={0.9}  style={styles.confettiC} />
                <LottieView source={lottie.confettiTop} autoPlay loop={false} renderMode={CONFETTI_RENDER_MODE} speed={0.8}  style={styles.confettiE} />
                <LottieView source={lottie.confettiTop} autoPlay loop={false} renderMode={CONFETTI_RENDER_MODE} speed={1.05} style={styles.confettiG} />
                <LottieView source={lottie.confettiTop} autoPlay loop={false} renderMode={CONFETTI_RENDER_MODE} speed={1.75} style={styles.confettiK} />
                <LottieView source={lottie.confettiTop} autoPlay loop={false} renderMode={CONFETTI_RENDER_MODE} speed={1.45} style={styles.confettiM} />
                {confettiBursts > 1 && (
                  <LottieView source={lottie.confettiTop} autoPlay loop={false} renderMode={CONFETTI_RENDER_MODE} speed={1.3} style={styles.confettiH} />
                )}
                {showSecondWave && (
                  <LottieView source={lottie.confettiTop} autoPlay loop={false} renderMode={CONFETTI_RENDER_MODE} speed={0.85} style={styles.confettiWave2B} />
                )}
                {showThirdWave && (
                  <>
                    <LottieView source={lottie.confettiTop} autoPlay loop renderMode={CONFETTI_RENDER_MODE} speed={1.2}  style={styles.confettiWave3B} />
                    <LottieView source={lottie.confettiTop} autoPlay loop renderMode={CONFETTI_RENDER_MODE} speed={1.35} style={styles.confettiWave3D} />
                  </>
                )}
              </View>

              {/* In front of the hero — zIndex: 20 floats above mainStageLayout */}
              <View
                key={`confetti-front-${confettiKey}`}
                pointerEvents="none"
                style={styles.confettiLayer}
              >
                <LottieView source={lottie.confettiTop} autoPlay loop={false} renderMode={CONFETTI_RENDER_MODE} speed={1.35} style={styles.confettiB} />
                <LottieView source={lottie.confettiTop} autoPlay loop={false} renderMode={CONFETTI_RENDER_MODE} speed={1.6}  style={styles.confettiD} />
                <LottieView source={lottie.confettiTop} autoPlay loop={false} renderMode={CONFETTI_RENDER_MODE} speed={1.2}  style={styles.confettiF} />
                <LottieView source={lottie.confettiTop} autoPlay loop={false} renderMode={CONFETTI_RENDER_MODE} speed={0.65} style={styles.confettiL} />
                {confettiBursts > 2 && (
                  <LottieView source={lottie.confettiTop} autoPlay loop={false} renderMode={CONFETTI_RENDER_MODE} speed={0.75} style={styles.confettiI} />
                )}
                {confettiBursts > 3 && (
                  <LottieView source={lottie.confettiTop} autoPlay loop={false} renderMode={CONFETTI_RENDER_MODE} speed={1.55} style={styles.confettiJ} />
                )}
                {showSecondWave && (
                  <>
                    <LottieView source={lottie.confettiTop} autoPlay loop={false} renderMode={CONFETTI_RENDER_MODE} speed={1.1}  style={styles.confettiWave2A} />
                    <LottieView source={lottie.confettiTop} autoPlay loop={false} renderMode={CONFETTI_RENDER_MODE} speed={1.4}  style={styles.confettiWave2C} />
                  </>
                )}
                {showThirdWave && (
                  <>
                    <LottieView source={lottie.confettiTop} autoPlay loop renderMode={CONFETTI_RENDER_MODE} speed={0.95} style={styles.confettiWave3A} />
                    <LottieView source={lottie.confettiTop} autoPlay loop renderMode={CONFETTI_RENDER_MODE} speed={0.78} style={styles.confettiWave3C} />
                    <LottieView source={lottie.confettiTop} autoPlay loop renderMode={CONFETTI_RENDER_MODE} speed={0.88} style={styles.confettiWave3E} />
                  </>
                )}
              </View>
            </>
          )}

          <View
            style={[
              styles.mainStageLayout,
              {
                paddingTop: insets.top + titleTopOffset,
                paddingHorizontal: 8,
              },
              isTablet && styles.mainStageLayoutTablet,
            ]}
          >
            <Animated.View
              style={[
                styles.topTitleWrap,
                {
                  opacity: staticTitleOpacity,
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

          {!hideAnimTitle && (
            <>
              {/* Dark backdrop */}
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: "rgba(0,0,0,0.60)", opacity: animBlurOpacity, zIndex: 50 },
                ]}
              />

              {/* Shockwave ring 1 */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.shockwaveRing,
                  {
                    top: insets.top + titleTopOffset,
                    height: winnerTitleHeight * 0.85,
                    borderColor: "rgba(255,230,80,1)",
                    opacity: animShockwaveOpacity,
                    zIndex: 51,
                    transform: [{ scale: animShockwaveScale }],
                  },
                ]}
              />

              {/* Shockwave ring 2 */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.shockwaveRing,
                  {
                    top: insets.top + titleTopOffset,
                    height: winnerTitleHeight * 0.85,
                    borderColor: "rgba(255,200,50,0.8)",
                    opacity: animShockwaveOpacity2,
                    zIndex: 51,
                    transform: [{ scale: animShockwaveScale2 }],
                  },
                ]}
              />

              {/* Impact flash */}
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: "rgba(255,240,160,0.55)", opacity: animImpactFlash, zIndex: 52 },
                ]}
              />

              {/* Animated title: starts huge at center, springs to top */}
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
                  source={{ uri: winnerTitleUri }}
                  contentFit="contain"
                  style={[styles.winnerTitle, { height: winnerTitleHeight }]}
                />
              </Animated.View>
            </>
          )}

          {showRevealButton && (
            <Animated.View
              style={[
                styles.revealButtonWrap,
                {
                  bottom: insets.bottom + 40,
                  paddingHorizontal: tabletBtnPad,
                  opacity: revealBtnOpacity,
                  transform: [{ translateY: revealBtnY }],
                },
              ]}
            >
              <View style={styles.nameplateWrap}>
                <AppImage
                  source={{ uri: WINNER_NAMEPLATE_URI }}
                  contentFit="fill"
                  style={styles.nameplateImage}
                />
                <View style={styles.nameplateTextWrap} pointerEvents="none">
                  <CustomText
                    variant="h5"
                    textColor="#000000"
                    numberOfLines={1}
                  >
                    {winnerPlayer?.name ?? ""}
                  </CustomText>
                </View>
              </View>

              <CustomButton
                title={t("winner_reveal_surprise_btn")}
                fullWidth
                onPress={handleRevealSurprise}
                backgroundImage={backgrounds.bg026}
                glow
                btnSize="md"
                fontSize="md"
                glowColor="rgba(41,255,25,0.8)"
                shadowColor="#005f07"
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
                    backgroundImage={backgrounds.bg026}
                    glow
                    btnSize="sm"
                    fontSize="sm"
                    glowColor="rgba(41,255,25,0.8)"
                    shadowColor="#005f07"
                  />
                </Animated.View>
              )}
            </Animated.View>
          )}

          {showButtons && (
            <>
              <Animated.View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, { zIndex: 8, opacity: buttonsOpacity }]}
              >
                <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.25)" }]} />
              </Animated.View>

              <Animated.View
                style={[
                  styles.buttonsWrap,
                  {
                    paddingHorizontal: tabletBtnPad,
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
                  <View style={{ gap: 12 }}>
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
                      backgroundImage={backgrounds.bg022}
                      shadowColor="#410047"
                    />
                    <CustomButton
                      title={t("winner_close_session_btn")}
                      fullWidth
                      onPress={handleCloseSessionForEveryone}
                      btnSize="sm"
                      fontSize="sm"
                      backgroundImage={backgrounds.bg015}
                      shadowColor="#540d0d"
                    />
                  </View>
                )}
              </Animated.View>
            </>
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
  mainStageLayoutTablet: {
    maxWidth: 560,
    alignSelf: "center",
    width: "100%",
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 9,
  },
  revealButtonWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9,
  },
  animTitleOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  shockwaveRing: {
    position: "absolute",
    left: "5%",
    right: "5%",
    borderWidth: 3,
    borderRadius: 14,
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
  confettiLayerBack: {
    ...StyleSheet.absoluteFillObject,
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
  confettiWave3D: {
    position: "absolute",
    top: -60,
    right: "-5%",
    width: 880,
    height: 880,
    transform: [{ rotate: "-15deg" }],
  },
  confettiWave3E: {
    position: "absolute",
    top: 160,
    left: "35%",
    width: 860,
    height: 860,
    transform: [{ rotate: "10deg" }],
  },
  nameplateWrap: {
    width: "100%",
    marginBottom: 16,
    position: "relative",
  },
  nameplateImage: {
    width: "100%",
    height: 80,
  },
  nameplateTextWrap: {
    position: "absolute",
    bottom: 8,
    left: 16,
    right: 16,
    alignItems: "center",
  },
});
