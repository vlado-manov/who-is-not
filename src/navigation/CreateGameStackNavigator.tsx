import React from "react";
import { StyleSheet, View } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { CreateGameStackParamList } from "./types";
import DevGameExitOverlay from "../components/dev/DevGameExitOverlay";
import PlayersNumberScreen from "../screens/PlayersNumberScreen";
import HeroPickerScreen from "../screens/HeroPickerScreen";
import LobbyScreen from "../screens/LobbyScreen";
import OnlineHostScreen from "../screens/OnlineHostScreen";
import OnlineJoinScreen from "../screens/OnlineJoinScreen";
import PassDeviceScreen from "../components/PassDeviceScreen";
import { Transitions } from "./transitions";
// import RoundScreen from "../components/RoundScreen";

const Stack = createStackNavigator<CreateGameStackParamList>();

export default function CreateGameStackNavigator() {
  const instantTransition = {
    transitionSpec: {
      open: { animation: "timing" as const, config: { duration: 0 } },
      close: { animation: "timing" as const, config: { duration: 0 } },
    },
  };

  return (
    <View style={styles.wrap}>
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
      initialRouteName="PlayersNumber"
    >
      <Stack.Screen
        name="PlayersNumber"
        component={PlayersNumberScreen}
        options={{ cardStyleInterpolator: Transitions.slideFromTop }}
      />
      <Stack.Screen
        name="HeroPicker"
        component={HeroPickerScreen}
        options={instantTransition}
      />
      <Stack.Screen name="PassDevice" component={PassDeviceScreen} />
      <Stack.Screen
        name="Lobby"
        component={LobbyScreen}
        options={instantTransition}
      />
      <Stack.Screen
        name="OnlineHost"
        component={OnlineHostScreen}
        options={{ cardStyleInterpolator: Transitions.slideFromTop }}
      />
      <Stack.Screen
        name="OnlineJoin"
        component={OnlineJoinScreen}
        options={{ cardStyleInterpolator: Transitions.slideFromTop }}
      />
      {/* <Stack.Screen name="Round" component={RoundScreen} /> */}
    </Stack.Navigator>
    {__DEV__ && <DevGameExitOverlay />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
});
