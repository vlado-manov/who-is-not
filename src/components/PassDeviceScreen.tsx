import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { View, Pressable, useWindowDimensions, ScrollView, StyleSheet } from "react-native";
import AppImage from "./AppImage";
import FullBleedStack from "./FullBleedStack";
import ImageBackgroundWithLoadGate from "./ImageBackgroundWithLoadGate";
import WarmBubblesOverlay from "./WarmBubblesOverlay";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import CustomText from "./common/CustomText";
import BottomSkipAction from "./common/BottomSkipAction";
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
  const { settings, updateSettings } = useAuthStore();
  const continuedRef = useRef(false);

  useEffect(() => {
    void AudioManager.playBackground();
  }, []);

  const target = useGameStore((s) => s.targetPlayersCount);

  const onContinue = useCallback(() => {
    if (continuedRef.current) return;
    continuedRef.current = true;
    void AudioManager.playHeroPickerEnd();
    if (target && index <= target) {
      navigation.navigate("HeroPicker", { index });
    } else {
      navigation.navigate("Lobby");
    }
  }, [index, navigation, target]);

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
  }, [onContinue]);

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
    <FullBleedStack
      rootStyle={{ flex: 1, backgroundColor: "#0a0a0a" }}
      backdrop={
        <ImageBackgroundWithLoadGate
          source={backgrounds.bg024}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          <WarmBubblesOverlay variant="intense" />
        </ImageBackgroundWithLoadGate>
      }
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "transparent" }}
        edges={["right", "left"]}
      >
        <BottomSkipAction
          label={t("skip", { defaultValue: "Skip" })}
          onPress={() => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            onContinue();
          }}
        />

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
      </SafeAreaView>
    </FullBleedStack>
  );
};

export default PassDeviceScreen;
