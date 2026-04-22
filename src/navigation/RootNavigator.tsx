import React from "react";
import {
  CardStyleInterpolators,
  createStackNavigator,
} from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import OnboardingStackNavigator from "./OnboardingStackNavigator";
import CreateGameStackNavigator from "./CreateGameStackNavigator";
import GameStackNavigator from "./GameStackNavigator";
import { Transitions } from "./transitions";

const Root = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Root.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
      initialRouteName="Onboarding"
    >
      <Root.Screen name="Onboarding" component={OnboardingStackNavigator} />
      <Root.Screen
        name="CreateGame"
        component={CreateGameStackNavigator}
        options={{
          /** Same vertical feel as onboarding modals: enter from top, pop slides back up. */
          cardStyleInterpolator: Transitions.slideFromTop,
        }}
      />
      <Root.Screen
        name="Game"
        component={GameStackNavigator}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forNoAnimation,
        }}
      />
    </Root.Navigator>
  );
}
