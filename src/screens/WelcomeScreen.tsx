// src/screens/WelcomeScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import FullBleedStack from "../components/FullBleedStack";
import ImageBackgroundWithLoadGate from "../components/ImageBackgroundWithLoadGate";
import WarmBubblesOverlay from "../components/WarmBubblesOverlay";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import CustomButton from "../components/common/CustomButton";
import LanguageSelector from "../components/LanguageSelector";
import { backgrounds } from "../../assets/backgrounds";
import { OnboardingStackParamList } from "../navigation/types";
import CurtainOverlay from "../components/CurtainOverlay";
import AudioManager from "../utils/audioManager";
import { useAuthStore } from "../store/useUserStore";
import { game_images } from "../../assets/images";
import { trackPlayerSessionStarted } from "../api/analytics";
import { useResponsive } from "../utils/responsive";
import CustomText from "../components/common/CustomText";
import ScreenTopBar from "../components/common/ScreenTopBar";
import { useUserSettingsSheet } from "../context/UserSettingsModalContext";

type Nav = StackNavigationProp<OnboardingStackParamList, "Welcome">;

export default function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const { openUserSettings } = useUserSettingsSheet();
  const route = useRoute<RouteProp<OnboardingStackParamList, "Welcome">>();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, user } = useAuthStore();
  const [curtainActive, setCurtainActive] = useState(
    !route.params?.skipCurtain,
  );
  const {
    logo,
    htpOverlay,
    horizontalPadding,
    topIconSize,
    logoBlockMarginTop,
    windowHeight,
    windowWidth,
    isShortScreen,
    isTablet,
  } = useResponsive();

  /** ~P30 Pro and similar; when they can't stay on one row, stack diagonally. */
  const stackStoreAndRulebook = windowWidth < 420;
  const stackedButtonsWidth = "65%";
  const buttonsVerticalGap = 10;

  const btnIconW = 72;
  const btnIconH = 56;

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
    void trackPlayerSessionStarted({
      userId: user.id,
      source: "WELCOME",
      step: "play_tapped",
      language: i18n.language,
    }).catch((e) => {
      console.warn("track PLAYER_SESSION_STARTED(play_tapped) failed", e);
    });
    navigation.navigate("MenuPlay");
  };

  const androidLangExtra = Platform.OS === "android" ? 36 : 0;
  const languageBarHeight =
    100 + insets.bottom + (isShortScreen ? 56 : 0) + androidLangExtra;
  const scrollMinH = Math.max(windowHeight - 24, 480);

  return (
    <FullBleedStack
      rootStyle={styles.root}
      backdrop={
        <ImageBackgroundWithLoadGate
          source={isTablet ? backgrounds.bg023t : backgrounds.bg023}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          <WarmBubblesOverlay variant="normal" />
        </ImageBackgroundWithLoadGate>
      }
    >
      <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
          <ScreenTopBar
            horizontalPadding={horizontalPadding}
            topIconSize={topIconSize}
            showBack={false}
            onSettings={() => openUserSettings()}
            onProfile={() => navigation.navigate("Profile")}
          />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{
              flexGrow: 1,
              minHeight: scrollMinH,
              paddingHorizontal: horizontalPadding,
              paddingBottom: languageBarHeight + 8,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{ marginTop: logoBlockMarginTop, alignItems: "center" }}
            >
              <Pressable onPress={toggleSound}>
                <View
                  style={{
                    width: logo.width,
                    height: logo.height,
                    position: "relative",
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={game_images.htpIcon}
                    style={{
                      position: "absolute",
                      width: htpOverlay.width,
                      height: htpOverlay.height,
                      top: htpOverlay.top,
                      left: htpOverlay.left,
                    }}
                    resizeMode="contain"
                  />
                  <Image
                    source={logoSource}
                    style={{ width: logo.width, height: logo.height }}
                    resizeMode="contain"
                  />
                </View>
              </Pressable>
            </View>

            <View
              style={{
                width: "100%",
                maxWidth: isTablet ? 560 : 420,
                alignSelf: "center",
                paddingTop: 20,
                paddingBottom: stackStoreAndRulebook ? 8 : 64,
              }}
            >
              <CustomButton
                title={t("menu_play_btn")}
                appearance="primary"
                onPress={handleStart}
                backgroundImage={backgrounds.bg026}
                glow
                iconOverlayPadText={false}
                glowColor="rgba(41,255,25,0.8)"
                shadowColor="#005f07"
                btnSize="md"
                fontSize="md"
                horizontalPadding={Math.min(52, horizontalPadding + 8)}
                fullWidth
                // icon={game_images.playIcon}
                // iconWidth={btnIconW}
                // iconHeight={btnIconH}
                // iconSize={btnIconW}
                // iconOverlayPreset="play"
                // iconRotation="0deg"
                // iconTop={4}
                // iconLeft={-24}
              />
            </View>

            <View
              style={{
                flexDirection: stackStoreAndRulebook ? "column" : "row",
                gap: buttonsVerticalGap,
                width: "100%",
                maxWidth: isTablet ? 560 : 420,
                alignSelf: "center",
                alignItems: "stretch",
                marginTop: stackStoreAndRulebook ? buttonsVerticalGap : 16,
                marginBottom: 8,
              }}
            >
              <View
                style={
                  stackStoreAndRulebook
                    ? { width: stackedButtonsWidth, alignSelf: "flex-start" }
                    : { flex: 1, minWidth: 0, paddingTop: 8 }
                }
              >
                <CustomButton
                  title={t("menu_store_btn")}
                  appearance="secondary"
                  btnSize="sm"
                  fontSize="sm"
                  fullWidth
                  backgroundImage={backgrounds.bg022}
                  onPress={() => navigation.navigate("Store")}
                  label="Ad-free 😎"
                  shadowColor="#410047"
                  icon={game_images.storeIcon}
                  iconWidth={btnIconW}
                  iconHeight={btnIconH}
                  iconSize={btnIconW}
                  iconOverlayPreset="store"
                  iconRotation="4deg"
                  iconLeft={-28}
                  iconTop={3}
                />
              </View>
              <View
                style={
                  stackStoreAndRulebook
                    ? { width: stackedButtonsWidth, alignSelf: "flex-end" }
                    : { flex: 1, minWidth: 0, paddingTop: 8 }
                }
              >
                <CustomButton
                  title={t("menu_htp_btn")}
                  appearance="tertiary"
                  onPress={() => navigation.navigate("Rules")}
                  btnSize="sm"
                  fontSize="sm"
                  fullWidth
                  backgroundImage={backgrounds.bg015}
                  shadowColor="#540d0d"
                  icon={game_images.rulebookIcon}
                  iconWidth={btnIconW}
                  iconHeight={btnIconH}
                  iconSize={btnIconW}
                  iconOverlayPreset="rulebook"
                  iconRotation="-11deg"
                  iconRight={-32}
                />
              </View>
            </View>
          </ScrollView>

          <View
            style={[
              styles.languageDock,
              {
                paddingBottom:
                  Math.max(insets.bottom, 12) +
                  (isShortScreen ? 28 : 0) +
                  (Platform.OS === "android" ? 24 : 0),
                paddingHorizontal: horizontalPadding,
              },
            ]}
            pointerEvents="box-none"
          >
            <CustomText className="mb-2" variant="p-small">
              {t("language_pick_btn")}
            </CustomText>
            <LanguageSelector />
          </View>

          {curtainActive && <CurtainOverlay onDone={onCurtainDone} />}
      </SafeAreaView>
    </FullBleedStack>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scroll: {
    flex: 1,
  },
  languageDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    zIndex: 15,
    backgroundColor: "transparent",
  },
});
