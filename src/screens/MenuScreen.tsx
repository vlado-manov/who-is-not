import { View, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { backgrounds } from "../../assets/backgrounds";
import CustomText from "../components/common/CustomText";
import CustomButton from "../components/common/CustomButton";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackNavigationProp } from "@react-navigation/stack";
import { OnboardingStackParamList } from "../navigation/types";

type Nav = StackNavigationProp<OnboardingStackParamList, "Menu">;

const MenuScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg001}
        style={{ flex: 1, width: "100%", height: "100%" }}
        resizeMode="cover"
      >
        <View className="flex-1 items-center w-full justify-center px-4 pt-40">
          <View className="justify-center items-center absolute top-24  w-full">
            <CustomText variant="h2-headline" className="text-center" shadow>
              {t("title_00")}
            </CustomText>
            <CustomText variant="h2" className="-rotate-3 text-center" shadow>
              {t("title_01")}
            </CustomText>
          </View>

          <View className="max-w-[80%] w-full justify-center items-center gap-6 h-full">
            <CustomButton
              title={t("menu_play_btn")}
              color="bg-primary-500"
              btnSize="sm"
              fullWidth
              buttonClassName="-rotate-1"
              onPress={() => navigation.navigate("MenuPlay")}
            />
            <CustomButton
              title={t("menu_store_btn")}
              color="bg-primary-900"
              btnSize="sm"
              fullWidth
              label
              labelTitle={t("menu_store_btn_label")}
              onPress={() => navigation.navigate("Store")}
            />
            <CustomButton
              title={t("menu_profile_btn")}
              color="bg-primary-100"
              btnSize="sm"
              fullWidth
              buttonClassName="-rotate-1"
            />
            <CustomButton
              title={t("menu_aq_btn")}
              color="bg-primary-800"
              btnSize="sm"
              disabled
              fullWidth
              label
              labelTitle={t("menu_aq_btn_label")}
              buttonClassName="rotate-1"
            />
            <CustomButton
              title={t("menu_htp_btn")}
              color="bg-primary-400"
              btnSize="sm"
              fullWidth
            />
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default MenuScreen;
