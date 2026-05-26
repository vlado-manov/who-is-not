import { createStackNavigator } from "@react-navigation/stack";
import { OnboardingStackParamList } from "./types";
import WelcomeScreen from "../screens/WelcomeScreen";
import MenuPlayScreen from "../screens/MenuPlayScreen";
import StoreScreen from "../screens/StoreScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ReferralScreen from "../screens/ReferralScreen";
import HowToPlayScreen from "../screens/HowToPlayScreen";
import PrivacyScreen from "../screens/PrivacyScreen";
import TermsScreen from "../screens/TermsScreen";
import SupportScreen from "../screens/SupportScreen";
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
        name="Rules"
        component={HowToPlayScreen}
        options={{
          cardStyleInterpolator: Transitions.slideFromRight,
          gestureDirection: "horizontal",
          cardStyle: { backgroundColor: "transparent" },
          cardOverlayEnabled: false,
        }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{
          cardStyleInterpolator: Transitions.slideFromRight,
          gestureDirection: "horizontal",
          cardStyle: { backgroundColor: "transparent" },
          cardOverlayEnabled: false,
        }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{
          cardStyleInterpolator: Transitions.slideFromRight,
          gestureDirection: "horizontal",
          cardStyle: { backgroundColor: "transparent" },
          cardOverlayEnabled: false,
        }}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
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
