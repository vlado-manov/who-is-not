import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import { Image as ExpoImage } from "expo-image";
import { Linking, Platform, View } from "react-native";
import { AppState } from "react-native";
import { useRef } from "react";

import "./global.css";
import { loadStoredLanguagePreference } from "./src/i18n";

import RootNavigator from "./src/navigation/RootNavigator";
import CurtainOverlay from "./src/components/CurtainOverlay";
import CrashBoundary from "./src/components/CrashBoundary";
import { useAuthStore } from "./src/store/useUserStore";
import AudioManager from "./src/utils/audioManager";
import { assertContractCompatibility } from "./src/api/contracts";
import { queryClient } from "./src/api/queryClient";
import { useSyncHeroesStore } from "./src/api/hooks/useSyncHeroesStore";
import { usePrefetchCharacterMedia } from "./src/api/hooks/usePrefetchCharacterMedia";
import { setApiErrorHandler } from "./src/api/errorHandler";
import { ApiError } from "./src/api/types";
import { setStoredReferralCode, postReferralClick } from "./src/api/referral";
import { backgrounds } from "./assets/backgrounds";
import { game_images, htp_images } from "./assets/images";
import { fetchCharacters, collectCharacterImageUris } from "./src/api/heroes";
import { queryKeys } from "./src/api/queryKeys";
import { REMOTE_GAME_URLS } from "./src/utils/prefetchRemoteUrls";
import type { ICharacter } from "./src/types/character";
import {
  addCrashBreadcrumb,
  getStoredCrashReports,
  initCrashMonitor,
} from "./src/utils/crashMonitor";

/** Preload на assets преди HeroPickerScreen (character images, backgrounds, game URLs). */
async function preloadHeroPickerAssets(
  onProgress?: (progress: number) => void,
): Promise<void> {
  const report = (value: number) => {
    onProgress?.(Math.max(0, Math.min(1, value)));
  };

  const values = (obj: Record<string, unknown>) =>
    Object.values(obj).filter(Boolean);
  const localBackgrounds = values(backgrounds).filter(
    (v): v is number => typeof v === "number",
  );
  const toPreload = [
    ...localBackgrounds,
    ...values(game_images).filter((v): v is number => typeof v === "number"),
    ...values(htp_images).filter((v): v is number => typeof v === "number"),
  ];

  report(0);

  let chars: ICharacter[] = [];
  try {
    chars = await fetchCharacters();
    queryClient.setQueryData(queryKeys.characters, chars);
  } catch (e) {
    console.warn("preloadHeroPickerAssets: fetchCharacters failed", e);
  }

  const localAssets = [...new Set(toPreload)];
  const remoteUrls = [...new Set(REMOTE_GAME_URLS)];
  const characterUrls = collectCharacterImageUris(chars);

  const total =
    1 + localAssets.length + remoteUrls.length + characterUrls.length;
  let completed = 1;
  report(completed / total);

  const markDone = () => {
    completed += 1;
    report(completed / total);
  };

  await Promise.all([
    ...localAssets.map((moduleId) =>
      Asset.fromModule(moduleId)
        .downloadAsync()
        .catch(() => null)
        .then(markDone),
    ),
    ...remoteUrls.map((url) =>
      ExpoImage.prefetch(url)
        .catch(() => false)
        .then(markDone),
    ),
    ...characterUrls.map((url) =>
      ExpoImage.prefetch(url)
        .catch(() => false)
        .then(markDone),
    ),
  ]);

  report(1);
}

