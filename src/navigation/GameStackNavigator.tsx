import { createStackNavigator } from "@react-navigation/stack";
import { GameStackParamList } from "./types";
import QuestionScreen from "../screens/Game/QuestionScreen";
import PassDeviceGameplayScreen from "../components/game/PassDeviceGameplayScreen";
import ResultsScreen from "../screens/Game/ResultsScreen";

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
    </Stack.Navigator>
  );
}
