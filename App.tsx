import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import { Asset } from "expo-asset";

import "./global.css";
import "./src/i18n";

import { backgrounds } from "./assets/backgrounds";
import { character_avatars } from "./assets/characters";
import { images, store_images } from "./assets/images";
import { HEROES } from "./src/data/heroes";

import RootNavigator from "./src/navigation/RootNavigator";
import InitialLoadingScreen from "./src/components/InitialLoadingScreen";
import { useAuthStore } from "./src/store/useUserStore";
import AudioManager from "./src/utils/audioManager";

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

  const [heroBgReady, setHeroBgReady] = useState(false);
  const [restReady, setRestReady] = useState(false);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await Asset.loadAsync([backgrounds.bgheroes01]);
      } finally {
        if (active) setHeroBgReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const values = (obj: Record<string, any>) =>
      Object.values(obj).filter(Boolean);

    (async () => {
      try {
        const allBackgrounds = values(backgrounds).filter(
          (v) => v !== backgrounds.bgheroes01
        );
        const toPreload = [
          ...allBackgrounds,
          ...values(character_avatars),
          ...values(store_images),
          ...values(images),
          ...HEROES.map((h) => h.main_image),
        ];
        await Asset.loadAsync(toPreload);
      } finally {
        if (active) setRestReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const soundEnabled = useAuthStore((s) => s.settings.soundEnabled);

  useEffect(() => {
    AudioManager.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    if (heroBgReady && restReady && fontsLoaded) {
      const t = setTimeout(() => setAppReady(true), 100);
      return () => clearTimeout(t);
    }
  }, [heroBgReady, restReady, fontsLoaded]);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {appReady ? (
        <RootNavigator />
      ) : (
        <InitialLoadingScreen heroReady={heroBgReady} />
      )}
    </NavigationContainer>
  );
}
