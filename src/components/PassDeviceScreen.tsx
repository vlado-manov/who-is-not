import React, { useEffect, useMemo, useRef } from "react";
import { View, ImageBackground, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import CustomText from "./common/CustomText";
import CustomButton from "./common/CustomButton";
import { backgrounds } from "../../assets/backgrounds";
import { game_images } from "../../assets/images";
import { CreateGameStackParamList } from "../navigation/types";
import { useGameStore } from "../store/useGameStore";
import AudioManager from "../utils/audioManager";
import i18n from "../i18n";
import { useAuthStore } from "../store/useUserStore";

type R = RouteProp<CreateGameStackParamList, "PassDevice">;
type Nav = StackNavigationProp<CreateGameStackParamList, "PassDevice">;

const PassDeviceScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { index } = useRoute<R>().params;
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

  return (
    <SafeAreaView className="flex-1 bg-primary-700" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg023}
        className="flex-1 relative"
        resizeMode="cover"
      >
        <View className="absolute top-24 right-8 z-50">
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

        <View className="flex-1 items-center w-full justify-center relative">
          <View className="justify-center items-center w-full absolute top-24">
            <Pressable className="mt-[40px]" onPress={toggleSound}>
              <Image
                source={logoSource}
                style={{ width: 360, height: 280 }}
                resizeMode="contain"
              />
            </Pressable>
            <CustomText
              variant="h4-headline"
              className="mt-24 text-center z-50 px-6"
            >
              {t("pass_device_sub", {
                defaultValue: "Hand the phone to next player",
                index,
              })}
            </CustomText>
          </View>
          <View className="flex-1 w-full h-full items-center justify-around">
            <Image
              source={game_images.passDevice}
              resizeMode="contain"
              className="w-full"
            />
          </View>
        </View>

        <View className="mb-16 px-16">
          {/* <CustomButton
            title={t("continue_btn", { defaultValue: "Continue" })}
            color="bg-primary-500"
            fullWidth
            onPress={onContinue}
          /> */}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default PassDeviceScreen;
