import { createStackNavigator } from "@react-navigation/stack";
import { GameStackParamList } from "./types";
import QuestionScreen from "../screens/Game/QuestionScreen";

const Stack = createStackNavigator<GameStackParamList>();

export default function GameStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Question"
    >
      <Stack.Screen name="Question" component={QuestionScreen} />
    </Stack.Navigator>
  );
}
