import React from "react";
import { View } from "react-native";
import CustomText from "../../components/common/CustomText";
import { useTranslation } from "react-i18next";

export function HeroPickerHeader() {
  const { t } = useTranslation();
  return (
    <View
      className="justify-center items-center max-w-[86%] w-full self-center px-1"
      style={{ paddingTop: 80 }}
    >
      <CustomText variant="h4-headline" className="text-center w-full" shadow>
        {t("hero_picker_headline")}
      </CustomText>
      <CustomText
        variant="h4"
        className="-rotate-3 text-center w-full mt-0.5"
        shadow
      >
        {t("hero_picker_headline_2")}
      </CustomText>
    </View>
  );
}
