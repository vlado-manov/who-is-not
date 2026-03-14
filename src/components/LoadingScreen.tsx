import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { Image } from "expo-image";
import AppImage from "./AppImage";

const AnimatedImage = Animated.createAnimatedComponent(Image);
import ImageBackgroundWithLoadGate from "./ImageBackgroundWithLoadGate";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomText from "./common/CustomText";
import { game_images, loaderFrames } from "../../assets/images";
import { backgrounds } from "../../assets/backgrounds";
import AudioManager from "../utils/audioManager";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store/useUserStore";
import { usePreventBack } from "../hooks/usePreventBack";
import { getTimeToVoteImageUrlForLang } from "../api/publicImages";

type LoadingScreenProps = {
  /** Пропусни scale-от-40 анимацията – за краткотрайни loading states (напр. HeroPicker) */
  skipIntroAnimation?: boolean;
  /** Рендирай като абсолютен overlay вместо пълен екран */
  overlay?: boolean;
  /** i18n ключ за заглавие (default: "loading") */
  titleKey?: string;
  /** i18n ключ за hint 1 (default: "loading_hint") */
  hint1Key?: string;
  /** i18n ключ за hint 2 (default: "loading_hint_2") */
  hint2Key?: string;
  /** При true, toggle на звука пуска playBackgroundGame (за gameplay екрани) */
  useGameMusic?: boolean;
};

const LoadingScreen = ({
  skipIntroAnimation = true,
  overlay = false,
  titleKey = "loading",
  hint1Key = "loading_hint",
  hint2Key = "loading_hint_2",
  useGameMusic = false,
}: LoadingScreenProps) => {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings } = useAuthStore();
  usePreventBack(!overlay);
  const logoScale = useRef(
    new Animated.Value(skipIntroAnimation ? 1 : 40)
  ).current;
  const logoOpacity = useRef(
    new Animated.Value(skipIntroAnimation ? 1 : 0)
  ).current;
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
    AudioManager.setSoundEnabled(newVal, useGameMusic);
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
    [],
  );

  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 80);

    return () => clearInterval(interval);
  }, [frames.length]);

  useEffect(() => {
    const lang = i18n.language;
    getTimeToVoteImageUrlForLang(lang)
      .then((url) => {
        if (url) {
          Image.prefetch(url);
        }
      })
      .catch(() => {
        // Non-fatal – we'll fall back to bundled assets in VoteNowScreen.
      });
  }, [i18n.language]);

  useEffect(() => {
    if (skipIntroAnimation) return;
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
  }, [skipIntroAnimation]);

  const content = (
    <ImageBackgroundWithLoadGate
        source={backgrounds.bg023}
        style={{ flex: 1 }}
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
          <View className="mt-[80px]" style={{ zIndex: 200, elevation: 200 }}>
            <Pressable className="mt-[80px]" onPress={toggleSound}>
              <AppImage
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
                contentFit="contain"
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
                  <AppImage
                    key={index}
                    source={frame}
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      opacity: frameIndex === index ? 1 : 0,
                    }}
                    contentFit="contain"
                  />
                ))}
              </View>

              <AppImage
                source={logoSource}
                style={{ width: 360, height: 280, opacity: 0, zIndex: 199 }}
                contentFit="contain"
              />
              <AnimatedImage
                source={logoSource}
                style={{
                  width: 360,
                  height: 280,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  zIndex: 199,
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }],
                }}
                contentFit="contain"
              />
            </Pressable>
          </View>
          <CustomText variant="h5-headline">{t(titleKey)}</CustomText>

          <CustomText variant="p-small" className="mt-2 px-8 text-center">
            {t(hint1Key)}
          </CustomText>
          <CustomText variant="p-small" className="mt-2 px-8 text-center">
            {t(hint2Key)}
          </CustomText>
        </Animated.View>
      </ImageBackgroundWithLoadGate>
  );

  if (overlay) {
    return (
      <View
        style={styles.overlay}
        pointerEvents="auto"
      >
        {content}
      </View>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      className="flex-1"
      edges={["right", "left"]}
    >
      {content}
    </SafeAreaView>
  );
};

export default LoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    zIndex: 50,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
});
