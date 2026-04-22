import React, { useEffect } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import ImageBackgroundWithLoadGate from "../../components/ImageBackgroundWithLoadGate";
import CustomButton from "../../components/common/CustomButton";
import CustomText from "../../components/common/CustomText";
import ScreenTopBar from "../../components/common/ScreenTopBar";
import {
  CreateGameStackParamList,
  GameStackParamList,
  OnboardingStackParamList,
  RootStackParamList,
} from "../../navigation/types";
import { useHeroesStore } from "../../store/useHeroesStore";
import { backgrounds } from "../../../assets/backgrounds";
import { useResponsive } from "../../utils/responsive";
import {
  DEV_IDS,
  seedCreateGameHeroPickerFlow,
  seedDevLabBase,
  seedLivesRevealScreen,
  seedPassDeviceGameplay,
  seedResultsBonusScreen,
  seedRoundBonusScreen,
  seedPlayerDeathContinue,
  seedPlayerDeathGameOver,
  seedPreReveal,
  seedQuestionScreen,
  seedQuestionScreenOfType,
  seedResultsScreen,
  seedResultsScreenOfType,
  seedReveal,
  seedRoundScreen,
  seedStandingsScreen,
  seedVoteNow,
  seedVoteScreen,
  seedWinnerCelebration,
  seedWinnerEliminatedOnline,
} from "../../dev/seedDevMultiplayerLab";
import { useGameStore } from "../../store/useGameStore";

type Nav = CompositeNavigationProp<
  StackNavigationProp<OnboardingStackParamList, "DevMultiplayerLab">,
  StackNavigationProp<RootStackParamList>
>;

type Row = { label: string; onPress: () => void };

