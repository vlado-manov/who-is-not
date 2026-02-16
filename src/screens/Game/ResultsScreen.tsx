import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  ImageBackground,
  ScrollView,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Pressable,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { backgrounds } from "../../../assets/backgrounds";

import CustomText from "../../components/common/CustomText";
import CustomButton from "../../components/common/CustomButton";

import { useGameStore, Player } from "../../store/useGameStore";
import { QUESTIONS } from "../../data/questions";
import { IQuestion } from "../../types/question";
import { GameStackParamList } from "../../navigation/types";
import { game_images } from "../../../assets/images";
import AudioManager from "../../utils/audioManager";
import { useHeroesStore } from "../../store/useHeroesStore";

type Nav = StackNavigationProp<GameStackParamList, "Results">;

type Character = {
  id: string;
  profileImage: ImageSourcePropType;
};

const ResultsScreen = () => {
  const navigation = useNavigation<Nav>();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const players = useGameStore((s) => s.players);
  const heroes = useHeroesStore((s) => s.heroes);
  const answers = useGameStore((s) => s.answers);
  const baseQuestionId = useGameStore((s) => s.currentBaseQuestionId);
  const questionType = useGameStore((s) => s.questionType);
  const discussionSeconds = useGameStore(
    (s) => s.gameSettings.discussionSeconds
  );
  useEffect(() => {
    AudioManager.playTensionLoop();

    return () => {
      AudioManager.stopTensionLoop();
    };
  }, []);

  const [secondsLeft, setSecondsLeft] = useState(discussionSeconds);

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

  const baseQuestion: IQuestion | null = useMemo(() => {
    if (!baseQuestionId) return null;
    return QUESTIONS.find((q) => q.id === baseQuestionId) ?? null;
  }, [baseQuestionId]);

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
    if (secondsLeft === 0) {
      AudioManager.stopTensionLoop();
      navigation.navigate("VoteNow");
    }
  }, [secondsLeft, navigation]);

  const handleNext = () => {
    AudioManager.stopTensionLoop();
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
      <ImageBackground
        source={backgrounds.bg023}
        className="flex-1"
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={{
            paddingVertical: 96,
            paddingBottom: 140,
            gap: 32,
          }}
        >
          {/* QUESTION HEADER */}
          <View style={{ paddingHorizontal: 24 }}>
            <View style={styles.namePlateShadow}>
              <ImageBackground
                source={backgrounds.bg005}
                resizeMode="stretch"
                imageStyle={{ borderRadius: 18 }}
                style={styles.namePlate}
              >
                <CustomText
                  variant="p"
                  className="text-center"
                  textColor="#762a05"
                >
                  The question is
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
                  className="text-center"
                  textColor="#762a05"
                >
                  Who is not answering that?
                </CustomText>
                <CustomText
                  variant="p-xsmall"
                  className="text-center"
                  textColor="#762a05"
                >
                  Click the timer to skip
                </CustomText>
                {/* <Pressable
                  className="items-center justify-center"
                  onPress={() => navigation.navigate("VoteNow")}
                >
                  <Image
                    source={game_images.readyToVote}
                    resizeMode="contain"
                    style={{
                      width: 160,
                      height: 40,
                    }}
                  />
                </Pressable> */}
              </ImageBackground>
            </View>

            {/* TIMER */}
            {/* <View style={styles.timerWrapper}> */}
            {/* <CustomButton
                title={formattedTime}
                appearance="tertiary"
                btnSize="xs"
                fontSize="lg"
                backgroundImage={backgrounds.bg017}
                glow
                fullWidth
                glowColor="rgba(255,204,0,1)"
                shadowColor="#834400"
              /> */}
            {/* <Image
                source={game_images.timer}
                resizeMode="contain"
                style={{
                  position: "absolute",
                  right: 40,
                  bottom: 0,
                  width: 220,
                  height: 140,
                }}
              />
              <CustomText variant="p">321</CustomText>
            </View> */}

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
                  <Image
                    source={game_images.timer}
                    resizeMode="contain"
                    style={styles.timerImage}
                  />

                  <CustomText variant="h3-headline" style={styles.timerText}>
                    {formattedTime}
                  </CustomText>
                </View>
              </Animated.View>
            </Pressable>
          </View>

          {/* VOTES */}
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
                        <Image
                          source={voterImg}
                          style={styles.avatar}
                          resizeMode="contain"
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
                    <Image
                      source={game_images.arrowRightVote}
                      style={styles.arrow}
                      resizeMode="contain"
                    />

                    {/* TARGET */}
                    <View style={styles.voteSide}>
                      {targetImg && (
                        <Image
                          source={targetImg}
                          style={styles.avatar}
                          resizeMode="contain"
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
        </ScrollView>

        {/* CTA */}
        {/* <View style={styles.bottomCta}>
          <CustomButton
            title="Ready to vote"
            onPress={() => navigation.navigate("VoteNow")}
          />
        </View> */}
      </ImageBackground>
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
    width: "100%",
    height: "100%",
  },

  timerText: {
    position: "absolute",
    textAlign: "center",
    color: "#ffef9d",
    fontSize: 28,
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
  bottomCta: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
});

export default ResultsScreen;
