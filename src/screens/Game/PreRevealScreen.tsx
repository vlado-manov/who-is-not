import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { GameStackParamList } from "../../navigation/types";
import PreRevealLoadingLayer from "../../components/PreRevealLoadingLayer";
import { usePreventBack } from "../../hooks/usePreventBack";

type PreRevealNavProp = StackNavigationProp<GameStackParamList, "PreReveal">;

const PreRevealScreen = () => {
  const navigation = useNavigation<PreRevealNavProp>();
  usePreventBack();

  const onDone = useCallback(() => {
    navigation.replace("Reveal");
  }, [navigation]);

  return <PreRevealLoadingLayer onDone={onDone} />;
};

export default PreRevealScreen;
