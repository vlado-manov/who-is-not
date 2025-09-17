import { View, Text, ImageBackground, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomText from "./common/CustomText";
import { backgrounds } from "../../assets/backgrounds";
import { useTranslation } from "react-i18next";

const LoadingScreen = () => {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-primary-700" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg009}
        className="flex-1 relative"
        resizeMode="cover"
      >
        <View className="flex-1 items-center w-full justify-center bg-primary-700 px-4 animate-pulse">
          <CustomText variant="h2-headline" className="text-center" shadow>
            {t("title_00")}
          </CustomText>
          <CustomText variant="h2" className="-rotate-3 text-center" shadow>
            {t("title_01")}
          </CustomText>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default LoadingScreen;
