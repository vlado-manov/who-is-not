import React, { useEffect } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import FullBleedStack from "../../components/FullBleedStack";
import ImageBackgroundWithLoadGate from "../../components/ImageBackgroundWithLoadGate";
import CustomButton from "../../components/common/CustomButton";
import CustomText from "../../components/common/CustomText";
import ScreenTopBar from "../../components/common/ScreenTopBar";
import { useUserSettingsSheet } from "../../context/UserSettingsModalContext";
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
  seedPlayerDeathWatchDemo,
  seedPreReveal,
  seedQuestionScreen,
  seedQuestionScreenOfType,
  seedResultsScreen,
  seedResultsScreenOfType,
  seedRevealLose,
  seedRevealWin,
  seedRoundScreen,
  seedStandingsScreen,
  seedVoteNow,
  seedVoteScreen,
  seedWinnerCelebration,
  seedWinnerEliminatedOnline,
  seedDeathMatchLocal,
  seedDeathMatchWinnerSingle,
  seedDeathMatchWinnerTie,
  seedHeroButtonsGroup1,
  seedHeroButtonsGroup2,
} from "../../dev/seedDevMultiplayerLab";
import { useGameStore } from "../../store/useGameStore";

type Nav = CompositeNavigationProp<
  StackNavigationProp<OnboardingStackParamList, "DevMultiplayerLab">,
  StackNavigationProp<RootStackParamList>
>;

type Row = { label: string; onPress: () => void };

