import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { View, Pressable, ScrollView, StyleSheet } from "react-native";
import FullBleedStack from "../components/FullBleedStack";
import ImageBackgroundWithLoadGate from "../components/ImageBackgroundWithLoadGate";
import WarmBubblesOverlay from "../components/WarmBubblesOverlay";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { backgrounds } from "../../assets/backgrounds";
import CustomButton from "../components/common/CustomButton";
import {
  OnboardingStackParamList,
  RootStackParamList,
} from "../navigation/types";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAuthStore } from "../store/useUserStore";
import { game_images } from "../../assets/images";
import AudioManager from "../utils/audioManager";
import AppImage from "../components/AppImage";
import { trackPlayerSessionStarted } from "../api/analytics";
import { useResponsive } from "../utils/responsive";
import ScreenTopBar from "../components/common/ScreenTopBar";
import { useUserSettingsSheet } from "../context/UserSettingsModalContext";
import { navigateBackSafe } from "../navigation/navigateBackSafe";
import OnlineJoinRoomModal from "../components/modals/OnlineJoinRoomModal";

type OnbNav = StackNavigationProp<OnboardingStackParamList, "MenuPlay">;
type RootNav = StackNavigationProp<RootStackParamList>;
type Nav = CompositeNavigationProp<OnbNav, RootNav>;
const MenuPlayScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { openUserSettings } = useUserSettingsSheet();
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const { settings, updateSettings, user } = useAuthStore();
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

  const menuLayout = useMemo(() => {
    const narrow = windowWidth < 380;
    const low = windowHeight < 640;
    if (!(low || narrow)) {
      return {
        btnSize: "md" as const,
        fontSize: "sm" as const,
        fontSizePx: undefined as number | undefined,
        gap: 24,
        sectionMarginTop: 28,
        sectionPaddingTop: 12,
        iconScale: 1,
        titleMinFontScale: undefined as number | undefined,
      };
    }
    const veryTight = isShortScreen || windowHeight < 600 || windowWidth < 340;
    return {
      btnSize: veryTight ? ("xs" as const) : ("sm" as const),
      fontSize: "xs" as const,
      fontSizePx: veryTight ? 15 : 16,
      gap: veryTight ? 12 : 16,
      sectionMarginTop: veryTight ? 14 : 20,
      sectionPaddingTop: veryTight ? 6 : 10,
      iconScale: veryTight ? 0.68 : 0.78,
      titleMinFontScale: veryTight ? 0.4 : 0.46,
    };
  }, [windowWidth, windowHeight, isShortScreen]);

  const s = menuLayout.iconScale;

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

  const scrollMinH = Math.max(windowHeight - 24, 520);

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
      <SafeAreaView style={styles.safe} edges={["left", "right"]}>
        <ScreenTopBar
          horizontalPadding={horizontalPadding}
          topIconSize={topIconSize}
          showBack
          useExpoImage
          onSettings={() => openUserSettings()}
          onProfile={() => navigation.navigate("Profile")}
          onBack={() =>
            navigation.canGoBack()
              ? navigateBackSafe(navigation)
              : navigation.navigate("Welcome")
          }
          backAccessibilityLabel={t("back_btn")}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            flexGrow: 1,
            minHeight: scrollMinH,
            paddingHorizontal: horizontalPadding,
            paddingBottom: 28,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: "center", marginTop: logoBlockMarginTop }}>
            <Pressable onPress={toggleSound}>
              <View
                style={{
                  width: logo.width,
                  height: logo.height,
                  position: "relative",
                  alignItems: "center",
                }}
              >
                {/* <AppImage
                    source={game_images.menuPlayIcon}
                    style={{
                      position: "absolute",
                      width: htpOverlay.width,
                      height: htpOverlay.height,
                      top: htpOverlay.top - 24,
                      left: htpOverlay.left,
                    }}
                    contentFit="contain"
                  /> */}
                <AppImage
                  source={logoSource}
                  style={{ width: logo.width, height: logo.height }}
                  contentFit="contain"
                />
              </View>
            </Pressable>
          </View>

          <View
            style={{
              width: "100%",
              maxWidth: isTablet ? 560 : 420,
              alignSelf: "center",
              gap: menuLayout.gap,
              marginTop: menuLayout.sectionMarginTop,
              flexGrow: 1,
              paddingTop: menuLayout.sectionPaddingTop,
              paddingBottom: 8,
            }}
          >
            <CustomButton
              title={t("menuPlay_device_btn")}
              fullWidth
              btnSize={menuLayout.btnSize}
              fontSize={menuLayout.fontSize}
              fontSizePx={menuLayout.fontSizePx}
              titleMinFontScale={menuLayout.titleMinFontScale}
              buttonClassName="-rotate-1"
              // iconOverlayPadText
              // icon={game_images.partyModeIcon}
              // iconWidth={Math.round(120 * s)}
              // iconHeight={Math.round(104 * s)}
              // iconSize={Math.round(120 * s)}
              // iconOverlayPreset="rulebook"
              // iconRotation="16deg"
              // iconTop={Math.round(-10 * s)}
              // iconRight={Math.round(-25 * s)}
              onPress={() => {
                void trackPlayerSessionStarted({
                  userId: user.id,
                  source: "MENU_PLAY",
                  step: "local_create_game_tapped",
                  language: i18n.language,
                }).catch((e) => {
                  console.warn(
                    "track PLAYER_SESSION_STARTED(local_create_game_tapped) failed",
                    e,
                  );
                });
                navigation.navigate("CreateGame");
              }}
              label={t("play_one_device")}
              labelSide="left"
              backgroundImage={backgrounds.bg026}
              shadowColor="#005f07"
            />
            <CustomButton
              title={t("menuPlay_host_btn")}
              fullWidth
              btnSize={menuLayout.btnSize}
              fontSize={menuLayout.fontSize}
              fontSizePx={menuLayout.fontSizePx}
              titleMinFontScale={menuLayout.titleMinFontScale}
              // iconOverlayPadText
              label={t("invite_friends_label")}
              buttonClassName="-rotate-1"
              // icon={game_images.hostGameIcon}
              // iconWidth={Math.round(104 * s)}
              // iconHeight={Math.round(88 * s)}
              // iconSize={Math.round(104 * s)}
              // iconLeft={Math.round(-24 * s)}
              // iconOverlayPreset="party"
              // iconRotation="10deg"
              backgroundImage={backgrounds.bg022}
              shadowColor="#410047"
              onPress={() => {
                void trackPlayerSessionStarted({
                  userId: user.id,
                  source: "MENU_PLAY",
                  step: "host_tapped",
                  language: i18n.language,
                  mode: "ONLINE",
                }).catch((e) => {
                  console.warn(
                    "track PLAYER_SESSION_STARTED(host_tapped) failed",
                    e,
                  );
                });
                AudioManager.playButtonClick();
                navigation.navigate("CreateGame", { screen: "OnlineHost" });
              }}
            />
            <CustomButton
              title={t("menuPlay_join_btn")}
              fullWidth
              // iconOverlayPadText
              btnSize={menuLayout.btnSize}
              fontSize={menuLayout.fontSize}
              fontSizePx={menuLayout.fontSizePx}
              titleMinFontScale={menuLayout.titleMinFontScale}
              // iconOverlayPreset="rulebook"
              buttonClassName="-rotate-1"
              // icon={game_images.joinGameIcon}
              // iconWidth={Math.round(104 * s)}
              // iconHeight={Math.round(88 * s)}
              // iconSize={Math.round(104 * s)}
              // iconRight={Math.round(-20 * s)}
              // iconRotation="-8deg"
              backgroundImage={backgrounds.bg015}
              glow
              glowColor="rgba(255,50,50,0.6)"
              glowIntensity={14}
              shadowColor="#1a0000"
              borderColor="rgba(255,60,60,0.9)"
              borderWidth={2}
              label={t("scan_qr_code")}
              labelSide="left"
              onPress={() => {
                void trackPlayerSessionStarted({
                  userId: user.id,
                  source: "MENU_PLAY",
                  step: "join_tapped",
                  language: i18n.language,
                  mode: "ONLINE",
                }).catch((e) => {
                  console.warn(
                    "track PLAYER_SESSION_STARTED(join_tapped) failed",
                    e,
                  );
                });
                AudioManager.playButtonClick();
                setJoinModalVisible(true);
              }}
            />
            {__DEV__ && (
              <CustomButton
                title="Dev: multiplayer screen lab"
                fullWidth
                btnSize="xs"
                fontSize="xs"
                buttonClassName="mt-4 opacity-90"
                backgroundImage={backgrounds.bg005}
                shadowColor="#333"
                onPress={() => {
                  AudioManager.playButtonClick();
                  navigation.navigate("DevMultiplayerLab");
                }}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      <OnlineJoinRoomModal
        visible={joinModalVisible}
        onDismiss={() => setJoinModalVisible(false)}
        onJoined={() => {
          setJoinModalVisible(false);
          navigation.navigate("CreateGame", { screen: "OnlineJoin" });
        }}
      />
    </FullBleedStack>
  );
};

export default MenuPlayScreen;

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
});
