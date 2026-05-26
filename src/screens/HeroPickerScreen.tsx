// src/screens/HeroPickerScreen.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Animated,
  Easing,
  Pressable,
  PanResponder,
  KeyboardAvoidingView,
  Keyboard,
  useWindowDimensions,
  Platform,
  StyleSheet,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import CustomText from "../components/common/CustomText";
import CustomButton from "../components/common/CustomButton";
import { useTranslation } from "react-i18next";
import {
  CommonActions,
  CompositeNavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import {
  CreateGameStackParamList,
  RootStackParamList,
} from "../navigation/types";
import { useGameStore } from "../store/useGameStore";
import { StackNavigationProp } from "@react-navigation/stack";
import HeroPickerLoadingOverlay from "./HeroPicker/HeroPickerLoadingOverlay";
import AudioManager from "../utils/audioManager";
import { game_images } from "../../assets/images";
import { backgrounds } from "../../assets/backgrounds";
import { useIconPressAnim } from "../hooks/useIconPressAnim";
import { createHeroPickerStyles } from "./styles/heroPicker.styles";
import { QuoteBubble } from "./HeroPicker/QuoteBubble";
import { HeroPickerHeader } from "./HeroPicker/HeroPickerHeader";
import { HeroStage } from "./HeroPicker/HeroStage";
import { HeroPickerFooter } from "./HeroPicker/HeroPickerFooter";
import FullBleedStack from "../components/FullBleedStack";
import { useUserSettingsSheet } from "../context/UserSettingsModalContext";
import { HeroPickerBackdrop } from "./HeroPicker/HeroPickerBackground";
import Round1TransitionOverlay from "../components/Round1TransitionOverlay";
import TutorialOverlay, {
  getTutorialSteps,
} from "../components/TutorialOverlay";
import { useHeroAssets } from "./HeroPicker/hooks/useHeroAssets";
import { usePassDeviceAssetsReady } from "./HeroPicker/hooks/usePassDeviceAssetsReady";
import {
  CAROUSEL_DIST,
  CAROUSEL_IN_DUR,
  CAROUSEL_OPACITY_FADE_START_RATIO,
  CAROUSEL_OUT_DUR,
  HERO_PICKER_BOTTOM_ART_BOTTOM,
  HERO_PICKER_BOTTOM_ART_HEIGHT_RATIO,
  HERO_PICKER_HERO_TO_FOOTER_GAP,
  HERO_PICKER_LARGE_SCREEN_HERO_TO_FOOTER_GAP_RATIO,
  HERO_PICKER_LARGE_SCREEN_HEIGHT,
  HERO_PICKER_LARGE_SCREEN_TITLE_TO_HERO_GAP_RATIO,
  HERO_PICKER_TITLE_TO_HERO_GAP,
  QUOTE_ENTER_DUR,
  QUOTE_EXIT_DUR,
  READ_HOLD_MS,
  TYPE_INTERVAL_MS,
} from "./HeroPicker/constants/heroPicker.constants";
import { CustomInputHandle } from "../components/common/CustomInput";
import { Confetti, ContinuousConfetti } from "react-native-fast-confetti";
import { Dimensions } from "react-native";
import LottieView from "lottie-react-native";
import { lottie } from "../../assets/lottie";
import { trackCharacterSelected } from "../api/analytics";
import { useAuthStore } from "../store/useUserStore";
import { useHeroesStore } from "../store/useHeroesStore";
import { useSyncHeroesStore } from "../api/hooks/useSyncHeroesStore";
import { ICharacter } from "../types/character";
import { getApiBaseUrl } from "../api/client";
import { usePreventBack } from "../hooks/usePreventBack";
import { preloadVoteMarkImages } from "../api/publicImages";
import {
  useTrackGameStartedMutation,
  useTrackRoundStartedMutation,
} from "../api/hooks/useAnalyticsMutations";
import { fetchQuestions } from "../api/questions";
import i18n, { normalizeLanguage } from "../i18n";
import {
  connectMultiplayerRelay,
  sendMultiplayerRelay,
  subscribeMultiplayerRelay,
} from "../api/multiplayerRelay";
import {
  HERO_CLAIM_DENIED_MESSAGE_TYPE,
  HERO_CLAIM_MESSAGE_TYPE,
  HERO_CLAIM_OK_MESSAGE_TYPE,
  mpPhaseHeroIntroComplete,
  mpPhaseRound1Start,
} from "../constants/onlineLobby";
import {
  sendPlayerReady,
  subscribeMpPhaseAllReady,
} from "../api/multiplayerSync";
import { useMultiplayerPhaseGate } from "../hooks/useMultiplayerPhaseGate";
import { getOnlinePlayerIndex } from "../utils/onlinePlayerIndex";
import OnlineWaitPlayersOverlay from "../components/online/OnlineWaitPlayersOverlay";
import { ActivityIndicator, Alert, ImageBackground } from "react-native";
import { Image } from "expo-image";
import AppImage from "../components/AppImage";
import WarmBubblesOverlay from "../components/WarmBubblesOverlay";

const AnimatedImage = Animated.createAnimatedComponent(Image);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
type CreateNav = StackNavigationProp<CreateGameStackParamList, "HeroPicker">;
type RootNav = StackNavigationProp<RootStackParamList>;
type HeroNav = CompositeNavigationProp<CreateNav, RootNav>;
type HeroRoute = RouteProp<CreateGameStackParamList, "HeroPicker">;
function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
export default function HeroPickerScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const route = useRoute<HeroRoute>();
  const navigation = useNavigation<HeroNav>();
  const { openUserSettings } = useUserSettingsSheet();
  const { index } = route.params;
  usePreventBack(index >= 1);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const settingsAnim = useIconPressAnim();
  const leftArrowAnim = useIconPressAnim();
  const rightArrowAnim = useIconPressAnim();
  const [lockedHero, setLockedHero] = useState<ICharacter | null>(null);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  /** ONLINE: server is validating hero reservation after "This is me" (before name). */
  const [onlineHeroClaimLoading, setOnlineHeroClaimLoading] = useState(false);
  const onlineHeroClaimLoadingRef = useRef(false);
  useEffect(() => {
    onlineHeroClaimLoadingRef.current = onlineHeroClaimLoading;
  }, [onlineHeroClaimLoading]);
  const heroReservePendingRef = useRef(false);
  const nameConfirmPendingRef = useRef(false);
  const lockedHeroForClaimRef = useRef<ICharacter | null>(null);
  const pendingNameRef = useRef("");
  const beginOnlineNamePromptAfterReserveRef = useRef((hero: ICharacter) => {});
  const beginOnlineFinalQuoteAfterNameRef = useRef((hero: ICharacter) => {});

  const [showConfetti, setShowConfetti] = useState(false);
  const [showRound1Transition, setShowRound1Transition] = useState(false);
  const [showRound1Content, setShowRound1Content] = useState(false);
  const [waitingRound1Players, setWaitingRound1Players] = useState(false);
  /** ONLINE: local player finished name + final quote; waiting for everyone before 3-2-1. */
  const [waitingForHeroIntroOthers, setWaitingForHeroIntroOthers] =
    useState(false);
  const heroIntroReadySentRef = useRef(false);
  const [showRound1Tutorial, setShowRound1Tutorial] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const footerTranslateY = useRef(new Animated.Value(0)).current;
  const skipTranslateY = useRef(new Animated.Value(-50)).current;
  const skipScale = useRef(new Animated.Value(0.6)).current;
  const skipOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const nameInputRef = useRef<CustomInputHandle | null>(null);
  const focusNameInput = useCallback(() => {
    requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });
    // Android occasionally misses first focus right after animation/state switch.
    if (Platform.OS === "android") {
      setTimeout(() => nameInputRef.current?.focus(), 120);
      setTimeout(() => nameInputRef.current?.focus(), 320);
    }
  }, []);

  const quoteModeRef = useRef<QuoteMode>("final");
  type QuoteMode = "prompt" | "final";
  const [quoteMode, setQuoteMode] = useState<QuoteMode>("final");
  const [previewing, setPreviewing] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const heroesQuery = useSyncHeroesStore();
  const heroes = useHeroesStore((s) => s.heroes);
  const heroesLoaded = useHeroesStore((s) => s.loaded);
  const heroesLoading = useHeroesStore((s) => s.loading);
  const heroesError = useHeroesStore((s) => s.error);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(
    () => new Set(heroes.filter((h) => h.unlocked).map((h) => h.id)),
  );
  // Keep a ref to the userId so the rebuild effect can compare
  const prevUserIdRef = useRef<string | null>(null);
  const taken = useGameStore((s) => s.takenCharacters);
  const gameId = useGameStore((s) => s.gameId);
  const mode = useGameStore((s) => s.mode);
  const userId = useAuthStore((s) => s.user.id);
  const target = useGameStore((s) => s.targetPlayersCount);
  const assignCharacter = useGameStore((s) => s.assignCharacter);
  const resetGame = useGameStore((s) => s.reset);
  const gameSettings = useGameStore((s) => s.gameSettings);
  const setGameQuestions = useGameStore((s) => s.setGameQuestions);
  const startGameSession = useGameStore((s) => s.startGameSession);
  const existingGameId = useGameStore((s) => s.gameId);
  const playersCount = useGameStore(
    (s) => s.targetPlayersCount ?? s.players.length,
  );
  const trackGameStartedMutation = useTrackGameStartedMutation();
  const trackRoundStartedMutation = useTrackRoundStartedMutation();
  const setCurrentRoundId = useGameStore((s) => s.setCurrentRoundId);
  const startRound = useGameStore((s) => s.startRound);
  const players = useGameStore((s) => s.players);
  const onlinePlayerId = useGameStore((s) => s.onlinePlayerId);
  const onlineIsHost = useGameStore((s) => s.onlineIsHost);
  const onlineWsToken = useGameStore((s) => s.onlineWsToken);
  const userUnlockedCharacterIds = useAuthStore(
    (s) => s.user.unlockedCharacterIds ?? [],
  );
  const shouldTrackLifecycle = mode !== "ONLINE" || onlineIsHost;
  const orderedHeroIdsRef = useRef<string[] | null>(null);
  useEffect(() => {
    return () => {
      orderedHeroIdsRef.current = null;
    };
  }, []);
  const availableHeroes = useMemo(() => {
    const filtered = heroes
      .filter((h) => !taken.includes(h.id))
      .map((h) => ({
        ...h,
        unlocked: unlockedIds.has(h.id),
      }));

    if (orderedHeroIdsRef.current) {
      const allowed = new Set(filtered.map((h) => h.id));
      const pruned = orderedHeroIdsRef.current.filter((id) => allowed.has(id));
      orderedHeroIdsRef.current = pruned.length > 0 ? pruned : null;
    }

    if (filtered.length > 0 && orderedHeroIdsRef.current === null) {
      const unlocked = filtered.filter((h) => unlockedIds.has(h.id));
      const locked = filtered.filter((h) => !unlockedIds.has(h.id));
      orderedHeroIdsRef.current = [
        ...unlocked.map((h) => h.id),
        ...locked.map((h) => h.id),
      ];
    }
    const order = orderedHeroIdsRef.current;
    if (!order || order.length === 0) {
      const unlocked = filtered.filter((h) => h.unlocked);
      const locked = filtered.filter((h) => !h.unlocked);
      return [...unlocked, ...locked];
    }
    const byId: Record<string, (typeof filtered)[number]> = {};
    filtered.forEach((h) => {
      byId[h.id] = h;
    });
    return order.map((id) => byId[id]).filter(Boolean);
  }, [heroes, taken, unlockedIds]);
  const lockAnimMapRef = useRef<Record<string, () => void>>({});
  const heroScale = useRef(new Animated.Value(1)).current;

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!heroesLoaded && !heroesLoading) {
      void heroesQuery.refetch();
    }
  }, [heroesLoaded, heroesLoading, heroesQuery]);

  // Preload localized vote mark images early so they're cached before VoteNowScreen
  useEffect(() => {
    void preloadVoteMarkImages();
  }, []);

  useEffect(() => {
    // Rebuild from scratch each time heroes or the logged-in user changes.
    // We never accumulate because stale IDs from a previous session / old
    // backend response could leak heroes the user hasn't actually purchased.
    const userChanged = prevUserIdRef.current !== userId;
    prevUserIdRef.current = userId;

    setUnlockedIds(() => {
      const next = new Set<string>();
      // Free (non-premium) heroes are always unlocked.
      // Premium heroes are only unlocked when the backend says so (h.unlocked).
      heroes.filter((h) => h.unlocked).forEach((h) => next.add(h.id));
      // Merge explicit character IDs from auth store (e.g. returned on login).
      userUnlockedCharacterIds.forEach((id) => next.add(id));
      return next;
    });

    // If the user changed, force-reset the ordered list so it's re-sorted.
    if (userChanged) {
      orderedHeroIdsRef.current = null;
    }
  }, [heroes, userUnlockedCharacterIds, userId]);

  const viewingHeroIdRef = useRef<string | null>(null);
  useEffect(() => {
    const h = availableHeroes[idx];
    if (h) viewingHeroIdRef.current = h.id;
  }, [availableHeroes, idx]);

  useEffect(() => {
    if (availableHeroes.length === 0) return;
    const vid = viewingHeroIdRef.current;
    if (vid) {
      const ni = availableHeroes.findIndex((x) => x.id === vid);
      if (ni >= 0) {
        setIdx(ni);
        return;
      }
    }
    setIdx((prev) => Math.min(prev, availableHeroes.length - 1));
  }, [availableHeroes, taken]);

  const hero =
    availableHeroes.length === 0
      ? undefined
      : (availableHeroes[idx] ?? availableHeroes[0]);
  const quoteOverlayTop = useMemo(() => insets.top + 8, [insets.top]);
  const footerBottomPad = 40;
  const styles = useMemo(
    () => createHeroPickerStyles(quoteOverlayTop, windowWidth),
    [quoteOverlayTop, windowWidth],
  );
  const titleToHeroGapPx = useMemo(
    () =>
      Math.round(
        windowHeight *
          (windowHeight >= HERO_PICKER_LARGE_SCREEN_HEIGHT
            ? HERO_PICKER_LARGE_SCREEN_TITLE_TO_HERO_GAP_RATIO
            : HERO_PICKER_TITLE_TO_HERO_GAP),
      ),
    [windowHeight],
  );
  const heroToFooterGapPx = useMemo(
    () =>
      Math.round(
        windowHeight *
          (windowHeight >= HERO_PICKER_LARGE_SCREEN_HEIGHT
            ? HERO_PICKER_LARGE_SCREEN_HERO_TO_FOOTER_GAP_RATIO
            : HERO_PICKER_HERO_TO_FOOTER_GAP),
      ),
    [windowHeight],
  );
  const bottomArtBottomPx = useMemo(
    () => Math.round(windowHeight * HERO_PICKER_BOTTOM_ART_BOTTOM),
    [windowHeight],
  );
  const assetsReady = useHeroAssets(availableHeroes);
  const passDeviceAssetsReady = usePassDeviceAssetsReady();
  const [isNaming, setIsNaming] = useState(false);
  const [isNameInputFocused, setIsNameInputFocused] = useState(false);
  const [heroSnipedNotice, setHeroSnipedNotice] = useState(false);
  const prevTakenInitForSnipeRef = useRef(false);
  const prevTakenForSnipeRef = useRef<string[]>([]);
  const availableHeroesRef = useRef(availableHeroes);
  useEffect(() => {
    availableHeroesRef.current = availableHeroes;
  }, [availableHeroes]);
  /** Само при име: вдига целия футър (поле + бутон) над клавиатурата. Без KeyboardAvoidingView — иначе flex-зоната на героя се свива. */
  useEffect(() => {
    const lift =
      isNaming && isNameInputFocused && keyboardHeight > 0
        ? -(keyboardHeight - insets.bottom) + 12
        : 0;
    Animated.timing(footerTranslateY, {
      toValue: lift,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isNaming, isNameInputFocused, keyboardHeight, insets.bottom]);

  // Carousel animation: two-phase like HeroPickerScreen3 — fade out + slide out, then swap hero, then fade in + slide in
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  const [selected, setSelected] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const animateTo = (nextIdx: number, direction: 1 | -1) => {
    if (selected || isAnimating || onlineHeroClaimLoadingRef.current) return;
    const listLen = availableHeroesRef.current.length;
    if (listLen <= 1) return;

    setIsAnimating(true);
    AudioManager.heroPickerSwipe();

    const opacityDelay = CAROUSEL_OUT_DUR * CAROUSEL_OPACITY_FADE_START_RATIO;
    const opacityDuration =
      CAROUSEL_OUT_DUR * (1 - CAROUSEL_OPACITY_FADE_START_RATIO);

    Animated.parallel([
      Animated.sequence([
        Animated.delay(opacityDelay),
        Animated.timing(opacity, {
          toValue: 0,
          duration: opacityDuration,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(translateX, {
        toValue: -direction * CAROUSEL_DIST,
        duration: CAROUSEL_OUT_DUR,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIdx(nextIdx);
      translateX.setValue(direction * CAROUSEL_DIST);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: CAROUSEL_IN_DUR,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: CAROUSEL_IN_DUR,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimating(false);
      });
    });
  };
  const animateToRef = useRef(animateTo);
  animateToRef.current = animateTo;

  useEffect(() => {
    if (mode !== "ONLINE") return;
    if (!prevTakenInitForSnipeRef.current) {
      prevTakenInitForSnipeRef.current = true;
      prevTakenForSnipeRef.current = [...taken];
      return;
    }
    if (selected || isNaming) {
      prevTakenForSnipeRef.current = [...taken];
      return;
    }
    const prev = prevTakenForSnipeRef.current;
    const newlyTaken = taken.filter((id) => !prev.includes(id));
    prevTakenForSnipeRef.current = [...taken];
    const vid = viewingHeroIdRef.current;
    if (!vid || !newlyTaken.includes(vid)) return;
    if (
      heroReservePendingRef.current &&
      lockedHeroForClaimRef.current?.id === vid
    ) {
      return;
    }
    if (
      onlineHeroClaimLoadingRef.current &&
      lockedHeroForClaimRef.current?.id === vid
    ) {
      return;
    }
    const myChar = useGameStore
      .getState()
      .players.find((p) => p.id === onlinePlayerId)?.characterId;
    if (vid === myChar) return;

    setHeroSnipedNotice(true);
    setTimeout(() => setHeroSnipedNotice(false), 2200);
    orderedHeroIdsRef.current = orderedHeroIdsRef.current
      ? orderedHeroIdsRef.current.filter((id) => id !== vid)
      : null;

    setTimeout(() => {
      const list = availableHeroesRef.current;
      if (list.length <= 1) return;
      const cur = Math.min(idxRef.current, list.length - 1);
      const next = (cur + 1) % list.length;
      animateToRef.current(next, 1);
    }, 0);
  }, [taken, mode, selected, isNaming, heroes, onlinePlayerId]);

  const onPrev = () => {
    const len = availableHeroesRef.current.length;
    if (len <= 1) return;
    const next = (idxRef.current - 1 + len) % len;
    animateTo(next, -1);
  };
  const onNext = () => {
    const len = availableHeroesRef.current.length;
    if (len <= 1) return;
    const next = (idxRef.current + 1) % len;
    animateTo(next, 1);
  };
  const SWIPE_THRESHOLD = 60;
  const idxRef = useRef(idx);
  useEffect(() => {
    idxRef.current = idx;
  }, [idx]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        !onlineHeroClaimLoadingRef.current &&
        !isNaming &&
        !selected &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
        Math.abs(gesture.dx) > 6,
      onPanResponderRelease: (_, gesture) => {
        if (selected || isAnimating || onlineHeroClaimLoadingRef.current)
          return;
        const total = availableHeroesRef.current.length;
        if (total <= 1) return;
        const currentIdx = idxRef.current;
        if (gesture.dx > SWIPE_THRESHOLD) {
          animateTo((currentIdx - 1 + total) % total, -1);
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          animateTo((currentIdx + 1) % total, 1);
        }
      },
    }),
  ).current;
  const [quoteTyped, setQuoteTyped] = useState("");
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const bubbleTranslateY = useRef(new Animated.Value(-28)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(0.98)).current;
  const typeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quoteExitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const cleanupTimers = () => {
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current);
      typeIntervalRef.current = null;
    }
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (quoteExitTimeoutRef.current) {
      clearTimeout(quoteExitTimeoutRef.current);
      quoteExitTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupTimers();
      AudioManager.stopKeyboardLoop();
      AudioManager.restoreBackground(0.35);
    };
  }, []);

  // Skip бутон: появява се с анимация когато започва финалният цитат
  useEffect(() => {
    if (!selected || quoteMode !== "final") return;
    skipTranslateY.setValue(-50);
    skipScale.setValue(0.6);
    skipOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(skipOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(skipTranslateY, {
        toValue: 0,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.spring(skipScale, {
        toValue: 1.15,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.spring(skipScale, {
        toValue: 1,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }).start();
    });
  }, [selected, quoteMode, skipTranslateY, skipScale, skipOpacity]);

  const navigateNext = () => {
    if (mode === "ONLINE") {
      // Only after final quote finished (not name prompt). Avoid duplicate ready signals.
      if (quoteModeRef.current !== "final") return;
      if (heroIntroReadySentRef.current) return;
      heroIntroReadySentRef.current = true;
      sendPlayerReady(mpPhaseHeroIntroComplete());
      setWaitingForHeroIntroOthers(true);
      return;
    }
    if (target && index < target) {
      navigation.navigate("PassDevice", { index: index + 1 });
    } else {
      setShowRound1Transition(true);
    }
  };

  useEffect(() => {
    if (mode !== "ONLINE") return;
    const unsub = subscribeMpPhaseAllReady((p) => {
      if (p !== mpPhaseHeroIntroComplete()) return;
      setWaitingForHeroIntroOthers(false);
      setShowRound1Transition(true);
    });
    return unsub;
  }, [mode]);

  const onRound1TransitionCountdownStart = useCallback(() => {
    setShowRound1Content(true);
    const packSlugs = (gameSettings?.selectedPacks ?? ["main"]).slice(0, 5);
    const lang =
      normalizeLanguage(
        useGameStore.getState().onlineSessionLanguage ?? i18n.language,
      ) ?? "en";
    (async () => {
      try {
        const result = await fetchQuestions({
          packs: packSlugs,
          lang,
          userId,
        }).then((q) => ({ questions: q }));
        if (!result?.questions?.length) {
          Alert.alert("Error", "No questions loaded. Check your connection.");
          setShowRound1Transition(false);
          setShowRound1Content(false);
          return;
        }
        setGameQuestions(result.questions);
        const gameIdForTrack = existingGameId ?? startGameSession(mode);
        if (shouldTrackLifecycle) {
          try {
            await trackGameStartedMutation.mutateAsync({
              gameId: gameIdForTrack,
              mode,
              playersCount: Math.max(playersCount || 1, 1),
              language: i18n.language,
              userId,
              packs: packSlugs,
            });
          } catch (e) {
            console.warn("track GAME_STARTED failed", e);
          }
        }
      } catch (e) {
        console.warn("fetchQuestions failed", e);
        Alert.alert("Error", "Could not load questions. Try again.");
        setShowRound1Transition(false);
        setShowRound1Content(false);
      }
    })();
  }, [
    gameSettings?.selectedPacks,
    setGameQuestions,
    existingGameId,
    startGameSession,
    mode,
    shouldTrackLifecycle,
    playersCount,
    userId,
    trackGameStartedMutation,
  ]);

  const enterRound1GameLocal = useCallback(async () => {
    if (!players?.length) return;
    const roundId = `${gameId ?? "game_local"}_round_1`;
    setCurrentRoundId(roundId);
    if (gameId && shouldTrackLifecycle) {
      try {
        await trackRoundStartedMutation.mutateAsync({
          gameId,
          roundId,
          mode,
          roundIndex: 1,
          userId,
        });
      } catch (e) {
        console.warn("track ROUND_STARTED failed", e);
      }
    }
    startRound();
    navigation.navigate("Game", {
      screen: "PassDeviceGameplay",
      params: { playerIndex: 0 },
    } as never);
  }, [
    players?.length,
    gameId,
    mode,
    shouldTrackLifecycle,
    userId,
    setCurrentRoundId,
    startRound,
    navigation,
    trackRoundStartedMutation,
  ]);

  const enterRound1GameOnline = useCallback(async () => {
    if (!players?.length) return;
    const roundId = `${gameId ?? "game_local"}_round_1`;
    setCurrentRoundId(roundId);
    if (gameId && shouldTrackLifecycle) {
      try {
        await trackRoundStartedMutation.mutateAsync({
          gameId,
          roundId,
          mode,
          roundIndex: 1,
          userId,
        });
      } catch (e) {
        console.warn("track ROUND_STARTED failed", e);
      }
    }
    startRound();
    const idx = getOnlinePlayerIndex(players, onlinePlayerId);
    navigation.navigate("Game", {
      screen: "Question",
      params: { playerIndex: idx },
    } as never);
  }, [
    players,
    onlinePlayerId,
    gameId,
    mode,
    shouldTrackLifecycle,
    userId,
    setCurrentRoundId,
    startRound,
    navigation,
    trackRoundStartedMutation,
  ]);

  useMultiplayerPhaseGate({
    enabled: mode === "ONLINE" && waitingRound1Players,
    phase: mpPhaseRound1Start(),
    onReady: () => {
      setWaitingRound1Players(false);
      void enterRound1GameOnline();
    },
  });

  const onRound1Start = async () => {
    if (!players?.length) return;
    AudioManager.playButtonClick();
    if (mode === "ONLINE") {
      setWaitingRound1Players(true);
      sendPlayerReady(mpPhaseRound1Start());
      return;
    }
    await enterRound1GameLocal();
  };

  const round1TutorialSteps = useMemo(() => getTutorialSteps(t), [t]);
  const firstPlayerName = players?.[0]?.name;
  const onRound1TransitionDone = useCallback(() => {
    setShowRound1Transition(false);
  }, []);

  const bounceTwice = () => {
    Animated.sequence([
      Animated.spring(bubbleScale, {
        toValue: 1.06,
        friction: 6,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.spring(bubbleScale, {
        toValue: 0.98,
        friction: 6,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.spring(bubbleScale, {
        toValue: 1.05,
        friction: 6,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.spring(bubbleScale, {
        toValue: 1,
        friction: 6,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const typeQuote = (text: string, onDone?: () => void) => {
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current);
      typeIntervalRef.current = null;
    }
    const safeText = text.trim() || t("hero_picker_quote_fallback");
    // 🔉 START: duck + keyboard ВЕДНАГА
    AudioManager.duckBackground(0.12);
    AudioManager.startKeyboardLoop();

    setQuoteTyped("");
    let i = 0;

    typeIntervalRef.current = setInterval(() => {
      i += 1;
      setQuoteTyped(safeText.slice(0, i));

      if (i >= safeText.length) {
        if (typeIntervalRef.current) {
          clearInterval(typeIntervalRef.current);
          typeIntervalRef.current = null;
        }
        // 🔇 STOP: keyboard + restore bg ВЕДНАГА
        AudioManager.stopKeyboardLoop();
        AudioManager.restoreBackground(0.35);
        onDone?.();
      }
    }, TYPE_INTERVAL_MS);
  };

  const runCoordinatedSequence = (text: string, shouldNavigate = true) => {
    cleanupTimers();
    setIsAnimating(true);
    overlayOpacity.setValue(0);
    bubbleOpacity.setValue(0);
    bubbleTranslateY.setValue(-28);
    bubbleScale.setValue(0.98);
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    Animated.parallel([
      Animated.timing(bubbleOpacity, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(bubbleTranslateY, {
        toValue: 0,
        duration: QUOTE_ENTER_DUR,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {});

    typeQuote(text, () => {
      if (quoteModeRef.current === "prompt") {
        setIsAnimating(false);

        // setTimeout(() => {
        // }, 600);

        return;
      }

      // 👇 ТОВА Е САМО ЗА ФИНАЛНИЯ ЦИТАТ
      holdTimeoutRef.current = setTimeout(() => {
        bounceTwice();
        quoteExitTimeoutRef.current = setTimeout(() => {
          quoteExitTimeoutRef.current = null;
          Animated.parallel([
            Animated.timing(bubbleOpacity, {
              toValue: 0,
              duration: 220,
              useNativeDriver: true,
            }),
            Animated.timing(bubbleTranslateY, {
              toValue: -90,
              duration: QUOTE_EXIT_DUR,
              useNativeDriver: true,
            }),
          ]).start(() => {
            AudioManager.playHeroPickerEnd();
            setIsAnimating(false);
            if (shouldNavigate) navigateNext();
          });
        }, 520);
      }, READ_HOLD_MS);
    });
  };

  const runCoordinatedSequenceRef = useRef(runCoordinatedSequence);
  runCoordinatedSequenceRef.current = runCoordinatedSequence;

  useEffect(() => {
    beginOnlineNamePromptAfterReserveRef.current = (h: ICharacter) => {
      setLockedHero(h);
      setIsNaming(true);
      setQuoteMode("prompt");
      quoteModeRef.current = "prompt";
      focusNameInput();
      AudioManager.playButtonClick();
      const namePrompt =
        (h.quotes_nameSelected?.length
          ? randomOf(h.quotes_nameSelected)
          : null) || t("hero_picker_name_prompt_default");
      runCoordinatedSequenceRef.current(namePrompt);
    };
  }, [t]);

  useEffect(() => {
    beginOnlineFinalQuoteAfterNameRef.current = (hero: ICharacter) => {
      setSelected(true);
      setIsNaming(false);
      setClaimSubmitting(false);
      setIsNameInputFocused(false);
      if (gameId) {
        void trackCharacterSelected({
          gameId,
          characterId: hero.id,
          mode,
          playerId: onlinePlayerId ?? "",
          userId,
        }).catch((e) => {
          console.warn("track CHARACTER_SELECTED failed", e);
        });
      }
      const selectedQuotes = hero.quotes_selected?.length
        ? hero.quotes_selected
        : [t("hero_picker_quote_fallback")];
      const q = randomOf(selectedQuotes) || t("hero_picker_quote_fallback");
      setQuoteMode("final");
      quoteModeRef.current = "final";
      runCoordinatedSequenceRef.current(q);
    };
  }, [gameId, mode, userId, t, onlinePlayerId]);

  useEffect(() => {
    if (mode !== "ONLINE" || !onlineWsToken) return;
    connectMultiplayerRelay(onlineWsToken);
    const unsub = subscribeMultiplayerRelay((raw) => {
      const d = raw as {
        type?: string;
        playerId?: string;
        characterId?: string;
        nickname?: string | null;
      };
      const st = useGameStore.getState();
      if (st.mode !== "ONLINE") return;
      if (
        d.type === HERO_CLAIM_OK_MESSAGE_TYPE &&
        d.playerId &&
        d.characterId
      ) {
        let displayName: string;
        if (d.playerId === st.onlinePlayerId) {
          if (
            nameConfirmPendingRef.current &&
            pendingNameRef.current.trim().length >= 3
          ) {
            displayName = pendingNameRef.current.trim();
          } else if (d.nickname && d.nickname.length >= 3) {
            displayName = d.nickname;
          } else {
            displayName = "Player";
          }
        } else {
          displayName =
            d.nickname && d.nickname.length >= 3 ? d.nickname : "Player";
        }
        st.applyRemoteHeroPick({
          playerId: d.playerId,
          characterId: d.characterId,
          name: displayName,
        });

        if (d.playerId !== st.onlinePlayerId) return;

        if (
          nameConfirmPendingRef.current &&
          lockedHeroForClaimRef.current?.id === d.characterId
        ) {
          nameConfirmPendingRef.current = false;
          setClaimSubmitting(false);
          const h = lockedHeroForClaimRef.current;
          if (h) beginOnlineFinalQuoteAfterNameRef.current(h);
          return;
        }
        if (
          heroReservePendingRef.current &&
          lockedHeroForClaimRef.current?.id === d.characterId
        ) {
          heroReservePendingRef.current = false;
          setOnlineHeroClaimLoading(false);
          const h = lockedHeroForClaimRef.current;
          if (h) beginOnlineNamePromptAfterReserveRef.current(h);
        }
      }
      if (
        d.type === HERO_CLAIM_DENIED_MESSAGE_TYPE &&
        typeof d.characterId === "string"
      ) {
        if (
          heroReservePendingRef.current &&
          lockedHeroForClaimRef.current?.id === d.characterId
        ) {
          heroReservePendingRef.current = false;
          setOnlineHeroClaimLoading(false);
          lockedHeroForClaimRef.current = null;
          Alert.alert(t("required_alert_title"), t("online_hero_taken"));
          return;
        }
        if (
          nameConfirmPendingRef.current &&
          lockedHeroForClaimRef.current?.id === d.characterId
        ) {
          nameConfirmPendingRef.current = false;
          setClaimSubmitting(false);
          Alert.alert(t("required_alert_title"), t("online_hero_taken"));
        }
      }
    });
    return unsub;
  }, [mode, onlineWsToken, t]);

  const handleSelect = () => {
    if (!hero || !hero.unlocked || selected || isAnimating) return;
    if (mode === "ONLINE") {
      if (!onlineWsToken || onlineHeroClaimLoading) return;
      AudioManager.playPickingHero();
      lockedHeroForClaimRef.current = hero;
      heroReservePendingRef.current = true;
      setOnlineHeroClaimLoading(true);
      connectMultiplayerRelay(onlineWsToken);
      sendMultiplayerRelay({
        type: HERO_CLAIM_MESSAGE_TYPE,
        characterId: hero.id,
      });
      return;
    }

    AudioManager.playPickingHero();
    setLockedHero(hero);
    setIsNaming(true);
    setQuoteMode("prompt");
    quoteModeRef.current = "prompt";
    focusNameInput();
    AudioManager.playButtonClick();

    const namePrompt =
      (hero.quotes_nameSelected?.length
        ? randomOf(hero.quotes_nameSelected)
        : null) || t("hero_picker_name_prompt_default");
    runCoordinatedSequence(namePrompt);
  };

  const addPlayer = useGameStore((s) => s.addPlayer);

  const onConfirmName = () => {
    if (!isNaming || selected) return;

    const trimmed = playerName.trim();
    if (trimmed.length < 3 || trimmed.length > 8) return;
    AudioManager.playButtonClick();

    if (mode === "ONLINE") {
      if (!lockedHero || !onlineWsToken) return;
      nameConfirmPendingRef.current = true;
      pendingNameRef.current = trimmed;
      setClaimSubmitting(true);
      connectMultiplayerRelay(onlineWsToken);
      sendMultiplayerRelay({
        type: HERO_CLAIM_MESSAGE_TYPE,
        characterId: lockedHero.id,
        nickname: trimmed,
      });
      return;
    }

    setSelected(true); // 🔒 lock UI
    setIsNaming(false);

    const id = Date.now().toString();

    addPlayer({
      id,
      name: trimmed,
      connected: true,
    });

    assignCharacter(id, lockedHero!.id);
    if (gameId) {
      void trackCharacterSelected({
        gameId,
        characterId: lockedHero!.id,
        mode,
        playerId: id,
        userId,
      }).catch((e) => {
        console.warn("track CHARACTER_SELECTED failed", e);
      });
    }

    setIsNameInputFocused(false);
    const selectedQuotes = lockedHero!.quotes_selected?.length
      ? lockedHero!.quotes_selected
      : [t("hero_picker_quote_fallback")];
    const q = randomOf(selectedQuotes) || t("hero_picker_quote_fallback");

    setQuoteMode("final");
    quoteModeRef.current = "final";
    runCoordinatedSequence(q);
  };

  const onSkip = () => {
    if (isAnimating) {
      cleanupTimers();
      AudioManager.stopKeyboardLoop();
      AudioManager.restoreBackground(0.35);
      setIsAnimating(false);
      navigateNext();
      return;
    }
    navigateNext();
  };

  const displayHero = lockedHero ?? hero;
  const showEmptyState =
    heroesLoaded &&
    !heroesLoading &&
    !lockedHero &&
    availableHeroes.length === 0;

  const screenReady =
    heroesLoaded &&
    !heroesLoading &&
    passDeviceAssetsReady &&
    (showEmptyState || assetsReady);

  if (!screenReady) {
    return <HeroPickerLoadingOverlay />;
  }

  if (showEmptyState) {
    return (
      <SafeAreaView
        className="flex-1 bg-black items-center justify-center px-8"
        edges={["right", "left"]}
      >
        <CustomText variant="h4" className="text-center">
          {t("hero_picker_unavailable")}
        </CustomText>
        <View className="mt-4">
          <CustomText variant="p" className="text-center">
            {heroesError ?? t("heroes_error")}
          </CustomText>
          <CustomText variant="p-small" className="text-center mt-2">
            API base: {getApiBaseUrl()}
          </CustomText>
          <CustomText variant="p-small" className="text-center mt-1">
            {t("hero_picker_unavailable_hint")}
          </CustomText>
        </View>
        <View className="w-full mt-8">
          <CustomButton
            title={t("retry")}
            fullWidth
            onPress={() => void heroesQuery.refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!displayHero) {
    return <HeroPickerLoadingOverlay />;
  }

  const handleFooterConfirm = () => {
    const h = lockedHero ?? hero;
    if (!h?.unlocked) {
      // 🔒 locked hero → само анимация
      lockAnimMapRef.current[displayHero.id]?.();
      return;
    }

    // ✅ unlocked hero → нормалния flow
    handleSelect();
  };

  return (
    <KeyboardAvoidingView enabled={false} style={{ flex: 1 }}>
      <FullBleedStack
        rootStyle={{ flex: 1 }}
        backdrop={
          showRound1Content ? (
            <ImageBackground
              source={backgrounds.bg019}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            >
              <WarmBubblesOverlay variant="normal" />
            </ImageBackground>
          ) : (
            <HeroPickerBackdrop
              showOverlay={selected || isNaming || onlineHeroClaimLoading}
              overlayOpacity={overlayOpacity}
              styles={styles}
            />
          )
        }
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: "transparent" }}
          edges={["right", "left"]}
        >
          {showRound1Content ? (
            <>
              <TutorialOverlay
                visible={showRound1Tutorial}
                onSkipAll={() => setShowRound1Tutorial(false)}
                onDoneAll={() => setShowRound1Tutorial(false)}
                steps={round1TutorialSteps}
              />
              <View className="flex-1 justify-center relative">
                <View>
                  <CustomText variant="h2" className="text-center mb-2" shadow>
                    {t("round_label")}
                  </CustomText>
                  <CustomText className="text-center" variant="h0" shadow>
                    1
                  </CustomText>
                </View>
                <View className="mb-16 px-16 absolute bottom-0 left-0 right-0">
                  <CustomText className="text-center mb-4">
                    <CustomText className="underline">
                      {firstPlayerName}
                    </CustomText>
                    ,<CustomText> {t("round_start_hint")}</CustomText>
                  </CustomText>
                  <CustomButton
                    title={t("start_btn")}
                    backgroundImage={backgrounds.bg026}
                    glow
                    glowColor="rgba(41,255,25,0.8)"
                    shadowColor="#005f07"
                    horizontalPadding={48}
                    fullWidth
                    onPress={onRound1Start}
                    disabled={mode === "ONLINE" && waitingRound1Players}
                  />
                </View>
              </View>
            </>
          ) : (
            <View style={styles.contentLayer} pointerEvents="box-none">
              {showConfetti && (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: SCREEN_WIDTH,
                    height: SCREEN_HEIGHT,
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 999,
                  }}
                >
                  <LottieView
                    source={lottie.confettiTop} // ⬅️ важно: burst animation
                    autoPlay
                    loop={false}
                    resizeMode="cover"
                    style={{
                      width: SCREEN_WIDTH * 1.4,
                      height: SCREEN_WIDTH * 1.4,
                    }}
                  />
                </View>
              )}

              <QuoteBubble
                visible={selected || isNaming}
                text={quoteTyped}
                opacity={bubbleOpacity}
                translateY={bubbleTranslateY}
                scale={bubbleScale}
                styles={styles}
              />
              {!selected && !isNaming && !onlineHeroClaimLoading && (
                <>
                  {/* Settings — top left */}
                  <View
                    style={{
                      position: "absolute",
                      top: insets.top + 8,
                      left: 16,
                      zIndex: 30,
                    }}
                  >
                    <Pressable
                      onPressIn={settingsAnim.pressIn}
                      onPressOut={settingsAnim.pressOut}
                      onPress={() => {
                        AudioManager.playButtonClick();
                        openUserSettings({
                          fromHeroPicker: true,
                          onHeroSetupExit: () => {
                            AudioManager.stopBackground();
                            resetGame();
                            let rootNavigation: any = navigation;
                            while (rootNavigation.getParent?.()) {
                              rootNavigation = rootNavigation.getParent();
                            }
                            rootNavigation.dispatch(
                              CommonActions.reset({
                                index: 0,
                                routes: [
                                  {
                                    name: "Onboarding",
                                    params: {
                                      screen: "Welcome",
                                      params: { skipCurtain: true },
                                    },
                                  },
                                ],
                              }),
                            );
                          },
                        });
                      }}
                    >
                      <AnimatedImage
                        source={game_images.settingsIcon}
                        style={[{ width: 56, height: 56 }, settingsAnim.style]}
                        contentFit="contain"
                      />
                    </Pressable>
                  </View>
                </>
              )}

              <View
                style={{
                  flex: 1,
                  width: "100%",
                  position: "relative",
                  paddingHorizontal: 16,
                }}
              >
                <View
                  pointerEvents="box-none"
                  style={{
                    zIndex: 20,
                    opacity:
                      isNaming || selected || onlineHeroClaimLoading ? 0 : 1,
                  }}
                >
                  <HeroPickerHeader />
                </View>
                <View
                  style={{
                    marginTop: titleToHeroGapPx,
                    flex: 1,
                    minHeight: 0,
                    overflow: "visible",
                    zIndex: 15,
                    position: "relative",
                  }}
                >
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: -16,
                      right: -16,
                      bottom: bottomArtBottomPx,
                      height: `${Math.round(HERO_PICKER_BOTTOM_ART_HEIGHT_RATIO * 102)}%`,
                      zIndex: 0,
                    }}
                  >
                    <AppImage
                      source={game_images.heroPickerBottom}
                      contentFit="cover"
                      style={{
                        width: "100%",
                        height: "100%",
                        opacity: isNameInputFocused ? 0 : 1,
                      }}
                    />
                  </View>
                  <HeroStage
                    key={displayHero.id}
                    hero={displayHero}
                    heroScale={heroScale}
                    opacity={opacity}
                    translateX={translateX}
                    selected={selected || isNaming}
                    panResponder={
                      !isNaming && !selected ? panResponder : undefined
                    }
                    canInteract={
                      !isNaming &&
                      !selected &&
                      !isAnimating &&
                      !onlineHeroClaimLoading &&
                      availableHeroes.length > 1
                    }
                    previewing={previewing}
                    onPrev={onPrev}
                    onNext={onNext}
                    leftArrowAnim={leftArrowAnim}
                    rightArrowAnim={rightArrowAnim}
                    styles={styles}
                    onPlayLockAnim={(fn) => {
                      lockAnimMapRef.current[displayHero.id] = fn;
                    }}
                    onUnlockVisualComplete={() => {
                      setUnlockedIds((prev) => {
                        const next = new Set(prev);
                        next.add(displayHero.id);
                        return next;
                      });
                      setShowConfetti(true);
                      setTimeout(() => setShowConfetti(false), 1800);
                    }}
                  />
                </View>

                <View
                  style={{
                    marginTop: heroToFooterGapPx,
                    paddingBottom: footerBottomPad,
                    zIndex: 25,
                    alignItems: "center",
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {selected && quoteMode === "final" ? (
                    <Animated.View
                      pointerEvents="auto"
                      style={{
                        position: "absolute",
                        left: 16,
                        right: 16,
                        bottom: footerBottomPad,
                        zIndex: 26,
                        opacity: skipOpacity,
                        transform: [
                          {
                            translateY: Animated.add(
                              skipTranslateY,
                              footerTranslateY,
                            ),
                          },
                          { scale: skipScale },
                          { translateY: 6 },
                        ],
                      }}
                    >
                      <Pressable
                        accessibilityRole="button"
                        onPress={onSkip}
                        hitSlop={{ top: 18, right: 28, bottom: 18, left: 28 }}
                        style={({ pressed }) => [
                          staticStyles.skipTextBtn,
                          pressed && staticStyles.skipTextBtnPressed,
                        ]}
                      >
                        <CustomText
                          variant="p"
                          className="text-center font-semibold"
                        >
                          {t("hero_picker_skip")}
                        </CustomText>
                      </Pressable>
                    </Animated.View>
                  ) : null}
                  <HeroPickerFooter
                    hero={displayHero}
                    isNaming={isNaming}
                    playerName={playerName}
                    disabled={
                      selected || claimSubmitting || onlineHeroClaimLoading
                    }
                    inputRef={nameInputRef}
                    onChangeName={(v) => setPlayerName(v)}
                    onConfirm={isNaming ? onConfirmName : handleFooterConfirm}
                    styles={styles}
                    style={{
                      opacity: selected ? 0 : 1,
                      pointerEvents: selected ? "none" : "auto",
                      width: "100%",
                    }}
                    keyboardLiftStyle={{
                      transform: [{ translateY: footerTranslateY }],
                    }}
                    onInputFocus={() => setIsNameInputFocused(true)}
                    onInputBlur={() => setIsNameInputFocused(false)}
                  />
                </View>
              </View>
              {onlineHeroClaimLoading ? (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 1000,
                    backgroundColor: "rgba(0,0,0,0.45)",
                  }}
                >
                  <ActivityIndicator size="small" color="#ffffff" />
                </View>
              ) : null}
              {heroSnipedNotice && mode === "ONLINE" ? (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 3000,
                    backgroundColor: "rgba(0,0,0,0.72)",
                    paddingHorizontal: 32,
                  }}
                >
                  <CustomText
                    variant="h5"
                    className="text-center text-white mb-2"
                  >
                    {t("hero_picker_sniped_title")}
                  </CustomText>
                  <CustomText variant="p" className="text-center text-white/90">
                    {t("hero_picker_sniped_hint")}
                  </CustomText>
                </View>
              ) : null}
            </View>
          )}
          <OnlineWaitPlayersOverlay
            visible={
              mode === "ONLINE" &&
              (waitingRound1Players || waitingForHeroIntroOthers)
            }
            messageKey={
              waitingForHeroIntroOthers
                ? "online_wait_hero_intro"
                : "online_wait_other_players"
            }
          />
        </SafeAreaView>
      </FullBleedStack>
      {showRound1Transition && (
        <Round1TransitionOverlay
          onDone={onRound1TransitionDone}
          onCountdownStart={onRound1TransitionCountdownStart}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const staticStyles = StyleSheet.create({
  skipTextBtn: {
    alignSelf: "center",
    minWidth: 116,
    minHeight: 44,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.36)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  skipTextBtnPressed: {
    opacity: 0.74,
    transform: [{ scale: 0.98 }],
  },
});
