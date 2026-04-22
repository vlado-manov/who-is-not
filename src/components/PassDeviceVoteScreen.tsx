// src/components/PassDeviceVoteScreen.tsx
import React, { useMemo } from "react";
import {
  View,
  Pressable,
  useWindowDimensions,
  StyleSheet,
  ScrollView,
} from "react-native";
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
import { useResponsive } from "../utils/responsive";

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

  const { width: windowWidth } = useWindowDimensions();
  const { logo, horizontalPadding } = useResponsive();
  const padH = horizontalPadding;

  return (
    <SafeAreaView className="flex-1 bg-primary-700" edges={["right", "left"]}>
      <ImageBackgroundWithLoadGate
        source={backgrounds.bg027}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.column,
            {
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom + 16,
              paddingHorizontal: padH,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces
        >
          <View className="items-center w-full">
            <Pressable onPress={toggleSound}>
              <AppImage
                source={logoSource}
                style={{ width: logo.width, height: logo.height }}
                contentFit="contain"
              />
            </Pressable>
            <CustomText
              variant="h4-headline"
              className="text-center z-50 px-2 mt-4"
            >
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

          <View style={styles.illustrationBlock}>
            <AppImage
              source={game_images.passDevice}
              contentFit="cover"
              style={[styles.passDeviceImageFullWidth, { width: windowWidth }]}
            />
          </View>

          <View className="w-full" style={styles.ctaBlock}>
            <CustomButton
              title={t("its_me")}
              backgroundImage={backgrounds.bg026}
              glow
              glowColor="rgba(41,255,25,0.8)"
              shadowColor="#005f07"
              horizontalPadding={Math.min(48, padH + 20)}
              fullWidth
              onPress={onContinue}
            />
            <CustomText
              variant="p"
              className="text-center px-2"
              style={styles.ctaHint}
            >
              {nextVoter
                ? t("pass_device_vote_instruction", { name: nextVoter.name })
                : t("pass_device_vote_instruction_next")}
            </CustomText>
          </View>
        </ScrollView>
      </ImageBackgroundWithLoadGate>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  column: {
    flexGrow: 1,
    justifyContent: "space-between",
    minHeight: "100%",
  },
  illustrationBlock: {
    marginTop: -16,
    width: "100%",
  },
  passDeviceImageFullWidth: {
    alignSelf: "center",
    aspectRatio: 350 / 320,
  },
  ctaBlock: {
    marginTop: -80,
    flexShrink: 0,
  },
  ctaHint: {
    marginTop: 10,
  },
});

export default PassDeviceVoteScreen;
