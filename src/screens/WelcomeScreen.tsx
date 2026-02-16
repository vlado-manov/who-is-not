// src/screens/WelcomeScreen.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  ImageBackground,
  TouchableOpacity,
  Image,
  Pressable,
  Animated,
} from "react-native";
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
import { Entypo, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../store/useUserStore";
import { game_images } from "../../assets/images";

type Nav = StackNavigationProp<OnboardingStackParamList, "Welcome">;
const useIconPressAnim = () => {
  const anim = useRef(new Animated.Value(0)).current;

  const pressIn = () =>
    Animated.timing(anim, {
      toValue: 1,
      duration: 80,
      useNativeDriver: true,
    }).start();

  const pressOut = () =>
    Animated.timing(anim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start();

  const style = {
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 4],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.94],
        }),
      },
    ],
  };

  return { style, pressIn, pressOut };
};
export default function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const { t, i18n } = useTranslation();
  const { settings, updateSettings } = useAuthStore();
  const [curtainActive, setCurtainActive] = useState(true);
  const settingsAnim = useIconPressAnim();
  const profileAnim = useIconPressAnim();
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
  const onCurtainDone = () => setCurtainActive(false);

  const handleStart = async () => {
    await AudioManager.playBackground();
    navigation.navigate("MenuPlay");
  };

  return (
    <SafeAreaView className="flex-1 relative" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg023}
        style={{ flex: 1, width: "100%", height: "100%", position: "relative" }}
        resizeMode="cover"
      >
        <View className="absolute top-16 left-8">
          {/* <Ionicons name="settings" size={24} color="#fce58d" />
           */}
          <Pressable
            onPressIn={settingsAnim.pressIn}
            onPressOut={settingsAnim.pressOut}
            onPress={() => {
              AudioManager.playButtonClick();
              navigation.navigate("Settings");
            }}
          >
            <Animated.Image
              source={game_images.settingsIcon}
              style={[
                { width: 56, height: 56, resizeMode: "contain" },
                settingsAnim.style,
              ]}
            />
          </Pressable>
        </View>
        <View className="absolute top-16 right-8">
          {/* <Ionicons name="settings" size={24} color="#fce58d" />
           */}
          <Pressable
            onPressIn={profileAnim.pressIn}
            onPressOut={profileAnim.pressOut}
            onPress={() => {
              AudioManager.playButtonClick();
              navigation.navigate("Profile");
            }}
          >
            <Animated.Image
              source={game_images.userIcon}
              style={[
                { width: 56, height: 56, resizeMode: "contain" },
                profileAnim.style,
              ]}
            />
          </Pressable>
        </View>
        {/* <View className="absolute top-16 right-12 boxShadow bg-[#2db6d7] border-white border-2 rounded-full p-3 w-[48px] h-[48px] justify-center items-center">
          <FontAwesome5 name="user-alt" size={24} color="white" />
        </View> */}
        <View className="flex-1 items-center w-full px-4 mt-[40px]">
          <View className="mt-[80px]">
            <Pressable className="mt-[80px]" onPress={toggleSound}>
              <Image
                source={game_images.htpIcon}
                style={{
                  width: 350,
                  height: 260,
                  position: "absolute",
                  top: -88,
                  left: 12,
                }}
                resizeMode="contain"
              />
              <Image
                source={logoSource}
                style={{ width: 360, height: 280 }}
                resizeMode="contain"
              />
            </Pressable>
          </View>
          {/* <CustomText variant="h2-headline" className="text-center w-full">
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
          </CustomText> */}

          <View className="mt-8">
            <CustomButton
              title={t("menu_play_btn")}
              appearance="primary"
              // onPress={() => navigation.navigate("MenuPlay")}
              onPress={handleStart}
              backgroundImage={backgrounds.bg026}
              glow
              glowColor="rgba(41,255,25,0.8)"
              shadowColor="#005f07"
              horizontalPadding={48}
            />
          </View>
        </View>

        <View className="w-full p-8 items-center justify-center absolute bottom-12">
          <View className="flex-row items-center justify-center gap-4 mt-12 w-full">
            <View className="w-1/2">
              <CustomButton
                title={t("menu_store_btn")}
                appearance="secondary"
                btnSize="xs"
                fontSize="sm"
                fullWidth
                backgroundImage={backgrounds.bg022}
                // glow
                // glowColor="rgba(240,130,255,0.8)"
                onPress={() => navigation.navigate("Store")}
                label="Ad-free 😎"
                shadowColor="#410047"
              />
            </View>
            <View className="w-1/2">
              <CustomButton
                title={t("menu_htp_btn")}
                appearance="tertiary"
                onPress={() => navigation.navigate("Rules")}
                btnSize="xs"
                fullWidth
                backgroundImage={backgrounds.bg015}
                // glow
                // glowColor="rgba(255,167,73,0.8)"
                shadowColor="#540d0d"
              />
            </View>
          </View>
          <CustomText className="mt-8 mb-4" variant="p-small">
            {t("language_pick_btn")}
          </CustomText>
          <LanguageSelector />
        </View>

        {curtainActive && <CurtainOverlay onDone={onCurtainDone} />}
      </ImageBackground>
    </SafeAreaView>
  );
}
