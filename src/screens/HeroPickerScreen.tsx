// src/screens/HeroPickerScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Animated,
  Easing,
  Pressable,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomText from "../components/common/CustomText";
import CustomButton from "../components/common/CustomButton";
import { useTranslation } from "react-i18next";
import {
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
import HeroPickerBackground from "./HeroPicker/HeroPickerBackground";
import Round1TransitionOverlay from "../components/Round1TransitionOverlay";
import TutorialOverlay, { getTutorialSteps } from "../components/TutorialOverlay";
import { useHeroAssets } from "./HeroPicker/hooks/useHeroAssets";
import { usePassDeviceAssetsReady } from "./HeroPicker/hooks/usePassDeviceAssetsReady";
import {
  CAROUSEL_DIST,
  CAROUSEL_IN_DUR,
  CAROUSEL_OPACITY_FADE_START_RATIO,
  CAROUSEL_OUT_DUR,
  HERO_STAGE_HEIGHT,
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
import i18n from "../i18n";
import { Alert, ImageBackground } from "react-native";
import { Image } from "expo-image";

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
  const route = useRoute<HeroRoute>();
  const navigation = useNavigation<HeroNav>();
  const { index } = route.params;
  usePreventBack(index >= 1);
  const { t } = useTranslation();
  const settingsAnim = useIconPressAnim();
  const leftArrowAnim = useIconPressAnim();
  const rightArrowAnim = useIconPressAnim();
  const [lockedHero, setLockedHero] = useState<ICharacter | null>(null);

  const [showConfetti, setShowConfetti] = useState(false);
  const [showRound1Transition, setShowRound1Transition] = useState(false);
  const [showRound1Content, setShowRound1Content] = useState(false);
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
  const taken = useGameStore((s) => s.takenCharacters);
  const gameId = useGameStore((s) => s.gameId);
  const mode = useGameStore((s) => s.mode);
  const userId = useAuthStore((s) => s.user.id);
  const target = useGameStore((s) => s.targetPlayersCount);
  const assignCharacter = useGameStore((s) => s.assignCharacter);
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
    setUnlockedIds((prev) => {
      const next = new Set(prev);
      heroes.filter((h) => h.unlocked).forEach((h) => next.add(h.id));
      return next;
    });
  }, [heroes]);

  useEffect(() => {
    if (availableHeroes.length === 0) return;
    if (idx >= availableHeroes.length) setIdx(0);
  }, [availableHeroes.length, idx]);
  const hero = availableHeroes[idx];
  const styles = useMemo(() => createHeroPickerStyles(HERO_STAGE_HEIGHT), []);
  const assetsReady = useHeroAssets(availableHeroes);
  const passDeviceAssetsReady = usePassDeviceAssetsReady();
  const [isNaming, setIsNaming] = useState(false);
  const [isNameInputFocused, setIsNameInputFocused] = useState(false);
  useEffect(() => {
    if (isNameInputFocused) {
      Animated.timing(footerTranslateY, {
        toValue: keyboardHeight > 0 ? -(keyboardHeight - 16) : -16,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(footerTranslateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [isNameInputFocused, keyboardHeight]);

  // Carousel animation: two-phase like HeroPickerScreen3 — fade out + slide out, then swap hero, then fade in + slide in
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  const [selected, setSelected] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const animateTo = (nextIdx: number, direction: 1 | -1) => {
    if (selected || isAnimating) return;
    if (availableHeroes.length <= 1) return;

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
  const onPrev = () => {
    const next =
      (idxRef.current - 1 + availableHeroes.length) % availableHeroes.length;
    animateTo(next, -1);
  };
  const onNext = () => {
    const next = (idxRef.current + 1) % availableHeroes.length;
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
        !isNaming &&
        !selected &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
        Math.abs(gesture.dx) > 6,
      onPanResponderRelease: (_, gesture) => {
        if (selected || isAnimating) return;
        if (availableHeroes.length <= 1) return;
        const currentIdx = idxRef.current;
        const total = availableHeroes.length;
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

  const cleanupTimers = () => {
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current);
      typeIntervalRef.current = null;
    }
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanupTimers();
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
    if (target && index < target) {
      navigation.navigate("PassDevice", { index: index + 1 });
    } else {
      setShowRound1Transition(true);
    }
  };

  const onRound1TransitionCountdownStart = useCallback(() => {
    setShowRound1Content(true);
    const packSlugs = (gameSettings?.selectedPacks ?? ["main"]).slice(0, 5);
    const lang = (i18n.language ?? "en").slice(0, 2).toLowerCase();
    (async () => {
      try {
        const result = await fetchQuestions({ packs: packSlugs, lang }).then(
          (q) => ({ questions: q }),
        );
        if (!result?.questions?.length) {
          Alert.alert("Error", "No questions loaded. Check your connection.");
          setShowRound1Transition(false);
          setShowRound1Content(false);
          return;
        }
        setGameQuestions(result.questions);
        const gameIdForTrack = existingGameId ?? startGameSession(mode);
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
    playersCount,
    userId,
    trackGameStartedMutation,
  ]);

  const onRound1Start = async () => {
    if (!players?.length) return;
    AudioManager.playButtonClick();
    const roundId = `${gameId ?? "game_local"}_round_1`;
    setCurrentRoundId(roundId);
    if (gameId) {
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
    // 🔉 START: duck + keyboard ВЕДНАГА
    AudioManager.duckBackground(0.12);
    AudioManager.startKeyboardLoop();

    setQuoteTyped("");
    let i = 0;

    typeIntervalRef.current = setInterval(() => {
      i += 1;
      setQuoteTyped(text.slice(0, i));

      if (i >= text.length) {
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
        setTimeout(() => {
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
            navigateNext();
          });
        }, 520);
      }, READ_HOLD_MS);
    });
  };

  const handleSelect = () => {
    if (!hero || !hero.unlocked || selected || isAnimating) return;
    AudioManager.playPickingHero();
    setLockedHero(hero);
    setIsNaming(true);
    setQuoteMode("prompt");
    quoteModeRef.current = "prompt";
    requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });
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
    const q = randomOf(selectedQuotes);

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
      <SafeAreaView className="flex-1 bg-black items-center justify-center px-8">
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
    if (!hero.unlocked) {
      // 🔒 locked hero → само анимация
      lockAnimMapRef.current[displayHero.id]?.();
      return;
    }

    // ✅ unlocked hero → нормалния flow
    handleSelect();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1" edges={["right", "left"]}>
        {showRound1Content ? (
          <ImageBackground
            source={backgrounds.bg019}
            className="flex-1 relative"
            resizeMode="cover"
          >
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
                  <CustomText className="underline">{firstPlayerName}</CustomText>,
                  <CustomText>
                    {" "}{t("round_start_hint")}
                  </CustomText>
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
                />
              </View>
            </View>
          </ImageBackground>
        ) : (
        <HeroPickerBackground
          showOverlay={selected || isNaming}
          overlayOpacity={overlayOpacity}
          styles={styles}
          hideBottomArt={isNameInputFocused}
        >
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
          {!selected && !isNaming && (
            <View className="absolute top-16 left-8">
              <Pressable
                onPressIn={settingsAnim.pressIn}
                onPressOut={settingsAnim.pressOut}
                onPress={() => {
                  AudioManager.playButtonClick();
                  navigation.navigate("Settings");
                }}
              >
                <AnimatedImage
                  source={game_images.settingsIcon}
                  style={[
                    { width: 56, height: 56 },
                    settingsAnim.style,
                  ]}
                  contentFit="contain"
                />
              </Pressable>
            </View>
          )}
          <View className="flex-1 items-center w-full justify-between px-4 pt-10 pb-[88px]">
            <View style={{ opacity: isNaming || selected ? 0 : 1 }}>
              <HeroPickerHeader />
            </View>
            <View
              style={[styles.stage, { overflow: "visible" as const }]}
              {...(panResponder ? panResponder.panHandlers : {})}
            >
              <HeroStage
                key={displayHero.id}
                hero={displayHero}
                heroScale={heroScale}
                opacity={opacity}
                translateX={translateX}
                panResponder={!isNaming && !selected ? panResponder : undefined}
                canInteract={
                  !isNaming &&
                  !selected &&
                  !isAnimating &&
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

            {selected && quoteMode === "final" && (
              <Animated.View
                style={{
                  opacity: skipOpacity,
                  transform: [
                    { translateY: skipTranslateY },
                    { scale: skipScale },
                  ],
                  marginTop: 8,
                  marginBottom: 12,
                  paddingHorizontal: 64,
                  width: "100%",
                }}
              >
                <CustomButton
                  title={t("hero_picker_skip")}
                  onPress={onSkip}
                  backgroundImage={backgrounds.bg026}
                  glow
                  btnSize="sm"
                  fontSize="sm"
                  glowColor="rgba(41,255,25,0.8)"
                  shadowColor="#005f07"
                  // fullWidth
                />
              </Animated.View>
            )}

            <View
              className="w-full"
              style={{ position: "relative", width: "100%" }}
            >
              <HeroPickerFooter
                hero={displayHero}
                isNaming={isNaming}
                playerName={playerName}
                disabled={selected}
                inputRef={nameInputRef}
                onChangeName={(v) => setPlayerName(v)}
                onConfirm={isNaming ? onConfirmName : handleFooterConfirm}
                styles={styles}
                style={{
                  opacity: selected ? 0 : 1,
                  pointerEvents: selected ? "none" : "auto",
                  transform: [{ translateY: footerTranslateY }],
                }}
                onInputFocus={() => setIsNameInputFocused(true)}
                onInputBlur={() => setIsNameInputFocused(false)}
              />
            </View>
          </View>
        </HeroPickerBackground>
        )}
      </SafeAreaView>
      {showRound1Transition && (
        <Round1TransitionOverlay
          onDone={onRound1TransitionDone}
          onCountdownStart={onRound1TransitionCountdownStart}
        />
      )}
    </KeyboardAvoidingView>
  );
}
