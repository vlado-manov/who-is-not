// src/screens/LobbyScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, Image, Dimensions, Animated, Easing } from "react-native";
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
import { preloadAssets } from "../utils/preloadAssets";
import { characters_loss, characters_win } from "../../assets/characters";
import AudioManager from "../utils/audioManager";
import { useGameStore } from "../store/useGameStore";
import { useAuthStore } from "../store/useUserStore";
import { useTrackGameStartedMutation } from "../api/hooks/useAnalyticsMutations";

const { height: H, width: W } = Dimensions.get("window");

// ✅ навигация: от CreateGame stack + Root stack
type CreateNav = StackNavigationProp<CreateGameStackParamList, "Lobby">;
type RootNav = StackNavigationProp<RootStackParamList>;
type HeroNav = CompositeNavigationProp<CreateNav, RootNav>;

const pct = (p: number) => (p / 100) * H;

const TOP_START = -pct(70);
const TOP_MID = -pct(13.25);

const BOT_START = +pct(70);
const BOT_MID = +pct(13.25);

export default function LobbyScreen() {
  const navigation = useNavigation<HeroNav>();
  const playersCount = useGameStore((s) => s.targetPlayersCount ?? s.players.length);
  const mode = useGameStore((s) => s.mode);
  const existingGameId = useGameStore((s) => s.gameId);
  const startGameSession = useGameStore((s) => s.startGameSession);
  const userId = useAuthStore((s) => s.user.id);
  const trackGameStartedMutation = useTrackGameStartedMutation();
  const topY = useRef(new Animated.Value(TOP_START)).current;
  const botY = useRef(new Animated.Value(BOT_START)).current;
  const overlayOpacity = useRef(new Animated.Value(0.35)).current;

  const readyOpacity = useRef(new Animated.Value(0)).current;
  const readyScale = useRef(new Animated.Value(0.8)).current;
  const [showReady, setShowReady] = useState(false);

  const [count, setCount] = useState<string | null>(null);
  const countOpacity = useRef(new Animated.Value(0)).current;
  const countScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const openMid = Animated.parallel([
      Animated.timing(topY, {
        toValue: TOP_MID,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(botY, {
        toValue: BOT_MID,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

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
        await new Promise<void>((resolve) => setTimeout(resolve, 200));
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
      AudioManager.playCurtainSound();
    };

    const closeAll = Animated.parallel([
      Animated.timing(topY, {
        toValue: TOP_START,
        duration: 600,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(botY, {
        toValue: BOT_START,
        duration: 600,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);
    (AudioManager.playCurtainSoundClose(),
      AudioManager.stopBackground(),
      (async () => {
        // Отваряне до средата
        await new Promise<void>((res) => openMid.start(() => res()));

        // Показваме надпис
        setShowReady(true);
        await new Promise<void>((res) => showReadyIn.start(() => res()));
        await new Promise<void>((resolve) => setTimeout(resolve, 1500));

        // Старт прелоуд
        let loaded = false;
        const preloadPromise = (async () => {
          try {
            await preloadAssets(Object.values(characters_loss));
            await preloadAssets(Object.values(characters_win));
          } catch (e) {
            console.warn("preload error", e);
          } finally {
            loaded = true;
          }
        })();

        while (!loaded) {
          await new Promise<void>((res) => pulseOnce().start(() => res()));
        }

        // Скриваме надпис
        await new Promise<void>((res) => hideReady.start(() => res()));
        setShowReady(false);

        // Броим
        await runCount();

        // Затваряме и продължаваме
        await new Promise<void>((res) => closeAll.start(() => res()));

        // ✅ Първо извикване на Round вече е през Game stack
        const gameId = existingGameId ?? startGameSession(mode);
        try {
          await trackGameStartedMutation.mutateAsync({
            gameId,
            mode,
            playersCount: Math.max(playersCount || 1, 1),
            userId,
          });
        } catch (e) {
          console.warn("track GAME_STARTED failed", e);
        }

        AudioManager.playBackgroundGame();
        navigation.navigate("Game", {
          screen: "Round",
        } as never);
      })());
  }, []);

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <View className="bg-black relative w-full h-full flex-1 justify-center items-center">
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
            transform: [{ translateY: topY }],
          }}
        >
          <Image
            source={images.curtainTop}
            resizeMode="contain"
            style={{ width: W }}
          />
        </Animated.View>

        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            transform: [{ translateY: botY }],
          }}
        >
          <Image
            source={images.curtainBottom}
            resizeMode="contain"
            style={{ width: W }}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
