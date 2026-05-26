// src/screens/Game/PassDeviceGameplayScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  View,
  Pressable,
  useWindowDimensions,
  StyleSheet,
  ScrollView,
} from "react-native";
import AppImage from "../AppImage";
import FullBleedStack from "../FullBleedStack";
import ImageBackgroundWithLoadGate from "../ImageBackgroundWithLoadGate";
import WarmBubblesOverlay from "../WarmBubblesOverlay";
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
import { useResponsive } from "../../utils/responsive";

type R = RouteProp<GameStackParamList, "PassDeviceGameplay">;
type Nav = StackNavigationProp<GameStackParamList, "PassDeviceGameplay">;

const PassDeviceGameplayScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  usePreventBack();
  const { playerIndex } = useRoute<R>().params;
  const continuedRef = useRef(false);

  useEffect(() => {
    void AudioManager.playBackgroundGame();
  }, []);

  const players = useGameStore((s) => s.players);
  const currentPlayer = players[playerIndex];
  const { settings, updateSettings } = useAuthStore();

  const onContinue = useCallback(() => {
    if (continuedRef.current) return;
    continuedRef.current = true;
    navigation.navigate("Question", { playerIndex });
  }, [navigation, playerIndex]);

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
    <FullBleedStack
      rootStyle={{ flex: 1, backgroundColor: "#0a0a0a" }}
      backdrop={
        <ImageBackgroundWithLoadGate
          source={backgrounds.bg027}
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
              {t("hand_phone_to")}
            </CustomText>
            <CustomText variant="h3" shadow className="capitalize">
              {currentPlayer?.name}
            </CustomText>
            <CustomText variant="p-small">({t("no_peeking")})</CustomText>
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
              {currentPlayer
                ? `${currentPlayer.name}, ${t("click_next_phone")}`
                : t("click_next_phone")}
            </CustomText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </FullBleedStack>
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
  ctaBlock: {
    marginTop: -80,
    flexShrink: 0,
  },
  ctaHint: {
    marginTop: 10,
  },
  passDeviceImageFullWidth: {
    alignSelf: "center",
    aspectRatio: 350 / 320,
  },
});

export default PassDeviceGameplayScreen;
