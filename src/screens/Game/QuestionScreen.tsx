// src/screens/Game/QuestionScreen.tsx
import React, { useMemo, useState } from "react";
import { ImageBackground, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { backgrounds } from "../../../assets/backgrounds";
import CustomText from "../../components/common/CustomText";
import CustomButton from "../../components/common/CustomButton";
import CustomInput from "../../components/common/CustomInput";

import { Player, useGameStore } from "../../store/useGameStore";
import { IQuestion } from "../../types/question";
import { QUESTIONS } from "../../data/questions";
import { GameStackParamList } from "../../navigation/types";

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

type Nav = StackNavigationProp<GameStackParamList, "Question">;
type R = RouteProp<GameStackParamList, "Question">;

const QuestionScreen = () => {
  const navigation = useNavigation<Nav>();
  const { playerIndex } = useRoute<R>().params;

  const round = useGameStore((s) => s.round) || 1;
  const players = useGameStore((s) => s.players);
  const oddOneId = useGameStore((s) => s.oddOneId);
  const baseQuestionId = useGameStore((s) => s.currentBaseQuestionId);
  const oddQuestionId = useGameStore((s) => s.currentOddQuestionId);
  const setAnswer = useGameStore((s) => s.setAnswer);

  const currentPlayer = players[playerIndex];

  const [numberAnswer, setNumberAnswer] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const playerRows = useMemo<Player[][]>(() => {
    const rows: Player[][] = [];
    for (let i = 0; i < players.length; i += 2) {
      rows.push(players.slice(i, i + 2));
    }
    return rows;
  }, [players]);

  const question: IQuestion | null = useMemo(() => {
    if (!currentPlayer || !baseQuestionId || !oddQuestionId) return null;

    const isOdd = currentPlayer.id === oddOneId;
    const targetId = isOdd ? oddQuestionId : baseQuestionId;

    return QUESTIONS.find((q) => q.id === targetId) ?? null;
  }, [currentPlayer, baseQuestionId, oddQuestionId, oddOneId]);

  if (!currentPlayer || !question) {
    return null;
  }

  const isNumber = question.type === "number";
  const isPick = question.type === "pick";

  const goToNextStep = () => {
    const isLast = playerIndex >= players.length - 1;

    if (!isLast) {
      navigation.navigate("PassDeviceGameplay", {
        playerIndex: playerIndex + 1,
      });
    } else {
      navigation.navigate("Results");
    }
  };

  const handleSubmitNumber = () => {
    const trimmed = numberAnswer.trim();
    if (!trimmed) return;

    setAnswer(currentPlayer.id, trimmed);
    goToNextStep();
  };

  const handlePickPlayer = (pickedId: string) => {
    setSelectedPlayerId(pickedId);
    setAnswer(currentPlayer.id, pickedId);
    goToNextStep();
  };

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg009}
        style={{ flex: 1, width: "100%", height: "100%" }}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: 96,
            paddingBottom: isNumber ? 32 : 96,
            flexGrow: 1,
            justifyContent: "space-between",
          }}
        >
          <View className="items-center w-full justify-center px-4">
            <CustomText variant="h3-headline" className="text-center w-full">
              Round {round}
            </CustomText>
            <CustomText
              variant="h4"
              className="-rotate-2 text-center w-full mt-8 px-4"
              shadow
            >
              {question.text}
            </CustomText>
          </View>

          <View className="justify-between">
            {isNumber && (
              <View className="px-6 flex-row gap-4">
                <CustomInput
                  value={numberAnswer}
                  onChangeText={setNumberAnswer}
                  keyboardType="numeric"
                  placeholder="Type your magic number"
                />

                <View className="mt-8">
                  <CustomButton
                    title="Next"
                    color="bg-primary-500"
                    fullWidth
                    btnSize="sm"
                    onPress={handleSubmitNumber}
                  />
                </View>
              </View>
            )}

            {isPick && (
              <View className="mt-16 w-full px-6">
                {playerRows.map((row, rowIndex) => (
                  <View
                    key={rowIndex}
                    className="flex-row justify-between items-center mb-3"
                    style={{ gap: 8 }}
                  >
                    {row.map((player, i) => {
                      const colorClass =
                        COLOR_CLASSES[
                          (rowIndex * 2 + i) % COLOR_CLASSES.length
                        ];
                      const selected = selectedPlayerId === player.id;

                      return (
                        <View key={player.id} className="flex-1">
                          <CustomButton
                            title={player.name}
                            color={colorClass}
                            btnSize="sm"
                            fullWidth
                            buttonClassName="w-full -rotate-4"
                            textClassName={selected ? "underline" : ""}
                            onPress={() => handlePickPlayer(player.id)}
                          />
                        </View>
                      );
                    })}

                    {row.length === 1 && <View className="flex-1" />}
                  </View>
                ))}
              </View>
            )}
          </View>

          {isPick && (
            <CustomText variant="p" className="text-center px-8 mt-10">
              Pick whoever you think is the most fitting answer (you can pick
              yourself as well)
            </CustomText>
          )}
          {isNumber && (
            <View className="gap-2 px-8">
              <CustomText variant="p" className="text-center px-8">
                Type the number that best fits you, then hit NEXT.
              </CustomText>
              <CustomButton title="Next" onPress={handleSubmitNumber} />
            </View>
          )}
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default QuestionScreen;
