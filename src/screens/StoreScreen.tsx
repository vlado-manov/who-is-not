// src/screens/StoreScreen.tsx
import React, { useState } from "react";
import {
  View,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { backgrounds } from "../../assets/backgrounds";
import CustomText from "../components/common/CustomText";
import PremiumComponent from "../components/store/PremiumComponent";
import HeroSliderComponent from "../components/store/HeroSliderComponent";
import LoadingComponent from "../components/store/LoadingComponent";
import SuccessComponent from "../components/store/SuccessComponent";
import { HEROES } from "../data/heroes";
import { OnboardingStackParamList } from "../navigation/types";
import { ICharacter } from "../types/character";
import BundleSliderComponent from "../components/store/BundleSliderComponent";
import { BUNDLES } from "../data/bundles";
import PackSliderComponent from "../components/store/PackSliderComponent";
import { PACKS } from "../data/packs";
import { FontAwesome5 } from "@expo/vector-icons";

type Nav = StackNavigationProp<OnboardingStackParamList, "Store">;

const StoreScreen = () => {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [successHero, setSuccessHero] = useState<ICharacter | null>(null);

  const paidHeroes = HEROES.filter((h) => !h.free && !h.unlocked);

  const handleBuy = async (hero: ICharacter) => {
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1200));
      setSuccessHero(hero);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg001}
        style={{ flex: 1, width: "100%", height: "100%", position: "relative" }}
        resizeMode="cover"
      >
        <ScrollView contentContainerStyle={{ paddingVertical: 64 }}>
          <View className="px-8 w-full">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="flex flex-row gap-2 items-center"
            >
              <FontAwesome5 name="arrow-left" size={16} color="white" />
              <CustomText>{t("back_btn")}</CustomText>
            </TouchableOpacity>
          </View>

          <View className="flex-1 items-center w-full justify-center px-4 mt-[16px]">
            <CustomText
              variant="h3-headline"
              className="text-center w-full"
              shadow
            >
              {t("menu_store_heading_01")}
            </CustomText>
            <CustomText
              variant="h3"
              className="-rotate-3 text-center w-full"
              shadow
            >
              {t("menu_store_heading_02")}
            </CustomText>
          </View>

          <PremiumComponent />

          <HeroSliderComponent
            title="Our hero selection"
            data={paidHeroes}
            itemSize={164}
            gap={0}
            sidePadding={16}
            onSelect={handleBuy}
          />
          <BundleSliderComponent
            title="Special offers"
            data={BUNDLES}
            onSelect={() => console.log("da")}
          />
          <PackSliderComponent
            title="Step up your game"
            data={PACKS}
            onSelect={() => console.log("opa")}
          />
        </ScrollView>

        {loading && <LoadingComponent />}
        {successHero && (
          <SuccessComponent
            visible={!!successHero}
            hero={successHero}
            onContinue={() => setSuccessHero(null)}
          />
        )}
      </ImageBackground>
    </SafeAreaView>
  );
};

export default StoreScreen;
