// src/components/PassDeviceVoteScreen.tsx
import React, { useMemo } from "react";
import { View, Pressable, Dimensions } from "react-native";
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
import CustomButton from "./common/CustomButton";
import { backgrounds } from "../../assets/backgrounds";
import { game_images } from "../../assets/images";
import { GameStackParamList } from "../navigation/types";
import { useGameStore } from "../store/useGameStore";
import { useAuthStore } from "../store/useUserStore";
import { usePreventBack } from "../hooks/usePreventBack";
import AudioManager from "../utils/audioManager";
import i18n from "../i18n";

type R = RouteProp<GameStackParamList, "PassDeviceVote">;
type Nav = StackNavigationProp<GameStackParamList, "PassDeviceVote">;

const PassDeviceVoteScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  usePreventBack();
  AudioManager.playBackgroundGame();
  const { voterIndex } = useRoute<R>().params;

  const players = useGameStore((s) => s.players);
  const nextVoter = players[voterIndex];
  const { settings, updateSettings } = useAuthStore();

  const onContinue = () => {
    navigation.navigate("Vote", { voterIndex });
  };

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
    AudioManager.setSoundEnabled(newVal, true);
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-700" edges={["right", "left"]}>
      <ImageBackgroundWithLoadGate
        source={backgrounds.bg023}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View
          className="flex-1 items-center w-full justify-start relative"
          style={{ overflow: "visible" }}
        >
          <View className="justify-center items-center w-full absolute">
            <Pressable className="mt-[40px]" onPress={toggleSound}>
              <AppImage
                source={logoSource}
                style={{ width: 360, height: 280 }}
                contentFit="contain"
              />
            </Pressable>
            <CustomText variant="h4-headline" className="text-center z-50 px-6">
              {t("pass_device_sub", { defaultValue: "Hand the phone to" })}
            </CustomText>
            <CustomText variant="h4" shadow className="capitalize">
              {nextVoter?.name ??
                t("next_player", { defaultValue: "Next player" })}
            </CustomText>

            <CustomText variant="p-small">
              ({t("no_peeking", { defaultValue: "No peeking" })})
            </CustomText>
          </View>

          {/* IMAGE */}
          <View
            style={{
              position: "absolute",
              bottom: "10%",
              left: 0,
              right: 0,
              paddingBottom: insets.bottom,
              width: Dimensions.get("window").width,
              overflow: "visible",
            }}
          >
            <AppImage
              source={game_images.passDevice}
              contentFit="cover"
              style={{
                width: Dimensions.get("window").width,
                aspectRatio: 350 / 300,
              }}
            />
          </View>
        </View>

        <View
          className="absolute bottom-0 left-0 right-0 px-16 pb-12"
          style={{ paddingBottom: insets.bottom + 48 }}
        >
          <CustomText variant="p" className="text-center px-8 mb-6">
            {nextVoter
              ? t("pass_device_vote_instruction", { name: nextVoter.name })
              : t("pass_device_vote_instruction_next")}
          </CustomText>
          <CustomButton
            title={t("its_me")}
            backgroundImage={backgrounds.bg026}
            glow
            glowColor="rgba(41,255,25,0.8)"
            shadowColor="#005f07"
            horizontalPadding={48}
            fullWidth
            onPress={onContinue}
          />
        </View>
      </ImageBackgroundWithLoadGate>
    </SafeAreaView>
  );
};

export default PassDeviceVoteScreen;
