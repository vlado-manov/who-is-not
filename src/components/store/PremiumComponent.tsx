import { View, Text, ImageBackground } from "react-native";
import React from "react";
import CustomText from "../common/CustomText";
import CustomButton from "../common/CustomButton";
import { backgrounds } from "../../../assets/backgrounds";
import { useTranslation } from "react-i18next";

type PremiumComponentProps = {
  onSelect?: () => void;
};

const PremiumComponent = ({ onSelect }: PremiumComponentProps) => {
  const { t } = useTranslation();
  return (
    <View className="mt-16 mx-8 relative">
      <ImageBackground
        source={backgrounds.bg023}
        resizeMode="cover"
        style={{ borderRadius: 40, overflow: "hidden" }}
        className="pt-12 pb-[128px]"
      >
        <View className="items-center justify-center flex-row gap-2">
          <Text className="text-[40px]">🤩</Text>
          <CustomText
            variant="h2-small"
            className="text-center items-center justify-center flex"
            shadow
          >
            {t("premium_title")}
          </CustomText>
        </View>
        <CustomText className="text-center my-4">{t("premium_sub")}</CustomText>
        <View className="items-center justify-center flex-row gap-2">
          <CustomText>{t("only")}</CustomText>
          <CustomText variant="h3" className="text-center" shadow>
            <CustomText
              variant="h2-headline"
              className="font-opensans-extrabold"
              shadow
            >
              $
            </CustomText>
            5.99
          </CustomText>
        </View>
      </ImageBackground>
      <CustomButton
        title={t("go_premium")}
        buttonClassName="mt-8 w-[106%] -ml-[3%] -rotate-1 absolute bottom-8"
        onPress={onSelect}
      />
    </View>
  );
};

export default PremiumComponent;
