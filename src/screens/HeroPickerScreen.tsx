// src/screens/HeroPickerScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Animated,
  Easing,
  Pressable,
  TouchableOpacity,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomText from "../components/common/CustomText";
import { useTranslation } from "react-i18next";
import { HEROES } from "../data/heroes";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { CreateGameStackParamList } from "../navigation/types";
import { useGameStore } from "../store/useGameStore";
import { StackNavigationProp } from "@react-navigation/stack";
import LoadingScreen from "../components/LoadingScreen";
import AudioManager from "../utils/audioManager";
import { game_images } from "../../assets/images";
import { useIconPressAnim } from "../hooks/useIconPressAnim";
import { createHeroPickerStyles } from "./styles/heroPicker.styles";
import { QuoteBubble } from "./HeroPicker/QuoteBubble";
import { HeroPickerHeader } from "./HeroPicker/HeroPickerHeader";
import { HeroStage } from "./HeroPicker/HeroStage";
import { HeroPickerFooter } from "./HeroPicker/HeroPickerFooter";
import HeroPickerBackground from "./HeroPicker/HeroPickerBackground";
import { useHeroAssets } from "./HeroPicker/hooks/useHeroAssets";
import {
  CAROUSEL_DIST,
  CAROUSEL_IN_DUR,
  CAROUSEL_OUT_DUR,
  HERO_STAGE_HEIGHT,
  QUOTE_ENTER_DUR,
  QUOTE_EXIT_DUR,
  READ_HOLD_MS,
  SLIDE_DISTANCE,
  TYPE_INTERVAL_MS,
} from "./HeroPicker/constants/heroPicker.constants";
import { CustomInputHandle } from "../components/common/CustomInput";
import { Confetti, ContinuousConfetti } from "react-native-fast-confetti";
import { Dimensions } from "react-native";
import LottieView from "lottie-react-native";
import { lottie } from "../../assets/lottie";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
type HeroNav = StackNavigationProp<CreateGameStackParamList, "HeroPicker">;
type HeroRoute = RouteProp<CreateGameStackParamList, "HeroPicker">;
function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
export default function HeroPickerScreen() {
  const route = useRoute<HeroRoute>();
  const navigation = useNavigation<HeroNav>();
  const { index } = route.params;
  const { t } = useTranslation();
  const settingsAnim = useIconPressAnim();
  const leftArrowAnim = useIconPressAnim();
  const rightArrowAnim = useIconPressAnim();
  const [lockedHero, setLockedHero] = useState<(typeof HEROES)[number] | null>(
    null
  );

  const [showConfetti, setShowConfetti] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const footerTranslateY = useRef(new Animated.Value(0)).current;
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
  const taken = useGameStore((s) => s.takenCharacters);
  const target = useGameStore((s) => s.targetPlayersCount);
  const assignCharacter = useGameStore((s) => s.assignCharacter);
  const availableHeroes = useMemo(() => {
    const filtered = HEROES.filter((h) => !taken.includes(h.id));

    const unlocked = filtered.filter((h) => h.unlocked);
    const locked = filtered.filter((h) => !h.unlocked);

    return [...unlocked, ...locked];
  }, [taken]);
  const lockAnimRef = useRef<(() => void) | null>(null);
  const lockAnimMapRef = useRef<Record<string, () => void>>({});
  const heroScale = useRef(new Animated.Value(1)).current;

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (availableHeroes.length === 0) return;
    if (idx >= availableHeroes.length) setIdx(0);
  }, [availableHeroes.length, idx]);
  const hero = availableHeroes[idx];
  const styles = useMemo(() => createHeroPickerStyles(HERO_STAGE_HEIGHT), []);
  const assetsReady = useHeroAssets(availableHeroes);
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

  // Carousel animation
  const translateX = useRef(new Animated.Value(0)).current;
  const slideCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selected, setSelected] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // const animateTo = (nextIdx: number, direction: 1 | -1) => {
  //   if (selected || isAnimating) return;
  //   if (availableHeroes.length <= 1) return;

  //   Animated.parallel([
  //     Animated.timing(opacity, {
  //       toValue: 0,
  //       duration: CAROUSEL_OUT_DUR,
  //       easing: Easing.inOut(Easing.cubic),
  //       useNativeDriver: true,
  //     }),
  //     Animated.timing(translateX, {
  //       toValue: -direction * CAROUSEL_DIST,
  //       duration: CAROUSEL_OUT_DUR,
  //       easing: Easing.inOut(Easing.cubic),
  //       useNativeDriver: true,
  //     }),
  //   ]).start(() => {
  //     setIdx(nextIdx);
  //     translateX.setValue(direction * CAROUSEL_DIST);

  //     Animated.parallel([
  //       Animated.timing(opacity, {
  //         toValue: 1,
  //         duration: CAROUSEL_IN_DUR,
  //         easing: Easing.out(Easing.cubic),
  //         useNativeDriver: true,
  //       }),
  //       Animated.timing(translateX, {
  //         toValue: 0,
  //         duration: CAROUSEL_IN_DUR,
  //         easing: Easing.out(Easing.cubic),
  //         useNativeDriver: true,
  //       }),
  //     ]).start();
  //   });
  // };

  // const animateTo = (nextIdx: number, direction: 1 | -1) => {
  //   if (selected || isAnimating) return;
  //   if (availableHeroes.length <= 1) return;

  //   setIsAnimating(true);

  //   // 👉 1. текущият герой ИЗЛИЗА
  //   Animated.timing(translateX, {
  //     toValue: -direction * SLIDE_DISTANCE,
  //     duration: CAROUSEL_OUT_DUR,
  //     easing: Easing.in(Easing.cubic),
  //     useNativeDriver: true,
  //   }).start(() => {
  //     // 👉 2. сменяме героя, но го позиционираме ИЗВЪН екрана
  //     setIdx(nextIdx);

  //     translateX.setValue(direction * SLIDE_DISTANCE);

  //     // 👉 3. новият герой ВЛИЗА
  //     Animated.timing(translateX, {
  //       toValue: 0,
  //       duration: CAROUSEL_IN_DUR,
  //       easing: Easing.out(Easing.cubic),
  //       useNativeDriver: true,
  //     }).start(() => {
  //       setIsAnimating(false);
  //     });
  //   });
  // };

  const animateTo = (nextIdx: number, direction: 1 | -1) => {
    if (selected || isAnimating) return;
    if (availableHeroes.length <= 1) return;

    setIsAnimating(true);
    AudioManager.heroPickerSwipe();

    // 👉 OUT: текущият герой излиза
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -direction * SLIDE_DISTANCE,
        duration: CAROUSEL_OUT_DUR,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(heroScale, {
        toValue: 0.96,
        duration: CAROUSEL_OUT_DUR,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 👉 SWAP
      setIdx(nextIdx);
      heroScale.setValue(1);
      translateX.setValue(direction * SLIDE_DISTANCE);

      // 👉 IN: новият герой влиза с лек overshoot
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: -direction * 12,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(translateX, {
          toValue: 0,
          friction: 6,
          tension: 140,
          useNativeDriver: true,
        }),
      ]).start(() => {
        slideCooldownRef.current = setTimeout(() => {
          setIsAnimating(false);
        }, 350);
      });
    });
  };

  const onPrev = () =>
    animateTo((idx - 1 + availableHeroes.length) % availableHeroes.length, -1);
  const onNext = () => animateTo((idx + 1) % availableHeroes.length, 1);
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
    })
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

  const navigateNext = () => {
    if (target && index < target) {
      navigation.navigate("PassDevice", { index: index + 1 });
    } else {
      // AudioManager.stopBackground();
      navigation.navigate("Lobby");
    }
  };

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
    if (!hero || !hero.free || selected || isAnimating) return;
    AudioManager.playPickingHero();
    setLockedHero(hero);
    setIsNaming(true);
    setQuoteMode("prompt");
    quoteModeRef.current = "prompt";
    requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });
    AudioManager.playButtonClick();

    runCoordinatedSequence("And what do you want me to call you?");
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
    setIsNameInputFocused(false);
    const q = randomOf(lockedHero!.quotes_selected);

    setQuoteMode("final");
    quoteModeRef.current = "final";
    // AudioManager.playHeroPickerEnd();
    runCoordinatedSequence(q);
  };

  const onSkip = () => {
    if (isAnimating) {
      cleanupTimers();
      setIsAnimating(false);
      navigateNext();
      return;
    }
    navigateNext();
  };

  const displayHero = lockedHero ?? hero;

  if (
    !assetsReady ||
    (availableHeroes.length === 0 && !lockedHero) ||
    !displayHero
  ) {
    return <LoadingScreen />;
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
          {selected && (
            <View className="absolute top-20 right-6 z-50">
              <TouchableOpacity onPress={onSkip} activeOpacity={0.9}>
                <CustomText className="w-full underline">
                  {t("hero_picker_skip")}
                </CustomText>
              </TouchableOpacity>
            </View>
          )}
          {!selected && !isNaming && (
            <View className="absolute top-16 left-8">
              <Pressable
                onPressIn={settingsAnim.pressIn}
                onPressOut={settingsAnim.pressOut}
                onPress={() => {
                  AudioManager.playButtonClick();
                }}
              >
                <Animated.Image
                  source={game_images.settingsIcon}
                  style={[
                    { width: 56, height: 56, resizeMode: "contain" },
                    settingsAnim.style,
                  ]}
                />
              </Pressable>
            </View>
          )}
          <View className="flex-1 items-center w-full justify-between px-4 pt-10 pb-[88px]">
            <View style={{ opacity: isNaming || selected ? 0 : 1 }}>
              <HeroPickerHeader />
            </View>
            <HeroStage
              hero={displayHero}
              heroScale={heroScale}
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
                setShowConfetti(true);

                // auto-hide след кратко време
                setTimeout(() => {
                  setShowConfetti(false);
                }, 1800);
              }}
            />

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
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
