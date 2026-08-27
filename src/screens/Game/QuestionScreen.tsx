// src/screens/Game/QuestionScreen.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ImageBackground,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  useWindowDimensions,
} from "react-native";
import AppImage from "../../components/AppImage";
import { LinearGradient } from "expo-linear-gradient";
import FullBleedStack from "../../components/FullBleedStack";
import ImageBackgroundWithLoadGate from "../../components/ImageBackgroundWithLoadGate";
import { ScrollView } from "react-native-gesture-handler";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { backgrounds } from "../../../assets/backgrounds";
import CustomText from "../../components/common/CustomText";
import CustomButton from "../../components/common/CustomButton";
// import RateFloatMenu from "../../components/RateFloatMenu";
import RatingSlider from "../../components/RatingSlider";
import CustomInput from "../../components/common/CustomInput";

import { Player, useGameStore } from "../../store/useGameStore";
import { IQuestion } from "../../types/question";
import { GameStackParamList } from "../../navigation/types";
import AudioManager from "../../utils/audioManager";
import { useHeroesStore } from "../../store/useHeroesStore";
import { usePreventBack } from "../../hooks/usePreventBack";

import { useMultiplayerPhaseGate } from "../../hooks/useMultiplayerPhaseGate";
import { useTranslation } from "react-i18next";
import { formatQuestionWithName } from "../../utils/formatQuestionText";
import { GameMode } from "../../api/analytics";
import { sendPlayerReady } from "../../api/multiplayerSync";
import { sendMultiplayerRelay } from "../../api/multiplayerRelay";
import {
  ANSWER_CAST_MESSAGE_TYPE,
  mpPhaseAnswers,
} from "../../constants/onlineLobby";
import OnlineWaitPlayersOverlay from "../../components/online/OnlineWaitPlayersOverlay";
import { reportMultiplayerDiagnostic } from "../../utils/multiplayerDiagnostics";

type Nav = StackNavigationProp<GameStackParamList, "Question">;
type R = RouteProp<GameStackParamList, "Question">;

const OPEN_INPUT_MAX_LEN = 12;
const RATE_GROUP_ID = "rate";

/* -------------------------------------------------------------------------- */
/* Avatar Pick Button (LOCAL, GAME-SPECIFIC) */
/* -------------------------------------------------------------------------- */


/* -------------------------------------------------------------------------- */

