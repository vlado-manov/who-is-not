// src/screens/Game/StandingsScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  ImageBackground,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import AppImage from "../../components/AppImage";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, CommonActions } from "@react-navigation/native";

import { GameStackParamList } from "../../navigation/types";
import { useGameStore } from "../../store/useGameStore";
import CustomText from "../../components/common/CustomText";
import CustomButton from "../../components/common/CustomButton";
import { backgrounds } from "../../../assets/backgrounds";
import { useAuthStore } from "../../store/useUserStore";
import { useHeroesStore } from "../../store/useHeroesStore";
import { useTrackGameFinishedMutation } from "../../api/hooks/useAnalyticsMutations";
import { useTranslation } from "react-i18next";
import { usePreventBack } from "../../hooks/usePreventBack";

type Nav = StackNavigationProp<GameStackParamList, "Standings">;
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
  "text-customBlack-500",
];

const StandingsScreen = () => {
  const navigation = useNavigation<Nav>();
  usePreventBack();
  const { t } = useTranslation();

  const players = useGameStore((s) => s.players);
  const heroes = useHeroesStore((s) => s.heroes);
  const gameId = useGameStore((s) => s.gameId);
  const mode = useGameStore((s) => s.mode);
  const lives = useGameStore((s) => s.lives);
  const round = useGameStore((s) => s.round);
  const goToNextRound = useGameStore((s) => s.goToNextRound);
  const resetGame = useGameStore((s) => s.reset);
  const userId = useAuthStore((s) => s.user.id);
  const trackGameFinishedMutation = useTrackGameFinishedMutation();

  const [atBottom, setAtBottom] = useState(false);

  const ranking = useMemo(() => {
    const list = players.map((p) => ({
      ...p,
      lives: lives[p.id] ?? 0,
      rand: Math.random(),
    }));

    list.sort((a, b) => {
      if (b.lives !== a.lives) return b.lives - a.lives;
      return a.rand - b.rand;
    });

    return list;
  }, [players, lives]);

  // топ играч + standingImage/Background на героя му (ако има)
  const topPlayer = ranking[0];
  const topCharacter = topPlayer
    ? heroes.find((h) => h.id === topPlayer.characterId)
    : undefined;
  const topStandingImage = (topCharacter as any)?.standingImage;
  const topStandingBackground =
    // (topCharacter as any)?.standingBackground ||
    backgrounds.bg023;

  const handleStartNextRound = () => {
    goToNextRound();
    // Reset stack to prevent accumulation – crash on round 4+ was likely from too many screens
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Round" }],
      }),
    );
  };

  const handleEndGame = () => {
    if (gameId) {
      trackGameFinishedMutation.mutate(
        { gameId, mode, userId },
        {
          onError: (e) => {
            console.warn("track GAME_FINISHED failed", e);
          },
        },
      );
    }

    resetGame();
    const rootNav = navigation.getParent();
    if (rootNav) {
      rootNav.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: "Onboarding",
              state: {
                routes: [{ name: "Welcome", params: { skipCurtain: true } }],
                index: 0,
              },
            },
          ],
        }),
      );
    }
  };

  const displayRound = round; // брой завършени рундове

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const paddingToBottom = 24;
    const isBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;
    setAtBottom(isBottom);
  };

  // ако имаме standing image – първият се показва горе и го махаме от списъка
  // ако нямаме – показваме всички в списъка
  const listPlayers =
    topStandingImage && topPlayer ? ranking.slice(1) : ranking;

  return (
    <SafeAreaView className="flex-1 bg-primary-700" edges={["right", "left"]}>
      <ImageBackground
        source={topStandingBackground}
        style={{ flex: 1, width: "100%", height: "100%" }}
        resizeMode="cover"
      >
        <View className="flex-1">
          <ScrollView
            contentContainerStyle={{
              paddingTop: 32,
              paddingHorizontal: 16,
              paddingBottom: 120, // място за фиксирания бутон
            }}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {/* Топ играч + standing image с име върху снимката */}
            {topStandingImage && topPlayer && (
              <View className="w-full my-8 relative">
                <ImageBackground
                  source={topStandingImage}
                  resizeMode="contain"
                  style={{
                    width: "100%",
                    // aspectRatio за да държим стабилна височина
                    aspectRatio: 0.8,
                    justifyContent: "flex-end",
                    paddingBottom: 16,
                  }}
                >
                  {/* <View className="absolute top-20 z-50 left-1/2 -translate-x-1/2"> */}
                  {/* <CustomText variant="h5" className="text-center uppercase">
                      {topPlayer.name} - {formatScore(topPlayer.score)}pt
                      {topPlayer.score === 1 ? "" : "s"}
                    </CustomText> */}
                  {/* {topCharacter?.name ? (
                      <CustomText variant="p-small" className="text-center">
                        leading as {topCharacter.name}
                      </CustomText>
                    ) : null} */}
                  {/* </View> */}
                </ImageBackground>
              </View>
            )}
            <View className=" w-full gap-2">
              {/* Класиране (без първия ако има hero секция) */}
              {listPlayers.map((p, index) => {
                const place =
                  topStandingImage && topPlayer ? index + 2 : index + 1;
                const character = heroes.find((h) => h.id === p.characterId);

                return (
                  <View
                    key={p.id}
                    // className="flex-row items-center justify-between bg-black/40 rounded-full pr-8"
                    className="flex-row gap-2  flex-1 bg-black/40 rounded-full px-8 py-4 justify-between"
                  >
                    {/* <View
                        className={`w-[60px] h-[60px] items-center justify-center rounded-full `}
                      >
                        ${COLOR_CLASSES[index % COLOR_CLASSES.length]}
                        <CustomText
                          variant="h4"
                          className="text-center"
                            textColor={`${COLOR_CLASSES[index % COLOR_CLASSES.length]}`}
                        >
                          {place}
                        </CustomText>
                      </View> */}
                    <View className="flex-row gap-4 items-center">
                      <CustomText variant="h4">{place}</CustomText>
                      {character?.profileImage && (
                        <AppImage
                          source={character.profileImage}
                          style={{ width: 72, height: 72 }}
                          contentFit="contain"
                        />
                      )}
                      <View>
                        <CustomText variant="h5" textColor="white">
                          {p.name}
                        </CustomText>
                      </View>
                    </View>
                      <View className="flex-row justify-between items-center">
                      <CustomText variant="h4" textColor="white">
                        ❤️ {p.lives}
                      </CustomText>
                    </View>
                  </View>
                );
              })}
            </View>
            {/* End game + Start next round (когато сме стигнали дъното) */}
            <View className="mt-20 px-4">
              <CustomButton
                title={t("end_game")}
                fullWidth
                appearance="danger"
                onPress={handleEndGame}
              />
            </View>
          </ScrollView>

          {/* Фиксиран бутон – показва се само когато НЕ сме в дъното */}
          <View className="absolute bottom-8 left-0 right-0 px-8">
            <CustomButton
              title={t("start_next_round")}
              fullWidth
              onPress={handleStartNextRound}
            />
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default StandingsScreen;