function ApiBootstrap() {
  useSyncHeroesStore();
  usePrefetchCharacterMedia();
  return null;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    "AmaticSC-Bold": require("./assets/fonts/AmaticSC-Bold.ttf"),
    "AmaticSC-Regular": require("./assets/fonts/AmaticSC-Regular.ttf"),
    "ElMessiri-Bold": require("./assets/fonts/ElMessiri-Bold.ttf"),
    "ElMessiri-SemiBold": require("./assets/fonts/ElMessiri-SemiBold.ttf"),
    "ElMessiri-Medium": require("./assets/fonts/ElMessiri-Medium.ttf"),
    "ElMessiri-Regular": require("./assets/fonts/ElMessiri-Regular.ttf"),
    "OpenSans-Bold": require("./assets/fonts/OpenSans-Bold.ttf"),
    "OpenSans-SemiBold": require("./assets/fonts/OpenSans-SemiBold.ttf"),
    "OpenSans-ExtraBold": require("./assets/fonts/OpenSans-ExtraBold.ttf"),
    "OpenSans-Regular": require("./assets/fonts/OpenSans-Regular.ttf"),
    "OpenSans-Italic": require("./assets/fonts/OpenSans-Italic.ttf"),
    "SeymourOne-Regular": require("./assets/fonts/SeymourOne-Regular.ttf"),
  });

  const [languageReady, setLanguageReady] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const navRef = useRef<any>(null);
  const lastRouteRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    AudioManager.stopBackground();
  }, []);

  useEffect(() => {
    void initCrashMonitor().then(async () => {
      const reports = await getStoredCrashReports();
      if (reports.length > 0) {
        const last = reports[reports.length - 1];
        console.warn(
          `[crash-monitor] Last captured crash: ${last.kind} at ${last.t}: ${last.message}`,
        );
      }
    });
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      void addCrashBreadcrumb("app_state", { state });
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      await loadStoredLanguagePreference();
      if (active) setLanguageReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const canShowCurtain = fontsLoaded && languageReady;

  const onCurtainDone = () => {
    setAppReady(true);
  };

  const soundEnabled = useAuthStore((s) => s.settings.soundEnabled);

  useEffect(() => {
    AudioManager.applySettingsFromStore(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    void assertContractCompatibility().catch((e) => {
      console.warn(
        "[api-contract]",
        e instanceof Error
          ? e.message
          : "Failed to validate API contract compatibility",
      );
    });
  }, []);

  useEffect(() => {
    const handleReferralUrl = (url: string) => {
      try {
        const codeMatch = url.match(/[?&]code=([^&]+)/);
        const codeFromQuery = codeMatch?.[1];
        const pathMatch = url.match(/invite[/\\]?([A-Za-z0-9]+)/);
        const codeFromPath = pathMatch?.[1];
        const code = codeFromQuery ?? codeFromPath ?? null;
        if (code) {
          void setStoredReferralCode(code).then(() => {
            void postReferralClick({
              code,
              platform: Platform.OS,
            }).catch(() => {});
          });
        }
      } catch {}
    };

    const handleUrl = (e: { url: string }) => handleReferralUrl(e.url);
    const subscription = Linking.addEventListener("url", handleUrl);
    void Linking.getInitialURL().then((url) => {
      if (url && (url.includes("invite") || url.includes("ref=")))
        handleReferralUrl(url);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    setApiErrorHandler((error: ApiError) => {
      console.warn(
        "[api-error]",
        `code=${error.code} status=${error.status ?? "n/a"} trace=${error.traceId ?? "n/a"} message=${error.message}`,
      );
    });
    return () => setApiErrorHandler(null);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ApiBootstrap />
      <NavigationContainer
        ref={navRef}
        onReady={() => {
          const route = navRef.current?.getCurrentRoute?.()?.name;
          lastRouteRef.current = route;
          if (route) void addCrashBreadcrumb("route_ready", { route });
        }}
        onStateChange={() => {
          const nextRoute = navRef.current?.getCurrentRoute?.()?.name;
          const prevRoute = lastRouteRef.current;
          if (nextRoute && nextRoute !== prevRoute) {
            void addCrashBreadcrumb("route_change", {
              from: prevRoute ?? "unknown",
              to: nextRoute,
            });
            lastRouteRef.current = nextRoute;
          }
        }}
      >
        <StatusBar style="light" />
        {!canShowCurtain ? (
          <View style={{ flex: 1, backgroundColor: "#000" }} />
        ) : (
          <CrashBoundary>
            <RootNavigator />
            {!appReady && (
              <CurtainOverlay
                onDone={onCurtainDone}
                mode="welcomeInitial"
                preloadWithProgress={preloadHeroPickerAssets}
              />
            )}
          </CrashBoundary>
        )}
      </NavigationContainer>
    </QueryClientProvider>
  );
}


