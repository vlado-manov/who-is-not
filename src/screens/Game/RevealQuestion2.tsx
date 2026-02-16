// src/screens/Game/RevealScreen.tsx
import React, { useMemo } from "react";
import { View, ImageBackground, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Player, useGameStore } from "../../store/useGameStore";
import { backgrounds } from "../../../assets/backgrounds";
import CustomText from "../../components/common/CustomText";

// NAVIGATION + BUTTON
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { GameStackParamList } from "../../navigation/types";
import CustomButton from "../../components/common/CustomButton";

import { QUESTIONS } from "../../data/questions";
import { useHeroesStore } from "../../store/useHeroesStore";

type Nav = StackNavigationProp<GameStackParamList, "Reveal">;

const RevealScreen = () => {
  const players = useGameStore((s) => s.players);
  const votes = useGameStore((s) => s.votes);
  const heroes = useHeroesStore((s) => s.heroes);

  const navigation = useNavigation<Nav>();

  // ID на импостъра
  const oddOneId = useGameStore((s) => s.oddOneId);

  // ID на въпроса за импостъра
  const currentOddQuestionId = useGameStore((s) => s.currentOddQuestionId);

  // helper: find player by id
  const getPlayer = (id: string): Player | undefined =>
    players.find((p) => p.id === id);

  // импостърът е играчът с id === oddOneId
  const imposter = useMemo(
    () => players.find((p) => p.id === oddOneId),
    [players, oddOneId]
  );

  // въпросът, който е получил импостърът
  const imposterQuestion = useMemo(
    () => QUESTIONS.find((q) => q.id === currentOddQuestionId),
    [currentOddQuestionId]
  );

  // героят на даден играч (по characterId)
  const getCharacterForPlayer = (player?: Player) => {
    if (!player?.characterId) return undefined;
    return heroes.find((ch) => ch.id === player.characterId);
  };

  // build lines like "Player A voted for Player B"
  const voteLines = useMemo(() => {
    return Object.entries(votes).map(([voterId, targetId]) => {
      const voter = getPlayer(voterId);
      const target = getPlayer(targetId);
      const voterName = voter?.name ?? "Unknown";
      const targetName = target?.name ?? "Unknown";
      return `${voterName} voted for ${targetName}`;
    });
  }, [votes, players]);

  // count votes per target + figure out the "winners"
  const { topTargets, maxVotes } = useMemo(() => {
    const tally: Record<string, number> = {};
    Object.values(votes).forEach((targetId) => {
      if (!tally[targetId]) tally[targetId] = 0;
      tally[targetId] += 1;
    });

    let max = 0;
    Object.values(tally).forEach((n) => {
      if (n > max) max = n;
    });

    const topIds = Object.entries(tally)
      .filter(([, n]) => n === max && max > 0)
      .map(([id]) => id);

    const topPlayers = topIds
      .map((id) => getPlayer(id))
      .filter((p): p is Player => !!p);

    return {
      topTargets: topPlayers,
      maxVotes: max,
    };
  }, [votes, players]);

  // when there is a single "winner" of the vote
  const votedWinner = topTargets.length === 1 ? topTargets[0] : null;

  const votedWinnerIsImposter =
    votedWinner && imposter && votedWinner.id === imposter.id;

  // 🔥 герой + win image на импостъра
  const imposterCharacter = imposter
    ? getCharacterForPlayer(imposter)
    : undefined;

  const getRandom = <T,>(arr?: T[]): T | undefined => {
    if (!arr || arr.length === 0) return undefined;
    const i = Math.floor(Math.random() * arr.length);
    return arr[i];
  };
  const imposterWinImage = imposterCharacter?.winImages?.[0];
  const imposterWinQuote = getRandom(imposterCharacter?.winQuotes);
  const imposterLoseImage = imposterCharacter?.loseImages?.[0];
  const imposterLoseQuote = getRandom(imposterCharacter?.loseQuotes);

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={votedWinnerIsImposter ? imposterLoseImage : imposterWinImage}
        style={{ flex: 1, width: "100%", height: "100%" }}
        resizeMode="contain"
        className="bg-black relative"
      >
        <View className="absolute top-16 w-full px-8">
          {votedWinnerIsImposter ? (
            <View>
              <CustomText variant="h2" className="text-center">
                FUCK
              </CustomText>
              <View className="bg-black p-4">
                <CustomText
                  variant="h3-headline"
                  className="text-center uppercase"
                >
                  You caught me!
                </CustomText>
              </View>
            </View>
          ) : (
            <View>
              <CustomText variant="h2" className="text-center">
                LOL
              </CustomText>
              <View className="bg-black p-4">
                <CustomText
                  variant="h3-headline"
                  className="text-center uppercase"
                >
                  Fooled you!
                </CustomText>
              </View>
            </View>
          )}
        </View>

        <View className="px-8 w-full absolute bottom-[80px] left-0 -translate-y-1/2">
          <View
            className="bg-white rounded-[16px] py-4 px-12 "
            // style={styles.quoteBubbleShadow}
          >
            <CustomText
              variant="quote"
              className="text-center"
              textColor="text-customBlack-500"
            >
              {votedWinnerIsImposter ? imposterLoseQuote : imposterWinQuote}
            </CustomText>
            <View
              className="absolute -bottom-4 left-1/2 - translate-x-1/2"
              // style={styles.quoteBubbleTail}
            />
          </View>
        </View>

        <View className="absolute bottom-12 w-full px-8">
          <CustomButton
            title="Next round"
            fullWidth
            onPress={() => navigation.navigate("Round")}
          />
        </View>
        {/* <ScrollView
          contentContainerStyle={{
            paddingVertical: 96,
            flexGrow: 1,
            justifyContent: "space-between",
          }}
        >
          {votedWinnerIsImposter ? (
            <CustomText variant="h2" className="text-center">
              Oh NO!
            </CustomText>
          ) : (
            <CustomText variant="h2" className="text-center">
              haha
            </CustomText>
          )}

          <View className="items-center w-full justify-center px-4">
            <CustomText variant="h3-headline" className="text-center w-full">
              Voting Results
            </CustomText>
          </View>

          <View className="mt-12 px-8">
            {voteLines.length ? (
              voteLines.map((line, idx) => (
                <CustomText key={idx} variant="p" className="text-center mb-2">
                  {line}
                </CustomText>
              ))
            ) : (
              <CustomText variant="p" className="text-center">
                No votes were cast.
              </CustomText>
            )}
          </View>

          <View className="mt-12 px-8 items-center">
            {maxVotes > 0 && topTargets.length ? (
              <>
                {topTargets.length === 1 ? (
                  <>
                    <CustomText variant="h4" className="text-center" shadow>
                      {votedWinner?.name} has the most votes ({maxVotes})
                    </CustomText>

                    {imposter && (
                      <View className="mt-3">
                        {votedWinnerIsImposter ? (
                          <CustomText
                            variant="p"
                            className="text-center"
                            shadow
                          >
                            And they were the Imposter. Nice catch! 🎯
                          </CustomText>
                        ) : (
                          <CustomText
                            variant="p"
                            className="text-center"
                            shadow
                          >
                            But they were not the Imposter.
                          </CustomText>
                        )}
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <CustomText
                      variant="h4"
                      className="text-center mb-2"
                      shadow
                    >
                      We have a tie!
                    </CustomText>
                    <CustomText variant="p" className="text-center">
                      {topTargets.map((p) => p.name).join(", ")} all have{" "}
                      {maxVotes} votes.
                    </CustomText>

                    {imposter && (
                      <CustomText
                        variant="p"
                        className="text-center mt-3"
                        shadow
                      >
                        The real Imposter was {imposter.name}.
                      </CustomText>
                    )}
                  </>
                )}

                {imposter && (
                  <View className="mt-6 items-center">
                    {imposterWinImage && (
                      <Image
                        source={imposterWinImage}
                        resizeMode="contain"
                        style={{ width: 220, height: 220, marginBottom: 16 }}
                      />
                    )}
                    <CustomText variant="p" className="text-center" shadow>
                      The Imposter was {imposter.name}
                      {imposterCharacter
                        ? ` playing ${imposterCharacter.name}.`
                        : "."}
                    </CustomText>
                  </View>
                )}
              </>
            ) : (
              <>
                <CustomText variant="p" className="text-center">
                  Nobody received any votes.
                </CustomText>

                {imposter && (
                  <View className="mt-3 items-center">
                    {imposterWinImage && (
                      <Image
                        source={imposterWinImage}
                        resizeMode="contain"
                        style={{ width: 220, height: 220, marginBottom: 16 }}
                      />
                    )}
                    <CustomText variant="p" className="text-center" shadow>
                      The Imposter was {imposter.name}
                      {imposterCharacter
                        ? ` playing ${imposterCharacter.name}.`
                        : "."}
                    </CustomText>
                  </View>
                )}
              </>
            )}
          </View>

          <View className="mt-12 px-8 items-center">
            {imposterQuestion?.text && (
              <>
                <CustomText variant="h5" className="text-center mb-2" shadow>
                  Question answered by the Imposter
                </CustomText>
                <CustomText variant="p" className="text-center">
                  “{imposterQuestion.text}”
                </CustomText>
              </>
            )}
          </View>

          <View className="mt-12 px-8 items-center mb-8">
            <CustomButton
              title="Next round"
              fullWidth
              onPress={() => navigation.navigate("Round")}
            />
          </View>
        </ScrollView> */}
      </ImageBackground>
    </SafeAreaView>
  );
};

export default RevealScreen;
