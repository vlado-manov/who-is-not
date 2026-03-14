import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  ImageBackground,
  ScrollView,
  ImageSourcePropType,
  StyleSheet,
  Pressable,
  Animated,
} from "react-native";
import AppImage from "../../components/AppImage";
import ImageBackgroundWithLoadGate from "../../components/ImageBackgroundWithLoadGate";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { backgrounds } from "../../../assets/backgrounds";

import CustomText from "../../components/common/CustomText";
import CustomButton from "../../components/common/CustomButton";

import { useQueryClient } from "@tanstack/react-query";
import { useGameStore, Player } from "../../store/useGameStore";
import { IQuestion } from "../../types/question";
import { GameStackParamList } from "../../navigation/types";
import { queryKeys } from "../../api/queryKeys";
import { useSyncHeroesStore } from "../../api/hooks/useSyncHeroesStore";
import { game_images } from "../../../assets/images";
import AudioManager from "../../utils/audioManager";
import { useHeroesStore } from "../../store/useHeroesStore";
import { useTranslation } from "react-i18next";
import { usePreventBack } from "../../hooks/usePreventBack";

type Nav = StackNavigationProp<GameStackParamList, "Results">;

type Character = {
  id: string;
  slug?: string;
  profileImage: ImageSourcePropType;
  rateImage?: ImageSourcePropType | null;
};

