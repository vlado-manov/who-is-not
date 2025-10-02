import React from "react";
import { View, ImageBackground, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import CustomText from "./common/CustomText";
import CustomButton from "./common/CustomButton";
import { backgrounds } from "../../assets/backgrounds";
import { images } from "../../assets/images";
import { CreateGameStackParamList } from "../navigation/types";
import { useGameStore } from "../store/useGameStore";

type R = RouteProp<CreateGameStackParamList, "PassDevice">;
type Nav = StackNavigationProp<CreateGameStackParamList, "PassDevice">;

const PassDeviceScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { index } = useRoute<R>().params;

  const target = useGameStore((s) => s.targetPlayersCount);

  const onContinue = () => {
    if (target && index <= target) {
      navigation.navigate("Name", { index });
    } else {
      navigation.navigate("Lobby");
    }
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
            <CustomText variant="h2-headline" className="text-center" shadow>
              {t("title_00")}
            </CustomText>
            <CustomText variant="h2" className="-rotate-3 text-center" shadow>
              {t("title_01")}
            </CustomText>
            <CustomText
              variant="h3-headline"
              className="mt-24 text-center z-50"
              shadow
            >
              {t("pass_device_sub", {
                defaultValue: "Hand the phone to player {{index}}",
                index,
              })}
            </CustomText>
          </View>
          <View className="flex-1 w-full h-full items-center justify-around mt-16">
            <Image
              source={images.passDevice}
              resizeMode="contain"
              className="mt-8 w-[130%]"
            />
          </View>
        </View>

        <View className="mb-16 px-16">
          <CustomButton
            title={t("continue_btn", { defaultValue: "Continue" })}
            color="bg-primary-500"
            fullWidth
            onPress={onContinue}
          />
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default PassDeviceScreen;
