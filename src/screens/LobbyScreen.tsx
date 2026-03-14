// src/screens/LobbyScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, Dimensions, Animated, Easing, Alert } from "react-native";
import AppImage from "../components/AppImage";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomText from "../components/common/CustomText";
import { images } from "../../assets/images";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  CreateGameStackParamList,
  RootStackParamList,
} from "../navigation/types";
import AudioManager from "../utils/audioManager";
import { useGameStore } from "../store/useGameStore";
import { useAuthStore } from "../store/useUserStore";
import { useTrackGameStartedMutation } from "../api/hooks/useAnalyticsMutations";
import { fetchQuestions } from "../api/questions";
import i18n from "../i18n";
import { usePreventBack } from "../hooks/usePreventBack";

const { height: H, width: W } = Dimensions.get("window");

// ✅ навигация: от CreateGame stack + Root stack
type CreateNav = StackNavigationProp<CreateGameStackParamList, "Lobby">;
type RootNav = StackNavigationProp<RootStackParamList>;
type HeroNav = CompositeNavigationProp<CreateNav, RootNav>;

/** Curtains closed (meeting in middle) */
const CURTAIN_CLOSED = 0;

export default function LobbyScreen() {
  const navigation = useNavigation<HeroNav>();
  usePreventBack();
  const playersCount = useGameStore(
    (s) => s.targetPlayersCount ?? s.players.length,
  );
  const mode = useGameStore((s) => s.mode);
  const existingGameId = useGameStore((s) => s.gameId);
  const gameSettings = useGameStore((s) => s.gameSettings);
  const setGameQuestions = useGameStore((s) => s.setGameQuestions);
  const startGameSession = useGameStore((s) => s.startGameSession);
  const userId = useAuthStore((s) => s.user.id);
  const trackGameStartedMutation = useTrackGameStartedMutation();
  const topY = useRef(new Animated.Value(CURTAIN_CLOSED)).current;
  const botY = useRef(new Animated.Value(CURTAIN_CLOSED)).current;
  const curtainTopSource =
    typeof images.curtainTop === "string"
      ? { uri: images.curtainTop }
      : images.curtainTop;
  const curtainBottomSource =
    typeof images.curtainBottom === "string"
      ? { uri: images.curtainBottom }
      : images.curtainBottom;
  const overlayOpacity = useRef(new Animated.Value(0.88)).current;

  const readyOpacity = useRef(new Animated.Value(0)).current;
  const readyScale = useRef(new Animated.Value(0.8)).current;
  const [showReady, setShowReady] = useState(false);

  const [count, setCount] = useState<string | null>(null);
  const countOpacity = useRef(new Animated.Value(0)).current;
  const countScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const showReadyIn = Animated.parallel([
      Animated.timing(readyOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(readyScale, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    const pulseOnce = () =>
      Animated.sequence([
        Animated.timing(readyScale, {
          toValue: 1.12,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(readyScale, {
          toValue: 1.0,
          duration: 240,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]);

    const hideReady = Animated.timing(readyOpacity, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    });

    const runCount = async () => {
      AudioManager.playCount();
      const doStep = async (txt: string, scaleFrom = 1.5) => {
        setCount(txt);
        countScale.setValue(scaleFrom);
        countOpacity.setValue(0);
        await new Promise<void>((res) => {
          Animated.parallel([
            Animated.timing(countOpacity, {
              toValue: 1,
              duration: 120,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(countScale, {
              toValue: 1.0,
              duration: 220,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]).start(() => res());
        });
        await new Promise<void>((resolve) => setTimeout(resolve, 150));
      };

      await doStep("3");
      await doStep("2");
      await doStep("1");
      await doStep("GO!", 1.7);
      await new Promise<void>((res) => {
        Animated.timing(countOpacity, {
          toValue: 0,
          duration: 150,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }).start(() => res());
      });
      setCount(null);
    };

    (AudioManager.stopBackground(),
      (async () => {
        // Завесите вече са затворени (от HeroPicker), няма нужда от openMid

        // Показваме надпис
        setShowReady(true);
        await new Promise<void>((res) => showReadyIn.start(() => res()));
        await new Promise<void>((resolve) => setTimeout(resolve, 1500));

        // Старт прелоуд
        await new Promise<void>((res) => pulseOnce().start(() => res()));

        // Скриваме надпис
        await new Promise<void>((res) => hideReady.start(() => res()));
        setShowReady(false);

        // Броим
        await runCount();

        // Зареждаме въпроси ПРЕДИ отваряне на завесите, за да е готово съдържанието отдолу
        const packSlugs = (gameSettings?.selectedPacks ?? ["main"]).slice(0, 5);
        const lang = (i18n.language ?? "en").slice(0, 2).toLowerCase();
        let questions: Awaited<ReturnType<typeof fetchQuestions>> = [];
        try {
          questions = await fetchQuestions({ packs: packSlugs, lang });
          if (!questions.length) {
            Alert.alert("Error", "No questions loaded. Check your connection.");
            return;
          }
          setGameQuestions(questions);
        } catch (e) {
          console.warn("fetchQuestions failed", e);
          Alert.alert("Error", "Could not load questions. Try again.");
          return;
        }

        const gameId = existingGameId ?? startGameSession(mode);
        try {
          await trackGameStartedMutation.mutateAsync({
            gameId,
            mode,
            playersCount: Math.max(playersCount || 1, 1),
            language: i18n.language,
            userId,
            packs: packSlugs,
          });
        } catch (e) {
          console.warn("track GAME_STARTED failed", e);
        }

        AudioManager.playBackgroundGame();

        // Бърз fade към Round 1 – завесите и звукът се случват в RoundScreen
        navigation.navigate("Game", {
          screen: "Round",
        } as never);
      })());
  }, []);

  const lobbyBgUri =
    "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/ba09f448-5270-4b9b-84d1-aaac8869f4b4-bg-heroes01.webp";

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <View className="bg-black relative w-full h-full flex-1 justify-center items-center">
        <AppImage
          source={{ uri: lobbyBgUri }}
          contentFit="cover"
          style={{
            position: "absolute",
            inset: 0,
            width: W,
            height: H,
          }}
        />
        <Animated.View
          style={{
            position: "absolute",
            inset: 0 as any,
            backgroundColor: "black",
            opacity: overlayOpacity,
            zIndex: 59,
          }}
        />
        <View
          style={{ zIndex: 99, alignItems: "center", justifyContent: "center" }}
        >
          {showReady ? (
            <Animated.View
              style={{
                opacity: readyOpacity,
                transform: [{ scale: readyScale }],
              }}
            >
              <CustomText
                variant="h2"
                className="text-center text-shadow-default"
              >
                Get ready
              </CustomText>
            </Animated.View>
          ) : null}

          {count ? (
            <Animated.View
              style={{
                opacity: countOpacity,
                transform: [{ scale: countScale }],
              }}
            >
              <CustomText
                variant="h1"
                className="text-center text-shadow-default"
              >
                {count}
              </CustomText>
            </Animated.View>
          ) : null}
        </View>

        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            width: W,
            height: H / 2,
            overflow: "visible",
            transform: [{ translateY: topY }],
          }}
        >
          <AppImage
            source={curtainTopSource}
            contentFit="contain"
            style={{
              position: "absolute",
              width: W,
              height: "100%",
              bottom: -117,
            }}
          />
        </Animated.View>

        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            width: W,
            height: H / 2,
            overflow: "visible",
            transform: [{ translateY: botY }],
          }}
        >
          <AppImage
            source={curtainBottomSource}
            contentFit="contain"
            style={{
              position: "absolute",
              width: W,
              height: "100%",
              top: -117,
            }}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
