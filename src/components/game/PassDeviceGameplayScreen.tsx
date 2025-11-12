// src/screens/Game/PassDeviceGameplayScreen.tsx
import React from "react";
import { View, ImageBackground, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { GameStackParamList } from "../../navigation/types";
import { useGameStore } from "../../store/useGameStore";
import { backgrounds } from "../../../assets/backgrounds";
import CustomText from "../../components/common/CustomText";
import { game_images } from "../../../assets/images";
import CustomButton from "../../components/common/CustomButton";

type R = RouteProp<GameStackParamList, "PassDeviceGameplay">;
type Nav = StackNavigationProp<GameStackParamList, "PassDeviceGameplay">;

const PassDeviceGameplayScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { playerIndex } = useRoute<R>().params;

  const players = useGameStore((s) => s.players);
  const currentPlayer = players[playerIndex];

  const onContinue = () => {
    navigation.navigate("Question", { playerIndex });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-700" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg009}
        className="flex-1 relative"
        resizeMode="cover"
      >
        <View className="flex-1 items-center w-full justify-center relative">
          <View className="justify-center items-center w-full absolute top-24">
            <CustomText variant="h2-headline" className="text-center">
              {t("title_00")}
            </CustomText>
            <CustomText variant="h2" className="-rotate-3 text-center" shadow>
              {t("title_01")}
            </CustomText>

            <CustomText
              variant="h4-headline"
              className="mt-24 text-center z-50 px-6"
            >
              {t("pass_device_sub", {
                defaultValue: `Hand the phone to`,
                playerName: currentPlayer?.name,
              })}
            </CustomText>
            <CustomText variant="h4" shadow className="capitalize">
              {currentPlayer?.name}
            </CustomText>

            <CustomText variant="p-small">
              ({t("no_peeking", { defaultValue: "No peeking" })})
            </CustomText>
          </View>

          <View className="flex-1 w-full h-full items-center justify-around mt-16">
            <Image
              source={game_images.passDevice}
              resizeMode="contain"
              className="mt-8 w-[130%]"
            />
          </View>
        </View>

        <View className="mb-16 px-16">
          <CustomText variant="p" className="text-center px-8 mb-10">
            {currentPlayer
              ? `${currentPlayer.name}, click NEXT once the phone is in your hands and nobody is looking`
              : "Click NEXT once the phone is in your hands and nobody is looking"}
          </CustomText>
          <CustomButton
            title={t("next_btn", { defaultValue: "Next" })}
            color="bg-primary-500"
            fullWidth
            onPress={onContinue}
          />
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default PassDeviceGameplayScreen;
