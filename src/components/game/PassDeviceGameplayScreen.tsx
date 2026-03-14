// src/screens/Game/PassDeviceGameplayScreen.tsx
import React, { useMemo } from "react";
import { View, Pressable, Dimensions } from "react-native";
import AppImage from "../AppImage";
import ImageBackgroundWithLoadGate from "../ImageBackgroundWithLoadGate";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { GameStackParamList } from "../../navigation/types";
import { useGameStore } from "../../store/useGameStore";
import { backgrounds } from "../../../assets/backgrounds";
import CustomText from "../../components/common/CustomText";
import { game_images } from "../../../assets/images";
import CustomButton from "../../components/common/CustomButton";
import AudioManager from "../../utils/audioManager";
import { useAuthStore } from "../../store/useUserStore";
import { usePreventBack } from "../../hooks/usePreventBack";
import i18n from "../../i18n";

type R = RouteProp<GameStackParamList, "PassDeviceGameplay">;
type Nav = StackNavigationProp<GameStackParamList, "PassDeviceGameplay">;

const PassDeviceGameplayScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  usePreventBack();
  AudioManager.playBackgroundGame();
  const { playerIndex } = useRoute<R>().params;

  const players = useGameStore((s) => s.players);
  const currentPlayer = players[playerIndex];
  const { settings, updateSettings } = useAuthStore();

  const onContinue = () => {
    navigation.navigate("Question", { playerIndex });
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
              {t("hand_phone_to")}
            </CustomText>
            <CustomText variant="h3" shadow className="capitalize">
              {currentPlayer?.name}
            </CustomText>
            <CustomText variant="p-small">({t("no_peeking")})</CustomText>
          </View>

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
                aspectRatio: 350 / 320,
              }}
            />
          </View>
        </View>

        <View
          className="absolute bottom-0 left-0 right-0 px-16 pb-12"
          style={{ paddingBottom: insets.bottom + 48 }}
        >
          <CustomText variant="p" className="text-center px-8 mb-6">
            {currentPlayer
              ? `${currentPlayer.name}, ${t("click_next_phone")}`
              : t("click_next_phone")}
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

export default PassDeviceGameplayScreen;
