// src/components/PassDeviceVoteScreen.tsx
import React from "react";
import { View, ImageBackground, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import CustomText from "./common/CustomText";
import CustomButton from "./common/CustomButton";
import { backgrounds } from "../../assets/backgrounds";
import { game_images } from "../../assets/images";
import { GameStackParamList } from "../navigation/types";
import { useGameStore } from "../store/useGameStore";

type R = RouteProp<GameStackParamList, "PassDeviceVote">;
type Nav = StackNavigationProp<GameStackParamList, "PassDeviceVote">;

const PassDeviceVoteScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { voterIndex } = useRoute<R>().params;

  const players = useGameStore((s) => s.players);
  const nextVoter = players[voterIndex];

  const onContinue = () => {
    navigation.navigate("Vote", { voterIndex });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-700" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg023}
        className="flex-1 relative"
        resizeMode="cover"
      >
        <View className="flex-1 items-center w-full justify-center relative">
          {/* TOP TEXT */}
          <View className="justify-center items-center w-full absolute top-24">
            <CustomText
              variant="h4-headline"
              className="mt-24 text-center z-50 px-6"
            >
              {t("pass_device_sub", {
                defaultValue: "Hand the phone to",
              })}
            </CustomText>

            <CustomText variant="h3" shadow className="capitalize">
              {nextVoter?.name ??
                t("next_player", { defaultValue: "Next player" })}
            </CustomText>

            <CustomText variant="p-small">
              ({t("no_peeking", { defaultValue: "No peeking" })})
            </CustomText>
          </View>

          {/* IMAGE */}
          <View
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              flex: 1,
            }}
          >
            <Image
              source={game_images.passDevice}
              resizeMode="contain"
              className="w-full"
              style={{
                position: "absolute",
                left: "50%",
                top: "80%",
                transform: "translate(-50%,-50%)",
                width: "100%",
              }}
            />
          </View>
        </View>

        {/* BOTTOM */}
        <View className="mb-16 px-16">
          <CustomText variant="p" className="text-center px-8 mb-10">
            {nextVoter
              ? `${nextVoter.name}, click this button once the phone is in your hands and nobody is looking`
              : "Click NEXT once the phone is in your hands and nobody is looking"}
          </CustomText>

          <CustomButton
            title={t("next_btn", { defaultValue: "It's me" })}
            backgroundImage={backgrounds.bg026}
            glow
            glowColor="rgba(41,255,25,0.8)"
            shadowColor="#005f07"
            horizontalPadding={48}
            fullWidth
            onPress={onContinue}
          />
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default PassDeviceVoteScreen;