const QuestionScreen = () => {
  const { t } = useTranslation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth >= 768 && windowWidth > windowHeight;
  const numCols = isTablet ? 3 : 2;
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const navigation = useNavigation<Nav>();
  usePreventBack();
  const { playerIndex } = useRoute<R>().params;

  /** Pick row: `px-6` + `cell` horizontal padding — avatar + label scale to fit. */

  /** Scales with screen; slot position uses % of hero so layout stays aligned on all sizes. */
  const numberFieldFontSize = useMemo(
    () => Math.round(Math.min(40, Math.max(22, windowWidth * 0.085))),
    [windowWidth],
  );

  const completedRounds = useGameStore((s) => s.round);
  const activeRoundNumber = (completedRounds ?? 0) + 1;
  const mode = useGameStore((s) => s.mode) as GameMode;
  const onlineIsHost = useGameStore((s) => s.onlineIsHost);
  const onlinePlayerId = useGameStore((s) => s.onlinePlayerId);
  const lives = useGameStore((s) => s.lives);
  const players = useGameStore((s) => s.players);
  const heroes = useHeroesStore((s) => s.heroes);
  const oddOneId = useGameStore((s) => s.oddOneId);
  const baseQuestionId = useGameStore((s) => s.currentBaseQuestionId);
  const oddQuestionId = useGameStore((s) => s.currentOddQuestionId);
  const questionNameTarget = useGameStore((s) => s.questionNameTarget);
  const impostorNameSubstitute = useGameStore((s) => s.impostorNameSubstitute);
  const gameQuestions = useGameStore((s) => s.gameQuestions);
  const setAnswer = useGameStore((s) => s.setAnswer);
  const plateScale = useRef(new Animated.Value(40)).current;
  const plateOpacity = useRef(new Animated.Value(0)).current;
  const screenShake = useRef(new Animated.Value(0)).current;
  const numberInputScale = useRef(new Animated.Value(0.8)).current;
  const numberInputOpacity = useRef(new Animated.Value(0)).current;

  const currentPlayer = players[playerIndex];

  const [numberAnswer, setNumberAnswer] = useState("");
  const [openAnswer, setOpenAnswer] = useState("");
  const [selectedPickId, setSelectedPickId] = useState<string | null>(null);

  const numberInputRef = useRef<any>(null);
  const openInputRef = useRef<TextInput>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [rateSliderValue, setRateSliderValue] = useState(1);
  const sliderGestureRef = useRef(null);
  const numberHeroScale = useRef(new Animated.Value(1)).current;
  const [waitingAnswersSync, setWaitingAnswersSync] = useState(false);
  const answerSubmittedRef = useRef(false);

  /** Answer display font size — large base, shrinks for longer text. iOS uses adjustsFontSizeToFit. */
  const openAnswerDisplayFontSize = useMemo(() => {
    if (Platform.OS === "ios") return 48;
    const len = openAnswer.length || 1;
    return Math.max(22, Math.round(52 - len * 2.5));
  }, [openAnswer]);

  const answersPhase = mpPhaseAnswers(activeRoundNumber);

  const isEliminatedSpectator =
    mode === "ONLINE" &&
    onlinePlayerId != null &&
    lives[onlinePlayerId] != null &&
    lives[onlinePlayerId] <= 0;

  const waitingForHostRound =
    mode === "ONLINE" &&
    !onlineIsHost &&
    (!baseQuestionId || !oddQuestionId || !oddOneId);

  useEffect(() => {
    if (waitingForHostRound || isEliminatedSpectator) return;
    void AudioManager.playBackgroundGame();
    return () => {
      void AudioManager.stopTensionLoop();
    };
  }, [waitingForHostRound, isEliminatedSpectator]);

  const specAnswerReadyRef = useRef(false);
  useEffect(() => {
    specAnswerReadyRef.current = false;
  }, [answersPhase]);

  useEffect(() => {
    if (!isEliminatedSpectator || specAnswerReadyRef.current) return;
    specAnswerReadyRef.current = true;
    setWaitingAnswersSync(true);
    sendPlayerReady(answersPhase);
    reportMultiplayerDiagnostic("answer_auto_ready_spectator", {
      onlinePlayerId: onlinePlayerId ?? null,
      answersPhase,
    });
  }, [answersPhase, isEliminatedSpectator, onlinePlayerId]);

  useMultiplayerPhaseGate({
    enabled: mode === "ONLINE" && waitingAnswersSync,
    phase: answersPhase,
    onReady: () => {
      setWaitingAnswersSync(false);
      navigation.navigate("Results");
    },
  });

  // no extra rate animations – keep rate UX simple

  const playerRows = useMemo<Player[][]>(() => {
    const rows: Player[][] = [];
    for (let i = 0; i < players.length; i += numCols) {
      rows.push(players.slice(i, i + numCols));
    }
    return rows;
  }, [players, numCols]);

  const question: IQuestion | null = useMemo(() => {
    if (
      !currentPlayer ||
      !baseQuestionId ||
      !oddQuestionId ||
      !gameQuestions.length
    )
      return null;

    const isOdd = currentPlayer.id === oddOneId;
    const targetId = isOdd ? oddQuestionId : baseQuestionId;

    return gameQuestions.find((q) => q.id === targetId) ?? null;
  }, [currentPlayer, baseQuestionId, oddQuestionId, oddOneId, gameQuestions]);

  const isRate =
    question?.type === "rate" ||
    (question?.type === "number" &&
      (question.relatedGroupIds ?? []).some(
        (g) => g.trim().toLowerCase() === RATE_GROUP_ID,
      ));
  const isNumber = question?.type === "number" && !isRate;
  const isInput = question?.type === "input";
  const isPick = question?.type === "pick";

  useEffect(() => {
    const show =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hide =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const subShow = Keyboard.addListener(show, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const subHide = Keyboard.addListener(hide, () => {
      setKeyboardHeight(0);
    });
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  const scrollAnswerIntoView = useCallback(() => {
    const delay = Platform.OS === "ios" ? 120 : 320;
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, delay);
    });
  }, []);

  React.useEffect(() => {
    // Splash sound fires in sync with the plate flying in
    void AudioManager.playRevealTitleSplash();
    Animated.sequence([
      Animated.parallel([
        Animated.timing(plateScale, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(3)),
          useNativeDriver: true,
        }),
        Animated.timing(plateOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),

      Animated.sequence([
        Animated.timing(screenShake, {
          toValue: 1,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(screenShake, {
          toValue: -1,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(screenShake, {
          toValue: 1,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(screenShake, {
          toValue: 0,
          duration: 60,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  React.useEffect(() => {
    if (!isNumber && !isInput) return;

    numberInputScale.setValue(0.8);
    numberInputOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(numberInputScale, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.back(2.5)),
        useNativeDriver: true,
      }),
      Animated.timing(numberInputOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isNumber, isInput, numberInputOpacity, numberInputScale]);

  if (!currentPlayer) return null;

  if (waitingForHostRound) {
    return (
      <SafeAreaView
        className="flex-1 bg-primary-700 justify-center items-center"
        edges={["right", "left"]}
      >
        <ActivityIndicator size="large" color="#ffffff" />
      </SafeAreaView>
    );
  }

  if (isEliminatedSpectator) {
    return (
      <SafeAreaView className="flex-1 bg-primary-700" edges={["right", "left"]}>
        <OnlineWaitPlayersOverlay visible={waitingAnswersSync} />
      </SafeAreaView>
    );
  }

  if (!question) return null;

  const questionDisplayText = formatQuestionWithName(question.text, {
    isImpostor: currentPlayer.id === oddOneId,
    substituteName: impostorNameSubstitute,
    yourLabel: questionNameTarget ?? t("question_name_your"),
  });

  const goToNextStep = () => {
    if (mode === "ONLINE") {
      setWaitingAnswersSync(true);
      sendPlayerReady(answersPhase);
      return;
    }
    const isLast = playerIndex >= players.length - 1;

    if (!isLast) {
      navigation.navigate("PassDeviceGameplay", {
        playerIndex: playerIndex + 1,
      });
    } else {
      navigation.navigate("Results");
    }
  };

  const submitAnswerAndAdvance = (raw: string) => {
    const value = raw.trim().slice(0, 500);
    if (!value) return;
    if (answerSubmittedRef.current) return;
    answerSubmittedRef.current = true;
    setAnswer(currentPlayer.id, value);
    if (mode === "ONLINE") {
      sendMultiplayerRelay({
        type: ANSWER_CAST_MESSAGE_TYPE,
        answer: value,
      });
    }
    goToNextStep();
  };

  const handleSubmitNumber = () => {
    if (!numberAnswer.trim()) return;
    submitAnswerAndAdvance(numberAnswer);
  };

  const handleSubmitOpen = () => {
    const text = openAnswer.trim();
    if (!text) return;
    submitAnswerAndAdvance(text);
  };

  const handleAnswerAreaPress = () => {
    if (keyboardHeight > 0 || isInputFocused) {
      Keyboard.dismiss();
    } else {
      openInputRef.current?.focus();
    }
  };

  const handleNumberChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, "").slice(0, 4);
    setNumberAnswer(digitsOnly);

    if (!digitsOnly) return;

    Animated.sequence([
      Animated.timing(numberInputScale, {
        toValue: 1.04,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(numberInputScale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleRateSelect = (value: number) => {
    submitAnswerAndAdvance(String(value));
  };

  const handlePickPlayer = (pickedId: string) => {
    setSelectedPickId(pickedId);
  };

  const confirmPickPlayer = () => {
    if (!selectedPickId) return;
    submitAnswerAndAdvance(selectedPickId);
  };

  const getRateImage = ():
    | import("react-native").ImageSourcePropType
    | null => {
    const vanessa = heroes.find(
      (h) =>
        h.slug?.toLowerCase().replace(/-/g, "_") === "silent_vanessa" ||
        h.slug?.toLowerCase().includes("vanessa"),
    );
    if (!currentPlayer?.characterId) return vanessa?.rateImage ?? null;
    const hero = heroes.find((h) => h.id === currentPlayer.characterId);
    return hero?.rateImage ?? vanessa?.rateImage ?? null;
  };

  const needsKeyboardLift = keyboardHeight > 0 && isInput;
  /** Android: KAV + window resize often fail with edge-to-edge; reserve bottom inset explicitly. */
  const androidKeyboardPad =
    Platform.OS === "android" && needsKeyboardLift
      ? keyboardHeight + insets.bottom
      : 0;
  const iosKeyboardScrollPad =
    Platform.OS === "ios" && needsKeyboardLift
      ? Math.min(keyboardHeight, 120)
      : 0;

  return (
    <FullBleedStack
      rootStyle={{ flex: 1, backgroundColor: "#0a0a0a" }}
      backdrop={
        <ImageBackgroundWithLoadGate
          source={{ uri: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/812ae730-ae76-4e68-8dbe-817eef639d60-question-test-bg.webp" }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      }
    >
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: "transparent" }}
        edges={["right", "left"]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          enabled={isInput}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        >
          <View
            style={[
              styles.keyboardAvoiding,
              androidKeyboardPad > 0 && {
                paddingBottom: androidKeyboardPad,
              },
            ]}
          >
            <ScrollView
              ref={scrollRef}
              style={styles.questionScroll}
              nestedScrollEnabled
              waitFor={isRate ? [sliderGestureRef] : undefined}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{
                paddingTop: 96,
                paddingBottom:
                  (isNumber || isInput || isRate ? 32 : 140) +
                  iosKeyboardScrollPad,
                flexGrow: 1,
                justifyContent: "space-between",
              }}
            >
          <Animated.View
            style={[
              {
                transform: [
                  {
                    translateX: screenShake.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-8, 8],
                    }),
                  },
                ],
              },
              isTablet && { maxWidth: 560, alignSelf: "center", width: "100%" },
            ]}
          >
            <View style={{ paddingHorizontal: 24 }}>
              <Animated.View
                style={[
                  styles.namePlateShadow,
                  {
                    opacity: plateOpacity,
                    transform: [{ scale: plateScale }],
                  },
                ]}
              >
                <ImageBackground
                  source={backgrounds.bg005}
                  resizeMode="stretch"
                  imageStyle={{ borderRadius: 18 }}
                  style={styles.namePlate}
                >
                  {/* <LinearGradient
                  colors={["#FFF7EC", "#F3E1C8"]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFill}
                /> */}

                  {/* CONTENT */}
                  <CustomText
                    variant="p"
                    className="text-center"
                    textColor="#762a05"
                    sizeDelta={2}
                    style={{ fontFamily: "Tektur-SemiBold" }}
                  >
                    {t("question_round", { round: activeRoundNumber })}
                  </CustomText>

                  <View style={styles.nameDivider} />

                  <CustomText
                    variant="h5"
                    className="text-center"
                    textColor="#592410"
                    allowWrap
                    sizeDelta={10}
                    style={{ fontFamily: "SofiaSansExtraCondensed-SemiBold" }}
                  >
                    {questionDisplayText}
                  </CustomText>

                  <View style={styles.nameDivider} />

                  <CustomText
                    variant="p-small"
                    className="text-center"
                    textColor="#762a05"
                    sizeDelta={2}
                    style={{ fontFamily: "Onest-SemiBold" }}
                  >
                    {isPick && t("question_hint_pick")}
                    {isRate && t("question_hint_rate")}
                    {isNumber && t("question_hint_number")}
                    {isInput && t("question_hint_input")}
                  </CustomText>

                  {/* ── Embedded answer area (input type only) ─────────────── */}
                  {isInput && (
                    <>
                      <View style={[styles.nameDivider, { marginTop: 12 }]} />
                      <Pressable
                        onPress={handleAnswerAreaPress}
                        style={styles.openEmbedPressable}
                      >
                        {/* Hidden TextInput — keyboard target */}
                        <TextInput
                          ref={openInputRef}
                          value={openAnswer}
                          onChangeText={(v) =>
                            setOpenAnswer(v.slice(0, OPEN_INPUT_MAX_LEN))
                          }
                          onFocus={() => {
                            setIsInputFocused(true);
                            scrollAnswerIntoView();
                          }}
                          onBlur={() => setIsInputFocused(false)}
                          maxLength={OPEN_INPUT_MAX_LEN}
                          autoCapitalize="characters"
                          autoCorrect={false}
                          spellCheck={false}
                          caretHidden
                          style={styles.openEmbedHiddenInput}
                        />

                        {/* Visible display */}
                        <View
                          style={styles.openEmbedDisplay}
                          pointerEvents="none"
                        >
                          {openAnswer.length === 0 ? (
                            <View style={styles.openEmbedPlaceholderRow}>
                              <Text style={styles.openEmbedSparkle}>✦</Text>
                              <Text
                                numberOfLines={1}
                                adjustsFontSizeToFit={Platform.OS === "ios"}
                                minimumFontScale={0.3}
                                style={[
                                  styles.openEmbedAnswerText,
                                  {
                                    fontSize: openAnswerDisplayFontSize,
                                    color: isInputFocused
                                      ? "rgba(89,36,16,0.65)"
                                      : "rgba(89,36,16,0.4)",
                                    flex: 1,
                                  },
                                ]}
                              >
                                {t("question_open_placeholder")}
                                {isInputFocused ? "|" : ""}
                              </Text>
                              <Text style={styles.openEmbedSparkle}>✦</Text>
                            </View>
                          ) : (
                            <Text
                              numberOfLines={1}
                              adjustsFontSizeToFit={Platform.OS === "ios"}
                              minimumFontScale={0.3}
                              style={[
                                styles.openEmbedAnswerText,
                                { fontSize: openAnswerDisplayFontSize },
                              ]}
                            >
                              {openAnswer.toUpperCase()}
                            </Text>
                          )}
                        </View>
                      </Pressable>
                      <View style={styles.openEmbedDividerBottom} />
                    </>
                  )}
                </ImageBackground>
              </Animated.View>
            </View>
            {/* CONTENT */}
            {isPick && (
              <View
                className="px-6"
                style={{ marginTop: 64 }}
              >
                {playerRows.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} style={styles.row}>
                    {row.map((player) => {
                      const characterData = heroes.find(
                        (h) => h.id === player.characterId,
                      );
                      const isSelected = selectedPickId === player.id;
                      const isDimmed = !!selectedPickId && !isSelected;
                      return (
                        <View
                          key={player.id}
                          style={[
                            styles.cell,
                            isTablet && styles.cellTablet,
                            isDimmed && { opacity: 0.85 },
                          ]}
                        >
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => handlePickPlayer(player.id)}
                            style={styles.avatarPressable}
                          >
                            <View
                              style={[
                                styles.avatarWrapper,
                                isSelected && styles.avatarWrapperSelected,
                              ]}
                            >
                              {isSelected && (
                                <LinearGradient
                                  colors={["#ff8800", "#ffc200", "#ffee58"]}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 1 }}
                                  style={[StyleSheet.absoluteFill, { borderRadius: 83 }]}
                                />
                              )}
                              {characterData?.profileImage && (
                                <AppImage
                                  source={characterData.profileImage}
                                  style={styles.avatarImage}
                                  contentFit="contain"
                                />
                              )}
                            </View>
                          </Pressable>
                          <CustomButton
                            title={player.name}
                            btnSize="xs"
                            fontSize="sm"
                            glow
                            fullWidth
                            buttonClassName="-mt-4"
                            onPress={() => handlePickPlayer(player.id)}
                            backgroundImage={backgrounds.bg018}
                            glowColor={isSelected ? "rgba(255,220,100,1)" : "rgba(255,204,0,1)"}
                            glowIntensity={isSelected ? 16 : 8}
                            shadowColor={isSelected ? "#a85000" : "#834400"}
                            borderColor={isSelected ? "#ffd060" : undefined}
                            borderWidth={isSelected ? 1.5 : undefined}
                          />
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}

            {isRate && (
              <View className="px-6" style={{ marginTop: 40 }}>
                <RatingSlider
                  value={rateSliderValue}
                  onValueChange={setRateSliderValue}
                  gestureRef={sliderGestureRef}
                  railFrameImage="https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/b179af07-61f2-46ea-812e-79ed27826ed0-border2.webp"
                />
                <View style={styles.numberButtonWrap}>
                  <CustomButton
                    title={t("question_number_confirm")}
                    onPress={() => handleRateSelect(rateSliderValue)}
                    backgroundImage={backgrounds.bg026}
                    glow
                    glowColor="rgba(41,255,25,0.8)"
                    shadowColor="#005f07"
                    horizontalPadding={48}
                    fullWidth
                    buttonClassName="-mt-12"
                  />
                </View>
              </View>
            )}

{/* isInput SEND button is rendered outside the ScrollView below */}

            {isNumber && !isRate && !isInput && (
              <View className="px-0" style={{ marginTop: 40 }}>
                <Animated.View
                  style={{
                    opacity: numberInputOpacity,
                    transform: [{ scale: numberInputScale }],
                  }}
                >
                  <View style={styles.numberImageWrap}>
                    <Pressable
                      style={styles.numberImagePressable}
                      onPress={() => numberInputRef.current?.focus?.()}
                      onPressIn={() => {
                        Animated.spring(numberHeroScale, {
                          toValue: 1.08,
                          friction: 4,
                          useNativeDriver: true,
                        }).start();
                      }}
                      onPressOut={() => {
                        Animated.spring(numberHeroScale, {
                          toValue: 1,
                          friction: 4,
                          useNativeDriver: true,
                        }).start();
                      }}
                    >
                      <Animated.View
                        style={[
                          styles.numberImageFullWrap,
                          { transform: [{ scale: numberHeroScale }] },
                        ]}
                      >
                        {(() => {
                          const rateImg = getRateImage();
                          return rateImg ? (
                            <AppImage
                              source={rateImg}
                              style={styles.numberImageFull}
                              contentFit="contain"
                            />
                          ) : null;
                        })()}
                        <View style={styles.numberImageInputOverlay}>
                          <View style={styles.numberFieldSlot}>
                            <CustomInput
                              ref={numberInputRef}
                              value={numberAnswer}
                              onChangeText={handleNumberChange}
                              keyboardType="numeric"
                              maxLength={4}
                              placeholder={t("question_number_placeholder")}
                              placeholderTextColor="rgba(89,36,16,0.5)"
                              unstyled
                              inputStyle={[
                                styles.numberImageHiddenInput,
                                {
                                  fontSize: numberFieldFontSize,
                                  textAlign: "center",
                                },
                              ]}
                            />
                            <View
                              style={styles.numberImageValueDisplay}
                              pointerEvents="none"
                            >
                              <CustomText
                                variant="h4-headline"
                                allowWrap
                                className="text-center"
                                textColor="#592410"
                                style={{
                                  fontSize: numberFieldFontSize,
                                  width: "100%",
                                  textAlign: "center",
                                }}
                              >
                                {numberAnswer || "?"}
                              </CustomText>
                            </View>
                          </View>
                        </View>
                      </Animated.View>
                    </Pressable>
                  </View>
                  <View style={styles.numberButtonWrap}>
                    <CustomButton
                      title={t("question_number_confirm")}
                      onPress={handleSubmitNumber}
                      backgroundImage={backgrounds.bg026}
                      glow
                      glowColor="rgba(41,255,25,0.8)"
                      shadowColor="#005f07"
                      horizontalPadding={48}
                      fullWidth
                      buttonClassName="-mt-12"
                    />
                  </View>
                </Animated.View>
              </View>
            )}

            {/* {isPick && (
            <CustomText variant="p" className="text-center px-8 mt-10">
              Pick whoever you think fits this question best
              {"\n"}(you can pick yourself as well)
            </CustomText>
          )} */}
          </Animated.View>
            </ScrollView>

            {/* CONFIRM button for pick type */}
            {isPick && selectedPickId && (
              <View
                style={[
                  styles.openEmbedButtonBar,
                  { paddingBottom: Math.max(insets.bottom, 16) + 8 },
                ]}
              >
                <CustomButton
                  title={t("question_number_confirm")}
                  onPress={confirmPickPlayer}
                  backgroundImage={backgrounds.bg026}
                  glow
                  glowColor="rgba(41,255,25,0.8)"
                  shadowColor="#005f07"
                  horizontalPadding={48}
                  fullWidth
                />
              </View>
            )}

            {/* SEND button — outside scroll so it stays visible above keyboard */}
            {isInput && (
              <View
                style={[
                  styles.openEmbedButtonBar,
                  androidKeyboardPad > 0 && { paddingBottom: androidKeyboardPad + 8 },
                ]}
              >
                <View style={{ opacity: openAnswer.trim() ? 1 : 0.38 }}>
                  <CustomButton
                    title={t("question_open_send")}
                    onPress={handleSubmitOpen}
                    backgroundImage={backgrounds.bg026}
                    glow
                    glowColor="rgba(41,255,25,0.8)"
                    shadowColor="#005f07"
                    horizontalPadding={48}
                    fullWidth
                  />
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      <OnlineWaitPlayersOverlay
        visible={mode === "ONLINE" && waitingAnswersSync}
      />
    </SafeAreaView>
    </FullBleedStack>
  );
};

export default QuestionScreen;

/* -------------------------------------------------------------------------- */
/* STYLES */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
  questionScroll: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    // gap: 32,
    marginBottom: 40,
    width: "100%",
  },

  cell: {
    width: "50%",
    paddingHorizontal: 16, // ≈ 32px gap
    alignItems: "center",
    justifyContent: "center",
  },
  cellTablet: {
    width: "33.33%",
  },

  nameDivider: {
    width: "88%",
    height: 1,
    marginVertical: 8,
    backgroundColor: "rgba(89,36,16,0.5)",
  },
  avatarCircle: {
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 6 },
  },
  avatarPressable: {
    width: "100%",
    alignItems: "center",
  },
  avatarWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: -12,
  },
  avatarWrapperSelected: {
    padding: 1.5,
    borderRadius: 83,
    overflow: "hidden",
    transform: [{ scale: 1.05 }],
  },
  avatarImage: {
    width: 164,
    height: 164,
  },
  headerContainer: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
    borderRadius: 20,
    marginVertical: 24,
    marginHorizontal: 24,
    padding: 24,
    position: "relative",
    backgroundColor: "rgba(0,0,0,0.25)",

    // iOS shadow (bottom)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 16,

    // Android
    elevation: 14,
  },

  roundButton: {
    position: "absolute",
    top: -22,
    alignSelf: "center",

    backgroundColor: "#FA3A00",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 32,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 10,
  },

  headerGlowWrapper: {
    position: "relative",
    marginHorizontal: 24,
    marginVertical: 24,
  },

  headerBackGlow: {
    position: "absolute",
    top: -45, // излиза над card-а
    left: -20,
    right: -20,
    height: 120, // височина на светлината

    backgroundColor: "rgba(250, 58, 0, 0.45)", // 🔴 ЧЕРВЕНО

    borderRadius: 80,

    // iOS – истински blur halo
    shadowColor: "#FA3A00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,

    // Android – най-доброто възможно
    elevation: 24,
  },
  namePlateShadow: {
    shadowColor: "#fff",
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 14,
    zIndex: 999,
  },
  namePlate: {
    borderRadius: 18,
    paddingHorizontal: 32,
    paddingVertical: 24,
    alignItems: "center",
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
  questionText: {},
  questionSubText: {},
  numberInputCard: {
    // backgroundColor: "rgba(255,247,236,0.95)",
    // borderRadius: 18,
    // borderWidth: 1,
    // borderColor: "rgba(89,36,16,0.3)",
    // padding: 20,
    // shadowColor: "#592410",
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.2,
    // shadowRadius: 8,
    // elevation: 6,
  },
  numberInputWrapper: {
    position: "relative",
    minHeight: 96,
    overflow: "hidden",
    borderRadius: 18,
    marginBottom: 16,
  },
  numberInputImageContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  numberInputImage: {
    // borderRadius: 18,
  },
  numberInputOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
  },
  numberInputField: {
    fontSize: 24,
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
    color: "#592410",
    width: "100%",
  },
  numberImageWrap: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    alignItems: "center",
  },
  numberImagePressable: {
    position: "relative",
    width: "76%",
    alignSelf: "center",
    aspectRatio: 3 / 4,
  },
  numberImageFullWrap: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  numberImageFull: {
    width: "100%",
    height: "100%",
  },
  /** % of hero frame — same visual anchor on phones and tablets */
  numberImageInputOverlay: {
    position: "absolute",
    top: "12.5%",
    left: "26%",
    right: "19%",
    alignItems: "center",
    justifyContent: "center",
  },
  numberFieldSlot: {
    width: "100%",
    minHeight: 44,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  numberImageHiddenInput: {
    width: "100%",
    paddingVertical: 6,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
    color: "#592410",
    textAlign: "center",
    fontWeight: "700",
    opacity: 0.02,
    ...(Platform.OS === "android"
      ? { textAlignVertical: "center" as const, includeFontPadding: false }
      : {}),
  },
  numberImageValueDisplay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  numberButtonWrap: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: "center",
  },
  openInputBlock: {
    width: "100%",
    alignSelf: "stretch",
    alignItems: "stretch",
  },
  openInputCard: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
  },
  openInputBgImage: {
    borderRadius: 18,
  },
  openInputCardContent: {
    width: "100%",
    paddingHorizontal: 8,
    paddingVertical: 64,
    position: "relative",
    zIndex: 1,
  },
  openInputRow: {
    width: "100%",
    justifyContent: "center",
  },
  openInputMeasureText: {
    position: "absolute",
    opacity: 0,
    left: 0,
    top: 0,
    fontFamily: "SeymourOne-Regular",
    padding: 0,
    margin: 0,
  },
  openInputButtonWrap: {
    marginTop: 8,
    width: "100%",
    alignSelf: "stretch",
  },
  openInputField: {
    width: "100%",
    textAlign: "center",
    color: "#592410",
    paddingHorizontal: 8,
    ...(Platform.OS === "android"
      ? {
          textAlignVertical: "center" as const,
          includeFontPadding: false as const,
          paddingVertical: 0,
        }
      : { paddingVertical: 0 }),
  },
  openEmbedPressable: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    minHeight: 72,
    justifyContent: "center",
  },
  openEmbedHiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  openEmbedDisplay: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  openEmbedPlaceholderRow: {
    flexDirection: "row" as const,
    alignItems: "center",
    gap: 8,
  },
  openEmbedSparkle: {
    color: "rgba(89,36,16,0.45)",
    fontSize: 28,
  },
  openEmbedPlaceholderText: {
    fontStyle: "italic" as const,
  },
  openEmbedAnswerText: {
    fontFamily: "Overpass-ExtraBold",
    color: "#592410",
    textAlign: "center" as const,
    width: "100%",
    fontWeight: "900" as const,
  },
  openEmbedDividerBottom: {
    width: "60%",
    height: 1,
    backgroundColor: "rgba(89,36,16,0.25)",
    marginTop: 12,
    marginBottom: 4,
  },
  openEmbedButtonBar: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
  },
});
