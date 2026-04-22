import { createStackNavigator } from "@react-navigation/stack";
import { OnboardingStackParamList } from "./types";
import WelcomeScreen from "../screens/WelcomeScreen";
import MenuPlayScreen from "../screens/MenuPlayScreen";
import StoreScreen from "../screens/StoreScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ReferralScreen from "../screens/ReferralScreen";
import SettingsScreen from "../screens/SettingsScreen";
import HowToPlayScreen from "../screens/HowToPlayScreen";
import DevMultiplayerLabScreen from "../screens/dev/DevMultiplayerLabScreen";
import { Transitions } from "./transitions";

const Stack = createStackNavigator<OnboardingStackParamList>();
export default function OnboardingStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Welcome"
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        initialParams={{ skipCurtain: true }}
      />
      <Stack.Screen
        name="MenuPlay"
        component={MenuPlayScreen}
        options={{
          cardStyleInterpolator: Transitions.slideFromTop,
        }}
      />
      <Stack.Screen
        name="Store"
        component={StoreScreen}
        options={{
          cardStyleInterpolator: Transitions.slideFromRight,
          gestureDirection: "horizontal",
          cardStyle: { backgroundColor: "transparent" },
          cardOverlayEnabled: false,
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          cardStyleInterpolator: Transitions.slideFromRight,
          gestureDirection: "horizontal",
          cardStyle: { backgroundColor: "transparent" },
          cardOverlayEnabled: false,
        }}
      />
      <Stack.Screen
        name="Referral"
        component={ReferralScreen}
        options={{
          cardStyleInterpolator: Transitions.slideFromTop,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          cardStyleInterpolator: Transitions.slideFromRight,
          gestureDirection: "horizontal",
          cardStyle: { backgroundColor: "transparent" },
          cardOverlayEnabled: false,
        }}
      />
      <Stack.Screen
        name="Rules"
        component={HowToPlayScreen}
        options={{
          cardStyleInterpolator: Transitions.slideFromRight,
          gestureDirection: "horizontal",
          cardStyle: { backgroundColor: "transparent" },
          cardOverlayEnabled: false,
        }}
      />
      {__DEV__ && (
        <Stack.Screen
          name="DevMultiplayerLab"
          component={DevMultiplayerLabScreen}
          options={{
            cardStyleInterpolator: Transitions.slideFromTop,
          }}
        />
      )}
    </Stack.Navigator>
  );
}
