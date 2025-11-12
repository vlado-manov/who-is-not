// src/screens/Game/ResultsScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  ImageBackground,
  ScrollView,
  Image,
  ImageSourcePropType,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { backgrounds } from "../../../assets/backgrounds";
import CustomText from "../../components/common/CustomText";
import CustomButton from "../../components/common/CustomButton";
import { useGameStore, Player } from "../../store/useGameStore";
import { QUESTIONS } from "../../data/questions";
import { IQuestion } from "../../types/question";
import { HEROES } from "../../data/heroes";
import { ICharacter } from "../../types/character";

const COLOR_CLASSES = [
  "bg-primary-500",
  "bg-primary-400",
  "bg-primary-300",
  "bg-primary-200",
  "bg-primary-100",
  "bg-primary-600",
  "bg-primary-700",
  "bg-primary-800",
  "bg-primary-900",
  "bg-customBlack-500",
];

type Character = {
  id: string;
  profileImage: ImageSourcePropType;
  name: string;
};

const ResultsScreen = () => {
  const players = useGameStore((s) => s.players);
  const answers = useGameStore((s) => s.answers);
  const baseQuestionId = useGameStore((s) => s.currentBaseQuestionId);
  const questionType = useGameStore((s) => s.questionType);
  const discussionSeconds = useGameStore(
    (s) => s.gameSettings.discussionSeconds
  );
  const [secondsLeft, setSecondsLeft] = useState(discussionSeconds);

  const characterById = useMemo(() => {
    const map: Record<string, Character> = {};
    (HEROES as ICharacter[]).forEach((c) => {
      map[c.id] = c as unknown as Character;
    });
    return map;
  }, []);

  const getProfileImage = (player: Player): ImageSourcePropType | undefined => {
    if (!player.characterId) return undefined;
    return characterById[player.characterId]?.profileImage;
  };

  const baseQuestion: IQuestion | null = useMemo(() => {
    if (!baseQuestionId) return null;
    return QUESTIONS.find((q) => q.id === baseQuestionId) ?? null;
  }, [baseQuestionId]);

  type PickGroup = { target: Player; voters: Player[] };

  const pickGroups: PickGroup[] = useMemo(() => {
    if (questionType !== "pick") return [];

    const map: Record<string, Player[]> = {};

    Object.entries(answers).forEach(([voterId, targetId]) => {
      const voter = players.find((p) => p.id === voterId);
      const target = players.find((p) => p.id === targetId);
      if (!voter || !target) return;

      if (!map[target.id]) map[target.id] = [];
      map[target.id].push(voter);
    });

    return Object.entries(map).map(([targetId, voters]) => {
      const target = players.find((p) => p.id === targetId)!;
      return { target, voters };
    });
  }, [answers, players, questionType]);

  type NumberAnswer = { player: Player; value: string };

  const numberAnswers: NumberAnswer[] = useMemo(() => {
    if (questionType !== "number") return [];
    return players
      .map((p) => {
        const ans = answers[p.id];
        if (!ans) return null;
        return { player: p, value: ans };
      })
      .filter((x): x is NumberAnswer => !!x);
  }, [answers, players, questionType]);

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

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg009}
        className="flex-1"
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={{
            paddingVertical: 96,
            flexGrow: 1,
            justifyContent:
              questionType === "pick" ? "space-between" : "center",
            gap: 32,
          }}
        >
          <View className="items-center w-full justify-center px-4">
            <CustomText variant="h3-headline" className="text-center w-full">
              The question is
            </CustomText>
            <CustomText
              variant="h4"
              className="-rotate-2 text-center w-full mt-8 px-4"
              shadow
            >
              {baseQuestion?.text}
            </CustomText>
          </View>

          <View className="mt-4 pb-[100px] px-8 max-w-full w-full">
            {questionType === "pick" && (
              <>
                {pickGroups.length &&
                  pickGroups.map((group, idx) => (
                    <View
                      key={idx}
                      className="bg-white rounded-2xl p-4 py-6 mt-8 w-full"
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          marginBottom: 8,
                        }}
                        className="gap-2"
                      >
                        {group.voters.map((v) => {
                          const playerIdx = players.findIndex(
                            (p) => p.id === v.id
                          );
                          const colorClass =
                            COLOR_CLASSES[
                              playerIdx >= 0
                                ? playerIdx % COLOR_CLASSES.length
                                : 0
                            ];

                          return (
                            <View
                              key={v.id}
                              style={{
                                alignSelf: "flex-start",
                              }}
                            >
                              <CustomButton
                                title={v.name}
                                btnSize="xs"
                                color={colorClass}
                              />
                            </View>
                          );
                        })}
                      </View>

                      <CustomText
                        variant="h3-headline"
                        textColor="black"
                        className="text-center font-opensans-extrabold mt-4"
                      >
                        Voted for
                      </CustomText>

                      <View className="flex-col items-center justify-center mt-4">
                        {(() => {
                          const img = getProfileImage(group.target);
                          return img ? (
                            <Image
                              source={img}
                              resizeMode="contain"
                              style={{
                                width: 180,
                                height: 180,
                              }}
                            />
                          ) : null;
                        })()}
                        <CustomText
                          variant="h5"
                          textColor="black"
                          className="mt-2"
                        >
                          {group.target.name}
                        </CustomText>
                      </View>
                    </View>
                  ))}
              </>
            )}

            {questionType === "number" && (
              <View className="gap-2">
                {numberAnswers.length &&
                  numberAnswers.map(({ player, value }) => {
                    const img = getProfileImage(player);
                    return (
                      <TouchableOpacity
                        key={player.id}
                        className="bg-white rounded-full p-1 w-full"
                      >
                        <View className="flex-row items-center justify-between pr-6">
                          <View className="flex-row gap-2 items-center">
                            {img && (
                              <Image
                                source={img}
                                resizeMode="contain"
                                style={{
                                  width: 72,
                                  height: 72,
                                }}
                              />
                            )}
                            <CustomText
                              variant="quote"
                              textColor="black"
                              className="text-center"
                            >
                              {player.name}
                            </CustomText>
                          </View>
                          <CustomText
                            variant="h4"
                            className="text-center"
                            textColor="black"
                          >
                            {value}
                          </CustomText>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            )}
          </View>
        </ScrollView>

        <View className="items-center gap-1 mt-8 absolute bottom-12 right-0 left-0 bg-transparent px-8">
          <View
            className="bg-primary-500 rounded-xl w-[120px] py-2 animate-bounce"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 6,
            }}
          >
            <CustomText variant="h2-small" className="text-center">
              {formattedTime}
            </CustomText>
          </View>
          <CustomButton
            title="Ready to vote"
            color="bg-primary-400"
            buttonClassName=""
          />
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default ResultsScreen;