export default function DevMultiplayerLabScreen() {
  const navigation = useNavigation<Nav>();
  const { openUserSettings } = useUserSettingsSheet();
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
      label: "Vote Now — voter 0",
      onPress: () => go(seedVoteScreen, "VoteNow", { voterIndex: 0 }),
    },
    {
      label: "Vote Now — voter 1",
      onPress: () => go(seedVoteScreen, "VoteNow", { voterIndex: 1 }),
    },
    {
      label: "Vote Now — voter 2",
      onPress: () => go(seedVoteScreen, "VoteNow", { voterIndex: 2 }),
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
      onPress: () => go(seedVoteNow, "VoteNow", { voterIndex: 0 }),
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
      label: "Reveal (win)",
      onPress: () => go(seedRevealWin, "Reveal"),
    },
    {
      label: "Reveal (lose)",
      onPress: () => go(seedRevealLose, "Reveal"),
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
      label: "Player death — watch feed (auto events)",
      onPress: () =>
        go(seedPlayerDeathWatchDemo, "PlayerDeath", {
          variant: "continue",
          deadPlayerId: DEV_IDS.local,
        }),
    },
    {
      label: "Hero buttons — group 1 (10 heroes: Vanessa → Dad GPT)",
      onPress: () => go(seedHeroButtonsGroup1, "Vote", { voterIndex: 0 }),
    },
    {
      label: "Hero buttons — group 2 (8 heroes: Screena → Dr. Wrong)",
      onPress: () => go(seedHeroButtonsGroup2, "Vote", { voterIndex: 0 }),
    },
    {
      label: "Deathmatch (local setup)",
      onPress: () => go(seedDeathMatchLocal, "DeathMatch"),
    },
    {
      label: "Deathmatch winner — single",
      onPress: () => go(seedDeathMatchWinnerSingle, "Winner"),
    },
    {
      label: "Deathmatch winner — tie",
      onPress: () => go(seedDeathMatchWinnerTie, "Winner"),
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

    // FONT LAB
    {
      label: "Font — SeymourOne (current)",
      onPress: () => navigation.navigate("DevFontPreview", { fontFamily: "SeymourOne-Regular", label: "SeymourOne Regular (current)" }),
    },
    {
      label: "Font — Alumni Sans Collegiate One",
      onPress: () => navigation.navigate("DevFontPreview", { fontFamily: "AlumniSansCollegiateOne-Regular", label: "Alumni Sans Collegiate One" }),
    },
    {
      label: "Font — Hachi Maru Pop",
      onPress: () => navigation.navigate("DevFontPreview", { fontFamily: "HachiMaruPop-Regular", label: "Hachi Maru Pop" }),
    },
    {
      label: "Font — Onest Bold",
      onPress: () => navigation.navigate("DevFontPreview", { fontFamily: "Onest-Bold", label: "Onest Bold" }),
    },
    {
      label: "Font — Onest ExtraBold",
      onPress: () => navigation.navigate("DevFontPreview", { fontFamily: "Onest-ExtraBold", label: "Onest ExtraBold" }),
    },
    {
      label: "Font — Onest Black",
      onPress: () => navigation.navigate("DevFontPreview", { fontFamily: "Onest-Black", label: "Onest Black" }),
    },
    {
      label: "Font — Oi",
      onPress: () => navigation.navigate("DevFontPreview", { fontFamily: "Oi-Regular", label: "Oi Regular" }),
    },
    {
      label: "Font — Overpass Bold",
      onPress: () => navigation.navigate("DevFontPreview", { fontFamily: "Overpass-Bold", label: "Overpass Bold" }),
    },
    {
      label: "Font — Overpass ExtraBold",
      onPress: () => navigation.navigate("DevFontPreview", { fontFamily: "Overpass-ExtraBold", label: "Overpass ExtraBold" }),
    },
    {
      label: "Font — Pacifico",
      onPress: () => navigation.navigate("DevFontPreview", { fontFamily: "Pacifico-Regular", label: "Pacifico" }),
    },
    {
      label: "Font — Sofia Sans Condensed Bold",
      onPress: () => navigation.navigate("DevFontPreview", { fontFamily: "SofiaSansExtraCondensed-Bold", label: "Sofia Sans Extra Condensed Bold" }),
    },
    {
      label: "Font — Sofia Sans Condensed ExtraBold",
      onPress: () => navigation.navigate("DevFontPreview", { fontFamily: "SofiaSansExtraCondensed-ExtraBold", label: "Sofia Sans Extra Condensed ExtraBold" }),
    },
    {
      label: "Font — Sofia Sans Condensed Black",
      onPress: () => navigation.navigate("DevFontPreview", { fontFamily: "SofiaSansExtraCondensed-Black", label: "Sofia Sans Extra Condensed Black" }),
    },
    {
      label: "Font — Stalinist One",
      onPress: () => navigation.navigate("DevFontPreview", { fontFamily: "StalinistOne-Regular", label: "Stalinist One" }),
    },
    {
      label: "Font — Tektur Bold",
      onPress: () => navigation.navigate("DevFontPreview", { fontFamily: "Tektur-Bold", label: "Tektur Bold" }),
    },
    {
      label: "Font — Tektur ExtraBold",
      onPress: () => navigation.navigate("DevFontPreview", { fontFamily: "Tektur-ExtraBold", label: "Tektur ExtraBold" }),
    },
    {
      label: "Font — Tektur Black",
      onPress: () => navigation.navigate("DevFontPreview", { fontFamily: "Tektur-Black", label: "Tektur Black" }),
    },
    {
      label: "Font — Yanone Kaffeesatz SemiBold",
      onPress: () => navigation.navigate("DevFontPreview", { fontFamily: "YanoneKaffeesatz-SemiBold", label: "Yanone Kaffeesatz SemiBold" }),
    },
    {
      label: "Font — Yanone Kaffeesatz Bold",
      onPress: () => navigation.navigate("DevFontPreview", { fontFamily: "YanoneKaffeesatz-Bold", label: "Yanone Kaffeesatz Bold" }),
    },
  ];

  return (
    <FullBleedStack
      rootStyle={styles.root}
      backdrop={
        <ImageBackgroundWithLoadGate
          source={backgrounds.bg023}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      }
    >
      <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
          <ScreenTopBar
            horizontalPadding={horizontalPadding}
            topIconSize={topIconSize}
            showBack
            onSettings={() => openUserSettings()}
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

            <CustomButton
              title="Button + Background Lab"
              fullWidth
              btnSize="sm"
              fontSize="sm"
              onPress={() => navigation.navigate("DevButtonLab")}
              backgroundImage={backgrounds.bg026}
              glow
              glowColor="rgba(41,255,25,0.8)"
              shadowColor="#005f07"
            />

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
      </SafeAreaView>
    </FullBleedStack>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  safe: { flex: 1, backgroundColor: "transparent" },
});
