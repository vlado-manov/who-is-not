import { useTranslation } from "react-i18next";
import { View, Pressable, Animated } from "react-native";
import ImageBackgroundWithLoadGate from "../components/ImageBackgroundWithLoadGate";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { backgrounds } from "../../assets/backgrounds";
import CustomText from "../components/common/CustomText";
import CustomButton from "../components/common/CustomButton";
import {
  OnboardingStackParamList,
  RootStackParamList,
} from "../navigation/types";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAuthStore } from "../store/useUserStore";
import { game_images } from "../../assets/images";
import { useMemo, useRef } from "react";
import AudioManager from "../utils/audioManager";
import { Image } from "expo-image";
import AppImage from "../components/AppImage";
import { trackPlayerSessionStarted } from "../api/analytics";

const AnimatedImage = Animated.createAnimatedComponent(Image);

type OnbNav = StackNavigationProp<OnboardingStackParamList, "MenuPlay">;
type RootNav = StackNavigationProp<RootStackParamList>;
type Nav = CompositeNavigationProp<OnbNav, RootNav>;
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
const MenuPlayScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { settings, updateSettings, user } = useAuthStore();
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
  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackgroundWithLoadGate
        source={backgrounds.bg023}
        style={{ flex: 1, width: "100%", height: "100%" }}
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
            <AnimatedImage
              source={game_images.settingsIcon}
              style={[
                { width: 56, height: 56 },
                settingsAnim.style,
              ]}
              contentFit="contain"
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
            <AnimatedImage
              source={game_images.userIcon}
              style={[
                { width: 56, height: 56 },
                profileAnim.style,
              ]}
              contentFit="contain"
            />
          </Pressable>
        </View>
        <View className="flex-1 items-center w-full px-4">
          <View className="flex-1 items-center w-full justify-between px-4 gap-3 relative pt-40">
            <Pressable className="" onPress={toggleSound}>
              <AppImage
                source={logoSource}
                style={{ width: 360, height: 280 }}
                contentFit="contain"
              />
            </Pressable>
          </View>

          <View className="max-w-[80%] w-full justify-center items-center gap-6 h-full">
            <CustomButton
              title={t("menuPlay_device_btn")}
              fullWidth
              buttonClassName="-rotate-1 mt-2"
              onPress={() => {
                void trackPlayerSessionStarted({
                  userId: user.id,
                  source: "MENU_PLAY",
                  step: "local_create_game_tapped",
                  language: i18n.language,
                }).catch((e) => {
                  console.warn(
                    "track PLAYER_SESSION_STARTED(local_create_game_tapped) failed",
                    e
                  );
                });
                navigation.navigate("CreateGame");
              }}
              label={t("play_one_device")}
              backgroundImage={backgrounds.bg026}
              shadowColor="#005f07"
            />
            <CustomButton
              title={t("menuPlay_host_btn")}
              fullWidth
              label={t("invite_friends_label")}
              buttonClassName="-rotate-1 mt-2"
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
                  console.warn("track PLAYER_SESSION_STARTED(host_tapped) failed", e);
                });
              }}
            />
            <CustomButton
              title={t("menuPlay_join_btn")}
              fullWidth
              buttonClassName="-rotate-1 mt-2"
              backgroundImage={backgrounds.bg015}
              label={t("scan_qr_code")}
              shadowColor="#540d0d"
              onPress={() => {
                void trackPlayerSessionStarted({
                  userId: user.id,
                  source: "MENU_PLAY",
                  step: "join_tapped",
                  language: i18n.language,
                  mode: "ONLINE",
                }).catch((e) => {
                  console.warn("track PLAYER_SESSION_STARTED(join_tapped) failed", e);
                });
              }}
            />
          </View>
        </View>
      </ImageBackgroundWithLoadGate>
    </SafeAreaView>
  );
};

export default MenuPlayScreen;
