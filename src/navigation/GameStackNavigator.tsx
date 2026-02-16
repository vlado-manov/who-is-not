import { createStackNavigator } from "@react-navigation/stack";
import { GameStackParamList } from "./types";
import QuestionScreen from "../screens/Game/QuestionScreen";
import PassDeviceGameplayScreen from "../components/game/PassDeviceGameplayScreen";
import ResultsScreen from "../screens/Game/ResultsScreen";
import VoteNowScreen from "../components/VoteNowScreen";
import VoteScreen from "../screens/Game/VoteScreen";
import VoteResultsScreen from "../screens/Game/VoteResultsScreen";
import RevealScreen from "../screens/Game/RevealScreen";
import PassDeviceVoteScreen from "../components/PassDeviceVoteScreen";
import RoundScreen from "../components/RoundScreen";
import PreRevealScreen from "../screens/Game/PreRevealScreen";
import StandingsScreen from "../screens/Game/StandingsScreen";

const Stack = createStackNavigator<GameStackParamList>();

export default function GameStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Question"
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
      <Stack.Screen name="PassDeviceVote" component={PassDeviceVoteScreen} />
      <Stack.Screen name="VoteResults" component={VoteResultsScreen} />
      <Stack.Screen name="PreReveal" component={PreRevealScreen} />
      <Stack.Screen name="Reveal" component={RevealScreen} />
      <Stack.Screen name="Standings" component={StandingsScreen} />
    </Stack.Navigator>
  );
}
