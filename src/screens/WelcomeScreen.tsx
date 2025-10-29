// src/screens/WelcomeScreen.tsx
import React, { useState } from "react";
import { View, ImageBackground, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import CustomText from "../components/common/CustomText";
import CustomButton from "../components/common/CustomButton";
import LanguageSelector from "../components/LanguageSelector";
import { backgrounds } from "../../assets/backgrounds";
import { OnboardingStackParamList } from "../navigation/types";
import CurtainOverlay from "../components/CurtainOverlay";
import AudioManager from "../utils/audioManager";
import { Entypo } from "@expo/vector-icons";
import { useAuthStore } from "../store/useUserStore";

type Nav = StackNavigationProp<OnboardingStackParamList, "Welcome">;

export default function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { settings, updateSettings } = useAuthStore();
  const [curtainActive, setCurtainActive] = useState(true);
  const toggleSound = () => {
    const newVal = !settings.soundEnabled;
    updateSettings({ soundEnabled: newVal });
    AudioManager.setSoundEnabled(newVal);
  };
  const onCurtainDone = () => setCurtainActive(false);

  const handleStart = async () => {
    await AudioManager.playBackground();
    navigation.navigate("Menu");
  };

  return (
    <SafeAreaView className="flex-1 relative" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg001}
        style={{ flex: 1, width: "100%", height: "100%", position: "relative" }}
        resizeMode="cover"
      >
        {/* <TouchableOpacity
          className="absolute top-1/2 right-6 z-[9999]"
          onPress={() => {
            toggleSound();
            setSoundEnabled(!soundEnabled);
          }}
        >
          <Entypo
            name={soundEnabled ? "sound" : "sound-mute"}
            size={48}
            color="white"
            className=""
          />
        </TouchableOpacity> */}
        <View className="flex-1 items-center w-full justify-center px-4">
          <CustomText
            variant="h2-headline"
            className="text-center w-full"
            shadow
          >
            {t("title_00")}
            <TouchableOpacity
              className="px-4"
              onPress={() => {
                toggleSound();
              }}
            >
              <Entypo
                name={settings.soundEnabled ? "sound" : "sound-mute"}
                size={48}
                color="white"
                className=""
              />
            </TouchableOpacity>
          </CustomText>
          <CustomText
            variant="h2"
            className="-rotate-3 text-center w-full"
            shadow
          >
            {t("title_01")}
          </CustomText>

          <View className="mt-8">
            <CustomButton
              title={t("start_btn")}
              color="bg-primary-500"
              onPress={handleStart}
            />
          </View>
        </View>

        <View className="w-full p-8 items-center justify-center absolute bottom-0">
          <CustomText className="my-2">{t("language_pick_btn")}</CustomText>
          <LanguageSelector />
        </View>

        {curtainActive && <CurtainOverlay onDone={onCurtainDone} />}
      </ImageBackground>
    </SafeAreaView>
  );
}
