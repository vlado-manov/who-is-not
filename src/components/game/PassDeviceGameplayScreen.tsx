// src/screens/Game/PassDeviceGameplayScreen.tsx
import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  ImageBackground,
  View,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import { usePreventBack } from "../../hooks/usePreventBack";
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

  const onContinue = useCallback(() => {
    if (continuedRef.current) return;
    continuedRef.current = true;
    // replace keeps the stack at depth 1 during pass-device cycle
    navigation.replace("Question", { playerIndex });
  }, [navigation, playerIndex]);

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

  const gap = Math.min(40, windowHeight * 0.055);
  const imageHeight = Math.min(windowWidth * (320 / 350), windowHeight * 0.38);

  const shakeX = screenShake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });

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
                  <CustomText variant="p-small" className="text-center" textColor="#762a05" sizeDelta={2} style={{ fontFamily: "Tektur-SemiBold" }}>
                    {t("hand_phone_to")}
                  </CustomText>
                  <View style={styles.nameDivider} />
                  <CustomText variant="h5" className="text-center" textColor="#592410" allowWrap sizeDelta={10} style={{ fontFamily: "SofiaSansExtraCondensed-SemiBold" }}>
                    {currentPlayer?.name ?? ""}
                  </CustomText>
                  <View style={styles.nameDivider} />
                  <CustomText variant="p-small" className="text-center" textColor="#762a05" sizeDelta={2} style={{ fontFamily: "Onest-SemiBold" }}>
                    {`(${t("no_peeking")})`}
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

          <View style={{ height: gap }} />

          {/* Button + hint */}
          <View style={{ paddingHorizontal: padH, paddingBottom: insets.bottom + 16 }}>
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
            <View style={styles.hintRow}>
              <View style={styles.hintIconGlow}>
                <MaterialCommunityIcons name="gesture-tap" size={20} color="#fbbf24" />
              </View>
              <CustomText variant="footnote" textColor="rgba(255,255,255,0.88)" style={{ fontFamily: "Onest-SemiBold", flexShrink: 1 }}>
                {currentPlayer ? `${currentPlayer.name}, ${t("click_next_phone")}` : t("click_next_phone")}
              </CustomText>
            </View>
          </View>

        </View>
      </SafeAreaView>
    </FullBleedStack>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  hintIconGlow: {
    shadowColor: "#fbbf24",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
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
    paddingVertical: 18,
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
  nameDivider: {
    width: "88%",
    height: 1,
    marginVertical: 7,
    backgroundColor: "rgba(89,36,16,0.5)",
  },
});

export default PassDeviceGameplayScreen;
