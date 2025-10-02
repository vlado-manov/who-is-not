import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import { Asset } from "expo-asset";

import "./global.css";
import "./src/i18n";
import { backgrounds } from "./assets/backgrounds";
import LoadingScreen from "./src/components/LoadingScreen";
import RootNavigator from "./src/navigation/RootNavigator";
import { character_avatars } from "./assets/characters";
import { images } from "./assets/images";
import { HEROES } from "./src/data/heroes";

export default function App() {
  const [fontsLoaded] = useFonts({
    "AmaticSC-Bold": require("./assets/fonts/AmaticSC-Bold.ttf"),
    "AmaticSC-Regular": require("./assets/fonts/AmaticSC-Regular.ttf"),
    "AlumniSansCollegiateOne-Regular": require("./assets/fonts/AlumniSansCollegiateOne-Regular.ttf"),
    "ElMessiri-Bold": require("./assets/fonts/ElMessiri-Bold.ttf"),
    "ElMessiri-SemiBold": require("./assets/fonts/ElMessiri-SemiBold.ttf"),
    "ElMessiri-Medium": require("./assets/fonts/ElMessiri-Medium.ttf"),
    "ElMessiri-Regular": require("./assets/fonts/ElMessiri-Regular.ttf"),
    "Oi-Regular": require("./assets/fonts/Oi-Regular.ttf"),
    "OpenSans-Bold": require("./assets/fonts/OpenSans-Bold.ttf"),
    "OpenSans-SemiBold": require("./assets/fonts/OpenSans-SemiBold.ttf"),
    "OpenSans-ExtraBold": require("./assets/fonts/OpenSans-ExtraBold.ttf"),
    "OpenSans-Regular": require("./assets/fonts/OpenSans-Regular.ttf"),
    "OpenSans-Italic": require("./assets/fonts/OpenSans-Italic.ttf"),
    "Overpass-Italic": require("./assets/fonts/Overpass-Italic.ttf"),
    "Overpass-Bold": require("./assets/fonts/Overpass-Bold.ttf"),
    "Overpass-ExtraBold": require("./assets/fonts/Overpass-ExtraBold.ttf"),
    "Overpass-SemiBold": require("./assets/fonts/Overpass-SemiBold.ttf"),
    "Overpass-Regular": require("./assets/fonts/Overpass-Regular.ttf"),
    "SeymourOne-Regular": require("./assets/fonts/SeymourOne-Regular.ttf"),
    "StalinistOne-Regular": require("./assets/fonts/StalinistOne-Regular.ttf"),
  });

  const [assetsReady, setAssetsReady] = useState(false);

  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const toPreload = [
          backgrounds.bg001,
          backgrounds.bg009,
          backgrounds.bgheroes01,
          ...HEROES.map((h) => h.main_image),
          images.passDevice,
          images.curtainTop,
          images.curtainBottom,
          character_avatars.susie,
          character_avatars.booena,
          character_avatars.simpalot,
        ] as any[];
        await Asset.loadAsync(toPreload);
      } finally {
        if (mounted) setAssetsReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const ready = fontsLoaded && assetsReady;

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {ready ? <RootNavigator /> : <LoadingScreen />}
    </NavigationContainer>
  );
}
