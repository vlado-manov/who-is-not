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
        <CustomText variant="h1">Round [1]</CustomText>
        <View className="mb-16 px-16">
          <CustomText variant="h3-small">
            [imeto na purviq igrach] is first.
          </CustomText>
          <CustomButton
            title={t("start_btn", { defaultValue: "Start" })}
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
