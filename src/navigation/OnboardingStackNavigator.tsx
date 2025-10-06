import { createStackNavigator } from "@react-navigation/stack";
import { OnboardingStackParamList } from "./types";
import WelcomeScreen from "../screens/WelcomeScreen";
import MenuScreen from "../screens/MenuScreen";
import MenuPlayScreen from "../screens/MenuPlayScreen";
import StoreScreen from "../screens/StoreScreen";

const Stack = createStackNavigator<OnboardingStackParamList>();
export default function OnboardingStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Welcome"
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Menu" component={MenuScreen} />
      <Stack.Screen name="MenuPlay" component={MenuPlayScreen} />
      <Stack.Screen name="Store" component={StoreScreen} />
    </Stack.Navigator>
  );
}
