import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  ImageBackground,
  View,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
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
      navigation.replace("HeroPicker", { index });
    } else {
      navigation.replace("Lobby");
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

  const plateScale  = useRef(new Animated.Value(40)).current;
  const plateOpacity = useRef(new Animated.Value(0)).current;
  const screenShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AudioManager.playItemDrop();
    Animated.sequence([
      Animated.parallel([
        Animated.timing(plateScale,   { toValue: 1, duration: 400, easing: Easing.out(Easing.back(3)), useNativeDriver: true }),
        Animated.timing(plateOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(screenShake, { toValue: 1,  duration: 60, useNativeDriver: true }),
        Animated.timing(screenShake, { toValue: -1, duration: 60, useNativeDriver: true }),
        Animated.timing(screenShake, { toValue: 1,  duration: 60, useNativeDriver: true }),
        Animated.timing(screenShake, { toValue: 0,  duration: 60, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { horizontalPadding } = useResponsive();
  const padH = horizontalPadding;

  const shakeX = screenShake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });

  const gap = Math.min(40, windowHeight * 0.055);
  const imageHeight = Math.min(windowWidth * (320 / 350), windowHeight * 0.38);

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
      <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["right", "left"]}>
        <View style={styles.container}>

          {/* Nameplate */}
          <View style={{ paddingHorizontal: padH }}>
            <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
              <Animated.View style={[styles.namePlateShadow, { opacity: plateOpacity, transform: [{ scale: plateScale }] }]}>
                <ImageBackground
                  source={backgrounds.bg005}
                  resizeMode="stretch"
                  imageStyle={{ borderRadius: 18 }}
                  style={styles.namePlate}
                >
                  <CustomText
                    variant="h5"
                    className="text-center"
                    textColor="#592410"
                    allowWrap
                    sizeDelta={10}
                    style={{ fontFamily: "SofiaSansExtraCondensed-SemiBold" }}
                  >
                    {t("pass_device_sub", {
                      defaultValue: "Hand the phone to next player",
                      index,
                    })}
                  </CustomText>
                </ImageBackground>
              </Animated.View>
            </Animated.View>
          </View>

          <View style={{ height: gap }} />

          {/* Illustration */}
          <View style={{ overflow: "hidden" }}>
            <AppImage
              source={game_images.passDevice}
              contentFit="cover"
              style={{ width: windowWidth, height: imageHeight }}
            />
          </View>

          {/* Space for floating BottomSkipAction */}
          <View style={{ height: insets.bottom + 96 }} />

        </View>

        {/* Skip floats absolutely */}
        <BottomSkipAction
          label={t("skip", { defaultValue: "Skip" })}
          onPress={() => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            onContinue();
          }}
        />
      </SafeAreaView>
    </FullBleedStack>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  namePlateShadow: {
    shadowColor: "#fff",
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 14,
  },
  namePlate: {
    borderRadius: 18,
    paddingHorizontal: 32,
    paddingVertical: 24,
    alignItems: "center",
    shadowColor: "#ffd800",
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(251,192,32,1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(160,110,60,0.7)",
  },
});

export default PassDeviceScreen;
