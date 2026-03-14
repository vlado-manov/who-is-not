import React from "react";
import { View } from "react-native";
import CustomText from "../../components/common/CustomText";
import { useTranslation } from "react-i18next";

export function HeroPickerHeader() {
  const { t } = useTranslation();
  return (
    <View
      className="mt-[80px] justify-center items-center max-w-[86%] w-full"
      style={{ marginBottom: 40 }}
    >
      <CustomText variant="h3-headline" className="text-center">
        <CustomText variant="h5" shadow>
          {t("hero_picker_headline")}
        </CustomText>{" "}
        <CustomText variant="h5" shadow>
          {t("hero_picker_headline_2")}
        </CustomText>
      </CustomText>
    </View>
  );
}
