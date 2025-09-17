import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import OnboardingStackNavigator from "./OnboardingStackNavigator";
import CreateGameStackNavigator from "./CreateGameStackNavigator";
import GameStackNavigator from "./GameStackNavigator";

const Root = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Root.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Onboarding"
    >
      <Root.Screen name="Onboarding" component={OnboardingStackNavigator} />
      <Root.Screen name="CreateGame" component={CreateGameStackNavigator} />
      <Root.Screen name="Game" component={GameStackNavigator} />
    </Root.Navigator>
  );
}

{
  /* <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen
        name="Menu"
        component={MenuScreen}
        options={{
          gestureDirection: "horizontal", // жест вертикално (по желание)
          cardStyleInterpolator: forFlipHorizontal,
        }}
      />
      <Stack.Screen
        name="MenuPlay"
        component={MenuPlayScreen}
        options={{
          gestureDirection: "horizontal", // жест вертикално (по желание)
          cardStyleInterpolator: forOverlayFade,
        }}
      /> */
}
{
  /* <Stack.Screen
        name="PlayersNumber"
        component={PlayersNumberScreen}
        options={{
          gestureDirection: "horizontal", // жест вертикално (по желание)
          cardStyleInterpolator: forParallax,
        }}
      />
      <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
      <Stack.Screen name="RoomCode" component={RoomCodeScreen} />
      <Stack.Screen
        name="Name"
        component={NameScreen}
        options={{
          gestureDirection: "horizontal", // жест вертикално (по желание)
          cardStyleInterpolator: forParallax,
        }}
      />
      <Stack.Screen
        name="HeroPicker"
        component={HeroPickerScreen}
        options={{
          gestureDirection: "horizontal", // жест вертикално (по желание)
          cardStyleInterpolator: forParallax,
        }}
      />
      <Stack.Screen name="Lobby" component={LobbyScreen} />
      <Stack.Screen name="Question" component={QuestionScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
      <Stack.Screen name="Vote" component={VoteScreen} />
      <Stack.Screen name="VoteResults" component={VoteResultsScreen} />
      <Stack.Screen name="Reveal" component={RevealScreen} /> */
}