const ResultsScreen = () => {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  usePreventBack();
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const players = useGameStore((s) => s.players);
  const heroes = useHeroesStore((s) => s.heroes);
  const questionType = useGameStore((s) => s.questionType);
  const answers = useGameStore((s) => s.answers);
  const baseQuestionId = useGameStore((s) => s.currentBaseQuestionId);
  const gameQuestions = useGameStore((s) => s.gameQuestions);
  const isBonusRound = useGameStore((s) => s.isBonusRound);
  const round = useGameStore((s) => s.round);
  const discussionSeconds = useGameStore(
    (s) => s.gameSettings.discussionSeconds
  );
  useSyncHeroesStore();

  const [secondsLeft, setSecondsLeft] = useState(discussionSeconds);
  const tensionStartedRef = useRef(false);
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    AudioManager.playBackgroundGame();

    return () => {
      AudioManager.stopTensionLoop();
    };
  }, []);

  useEffect(() => {
    if (secondsLeft <= 20 && secondsLeft > 0 && !tensionStartedRef.current) {
      tensionStartedRef.current = true;
      AudioManager.stopBackground();
      AudioManager.playTensionLoop();
    }
  }, [secondsLeft]);

  useEffect(() => {
    if (questionType === "rate" || questionType === "number") {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters });
    }
  }, [questionType, queryClient]);

  /* -------------------------------------------------------------------------- */
  /* DATA HELPERS */
  /* -------------------------------------------------------------------------- */

  const characterById = useMemo(() => {
    const map: Record<string, Character> = {};
    heroes.forEach((c) => {
      map[c.id] = c as unknown as Character;
    });
    return map;
  }, [heroes]);

  const getAvatar = (player: Player): ImageSourcePropType | undefined => {
    if (!player.characterId) return undefined;
    return characterById[player.characterId]?.profileImage;
  };

  const vanessaRateImage = useMemo(() => {
    const v = heroes.find(
      (h) =>
        h.slug?.toLowerCase().replace(/-/g, "_") === "silent_vanessa" ||
        h.slug?.toLowerCase().includes("vanessa")
    );
    return v?.rateImage;
  }, [heroes]);

  const getRateImage = (player: Player): ImageSourcePropType | null => {
    if (!player.characterId) return vanessaRateImage ?? null;
    const char = characterById[player.characterId];
    return char?.rateImage ?? vanessaRateImage ?? null;
  };

  const baseQuestion: IQuestion | null = useMemo(() => {
    if (!baseQuestionId || !gameQuestions.length) return null;
    return gameQuestions.find((q) => q.id === baseQuestionId) ?? null;
  }, [baseQuestionId, gameQuestions]);

  /**
   * 🔁 Flat vote list:
   * A voted for B
   */
  const votePairs = useMemo(() => {
    if (questionType !== "pick") return [];

    return Object.entries(answers)
      .map(([voterId, targetId]) => {
        const voter = players.find((p) => p.id === voterId);
        const target = players.find((p) => p.id === targetId);
        if (!voter || !target) return null;
        return { voter, target };
      })
      .filter(Boolean) as { voter: Player; target: Player }[];
  }, [answers, players, questionType]);

  /**
   * For rate/number: list of { player, answer } to show who answered what.
   */
  const answerEntries = useMemo(() => {
    if (questionType !== "rate" && questionType !== "number") return [];

    return players
      .map((player) => {
        const answer = answers[player.id];
        if (answer == null || answer === "") return null;
        return { player, answer: answer.trim() };
      })
      .filter(Boolean) as { player: Player; answer: string }[];
  }, [answers, players, questionType]);

  /** Rows of 2 for rate/number grid layout. */
  const answerRows = useMemo(() => {
    const rows: { player: Player; answer: string }[][] = [];
    for (let i = 0; i < answerEntries.length; i += 2) {
      rows.push(answerEntries.slice(i, i + 2));
    }
    return rows;
  }, [answerEntries]);

  /* -------------------------------------------------------------------------- */
  /* TIMER */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    setSecondsLeft(discussionSeconds);
  }, [discussionSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const formattedTime = secondsLeft.toString();

  useEffect(() => {
    if (secondsLeft === 0 && !hasFinishedRef.current) {
      hasFinishedRef.current = true;
      AudioManager.stopTensionLoop();
      navigation.navigate("VoteNow");
    }
  }, [secondsLeft, navigation]);

  const handleNext = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    tensionStartedRef.current = true;
    AudioManager.stopTensionLoop();
    setSecondsLeft(0);
    navigation.navigate("VoteNow");
  };

  const scaleUp = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  const scaleDown = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  /* -------------------------------------------------------------------------- */
  /* RENDER */
  /* -------------------------------------------------------------------------- */

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackgroundWithLoadGate
        source={backgrounds.bg023}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={{
            paddingVertical: 96,
            paddingBottom: 140,
            gap: 32,
          }}
        >
          {/* QUESTION HEADER (hidden in bonus round 5) */}
          <View style={{ paddingHorizontal: 24 }}>
            <View style={styles.namePlateShadow}>
              <ImageBackground
                source={backgrounds.bg005}
                resizeMode="stretch"
                imageStyle={{ borderRadius: 18 }}
                style={styles.namePlate}
              >
                {isBonusRound ? (
                  <>
                    <CustomText
                      variant="p"
                      className="text-center"
                      textColor="#762a05"
                    >
                      {t("bonus_round_title")}
                    </CustomText>
                    <View style={styles.nameDivider} />
                    <CustomText
                      variant="h6-headline"
                      className="text-center"
                      textColor="#592410"
                    >
                      {t("results_bonus_no_question")}
                    </CustomText>
                    <View style={styles.nameDivider} />
                    <CustomText
                      variant="p-small"
                      className="text-center mw-[40%]"
                      textColor="#762a05"
                    >
                      {t("results_who_voted_whom")}
                    </CustomText>
                    <CustomText
                      variant="p-xsmall"
                      className="text-center mw-[40%]"
                      textColor="#762a05"
                    >
                      {t("results_click_timer_skip")}
                    </CustomText>
                  </>
                ) : (
                  <>
                    <CustomText
                      variant="p"
                      className="text-center"
                      textColor="#762a05"
                    >
                      {t("results_the_question_is")}
                    </CustomText>

                    <View style={styles.nameDivider} />

                    <CustomText
                      variant="h6-headline"
                      className="text-center"
                      textColor="#592410"
                    >
                      {baseQuestion?.text}
                    </CustomText>

                    <View style={styles.nameDivider} />

                    <CustomText
                      variant="p-small"
                      className="text-center max-w-[60%]"
                      textColor="#762a05"
                    >
                      {t("results_who_not_answering")}
                    </CustomText>
                    <CustomText
                      variant="p-xsmall"
                      className="text-center max-w-[50%]"
                      textColor="#762a05"
                    >
                      {t("results_click_timer_skip")}
                    </CustomText>
                  </>
                )}
              </ImageBackground>
            </View>

            <Pressable
              onPressIn={scaleUp}
              onPressOut={scaleDown}
              onPress={handleNext}
              style={styles.timerWrapper}
            >
              <Animated.View
                style={{
                  transform: [{ scale: scaleAnim }],
                }}
              >
                <View style={styles.timerContainer}>
                  <AppImage
                    source={game_images.timer}
                    contentFit="contain"
                    style={styles.timerImage}
                  />

                  <CustomText variant="h3-headline" style={styles.timerText}>
                    {formattedTime}
                  </CustomText>
                </View>
              </Animated.View>
            </Pressable>
          </View>

          {/* PICK: who voted for whom */}
          {questionType === "pick" && (
            <View className="px-6 gap-8">
              {votePairs.map(({ voter, target }, idx) => {
                const voterImg = getAvatar(voter);
                const targetImg = getAvatar(target);

                return (
                  <View key={idx} style={styles.voteRow}>
                    {/* VOTER */}
                    <View style={styles.voteSide}>
                      {voterImg && (
                        <AppImage
                          source={voterImg}
                          style={styles.avatar}
                          contentFit="contain"
                        />
                      )}
                      <CustomButton
                        title={voter.name}
                        appearance="tertiary"
                        btnSize="xs"
                        fontSize="xs"
                        backgroundImage={backgrounds.bg018}
                        glow
                        fullWidth
                        glowColor="rgba(255,204,0,1)"
                        shadowColor="#834400"
                        buttonClassName="-mt-4"
                      />
                    </View>

                    {/* ARROW */}
                    <AppImage
                      source={game_images.arrowRightVote}
                      style={styles.arrow}
                      contentFit="contain"
                    />

                    {/* TARGET */}
                    <View style={styles.voteSide}>
                      {targetImg && (
                        <AppImage
                          source={targetImg}
                          style={styles.avatar}
                          contentFit="contain"
                        />
                      )}
                      <CustomButton
                        title={target.name}
                        appearance="tertiary"
                        btnSize="xs"
                        fontSize="xs"
                        backgroundImage={backgrounds.bg018}
                        glow
                        fullWidth
                        glowColor="rgba(255,204,0,1)"
                        shadowColor="#834400"
                        buttonClassName="-mt-4"
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* RATE / NUMBER: who answered what – 2 per row, rate image + number overlay */}
          {(questionType === "rate" || questionType === "number") && (
            <View className="px-6" style={styles.rateNumberContainer}>
              {answerRows.map((row, rowIdx) => (
                <View key={`row-${rowIdx}`} style={styles.rateNumberRow}>
                  {row.map(({ player, answer }) => {
                    const rateImg = getRateImage(player);
                    return (
                      <View key={player.id} style={styles.rateNumberCell}>
                        <View style={styles.rateNumberImageWrap}>
                          {rateImg && (
                            <AppImage
                              source={rateImg}
                              style={styles.rateNumberImage}
                              contentFit="contain"
                            />
                          )}
                          <View style={styles.rateNumberOverlay}>
                            <CustomText
                              variant="h4-headline"
                              // textColor="#000000"
                              style={styles.rateNumberValue}
                            >
                              {answer}
                            </CustomText>
                          </View>
                        </View>
                        <CustomButton
                          title={player.name}
                          appearance="tertiary"
                          btnSize="xs"
                          fontSize="xs"
                          backgroundImage={backgrounds.bg018}
                          glow
                          fullWidth
                          glowColor="rgba(255,204,0,1)"
                          shadowColor="#834400"
                          buttonClassName="-mt-1"
                        />
                      </View>
                    );
                  })}
                  {row.length === 1 && <View style={styles.rateNumberCell} />}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* CTA */}
        {/* <View style={styles.bottomCta}>
          <CustomButton
            title={t("ready_to_vote")}
            onPress={() => navigation.navigate("VoteNow")}
          />
        </View> */}
      </ImageBackgroundWithLoadGate>
    </SafeAreaView>
  );
};

/* -------------------------------------------------------------------------- */
/* STYLES */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  namePlateShadow: {
    shadowColor: "#fff",
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 14,
  },
  namePlate: {
    borderRadius: 18,
    paddingHorizontal: 32,
    paddingVertical: 24,
    // paddingBottom: 48,
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
  nameDivider: {
    width: "88%",
    height: 1,
    marginVertical: 8,
    backgroundColor: "rgba(89,36,16,0.5)",
  },
  // timerWrapper: {
  //   position: "absolute",
  //   bottom: -28,
  //   left: "50%",
  //   transform: [{ translateX: -65 }],
  //   // width: 180,
  //   width: "100%",
  //   alignItems: "center",
  //   justifyContent: "space-between",
  // },
  timerWrapper: {
    position: "absolute",
    bottom: -40,
    right: -40,
    // left: "50%",
    // transform: [{ translateX: -110 }], // половината от width
  },

  timerContainer: {
    width: 230,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },

  timerImage: {
    width: 112,
    height: 112,
  },

  timerText: {
    position: "absolute",
    textAlign: "center",
    paddingTop: 20,
    color: "#ffef9d",
    fontSize: 24,
    // fontFamily: "OpenSans-Bold",
    fontWeight: "900",
    textShadowColor: "rgba(255,180,0,0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  voteRow: {
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    marginTop: 24,
  },
  voteSide: {
    width: "40%",
    alignItems: "center",
  },
  avatar: {
    width: 120,
    height: 120,
  },
  arrow: {
    width: 120,
    height: 120,
    position: "absolute",
    left: "50%",
    top: "50%",
    zIndex: -1,
    transform: [{ translateX: -60 }, { translateY: -60 }],
  },
  rateNumberContainer: {
    gap: 24,
  },
  rateNumberRow: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  rateNumberCell: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  rateNumberImageWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rateNumberImage: {
    width: "100%",
    height: "100%",
    // transform: [{ scale: 1.25 }],
  },
  rateNumberOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    // justifyContent: "center",
  },
  rateNumberValue: {
    fontSize: 16,
    paddingLeft: 18,
    marginTop: 18,
    color: "#000",
    fontWeight: "900",
    textShadowColor: "rgba(255,255,255,0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bottomCta: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
});

export default ResultsScreen;
