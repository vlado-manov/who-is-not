import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  ImageBackground,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomText from "../../components/common/CustomText";
import { game_images, loaderFrames } from "../../../assets/images";
import { backgrounds } from "../../../assets/backgrounds";
import AudioManager from "../../utils/audioManager";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/useUserStore";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { GameStackParamList } from "../../navigation/types";
type PreRevealNavProp = StackNavigationProp<GameStackParamList, "PreReveal">;

const PreRevealScreen = () => {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings } = useAuthStore();
  const navigation = useNavigation<PreRevealNavProp>();
  const logoScale = useRef(new Animated.Value(40)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const screenShake = useRef(new Animated.Value(0)).current;

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
  const frames = useMemo(
    () => [
      loaderFrames.frame01,
      loaderFrames.frame02,
      loaderFrames.frame03,
      loaderFrames.frame04,
      loaderFrames.frame05,
      loaderFrames.frame06,
      loaderFrames.frame07,
      loaderFrames.frame08,
    ],
    []
  );

  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 80);

    return () => clearInterval(interval);
  }, [frames.length]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.replace("Reveal");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [navigation]);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(5)),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),

      Animated.sequence([
        Animated.timing(screenShake, {
          toValue: 1,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(screenShake, {
          toValue: -1,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(screenShake, {
          toValue: 1,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(screenShake, {
          toValue: 0,
          duration: 60,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <SafeAreaView
      style={styles.container}
      className="flex-1"
      edges={["right", "left"]}
    >
      <ImageBackground
        source={backgrounds.bg023}
        className="flex-1"
        resizeMode="cover"
      >
        <Animated.View
          style={[
            styles.content,
            {
              transform: [
                {
                  translateX: screenShake.interpolate({
                    inputRange: [-1, 1],
                    outputRange: [-8, 8],
                  }),
                },
              ],
            },
          ]}
        >
          <View className="mt-[80px]">
            <Pressable className="mt-[80px]" onPress={toggleSound}>
              <Image
                key={frameIndex}
                source={frames[frameIndex]}
                style={{
                  width: 350,
                  height: 260,
                  position: "absolute",
                  top: -88,
                  left: 12,
                  opacity: 0.95,
                }}
                resizeMode="contain"
              />
              <View
                style={{
                  width: 350,
                  height: 260,
                  position: "absolute",
                  top: -88,
                  left: 12,
                }}
              >
                {frames.map((frame, index) => (
                  <Image
                    key={index}
                    source={frame}
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      opacity: frameIndex === index ? 1 : 0,
                    }}
                    resizeMode="contain"
                  />
                ))}
              </View>

              <Image
                source={logoSource}
                style={{ width: 360, height: 280, opacity: 0 }}
                resizeMode="contain"
              />
              <Animated.Image
                source={logoSource}
                style={{
                  width: 360,
                  height: 280,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  zIndex: 99,
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }],
                }}
                resizeMode="contain"
              />
            </Pressable>
          </View>
          <CustomText variant="h5-headline">Loading...</CustomText>

          <CustomText variant="p-small" className="mt-2 px-8 text-center">
            ...not really, we just like the suspense.
          </CustomText>
          <CustomText variant="p-small" className="mt-2 px-8 text-center">
            Don't you?
          </CustomText>
        </Animated.View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default PreRevealScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  loaderWrapper: {
    width: "100%",
    height: "80%",
  },
  loader: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
});
