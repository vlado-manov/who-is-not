import React, { useEffect, useMemo, useRef } from "react";
import { View, Pressable, useWindowDimensions, ScrollView } from "react-native";
import AppImage from "./AppImage";
import ImageBackgroundWithLoadGate from "./ImageBackgroundWithLoadGate";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import CustomText from "./common/CustomText";
import { backgrounds } from "../../assets/backgrounds";
import { game_images } from "../../assets/images";
import { CreateGameStackParamList } from "../navigation/types";
import { useGameStore } from "../store/useGameStore";
import AudioManager from "../utils/audioManager";
import i18n from "../i18n";
import { useAuthStore } from "../store/useUserStore";
import { usePreventBack } from "../hooks/usePreventBack";
import { useResponsive } from "../utils/responsive";

type R = RouteProp<CreateGameStackParamList, "PassDevice">;
type Nav = StackNavigationProp<CreateGameStackParamList, "PassDevice">;

const PassDeviceScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { index } = useRoute<R>().params;
  usePreventBack();
  AudioManager.playBackground();
  const { settings, updateSettings } = useAuthStore();

  const target = useGameStore((s) => s.targetPlayersCount);

  const onContinue = () => {
    if (target && index <= target) {
      navigation.navigate("HeroPicker", { index });
    } else {
      navigation.navigate("Lobby");
    }
  };

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      onContinue();
    }, 2500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const logoSource = useMemo(() => {
    const sound = settings.soundEnabled ? "MusicOn" : "MusicOff";

    switch (i18n.language) {
      case "fr":
        return game_images[`logoFr${sound}`];
      case "es":
        return game_images[`logoEs${sound}`];
      case "bg":
        return game_images[`logoBg${sound}`];
      default:
        return game_images[`logo${sound}`];
    }
  }, [i18n.language, settings.soundEnabled]);

  const toggleSound = () => {
    const newVal = !settings.soundEnabled;
    updateSettings({ soundEnabled: newVal });
    AudioManager.setSoundEnabled(newVal);
  };

  const { width: windowWidth } = useWindowDimensions();
  const { logo, horizontalPadding } = useResponsive();

  return (
    <SafeAreaView className="flex-1 bg-primary-700" edges={["right", "left"]}>
      <ImageBackgroundWithLoadGate
        source={backgrounds.bg024}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View
          className="absolute right-4 z-50"
          style={{ top: insets.top + 12, paddingRight: horizontalPadding }}
        >
          <Pressable
            onPress={() => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              onContinue();
            }}
            hitSlop={16}
          >
            <CustomText className="h3-headline">
              {t("skip", { defaultValue: "Skip" })}
            </CustomText>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: horizontalPadding,
            paddingBottom: insets.bottom + 12,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center w-full pt-20">
            <Pressable style={{ marginTop: 8 }} onPress={toggleSound}>
              <AppImage
                source={logoSource}
                style={{ width: logo.width, height: logo.height }}
                contentFit="contain"
              />
            </Pressable>
            <CustomText
              variant="h3-headline"
              className="mt-8 text-center z-50 px-2 text-black"
            >
              {t("pass_device_sub", {
                defaultValue: "Hand the phone to next player",
                index,
              })}
            </CustomText>
          </View>
          <View style={{ marginTop: 16, width: "100%" }}>
            <AppImage
              source={game_images.passDevice}
              contentFit="cover"
              style={{
                width: windowWidth,
                alignSelf: "center",
                aspectRatio: 350 / 320,
              }}
            />
          </View>
        </ScrollView>
      </ImageBackgroundWithLoadGate>
    </SafeAreaView>
  );
};

export default PassDeviceScreen;
