import React, { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { GameStackParamList } from "../../navigation/types";
import LoadingScreen from "../../components/LoadingScreen";

type PreRevealNavProp = StackNavigationProp<GameStackParamList, "PreReveal">;

const PreRevealScreen = () => {
  const navigation = useNavigation<PreRevealNavProp>();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.replace("Reveal");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [navigation]);

  return (
    <LoadingScreen
      skipIntroAnimation
      useGameMusic
      titleKey="pre_reveal_loading"
      hint1Key="pre_reveal_suspense"
      hint2Key="pre_reveal_dont_you"
    />
  );
};

export default PreRevealScreen;
