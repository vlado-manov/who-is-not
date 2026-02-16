import { createStackNavigator } from "@react-navigation/stack";
import { OnboardingStackParamList } from "./types";
import WelcomeScreen from "../screens/WelcomeScreen";
import MenuScreen from "../screens/MenuScreen";
import MenuPlayScreen from "../screens/MenuPlayScreen";
import StoreScreen from "../screens/StoreScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";
import HowToPlayScreen from "../screens/HowToPlayScreen";
import { Transitions } from "./transitions";

const Stack = createStackNavigator<OnboardingStackParamList>();
export default function OnboardingStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Welcome"
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Menu" component={MenuScreen} />
      <Stack.Screen
        name="MenuPlay"
        component={MenuPlayScreen}
        options={{
          cardStyleInterpolator: Transitions.fade,
        }}
      />
      <Stack.Screen
        name="Store"
        component={StoreScreen}
        options={{
          cardStyleInterpolator: Transitions.fade,
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          cardStyleInterpolator: Transitions.fade,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          cardStyleInterpolator: Transitions.fade,
        }}
      />
      <Stack.Screen
        name="Rules"
        component={HowToPlayScreen}
        options={{
          cardStyleInterpolator: Transitions.fade,
        }}
      />
    </Stack.Navigator>
  );
}
