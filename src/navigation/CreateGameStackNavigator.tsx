import { createStackNavigator } from "@react-navigation/stack";
import { CreateGameStackParamList } from "./types";
import PlayersNumberScreen from "../screens/PlayersNumberScreen";
import HeroPickerScreen from "../screens/HeroPickerScreen";
import SettingsScreen from "../screens/SettingsScreen";
import LobbyScreen from "../screens/LobbyScreen";
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
        options={{ cardStyleInterpolator: Transitions.fade }}
      />
      <Stack.Screen
        name="HeroPicker"
        component={HeroPickerScreen}
        options={instantTransition}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ cardStyleInterpolator: Transitions.fade }}
      />
      <Stack.Screen name="PassDevice" component={PassDeviceScreen} />
      <Stack.Screen
        name="Lobby"
        component={LobbyScreen}
        options={instantTransition}
      />
      {/* <Stack.Screen name="Round" component={RoundScreen} /> */}
    </Stack.Navigator>
  );
}
