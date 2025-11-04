import { createStackNavigator } from "@react-navigation/stack";
import { CreateGameStackParamList } from "./types";
import PlayersNumberScreen from "../screens/PlayersNumberScreen";
import NameScreen from "../screens/NameScreen";
import HeroPickerScreen from "../screens/HeroPickerScreen";
import LobbyScreen from "../screens/LobbyScreen";
import PassDeviceScreen from "../components/PassDeviceScreen";
import RoundScreen from "../components/RoundScreen";

const Stack = createStackNavigator<CreateGameStackParamList>();

export default function CreateGameStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="PlayersNumber"
    >
      <Stack.Screen name="PlayersNumber" component={PlayersNumberScreen} />
      <Stack.Screen name="Name" component={NameScreen} />
      <Stack.Screen name="HeroPicker" component={HeroPickerScreen} />
      <Stack.Screen name="PassDevice" component={PassDeviceScreen} />
      <Stack.Screen name="Lobby" component={LobbyScreen} />
      <Stack.Screen name="Round" component={RoundScreen} />
    </Stack.Navigator>
  );
}
