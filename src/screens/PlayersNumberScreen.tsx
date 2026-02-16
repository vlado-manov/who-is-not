import {
  View,
  ImageBackground,
  Pressable,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import AudioManager from "../utils/audioManager";
import { game_images } from "../../assets/images";
import { useAuthStore } from "../store/useUserStore";
import { Animated } from "react-native";
import { useRef } from "react";

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
  const { settings, updateSettings } = useAuthStore();

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
    beginLocalGame(players);
    startGameSession("LOCAL");
    // navigation.navigate("Name", { index: 1 });
    navigation.navigate("HeroPicker", { index: 1 });
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

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg023}
        className="flex-1"
        resizeMode="cover"
      >
        <View className="flex-1 items-center px-4 pt-40">
          {/* LOGO */}
          <Pressable className="mt-[80px]" onPress={toggleSound}>
            <Image
              source={game_images.storeIcon}
              style={{
                width: 350,
                height: 260,
                position: "absolute",
                top: -88,
                left: 0,
              }}
              resizeMode="contain"
            />
            <Image
              source={logoSource}
              style={{ width: 360, height: 280 }}
              resizeMode="contain"
            />
          </Pressable>

          {/* CONTENT */}
          <View className="w-full items-center px-8">
            <CustomText variant="label" className="mb-4">
              {t("players_number_label_text")}
            </CustomText>

            {/* PLAYER COUNT CONTROL */}
            <View className="relative">
              <Image
                source={game_images.pplCountContainer}
                resizeMode="contain"
                style={{ width: 360, height: 160 }}
              />

              {/* MINUS */}
              <Pressable
                onPress={decrement}
                onPressIn={minusAnim.pressIn}
                onPressOut={minusAnim.pressOut}
                disabled={players <= MIN_PLAYERS}
                style={{
                  position: "absolute",
                  left: 8,
                  bottom: 26,
                  width: 90,
                  height: 77,
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: players <= MIN_PLAYERS ? 0.5 : 1,
                }}
              >
                <Animated.Image
                  source={game_images.btnMinus}
                  style={[{ width: 90, height: 77 }, minusAnim.style]}
                  resizeMode="contain"
                />
              </Pressable>

              {/* COUNT */}
              <View
                style={{
                  position: "absolute",
                  left: 96,
                  right: 96,
                  bottom: 22,
                  // height: 96,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <CustomText variant="h3" className="text-white" shadow>
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
                  right: 8,
                  bottom: 26,
                  // width: 96,
                  // height: 96,
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: players >= MAX_PLAYERS ? 0.5 : 1,
                }}
              >
                <Animated.Image
                  source={game_images.btnPlus}
                  style={[{ width: 90, height: 77 }, plusAnim.style]}
                  resizeMode="contain"
                />
              </Pressable>
            </View>

            <CustomText variant="footnote" className="mb-4">
              {t("max_characters_players")}
            </CustomText>

            {/* CONTINUE */}
            <CustomButton
              title={t("continue_btn")}
              fullWidth
              // btnSize="lg"
              buttonClassName="mt-2"
              onPress={onContinue}
              backgroundImage={backgrounds.bg026}
              shadowColor="#005f07"
            />

            {/* SETTINGS */}
            <TouchableOpacity
              className="flex-row items-center gap-2 justify-center mt-4"
              onPress={() => {
                setGameSettingsVisible(true);
                AudioManager.playButtonClick();
              }}
            >
              <FontAwesome name="gear" size={20} color="white" />
              <CustomText variant="p">Game settings</CustomText>
            </TouchableOpacity>
          </View>
        </View>

        {gameSettingsVisible && (
          <GameSettingsModal setGameSettingsVisible={setGameSettingsVisible} />
        )}
      </ImageBackground>
    </SafeAreaView>
  );
};

export default PlayersNumberScreen;
