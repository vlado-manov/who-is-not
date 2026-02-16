// src/components/VoteNowScreen.tsx
import React, { useEffect, useRef } from "react";
import {
  View,
  ImageBackground,
  Pressable,
  Image,
  Animated,
  Easing,
} from "react-native";
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

type Nav = StackNavigationProp<GameStackParamList, "VoteNow">;

const VoteNowScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const players = useGameStore((s) => s.players);

  const firstVoter = players[0];
  const voteMarkScale = useRef(new Animated.Value(40)).current;
  const voteMarkOpacity = useRef(new Animated.Value(0)).current;
  const screenShake = useRef(new Animated.Value(0)).current;

  const onStartVoting = () => {
    if (!firstVoter) return;
    navigation.navigate("Vote", { voterIndex: 0 });
  };

  useEffect(() => {
    Animated.sequence([
      // Animated.delay(200),

      Animated.parallel([
        Animated.timing(voteMarkScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(5)), // cartoon zoom
          useNativeDriver: true,
        }),
        Animated.timing(voteMarkOpacity, {
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
    <SafeAreaView className="flex-1 bg-primary-700" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg023}
        className="flex-1 relative"
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
          {/* <View className="justify-center items-center">
            <CustomText variant="h3" className="text-center" shadow>
              Vote
            </CustomText>
            <CustomText variant="h2" className="-rotate-3 text-center" shadow>
              NOW
            </CustomText>
          </View> */}

          <Pressable className="mt-[80px]">
            <Image
              source={game_images.voteNow4}
              style={{
                width: 350,
                height: 260,
                position: "absolute",
                top: -140,
                left: 0,
              }}
              resizeMode="contain"
            />
            <Image
              source={game_images.logoMusicOn}
              style={{ width: 360, height: 280, opacity: 0 }}
              resizeMode="contain"
            />
            <Animated.Image
              source={game_images.voteMark}
              style={{
                width: 380,
                height: 280,
                position: "absolute",
                top: 40,
                right: 0,
                opacity: voteMarkOpacity,
                transform: [{ scale: voteMarkScale }],
              }}
              resizeMode="contain"
            />
          </Pressable>
          {/* <CustomText variant="h3-headline">Time to vote!</CustomText> */}

          <CustomText variant="h4-headline" className="mt-2 px-8 text-center">
            {firstVoter ? `${firstVoter.name} is first` : "First player is up"}
          </CustomText>
          <View className="absolute bottom-12 w-full">
            {/* <CustomText variant="h4-headline" className="text-center">
              {firstVoter
                ? `${firstVoter.name} is first`
                : "First player is up"}
            </CustomText> */}
            <CustomText variant="footnote" className="mb-2 px-4 text-center">
              {firstVoter
                ? `${firstVoter.name} please click the button when the phone is in your hands`
                : "First player is up"}
            </CustomText>
            <CustomButton
              title={t("lets_go_btn", {
                defaultValue: `It's me, ${firstVoter.name} !`,
              })}
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
      </ImageBackground>
    </SafeAreaView>
  );
};

export default VoteNowScreen;
