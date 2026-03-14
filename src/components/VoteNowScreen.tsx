// src/components/VoteNowScreen.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { View, Pressable, Animated, Easing } from "react-native";
import AppImage from "./AppImage";
import ImageBackgroundWithLoadGate from "./ImageBackgroundWithLoadGate";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { backgrounds } from "../../assets/backgrounds";
import CustomText from "./common/CustomText";
import CustomButton from "./common/CustomButton";
import { GameStackParamList } from "../navigation/types";
import { useGameStore } from "../store/useGameStore";
import { game_images } from "../../assets/images";
import { usePreventBack } from "../hooks/usePreventBack";
import { getVoteMarkImageUrlForLang } from "../api/publicImages";

const VOTE_NOW_IMAGE_URLS = [
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/536c3912-ecb7-485e-a434-6702f142fdc9-voteNow1.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/2976fe36-14fd-4af7-ad91-4c564127e758-voteNow2.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/b555d650-3b61-4bb8-8b95-3a5908af8c09-voteNow3.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/9ac5f955-b106-4456-b882-256ae7f2da6e-voteNow4.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/44a2c8db-e7d3-4842-9149-3f76646c8145-voteNow6.webp",
];

type Nav = StackNavigationProp<GameStackParamList, "VoteNow">;

const VoteNowScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  usePreventBack();
  const players = useGameStore((s) => s.players);

  const firstVoter = players[0];
  const randomVoteNowImage = useMemo(
    () =>
      VOTE_NOW_IMAGE_URLS[
        Math.floor(Math.random() * VOTE_NOW_IMAGE_URLS.length)
      ],
    [],
  );

  const voteMarkUri = getVoteMarkImageUrlForLang(i18n.language);
  const animatedVoteMarkScale = useRef(new Animated.Value(25)).current;
  const animatedVoteMarkTranslateY = useRef(new Animated.Value(-800)).current;
  const animatedVoteMarkRotate = useRef(new Animated.Value(0)).current;
  const animatedVoteMarkOpacity = useRef(new Animated.Value(1)).current;
  const staticVoteMarkOpacity = useRef(new Animated.Value(0)).current;
  const screenShake = useRef(new Animated.Value(0)).current;

  const onStartVoting = () => {
    if (!firstVoter) return;
    navigation.navigate("Vote", { voterIndex: 0 });
  };

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(animatedVoteMarkTranslateY, {
          toValue: 0,
          speed: 14,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.timing(animatedVoteMarkScale, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(animatedVoteMarkRotate, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(animatedVoteMarkOpacity, {
          toValue: 0,
          duration: 130,
          useNativeDriver: true,
        }),
        Animated.timing(staticVoteMarkOpacity, {
          toValue: 1,
          duration: 130,
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
    <SafeAreaView className="flex-1 bg-primary-700" edges={["right", "left"]}>
      <ImageBackgroundWithLoadGate
        source={backgrounds.bg023}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <Animated.View
          className="flex-1 items-center justify-center relative w-full h-full px-8"
          style={{
            transform: [
              {
                translateX: screenShake.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [-8, 8],
                }),
              },
            ],
          }}
        >
          <Pressable
            className="mt-[80px]"
            style={{ zIndex: 200, elevation: 200 }}
          >
            <Animated.View
              style={{
                width: 380,
                height: 280,
                zIndex: 5,
                position: "absolute",
                opacity: animatedVoteMarkOpacity,
                transform: [
                  { translateY: animatedVoteMarkTranslateY },
                  { scale: animatedVoteMarkScale },
                  {
                    rotate: animatedVoteMarkRotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["-900deg", "0deg"],
                    }),
                  },
                ],
              }}
            >
              <AppImage
                source={{ uri: voteMarkUri }}
                style={{ width: 380, height: 280 }}
                contentFit="contain"
              />
            </Animated.View>

            <Animated.View
              style={{
                width: 380,
                height: 280,
                zIndex: 6,
                opacity: staticVoteMarkOpacity,
              }}
            >
              <AppImage
                source={{ uri: voteMarkUri }}
                style={{ width: 380, height: 280 }}
                contentFit="contain"
              />
            </Animated.View>

            <AppImage
              source={{ uri: randomVoteNowImage }}
              style={{
                width: 350,
                height: 260,
                position: "absolute",
                top: -160,
                left: 16,
                zIndex: 1,
              }}
              contentFit="contain"
            />
            <AppImage
              source={game_images.logoMusicOn}
              style={{
                width: 360,
                height: 280,
                opacity: 0,
                position: "absolute",
              }}
              contentFit="contain"
            />
          </Pressable>

          <CustomText variant="h4-headline" className="mt-2 px-8 text-center">
            {firstVoter
              ? t("first_player_name", { name: firstVoter.name })
              : t("first_player_up")}
          </CustomText>
          <View className="absolute bottom-12 w-full">
            <CustomText variant="footnote" className="mb-2 px-4 text-center">
              {firstVoter
                ? t("first_voter_click_hint", { name: firstVoter.name })
                : t("first_player_up")}
            </CustomText>
            <CustomButton
              title={t("its_me")}
              backgroundImage={backgrounds.bg026}
              glow
              glowColor="rgba(41,255,25,0.8)"
              shadowColor="#005f07"
              horizontalPadding={48}
              fullWidth
              onPress={onStartVoting}
            />
          </View>
        </Animated.View>
      </ImageBackgroundWithLoadGate>
    </SafeAreaView>
  );
};

export default VoteNowScreen;