export default function DevMultiplayerLabScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { horizontalPadding, topIconSize } = useResponsive();

  useEffect(() => {
    void useHeroesStore.getState().loadHeroes();
  }, []);

  const go = <T extends keyof GameStackParamList>(
    seed: () => void,
    screen: T,
    params?: GameStackParamList[T]
  ) => {
    seed();
    navigation.navigate(
      "Game",
      (params === undefined
        ? { screen }
        : { screen, params }) as never
    );
  };

  const goCreate = <T extends keyof CreateGameStackParamList>(
    seed: () => void,
    screen: T,
    params?: CreateGameStackParamList[T]
  ) => {
    seed();
    navigation.navigate(
      "CreateGame",
      (params === undefined
        ? { screen }
        : { screen, params }) as never
    );
  };

  const rows: Row[] = [
    {
      label: "Create — Players number",
      onPress: () => {
        useGameStore.getState().reset();
        navigation.navigate("CreateGame", { screen: "PlayersNumber" } as never);
      },
    },
    {
      label: "Create — HeroPicker (slot 1 · 5 players)",
      onPress: () =>
        goCreate(
          () => seedCreateGameHeroPickerFlow(5),
          "HeroPicker",
          { index: 1 },
        ),
    },
    {
      label: "Create — HeroPicker (slot 2 · 5 players)",
      onPress: () =>
        goCreate(
          () => seedCreateGameHeroPickerFlow(5),
          "HeroPicker",
          { index: 2 },
        ),
    },
    {
      label: "Create — HeroPicker (slot 3 · 5 players)",
      onPress: () =>
        goCreate(
          () => seedCreateGameHeroPickerFlow(5),
          "HeroPicker",
          { index: 3 },
        ),
    },
    {
      label: "Create — HeroPicker (slot 1 · 8 players)",
      onPress: () =>
        goCreate(
          () => seedCreateGameHeroPickerFlow(8),
          "HeroPicker",
          { index: 1 },
        ),
    },
    {
      label: "Question — pick",
      onPress: () => go(seedQuestionScreen, "Question", { playerIndex: 0 }),
    },
    {
      label: "Question — number",
      onPress: () =>
        go(
          () => seedQuestionScreenOfType("number"),
          "Question",
          { playerIndex: 0 },
        ),
    },
    {
      label: "Question — rate",
      onPress: () =>
        go(
          () => seedQuestionScreenOfType("rate"),
          "Question",
          { playerIndex: 0 },
        ),
    },
    {
      label: "Question — input",
      onPress: () =>
        go(
          () => seedQuestionScreenOfType("input"),
          "Question",
          { playerIndex: 0 },
        ),
    },
    {
      label: "Pass device — gameplay (holder 0)",
      onPress: () =>
        go(seedPassDeviceGameplay, "PassDeviceGameplay", { playerIndex: 0 }),
    },
    {
      label: "Pass device — gameplay (holder 1)",
      onPress: () =>
        go(seedPassDeviceGameplay, "PassDeviceGameplay", { playerIndex: 1 }),
    },
    {
      label: "Pass device — gameplay (holder 2)",
      onPress: () =>
        go(seedPassDeviceGameplay, "PassDeviceGameplay", { playerIndex: 2 }),
    },
    {
      label: "Pass device — vote handoff (voter 0)",
      onPress: () =>
        go(seedVoteScreen, "PassDeviceVote", { voterIndex: 0 }),
    },
    {
      label: "Pass device — vote handoff (voter 1)",
      onPress: () =>
        go(seedVoteScreen, "PassDeviceVote", { voterIndex: 1 }),
    },
    {
      label: "Pass device — vote handoff (voter 2)",
      onPress: () =>
        go(seedVoteScreen, "PassDeviceVote", { voterIndex: 2 }),
    },
    {
      label: "Results — pick (answers revealed)",
      onPress: () => go(seedResultsScreen, "Results"),
    },
    {
      label: "Results — bonus (round 5)",
      onPress: () => go(seedResultsBonusScreen, "Results"),
    },
    {
      label: "Results — number (answers revealed)",
      onPress: () =>
        go(() => seedResultsScreenOfType("number"), "Results"),
    },
    {
      label: "Results — rate (answers revealed)",
      onPress: () =>
        go(() => seedResultsScreenOfType("rate"), "Results"),
    },
    {
      label: "Results — input (answers revealed)",
      onPress: () =>
        go(() => seedResultsScreenOfType("input"), "Results"),
    },
    {
      label: "Vote Now",
      onPress: () => go(seedVoteNow, "VoteNow"),
    },
    {
      label: "Vote (voter 0)",
      onPress: () => go(seedVoteScreen, "Vote", { voterIndex: 0 }),
    },
    {
      label: "Vote (voter 1)",
      onPress: () => go(seedVoteScreen, "Vote", { voterIndex: 1 }),
    },
    {
      label: "Vote (voter 2)",
      onPress: () => go(seedVoteScreen, "Vote", { voterIndex: 2 }),
    },
    {
      label: "Pre-reveal (loading)",
      onPress: () => go(seedPreReveal, "PreReveal"),
    },
    {
      label: "Reveal",
      onPress: () => go(seedReveal, "Reveal"),
    },
    {
      label: "Lives reveal (long)",
      onPress: () => go(seedLivesRevealScreen, "LivesReveal"),
    },
    {
      label: "Player death — continue",
      onPress: () =>
        go(seedPlayerDeathContinue, "PlayerDeath", {
          variant: "continue",
          deadPlayerId: DEV_IDS.p2,
        }),
    },
    {
      label: "Player death — game over",
      onPress: () =>
        go(seedPlayerDeathGameOver, "PlayerDeath", {
          variant: "gameOver",
          deadPlayerId: DEV_IDS.p2,
        }),
    },
    {
      label: "Winner (celebration)",
      onPress: () => go(seedWinnerCelebration, "Winner"),
    },
    {
      label: "Winner — eliminated (online UI)",
      onPress: () => go(seedWinnerEliminatedOnline, "Winner"),
    },
    {
      label: "Round (normal)",
      onPress: () => go(seedRoundScreen, "Round"),
    },
    {
      label: "Round — bonus (display 5)",
      onPress: () => go(seedRoundBonusScreen, "Round"),
    },
    {
      label: "Standings",
      onPress: () => go(seedStandingsScreen, "Standings"),
    },
    {
      label: "Vote results (placeholder)",
      onPress: () => {
        seedDevLabBase();
        navigation.navigate("Game", { screen: "VoteResults" } as never);
      },
    },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
        <ImageBackgroundWithLoadGate
          source={backgrounds.bg023}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          <ScreenTopBar
            horizontalPadding={horizontalPadding}
            topIconSize={topIconSize}
            showBack
            onSettings={() => navigation.navigate("Settings")}
            onProfile={() => navigation.navigate("Profile")}
            onBack={() => navigation.navigate("MenuPlay")}
            backAccessibilityLabel={t("back_btn")}
          />
          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingTop: 72, paddingBottom: 32, gap: 10 }}
          >
            <CustomText variant="h5" className="text-white mt-2 mb-1">
              Multiplayer screen lab
            </CustomText>
            <CustomText variant="p-small" className="text-white/80 mb-4">
              Create — opens the real CreateGame stack (Players number, HeroPicker).
              Multiplayer rows seed a fake session (3× Silent Vanessa, LOCAL unless
              noted). No server. Use “Exit lab” on game screens to return here. Vote
              Results is a stub.
            </CustomText>

            {rows.map((r) => (
              <View key={r.label}>
                <CustomButton
                  title={r.label}
                  fullWidth
                  btnSize="sm"
                  fontSize="sm"
                  onPress={r.onPress}
                  backgroundImage={backgrounds.bg015}
                  shadowColor="#2a0a0a"
                />
              </View>
            ))}
          </ScrollView>
        </ImageBackgroundWithLoadGate>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  safe: { flex: 1, backgroundColor: "transparent" },
});
