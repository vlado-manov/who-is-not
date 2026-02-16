import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useEffect, useRef, useState } from "react";
import { AppState, Image } from "react-native";
import { Asset } from "expo-asset";

import "./global.css";
import "./src/i18n";

import { backgrounds } from "./assets/backgrounds";
import {
  character_avatars,
  character_standing_backgrounds,
  character_videos,
  characters_wonRound,
} from "./assets/characters";
import {
  game_images,
  htp_images,
  images,
  loaderFrames,
  store_images,
} from "./assets/images";

import RootNavigator from "./src/navigation/RootNavigator";
import InitialLoadingScreen from "./src/components/InitialLoadingScreen";
import { useAuthStore } from "./src/store/useUserStore";
import { useHeroesStore } from "./src/store/useHeroesStore";
import AudioManager from "./src/utils/audioManager";
import { character_sounds } from "./assets/audio";
import {
  startPresence,
  heartbeatPresence,
  endPresence,
} from "./src/api/presence";
import { ImageSourcePropType } from "react-native";

function extractUri(source?: ImageSourcePropType) {
  if (!source || typeof source === "number") return null;
  if (Array.isArray(source)) return source[0]?.uri ?? null;
  return source.uri ?? null;
}

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
  const [heroesMediaReady, setHeroesMediaReady] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const presenceSessionIdRef = useRef<string | null>(null);
  AudioManager.stopBackground();
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
          ...values(game_images),
          ...values(character_videos),
          ...values(htp_images),
          ...values(character_standing_backgrounds),
          ...values(character_sounds),
          ...values(loaderFrames),
          ...values(characters_wonRound),
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

  const audioSettings = useAuthStore((s) => s.settings);
  const userId = useAuthStore((s) => s.user.id);
  const loadHeroes = useHeroesStore((s) => s.loadHeroes);
  const heroes = useHeroesStore((s) => s.heroes);
  const heroesLoaded = useHeroesStore((s) => s.loaded);
  const heroesLoading = useHeroesStore((s) => s.loading);

  useEffect(() => {
    AudioManager.setSoundEnabled(audioSettings.soundEnabled);
    AudioManager.setMusicEnabled(
      audioSettings.musicLevel > 0,
      audioSettings.musicLevel
    );
    AudioManager.setSfxEnabled(
      audioSettings.sfxLevel > 0,
      audioSettings.sfxLevel
    );
  }, [
    audioSettings.soundEnabled,
    audioSettings.musicLevel,
    audioSettings.sfxLevel,
  ]);

  useEffect(() => {
    if (!heroesLoaded && !heroesLoading) {
      void loadHeroes();
    }
  }, [heroesLoaded, heroesLoading, loadHeroes]);

  useEffect(() => {
    if (!heroesLoaded) return;

    let canceled = false;
    (async () => {
      const remoteUris: string[] = [];
      for (const h of heroes) {
        const mainUri = extractUri(h.main_image);
        if (mainUri) remoteUris.push(mainUri);
        const profileUri = extractUri(h.profileImage);
        if (profileUri) remoteUris.push(profileUri);
        for (const img of h.winImages) {
          const uri = extractUri(img);
          if (uri) remoteUris.push(uri);
        }
        for (const img of h.loseImages) {
          const uri = extractUri(img);
          if (uri) remoteUris.push(uri);
        }
      }

      if (remoteUris.length > 0) {
        await Promise.all(
          remoteUris.map((u) => Image.prefetch(u).catch(() => false))
        );
      }

      if (!canceled) {
        setHeroesMediaReady(true);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [heroesLoaded, heroes]);

  useEffect(() => {
    if (heroBgReady && restReady && fontsLoaded && heroesMediaReady) {
      const t = setTimeout(() => setAppReady(true), 100);
      return () => clearTimeout(t);
    }
  }, [heroBgReady, restReady, fontsLoaded, heroesMediaReady]);

  useEffect(() => {
    if (!appReady || !userId) return;
    let active = true;
    let hb: ReturnType<typeof setInterval> | null = null;

    const start = async () => {
      try {
        const res = await startPresence(userId);
        if (!active) return;
        presenceSessionIdRef.current = res.sessionId;
        hb = setInterval(() => {
          void heartbeatPresence(userId, res.sessionId).catch((e) => {
            console.warn("presence heartbeat failed", e);
          });
        }, 20000);
      } catch (e) {
        console.warn("presence start failed", e);
      }
    };

    void start();

    const sub = AppState.addEventListener("change", (nextState) => {
      const sessionId = presenceSessionIdRef.current;
      if (!sessionId) return;
      if (nextState === "active") {
        void heartbeatPresence(userId, sessionId).catch((e) =>
          console.warn("presence resume heartbeat failed", e)
        );
      }
      if (nextState === "background" || nextState === "inactive") {
        void endPresence(userId, sessionId).catch((e) =>
          console.warn("presence end failed", e)
        );
      }
    });

    return () => {
      active = false;
      if (hb) clearInterval(hb);
      sub.remove();
      const sessionId = presenceSessionIdRef.current;
      if (sessionId) {
        void endPresence(userId, sessionId).catch(() => undefined);
        presenceSessionIdRef.current = null;
      }
    };
  }, [appReady, userId]);

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
