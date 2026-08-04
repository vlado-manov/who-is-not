// src/screens/Game/RevealScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  ImageBackground,
  StyleSheet,
  Animated,
  Easing,
  ImageSourcePropType,
  Dimensions,
  useWindowDimensions,
} from "react-native";
import AppImage from "../../components/AppImage";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";

import { Player, useGameStore } from "../../store/useGameStore";
import { GameStackParamList } from "../../navigation/types";
// import CustomText from "../../components/common/CustomText"; // commented out for now
import CustomButton from "../../components/common/CustomButton";

import { backgrounds } from "../../../assets/backgrounds";
import QuestionPlate from "../../components/game/QuestionPlate";
import { useAuthStore } from "../../store/useUserStore";
import { useHeroesStore } from "../../store/useHeroesStore";
import { useTrackRoundEndedMutation } from "../../api/hooks/useAnalyticsMutations";
import { usePreventBack } from "../../hooks/usePreventBack";
import { useTranslation } from "react-i18next";
import { formatQuestionWithName } from "../../utils/formatQuestionText";
import {
  deterministicPickIndex,
  // getRevealQuoteI18nKey, // commented out for now
  getRevealVariant,
  LoseVariant,
  WinVariant,
} from "../../utils/revealQuotes";
import AudioManager from "../../utils/audioManager";
import RevealAmbienceOverlay from "../../components/game/RevealAmbienceOverlay";

type Nav = StackNavigationProp<GameStackParamList, "Reveal">;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const TOP_TITLE_MARGIN_TOP = 40;
const TOP_TITLE_HEIGHT = 240;
const TITLE_TARGET_OFFSET_Y =
  TOP_TITLE_MARGIN_TOP + TOP_TITLE_HEIGHT / 2 - SCREEN_HEIGHT / 2;

const RevealScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  usePreventBack();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth >= 768 && windowWidth > windowHeight;
  const animatedTitleScale = useRef(new Animated.Value(50)).current;
  const animatedTitleTranslateY = useRef(new Animated.Value(0)).current;
  const animatedTitleRotate = useRef(new Animated.Value(0)).current;
  const titleShakeX = useRef(new Animated.Value(0)).current;
  const blurOverlayOpacity = useRef(new Animated.Value(0)).current;
  const shockwaveScale = useRef(new Animated.Value(0.3)).current;
  const shockwaveOpacity = useRef(new Animated.Value(0)).current;
  const shockwaveScale2 = useRef(new Animated.Value(0.3)).current;
  const shockwaveOpacity2 = useRef(new Animated.Value(0)).current;
  const impactFlash = useRef(new Animated.Value(0)).current;
  const [characterLoaded, setCharacterLoaded] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  // -- QUOTE BUBBLE (commented out for now) --
  // const [showQuoteBubble, setShowQuoteBubble] = useState(false);
  // const [quoteTyped, setQuoteTyped] = useState("");

  const [hideAnimatedTitle, setHideAnimatedTitle] = useState(false);
  const plateTranslateY = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(80)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  // const quoteOpacity = useRef(new Animated.Value(0)).current; // commented out for now
  // const quoteTranslateY = useRef(new Animated.Value(-28)).current; // commented out for now
  // const quoteScale = useRef(new Animated.Value(1)).current; // commented out for now
  const hasRevealedCTA = useRef(false);
  const isContinuingRef = useRef(false);
  // const typeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null); // commented out for now
  const hideTitleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const revealCtaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const entryAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const ctaAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const titleFadeAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  // const quoteIntroAnimRef = useRef<Animated.CompositeAnimation | null>(null); // commented out for now

  const stopRevealAnimations = () => {
    entryAnimRef.current?.stop();
    entryAnimRef.current = null;
    ctaAnimRef.current?.stop();
    ctaAnimRef.current = null;
    titleFadeAnimRef.current?.stop();
    titleFadeAnimRef.current = null;
    // quoteIntroAnimRef.current?.stop(); // commented out for now
    // quoteIntroAnimRef.current = null; // commented out for now

    // cleanupQuoteTyping(); // commented out for now

    if (revealCtaTimeoutRef.current) {
      clearTimeout(revealCtaTimeoutRef.current);
      revealCtaTimeoutRef.current = null;
    }
    if (hideTitleTimeoutRef.current) {
      clearTimeout(hideTitleTimeoutRef.current);
      hideTitleTimeoutRef.current = null;
    }

    animatedTitleScale.stopAnimation();
    animatedTitleTranslateY.stopAnimation();
    animatedTitleRotate.stopAnimation();
    titleShakeX.stopAnimation();
    blurOverlayOpacity.stopAnimation();
    shockwaveScale.stopAnimation();
    shockwaveOpacity.stopAnimation();
    shockwaveScale2.stopAnimation();
    shockwaveOpacity2.stopAnimation();
    impactFlash.stopAnimation();
    blurOverlayOpacity.setValue(0);
    shockwaveOpacity.setValue(0);
    shockwaveOpacity2.setValue(0);
    impactFlash.setValue(0);
    titleShakeX.setValue(0);
    plateTranslateY.stopAnimation();
    buttonTranslateY.stopAnimation();
    buttonOpacity.stopAnimation();
    titleOpacity.stopAnimation();
    // quoteOpacity.stopAnimation(); // commented out for now
    // quoteTranslateY.stopAnimation(); // commented out for now
    // quoteScale.stopAnimation(); // commented out for now

    // setShowQuoteBubble(false); // commented out for now
    // setQuoteTyped(""); // commented out for now

    // void AudioManager.stopKeyboardLoop(); // commented out for now
    // void AudioManager.restoreBackground(0.2); // commented out for now
  };

  const players = useGameStore((s) => s.players);
  const heroes = useHeroesStore((s) => s.heroes);
  const gameId = useGameStore((s) => s.gameId);
  const mode = useGameStore((s) => s.mode);
  const onlineIsHost = useGameStore((s) => s.onlineIsHost);
  const currentRoundId = useGameStore((s) => s.currentRoundId);
  const votes = useGameStore((s) => s.votes);
  const oddOneId = useGameStore((s) => s.oddOneId);
  const currentOddQuestionId = useGameStore((s) => s.currentOddQuestionId);
  const questionNameTarget = useGameStore((s) => s.questionNameTarget);
  const impostorNameSubstitute = useGameStore((s) => s.impostorNameSubstitute);
  const gameQuestions = useGameStore((s) => s.gameQuestions);
  const round = useGameStore((s) => s.round);
  const userId = useAuthStore((s) => s.user.id);
  const trackRoundEndedMutation = useTrackRoundEndedMutation();
  const shouldTrackLifecycle = mode !== "ONLINE" || onlineIsHost;
  useEffect(() => {
    if (!characterLoaded) return;
    if (hasRevealedCTA.current) return;
    // Reset shockwave/impact state before starting
    shockwaveScale.setValue(0.3);
    shockwaveScale2.setValue(0.3);
    shockwaveOpacity.setValue(0);
    shockwaveOpacity2.setValue(0);
    impactFlash.setValue(0);
    titleShakeX.setValue(0);
    blurOverlayOpacity.setValue(0);

    entryAnimRef.current = Animated.sequence([
      // Phase 1 — zoom in + spin, title stays centered, backdrop dims
      Animated.parallel([
        Animated.timing(animatedTitleScale, {
          toValue: 1,
          duration: 760,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(animatedTitleRotate, {
          toValue: 1,
          duration: 760,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(blurOverlayOpacity, {
          toValue: 1,
          duration: 460,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      // Phase 2 — two quick pulses while centered
      Animated.sequence([
        Animated.timing(animatedTitleScale, {
          toValue: 1.15,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(animatedTitleScale, {
          toValue: 0.93,
          duration: 100,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(animatedTitleScale, {
          toValue: 1.09,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(animatedTitleScale, {
          toValue: 1.0,
          duration: 100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(55),
      // Phase 3 — slam to final position with impact effects
      Animated.parallel([
        // Spring slam to top
        Animated.spring(animatedTitleTranslateY, {
          toValue: TITLE_TARGET_OFFSET_Y,
          speed: 26,
          bounciness: 4,
          useNativeDriver: true,
        }),
        // Backdrop clears
        Animated.timing(blurOverlayOpacity, {
          toValue: 0,
          duration: 210,
          useNativeDriver: true,
        }),
        // Landing squish → spring back
        Animated.sequence([
          Animated.timing(animatedTitleScale, {
            toValue: 0.88,
            duration: 85,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(animatedTitleScale, {
            toValue: 1,
            speed: 18,
            bounciness: 14,
            useNativeDriver: true,
          }),
        ]),
        // Camera shake
        Animated.sequence([
          Animated.delay(50),
          Animated.timing(titleShakeX, {
            toValue: -11,
            duration: 38,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(titleShakeX, {
            toValue: 11,
            duration: 38,
            useNativeDriver: true,
          }),
          Animated.timing(titleShakeX, {
            toValue: -7,
            duration: 35,
            useNativeDriver: true,
          }),
          Animated.timing(titleShakeX, {
            toValue: 7,
            duration: 35,
            useNativeDriver: true,
          }),
          Animated.timing(titleShakeX, {
            toValue: -3,
            duration: 32,
            useNativeDriver: true,
          }),
          Animated.timing(titleShakeX, {
            toValue: 0,
            duration: 32,
            useNativeDriver: true,
          }),
        ]),
        // Impact flash
        Animated.sequence([
          Animated.delay(35),
          Animated.timing(impactFlash, {
            toValue: 1,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(impactFlash, {
            toValue: 0,
            duration: 310,
            useNativeDriver: true,
          }),
        ]),
        // Shockwave ring 1
        Animated.sequence([
          Animated.delay(25),
          Animated.parallel([
            Animated.timing(shockwaveScale, {
              toValue: 2.8,
              duration: 530,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(shockwaveOpacity, {
                toValue: 0.9,
                duration: 38,
                useNativeDriver: true,
              }),
              Animated.timing(shockwaveOpacity, {
                toValue: 0,
                duration: 460,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]),
        // Shockwave ring 2 (slightly delayed, smaller)
        Animated.sequence([
          Animated.delay(80),
          Animated.parallel([
            Animated.timing(shockwaveScale2, {
              toValue: 2.4,
              duration: 490,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(shockwaveOpacity2, {
                toValue: 0.7,
                duration: 38,
                useNativeDriver: true,
              }),
              Animated.timing(shockwaveOpacity2, {
                toValue: 0,
                duration: 420,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]),
      ]),
    ]);
    setTimeout(() => void AudioManager.playRevealTitleSplash(), 1000);
    entryAnimRef.current.start(() => {
      if (isContinuingRef.current) return;
      // Stop the pre-reveal suspense bg, then play the outcome sting
      void AudioManager.stopBackground();
      if (impostorWon) {
        void AudioManager.playImposterWinSound();
      } else {
        void AudioManager.playImposterLossSound();
      }
      setHideAnimatedTitle(true);
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      revealCtaTimeoutRef.current = setTimeout(() => {
        if (isContinuingRef.current) return;
        revealCTA();
      }, 2000);
    });
  }, [characterLoaded]);

  const revealCTA = () => {
    if (hasRevealedCTA.current) return;
    hasRevealedCTA.current = true;
    setShowCTA(true);

    // Бутонът – остава както е (той ти харесва)
    ctaAnimRef.current = Animated.parallel([
      Animated.timing(buttonTranslateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),

      // QuestionPlate – прост, естествен motion
      Animated.sequence([
        // леко повдигане
        Animated.timing(plateTranslateY, {
          toValue: 0,
          duration: 60,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Animated.timing(plateTranslateY, {
        //   toValue: -64,
        //   duration: 120,
        //   easing: Easing.out(Easing.cubic),
        //   useNativeDriver: true,
        // }),
        // Animated.timing(plateTranslateY, {
        //   toValue: 0, // 🎯 финал
        //   duration: 120,
        //   easing: Easing.out(Easing.cubic),
        //   useNativeDriver: true,
        // }),
        Animated.timing(plateTranslateY, {
          toValue: -48,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        // връщане към финалната позиция
        Animated.timing(plateTranslateY, {
          toValue: -24, // 🎯 финал
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        // микродвижение за живот
        Animated.timing(plateTranslateY, {
          toValue: -32,
          duration: 80,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.timing(plateTranslateY, {
          toValue: -24,
          duration: 80,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);
    ctaAnimRef.current.start(() => {
      if (isContinuingRef.current) return;
      // -- Title fade-out + quote sequence commented out for now --
      // if (hideTitleTimeoutRef.current) {
      //   clearTimeout(hideTitleTimeoutRef.current);
      // }
      // hideTitleTimeoutRef.current = setTimeout(() => {
      //   if (isContinuingRef.current) return;
      //   titleFadeAnimRef.current = Animated.timing(titleOpacity, {
      //     toValue: 0,
      //     duration: 280,
      //     easing: Easing.out(Easing.cubic),
      //     useNativeDriver: true,
      //   });
      //   titleFadeAnimRef.current.start();
      //   runRevealQuoteSequence();
      // }, 300);
    });
  };

  // -- QUOTE FUNCTIONS (commented out for now) --
  // const cleanupQuoteTyping = () => {
  //   if (typeIntervalRef.current) {
  //     clearInterval(typeIntervalRef.current);
  //     typeIntervalRef.current = null;
  //   }
  // };

  // const typeQuote = (text: string, onDone?: () => void) => {
  //   cleanupQuoteTyping();
  //   void AudioManager.duckBackground(0.12);
  //   void AudioManager.startKeyboardLoop();
  //   setQuoteTyped("");
  //   let i = 0;
  //   typeIntervalRef.current = setInterval(() => {
  //     i += 1;
  //     setQuoteTyped(text.slice(0, i));
  //     if (i >= text.length) {
  //       cleanupQuoteTyping();
  //       void AudioManager.stopKeyboardLoop();
  //       void AudioManager.restoreBackground(0.35);
  //       onDone?.();
  //     }
  //   }, 38);
  // };

  // const runRevealQuoteSequence = () => {
  //   setShowQuoteBubble(true);
  //   quoteOpacity.setValue(0);
  //   quoteTranslateY.setValue(-28);
  //   quoteScale.setValue(1);
  //   quoteIntroAnimRef.current = Animated.parallel([
  //     Animated.timing(quoteOpacity, {
  //       toValue: 1,
  //       duration: 160,
  //       easing: Easing.out(Easing.quad),
  //       useNativeDriver: true,
  //     }),
  //     Animated.timing(quoteTranslateY, {
  //       toValue: 0,
  //       duration: 220,
  //       easing: Easing.out(Easing.cubic),
  //       useNativeDriver: true,
  //     }),
  //   ]);
  //   quoteIntroAnimRef.current.start(() => {
  //     if (isContinuingRef.current) return;
  //     typeQuote(revealQuoteText, () => {
  //       // void AudioManager.playHeroPickerEnd();
  //     });
  //   });
  // };

  useEffect(() => {
    return () => {
      stopRevealAnimations();
    };
  }, []);

  /* -------------------------------------------------------------------------- */
  /* DATA */
  /* -------------------------------------------------------------------------- */

  const imposter = useMemo(
    () => players.find((p) => p.id === oddOneId),
    [players, oddOneId]
  );

  const imposterCharacter = imposter
    ? heroes.find((h) => h.id === imposter.characterId)
    : undefined;

  const imposterQuestion = useMemo(
    () => gameQuestions.find((q) => q.id === currentOddQuestionId),
    [currentOddQuestionId, gameQuestions]
  );

  const imposterQuestionDisplayText = useMemo(() => {
    if (!imposterQuestion?.text) return "";
    return formatQuestionWithName(imposterQuestion.text, {
      isImpostor: true,
      substituteName: impostorNameSubstitute,
      yourLabel: questionNameTarget ?? t("question_name_your"),
    });
  }, [imposterQuestion?.text, impostorNameSubstitute, questionNameTarget, t]);

  const { topTargets, maxVotes } = useMemo(() => {
    const tally: Record<string, number> = {};
    Object.values(votes).forEach((targetId) => {
      tally[targetId] = (tally[targetId] || 0) + 1;
    });

    const max = Math.max(0, ...Object.values(tally));
    const top = Object.entries(tally)
      .filter(([, v]) => v === max && max > 0)
      .map(([id]) => players.find((p) => p.id === id))
      .filter(Boolean) as Player[];

    return { topTargets: top, maxVotes: max };
  }, [votes, players]);

  const votedWinner =
    maxVotes > 0 && topTargets.length === 1 ? topTargets[0] : null;

  const impostorLost =
    votedWinner && imposter && votedWinner.id === imposter.id;

  // Total *eligible* voters = all players except the impostor.
  // This makes "COOKED" mean everyone (all non-impostors) voted for the impostor.
  const totalEligibleVoters = players.length > 0 ? players.length - 1 : 0;
  const votesForImpostor = Object.values(votes).filter(
    (targetId) => targetId === oddOneId
  ).length;
  const impostorWon = !impostorLost;

  const revealVariant: WinVariant | LoseVariant = getRevealVariant(
    votesForImpostor,
    totalEligibleVoters,
    impostorWon
  );

  /** Same for every device in the round (no per-client random title art). */
  const revealVisualSeed = useMemo(
    () =>
      `${gameId ?? "local"}_${round ?? 0}_${oddOneId}_${revealVariant}_${
        impostorWon ? "w" : "l"
      }`,
    [gameId, round, oddOneId, revealVariant, impostorWon]
  );

  // const revealQuoteText = useMemo( // commented out for now
  //   () => t(getRevealQuoteI18nKey(impostorWon, revealVariant)),
  //   [t, impostorWon, revealVariant]
  // );

  /* -------------------------------------------------------------------------- */
  /* ASSETS */
  /* -------------------------------------------------------------------------- */

  const backgroundImage = impostorLost
    ? (isTablet ? backgrounds.bg030t : backgrounds.bg030)
    : (isTablet ? backgrounds.bg029t : backgrounds.bg029);

  const titleImage: ImageSourcePropType = useMemo(() => {
    const seed = `${revealVisualSeed}-title`;
    if (impostorWon) {
      const winVariant = revealVariant as WinVariant;
      switch (winVariant) {
        case "PERFECT_BLUFF": {
          const urls = [
            "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/698b6249-2c84-4de1-80a7-1d040a7cab15-captain.webp",
            "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/3098328b-e20e-48bd-8fdb-90818f71290e-knocks.webp",
            "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/15a91088-0b9d-414c-ac73-c7ef77c60d13-flawless.webp",
          ];
          return { uri: urls[deterministicPickIndex(seed, urls.length)] };
        }
        case "BARELY_SOLD_IT": {
          const urls = [
            "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/0e944d74-3c4d-4145-be57-852da2d8f6e7-lucky.webp",
            "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/ecfaa1ec-2d85-4d22-a835-98382a6bb39a-minute.webp",
          ];
          return { uri: urls[deterministicPickIndex(seed, urls.length)] };
        }
        case "NORMAL":
        default: {
          const urls = [
            "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/0896451f-3ad4-403f-943d-ae9e973f5b3f-gg.webp",
            "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/8a423802-d7a2-45b1-8f83-d32e1603274a-winner.webp",
          ];
          return { uri: urls[deterministicPickIndex(seed, urls.length)] };
        }
      }
    }

    const loseVariant = revealVariant as LoseVariant;
    switch (loseVariant) {
      case "COOKED": {
        const urls = [
          "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/67314e35-f3f5-422f-b722-74ee78dfc829-soweak.webp",
          "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/8da5ee85-aaa0-4db9-ae2f-a9fb975beb4c-smallpp.webp",
        ];
        return { uri: urls[deterministicPickIndex(seed, urls.length)] };
      }
      case "NEARLY_THERE":
        return {
          uri: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/4e14f65c-3931-4b6a-a5a8-ca45e1783cef-tough.webp",
        };
      case "NORMAL":
      default: {
        const urls = [
          "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/28db9184-2ddf-4784-95d7-c60dbd049cf9-inevitable.webp",
          "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/3d363964-d229-4eb9-bc84-a1e926192071-defeat.webp",
        ];
        return { uri: urls[deterministicPickIndex(seed, urls.length)] };
      }
    }
  }, [impostorWon, revealVariant, revealVisualSeed]);

  const questionFrameImage = impostorLost
    ? backgrounds.bg016
    : backgrounds.bg005;

  // const characterImage = impostorLost
  //   ? imposterCharacter?.lostImage
  //   : imposterCharacter?.wonImage;

  const characterImageSource = useMemo(() => {
    if (!imposterCharacter) return null;

    const byVariant = impostorWon
      ? imposterCharacter.winImagesByVariant
      : imposterCharacter.loseImagesByVariant;
    const flatImages = impostorWon
      ? imposterCharacter.winImages
      : imposterCharacter.loseImages;

    const variantKey = revealVariant as string;

    const variantList =
      (byVariant && (byVariant[variantKey] || byVariant.NORMAL)) || undefined;

    const pool: ImageSourcePropType[] =
      (variantList && variantList.length > 0 && variantList) ||
      (flatImages && flatImages.length > 0 && flatImages) ||
      (imposterCharacter.main_image
        ? [imposterCharacter.main_image]
        : heroes
            .map((h) => h.main_image)
            .filter((img): img is ImageSourcePropType => Boolean(img)));

    if (!pool || pool.length === 0) return null;

    const idx = deterministicPickIndex(`${revealVisualSeed}-char`, pool.length);
    return pool[idx];
  }, [heroes, imposterCharacter, impostorWon, revealVariant, revealVisualSeed]);

  /* -------------------------------------------------------------------------- */
  /* ACTION */
  /* -------------------------------------------------------------------------- */

  const handleContinue = async () => {
    isContinuingRef.current = true;
    stopRevealAnimations();

    if (gameId && currentRoundId && shouldTrackLifecycle) {
      try {
        await trackRoundEndedMutation.mutateAsync({
          gameId,
          roundId: currentRoundId,
          mode,
          roundIndex: (round || 0) + 1,
          userId,
        });
      } catch (e) {
        console.warn("track ROUND_ENDED failed", e);
      }
    }

    navigation.navigate("LivesReveal");
  };

  if (!imposter || !imposterCharacter) return null;

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgroundImage}
        style={styles.bg}
        resizeMode="cover"
      >
        <BlurView
          intensity={15}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <RevealAmbienceOverlay variant={impostorWon ? "win" : "lose"} />

        {/* TOP TITLE */}
        {/* <View style={styles.topTitleWrap}>
          <Image
            source={titleImage}
            resizeMode="contain"
            style={styles.topTitleImage}
          />
        </View> */}

        {/* -- QUOTE BUBBLE (commented out for now) --
        {showQuoteBubble && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.quoteOverlay,
              {
                opacity: quoteOpacity,
                transform: [
                  { translateY: quoteTranslateY },
                  { scale: quoteScale },
                ],
              },
            ]}
          >
            <View style={[styles.quoteBubble, styles.quoteBubbleShadow]}>
              <CustomText
                variant="quote"
                className="text-center"
                textColor="text-customBlack-500"
              >
                {quoteTyped}
              </CustomText>

              <View style={styles.quoteBubbleTailWrap}>
                <View style={styles.quoteBubbleTail} />
              </View>
            </View>
          </Animated.View>
        )}
        */}
        <Animated.View
          style={[
            styles.topTitleWrap,
            {
              zIndex: 10,
              opacity: titleOpacity,
            },
          ]}
        >
          <AppImage
            source={titleImage}
            contentFit="contain"
            style={styles.topTitleImage}
          />
        </Animated.View>

        {/* Dark backdrop — fades in during fly-in, out on slam */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              zIndex: 995,
              opacity: blurOverlayOpacity,
              backgroundColor: "rgba(0,0,0,0.58)",
            },
          ]}
        />

        {/* Shockwave ring 1 */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            zIndex: 996,
            top: TOP_TITLE_MARGIN_TOP,
            left: 0,
            right: 0,
            height: TOP_TITLE_HEIGHT,
            alignItems: "center",
            justifyContent: "center",
            opacity: shockwaveOpacity,
            transform: [{ scale: shockwaveScale }],
          }}
        >
          <View
            style={{
              width: "88%",
              height: TOP_TITLE_HEIGHT * 0.82,
              borderRadius: TOP_TITLE_HEIGHT * 0.38,
              borderWidth: 3,
              borderColor: impostorWon
                ? "rgba(255,230,80,1)"
                : "rgba(255,90,20,1)",
            }}
          />
        </Animated.View>

        {/* Shockwave ring 2 */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            zIndex: 996,
            top: TOP_TITLE_MARGIN_TOP,
            left: 0,
            right: 0,
            height: TOP_TITLE_HEIGHT,
            alignItems: "center",
            justifyContent: "center",
            opacity: shockwaveOpacity2,
            transform: [{ scale: shockwaveScale2 }],
          }}
        >
          <View
            style={{
              width: "88%",
              height: TOP_TITLE_HEIGHT * 0.82,
              borderRadius: TOP_TITLE_HEIGHT * 0.38,
              borderWidth: 2,
              borderColor: impostorWon
                ? "rgba(255,200,50,1)"
                : "rgba(255,50,10,1)",
            }}
          />
        </Animated.View>

        {/* Impact flash */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              zIndex: 997,
              opacity: impactFlash,
              backgroundColor: impostorWon
                ? "rgba(255,240,160,0.55)"
                : "rgba(255,60,5,0.38)",
            },
          ]}
        />

        {!hideAnimatedTitle && (
          <Animated.View
            style={[
              styles.topTitleWrap2,
              {
                zIndex: 999,
                transform: [
                  { translateX: titleShakeX },
                  { translateY: animatedTitleTranslateY },
                  { scale: animatedTitleScale },
                  {
                    rotate: animatedTitleRotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["-900deg", "0deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            <AppImage
              source={titleImage}
              contentFit="contain"
              style={styles.topTitleImage2}
            />
          </Animated.View>
        )}

        {/* <View style={styles.topTitleWrap2}>
          <Image
            source={titleImage}
            resizeMode="contain"
            style={styles.topTitleImage2}
          />
        </View> */}

        {/* CHARACTER IMAGE */}
        <View style={styles.characterWrap}>
          {characterImageSource && (
            <AppImage
              source={characterImageSource}
              contentFit="contain"
              style={styles.characterImage}
              onLoadEnd={() => setCharacterLoaded(true)}
            />
          )}
        </View>

        {/* QUESTION FRAME */}
        <View style={styles.questionWrap}>
          <View style={[{ paddingHorizontal: 40, width: "100%" }, isTablet && styles.tabletContentWrap]}>
            <Animated.View
              style={{
                transform: [{ translateY: plateTranslateY }],
              }}
            >
              <QuestionPlate
                title={t("reveal_plate_title", { name: imposter.name })}
                text={imposterQuestionDisplayText}
                background={questionFrameImage}
                mode={impostorLost ? "dark" : "light"}
                textVariant="h5-headline"
                textColorOverride={impostorLost ? "#fff" : "#000"}
              />
            </Animated.View>

            {showCTA && (
              <Animated.View
                style={{
                  opacity: buttonOpacity,
                  transform: [{ translateY: buttonTranslateY }],
                  width: "100%",
                }}
              >
                <CustomButton
                  title={t("continue_btn")}
                  btnSize="md"
                  fontSize="md"
                  fullWidth
                  backgroundImage={
                    impostorLost ? backgrounds.bg003 : backgrounds.bg026
                  }
                  shadowColor={impostorLost ? "#771717" : "#005f07"}
                  onPress={handleContinue}
                />
              </Animated.View>
            )}
          </View>
        </View>

        {/* CTA */}
        {/* <View style={styles.ctaWrap}>
          <CustomButton title="Continue" fullWidth onPress={handleContinue} />
        </View> */}
      </ImageBackground>
    </SafeAreaView>
  );
};

export default RevealScreen;

/* -------------------------------------------------------------------------- */
/* STYLES */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    justifyContent: "space-between",
  },
  tabletContentWrap: {
    maxWidth: 560,
    alignSelf: "center",
    width: "100%",
  },

  topTitleWrap: {
    marginTop: 40,
    alignItems: "center",
    zIndex: 1,
  },
  topTitleImage: {
    width: "100%",
    height: 240,
  },
  topTitleWrap2: {
    position: "absolute",
    top: "0%",
    left: "0%",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  topTitleImage2: {
    width: "100%",
    height: 240,
  },

  characterWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: "0%",
    left: "0%",
    width: "100%",
    height: "100%",
    // transform: [{ translateX: -200 }, { translateY: -280 }],
  },
  characterImage: {
    width: "85%",
    height: "85%",
  },

  questionWrap: {
    alignItems: "center",
    marginBottom: 24,
  },
  questionFrame: {
    width: "100%",
    height: 320,
  },
  questionTextOverlay: {
    position: "absolute",
    top: 64,
    left: 32,
    right: 32,
    bottom: 24,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  ctaWrap: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },

  // -- QUOTE STYLES (commented out for now) --
  // quoteBubble: {
  //   backgroundColor: "#FFFFFF",
  //   borderRadius: 22,
  //   paddingVertical: 18,
  //   paddingHorizontal: 22,
  //   minWidth: "92%",
  //   maxWidth: "92%",
  //   alignSelf: "center",
  //   marginTop: 48,
  //   zIndex: 1,
  // },
  // quoteOverlay: {
  //   position: "absolute",
  //   top: 24,
  //   left: 0,
  //   right: 0,
  //   zIndex: 11,
  // },
  // quoteBubbleShadow: {
  //   shadowColor: "#000",
  //   shadowOpacity: 0.18,
  //   shadowRadius: 16,
  //   shadowOffset: { width: 0, height: 8 },
  //   elevation: 8,
  // },
  // quoteBubbleTailWrap: {
  //   position: "absolute",
  //   bottom: -14,
  //   left: "50%",
  //   transform: [{ translateX: -12 }],
  // },
  // quoteBubbleTail: {
  //   width: 0,
  //   height: 0,
  //   borderLeftWidth: 12,
  //   borderRightWidth: 12,
  //   borderTopWidth: 14,
  //   borderLeftColor: "transparent",
  //   borderRightColor: "transparent",
  //   borderTopColor: "#FFFFFF",
  // },
});
