import React, { useCallback, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { CommonActions } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useGameStore } from "../store/useGameStore";
import OnlineSessionSyncListener from "../components/online/OnlineSessionSyncListener";
import OnlineRoomBanner from "../components/online/OnlineRoomBanner";
import DevGameExitOverlay from "../components/dev/DevGameExitOverlay";
import { GameStackParamList } from "./types";
import QuestionScreen from "../screens/Game/QuestionScreen";
import PassDeviceGameplayScreen from "../components/game/PassDeviceGameplayScreen";
import ResultsScreen from "../screens/Game/ResultsScreen";
import VoteNowScreen from "../components/VoteNowScreen";
import VoteScreen from "../screens/Game/VoteScreen";
import VoteResultsScreen from "../screens/Game/VoteResultsScreen";
import RevealScreen from "../screens/Game/RevealScreen";
import LivesRevealScreen from "../screens/Game/LivesRevealScreen";
import RoundScreen from "../components/RoundScreen";
import PreRevealScreen from "../screens/Game/PreRevealScreen";
import StandingsScreen from "../screens/Game/StandingsScreen";
import WinnerScreen from "../screens/Game/WinnerScreen";
import PlayerDeathScreen from "../screens/Game/PlayerDeathScreen";
import GameplayRefreshButton from "../components/game/GameplayRefreshButton";

const Stack = createStackNavigator<GameStackParamList>();

type ActiveGameRoute = {
  name: keyof GameStackParamList;
  params?: GameStackParamList[keyof GameStackParamList];
};

export default function GameStackNavigator() {
  const mode = useGameStore((s) => s.mode);
  const stackNavigationRef = useRef<any>(null);
  const activeRouteRef = useRef<ActiveGameRoute>({ name: "Question" });

  const refreshCurrentScreen = useCallback(() => {
    const activeRoute = activeRouteRef.current;
    stackNavigationRef.current?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: activeRoute.name,
            params: activeRoute.params,
          },
        ],
      }),
    );
  }, []);

  return (
    <View style={styles.wrap}>
      <Stack.Navigator
        screenOptions={{ headerShown: false, gestureEnabled: false }}
        initialRouteName="Question"
        screenListeners={({ navigation }) => {
          stackNavigationRef.current = navigation;
          return {
            state: (event) => {
              const state = event.data.state;
              const route = state.routes[state.index];
              if (!route?.name) return;
              activeRouteRef.current = {
                name: route.name as keyof GameStackParamList,
                params:
                  route.params as GameStackParamList[keyof GameStackParamList],
              };
            },
          };
        }}
      >
        <Stack.Screen name="Question" component={QuestionScreen} />
        <Stack.Screen
          name="PassDeviceGameplay"
          component={PassDeviceGameplayScreen}
        />
        <Stack.Screen name="Results" component={ResultsScreen} />
        <Stack.Screen name="Round" component={RoundScreen} />
        <Stack.Screen name="VoteNow" component={VoteNowScreen} />
        <Stack.Screen name="Vote" component={VoteScreen} />
        <Stack.Screen name="VoteResults" component={VoteResultsScreen} />
        <Stack.Screen name="PreReveal" component={PreRevealScreen} />
        <Stack.Screen name="Reveal" component={RevealScreen} />
        <Stack.Screen name="LivesReveal" component={LivesRevealScreen} />
        <Stack.Screen name="PlayerDeath" component={PlayerDeathScreen} />
        <Stack.Screen name="Winner" component={WinnerScreen} />
        <Stack.Screen name="Standings" component={StandingsScreen} />
      </Stack.Navigator>
      <GameplayRefreshButton onRefresh={refreshCurrentScreen} />
      {mode === "ONLINE" && <OnlineSessionSyncListener />}

      {mode === "ONLINE" && <OnlineRoomBanner />}
      {__DEV__ && <DevGameExitOverlay />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
});
