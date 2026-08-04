import {
  View,
  Pressable,
  TouchableOpacity,
  Animated,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import AppImage from "../components/AppImage";

const AnimatedImage = Animated.createAnimatedComponent(Image);
import FullBleedStack from "../components/FullBleedStack";
import ImageBackgroundWithLoadGate from "../components/ImageBackgroundWithLoadGate";
import WarmBubblesOverlay from "../components/WarmBubblesOverlay";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { backgrounds } from "../../assets/backgrounds";
import CustomText from "../components/common/CustomText";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useMemo, useState } from "react";
import CustomButton from "../components/common/CustomButton";
import { CreateGameStackParamList } from "../navigation/types";
import { useGameStore } from "../store/useGameStore";
import { FontAwesome } from "@expo/vector-icons";
import GameSettingsModal from "../components/modals/GameSettingsModal";
import ScreenTopBar from "../components/common/ScreenTopBar";
import { useUserSettingsSheet } from "../context/UserSettingsModalContext";
import AnimatedLogoHero from "../components/AnimatedLogoHero";
import AudioManager from "../utils/audioManager";
import { game_images } from "../../assets/images";
import { useAuthStore } from "../store/useUserStore";
import { useRef } from "react";
import { trackPlayerSessionStarted } from "../api/analytics";
import { getPlayerCountPanelSize, useResponsive } from "../utils/responsive";
import { goBackFromCreateGameToMenu } from "../navigation/goBackFromCreateGameToMenu";

type Nav = StackNavigationProp<CreateGameStackParamList, "PlayersNumber">;

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 10;

