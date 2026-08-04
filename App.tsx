import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import {
  Linking,
  Platform,
  StatusBar as RNStatusBar,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppState } from "react-native";
import { useRef } from "react";

import "./global.css";
import { loadStoredLanguagePreference } from "./src/i18n";

import RootNavigator from "./src/navigation/RootNavigator";
import { UserSettingsModalProvider } from "./src/context/UserSettingsModalContext";
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
import { WELCOME_BACKGROUND_URIS } from "./src/hooks/useWelcomeBackgroundVariant";
import { prefetchExpoImageUri } from "./src/utils/prefetchExpoImage";

/** Same URI as `CurtainOverlay` loader strip — prefetch early for Android decode. */
const WELCOME_CURTAIN_LOADER_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/b6612c06-2e0e-45ee-8557-483d229c70a7-loader.webp";

/** Preload на assets преди HeroPickerScreen (character images, backgrounds, game URLs). */
async function preloadHeroPickerAssets(
  onProgress?: (progress: number) => void,
): Promise<void> {
  const report = (value: number) => {
    onProgress?.(Math.max(0, Math.min(1, value)));
  };

  report(0);
  await Promise.all([
    ...WELCOME_BACKGROUND_URIS.map((uri) =>
      prefetchExpoImageUri(uri).catch(() => false),
    ),
    prefetchExpoImageUri(WELCOME_CURTAIN_LOADER_URI).catch(() => false),
  ]);

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
      prefetchExpoImageUri(url)
        .catch(() => false)
        .then(markDone),
    ),
    ...characterUrls.map((url) =>
      prefetchExpoImageUri(url)
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
  const [fontsLoaded, fontError] = useFonts({
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
    "AlumniSansCollegiateOne-Regular": require("./assets/fonts/AlumniSansCollegiateOne-Regular.ttf"),
    "HachiMaruPop-Regular": require("./assets/fonts/Hachi_Maru_Pop/HachiMaruPop-Regular.ttf"),
    "Onest-Bold": require("./assets/fonts/Onest/static/Onest-Bold.ttf"),
    "Onest-ExtraBold": require("./assets/fonts/Onest/static/Onest-ExtraBold.ttf"),
    "Onest-Black": require("./assets/fonts/Onest/static/Onest-Black.ttf"),
    "Oi-Regular": require("./assets/fonts/Oi-Regular.ttf"),
    "Overpass-Bold": require("./assets/fonts/Overpass-Bold.ttf"),
    "Overpass-ExtraBold": require("./assets/fonts/Overpass-ExtraBold.ttf"),
    "Pacifico-Regular": require("./assets/fonts/Pacifico/Pacifico-Regular.ttf"),
    "Onest-Bold": require("./assets/fonts/Onest/static/Onest-Bold.ttf"),
    "Onest-SemiBold": require("./assets/fonts/Onest/static/Onest-SemiBold.ttf"),
    "SofiaSansExtraCondensed-SemiBold": require("./assets/fonts/Sofia_Sans_Extra_Condensed/static/SofiaSansExtraCondensed-SemiBold.ttf"),
    "SofiaSansExtraCondensed-Bold": require("./assets/fonts/Sofia_Sans_Extra_Condensed/static/SofiaSansExtraCondensed-Bold.ttf"),
    "SofiaSansExtraCondensed-ExtraBold": require("./assets/fonts/Sofia_Sans_Extra_Condensed/static/SofiaSansExtraCondensed-ExtraBold.ttf"),
    "SofiaSansExtraCondensed-Black": require("./assets/fonts/Sofia_Sans_Extra_Condensed/static/SofiaSansExtraCondensed-Black.ttf"),
    "StalinistOne-Regular": require("./assets/fonts/StalinistOne-Regular.ttf"),
    "Tektur-SemiBold": require("./assets/fonts/Tektur/static/Tektur-SemiBold.ttf"),
    "Tektur-Bold": require("./assets/fonts/Tektur/static/Tektur-Bold.ttf"),
    "Tektur-ExtraBold": require("./assets/fonts/Tektur/static/Tektur-ExtraBold.ttf"),
    "Tektur-Black": require("./assets/fonts/Tektur/static/Tektur-Black.ttf"),
    "YanoneKaffeesatz-Bold": require("./assets/fonts/Yanone_Kaffeesatz/static/YanoneKaffeesatz-Bold.ttf"),
    "YanoneKaffeesatz-SemiBold": require("./assets/fonts/Yanone_Kaffeesatz/static/YanoneKaffeesatz-SemiBold.ttf"),
  });

  const [languageReady, setLanguageReady] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const navRef = useRef<any>(null);
  const lastRouteRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    AudioManager.stopBackground();
  }, []);

  useEffect(() => {
    if (Platform.OS === "android") {
      RNStatusBar.setTranslucent(true);
      RNStatusBar.setBackgroundColor("transparent");
    }
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

  /** If font loading fails (common on some web setups), don't block the app forever */
  const fontsReady = fontsLoaded || fontError != null;
  const canShowCurtain = fontsReady && languageReady;

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
    <SafeAreaProvider>
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
          <UserSettingsModalProvider>
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
          </UserSettingsModalProvider>
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}