const PlayersNumberScreen = () => {
  const [players, setPlayers] = useState<number>(5);
  const [gameSettingsVisible, setGameSettingsVisible] =
    useState<boolean>(false);

  const beginLocalGame = useGameStore((s) => s.beginLocalGame);
  const startGameSession = useGameStore((s) => s.startGameSession);
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { openUserSettings } = useUserSettingsSheet();
  const { settings, updateSettings, user } = useAuthStore();
  const insets = useSafeAreaInsets();

  /* ----------------------------- LOGO PICKER ----------------------------- */

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

  /* ----------------------------- HANDLERS ----------------------------- */

  const decrement = () => {
    if (players <= MIN_PLAYERS) return;
    AudioManager.playButtonClick();
    setPlayers((p) => p - 1);
  };

  const increment = () => {
    if (players >= MAX_PLAYERS) return;
    AudioManager.playButtonClick();
    setPlayers((p) => p + 1);
  };

  const onContinue = () => {
    void trackPlayerSessionStarted({
      userId: user.id,
      source: "CREATE_GAME",
      step: "players_count_confirmed",
      mode: "LOCAL",
      language: i18n.language,
      playersCount: players,
    }).catch((e) => {
      console.warn(
        "track PLAYER_SESSION_STARTED(players_count_confirmed) failed",
        e,
      );
    });
    beginLocalGame(players);
    startGameSession("LOCAL");
    // navigation.navigate("Name", { index: 1 });
    navigation.navigate("HeroPicker", { index: 1 });
  };

  const goBackToMenu = () => {
    goBackFromCreateGameToMenu(navigation);
  };

  /* --------------------------------------------------------------------- */
  const usePressAnimation = () => {
    const anim = useRef(new Animated.Value(0)).current;

    const pressIn = () => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }).start();
    };

    const pressOut = () => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start();
    };

    const style = {
      transform: [
        {
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 6],
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
  const minusAnim = usePressAnimation();
  const plusAnim = usePressAnimation();

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth >= 768 && windowWidth > windowHeight;
  const {
    logo,
    horizontalPadding: pad,
    topIconSize,
    storeIconOverlay: storeOv,
    logoBlockMarginTop,
  } = useResponsive();
  const panel = getPlayerCountPanelSize(logo.width);
  const s = panel.scale;

  return (
    <FullBleedStack
      rootStyle={styles.root}
      backdrop={
        <ImageBackgroundWithLoadGate
          source={backgrounds.bg024}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          <WarmBubblesOverlay variant="normal" />
        </ImageBackgroundWithLoadGate>
      }
    >
      <SafeAreaView style={styles.safe} edges={["left", "right"]}>
        <ScreenTopBar
          variant="soloBackFromCenter"
          horizontalPadding={pad}
          topIconSize={topIconSize}
          showBack
          onSettings={() => openUserSettings()}
          onProfile={() => {}}
          onBack={goBackToMenu}
          backAccessibilityLabel={t("players_back_menu", {
            defaultValue: "Menu",
          })}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: pad,
            paddingBottom: 24,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 items-center w-full">
            {/* LOGO */}
            <AnimatedLogoHero
              logoSource={logoSource}
              overlaySource={game_images.playersNumberLogoOverlay}
              logoWidth={logo.width}
              logoHeight={logo.height}
              overlayLayout={storeOv}
              marginTop={logoBlockMarginTop}
              onPress={toggleSound}
            />

            {/* CONTENT */}
            <View style={[{ width: "100%", alignItems: "center", paddingHorizontal: 8 }, isTablet && { maxWidth: 560, alignSelf: "center" }]}>
              <CustomText variant="label" sizeDelta={6} className="mb-4" style={{ fontFamily: "SofiaSansExtraCondensed-Bold" }}>
                {t("players_number_label_text")}
              </CustomText>

              {/* PLAYER COUNT CONTROL */}
              <View className="relative">
                <AppImage
                  source={game_images.pplCountContainer}
                  contentFit="contain"
                  style={{ width: panel.width, height: panel.height }}
                />

                {/* MINUS */}
                <Pressable
                  onPress={decrement}
                  onPressIn={minusAnim.pressIn}
                  onPressOut={minusAnim.pressOut}
                  disabled={players <= MIN_PLAYERS}
                  style={{
                    position: "absolute",
                    left: 8 * s,
                    bottom: 26 * s,
                    width: 90 * s,
                    height: 77 * s,
                    justifyContent: "center",
                    alignItems: "center",
                    opacity: players <= MIN_PLAYERS ? 0.5 : 1,
                  }}
                >
                  <AnimatedImage
                    source={game_images.btnMinus}
                    style={[{ width: 80 * s, height: 77 * s }, minusAnim.style]}
                    contentFit="contain"
                  />
                </Pressable>

                {/* COUNT */}
                <View
                  style={{
                    position: "absolute",
                    left: 96 * s,
                    right: 96 * s,
                    bottom: 24 * s,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <CustomText
                    variant="h4"
                    // className="text-black"
                    style={{ fontSize: 50, color: "#2f5377" }}
                  >
                    {players}
                  </CustomText>
                </View>

                {/* PLUS */}
                <Pressable
                  onPress={increment}
                  onPressIn={plusAnim.pressIn}
                  onPressOut={plusAnim.pressOut}
                  disabled={players >= MAX_PLAYERS}
                  style={{
                    position: "absolute",
                    right: 8 * s,
                    bottom: 26 * s,
                    justifyContent: "center",
                    alignItems: "center",
                    opacity: players >= MAX_PLAYERS ? 0.5 : 1,
                  }}
                >
                  <AnimatedImage
                    source={game_images.btnPlus}
                    style={[{ width: 80 * s, height: 77 * s }, plusAnim.style]}
                    contentFit="contain"
                  />
                </Pressable>
              </View>

              <CustomText variant="footnote" className="mb-4" style={{ fontFamily: "Onest-SemiBold" }}>
                {t("max_characters_players")}
              </CustomText>
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingHorizontal: pad, paddingBottom: insets.bottom + 16 },
          ]}
        >
          <CustomButton
            title={t("continue_btn")}
            fullWidth
            btnSize="md"
            fontSize="md"
            onPress={onContinue}
            backgroundImage={backgrounds.bg026}
            shadowColor="#005f07"
          />
          <TouchableOpacity
            className="flex-row items-center gap-2 justify-center mt-4"
            onPress={() => {
              setGameSettingsVisible(true);
              AudioManager.playButtonClick();
            }}
          >
            <FontAwesome name="gear" size={20} color="white" />
            <CustomText variant="p" sizeDelta={4} style={{ fontFamily: "SofiaSansExtraCondensed-Bold" }}>{t("game_settings")}</CustomText>
          </TouchableOpacity>
        </View>

        {gameSettingsVisible && (
          <GameSettingsModal setGameSettingsVisible={setGameSettingsVisible} />
        )}
      </SafeAreaView>
    </FullBleedStack>
  );
};

export default PlayersNumberScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  footer: {
    paddingTop: 12,
  },
});
