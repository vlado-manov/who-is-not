import { useTranslation } from "react-i18next";
import { View, ImageBackground } from "react-native";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { backgrounds } from "../../assets/backgrounds";
import CustomText from "../components/common/CustomText";
import CustomButton from "../components/common/CustomButton";
import {
  OnboardingStackParamList,
  RootStackParamList,
} from "../navigation/types";
import { StackNavigationProp } from "@react-navigation/stack";

type OnbNav = StackNavigationProp<OnboardingStackParamList, "MenuPlay">;
type RootNav = StackNavigationProp<RootStackParamList>;
type Nav = CompositeNavigationProp<OnbNav, RootNav>;

const MenuPlayScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg001}
        style={{ flex: 1, width: "100%", height: "100%" }}
        resizeMode="cover"
      >
        <View className="flex-1 items-center w-full justify-between px-4 gap-3 relative pt-40">
          <View className="justify-center items-center absolute top-24  w-full">
            <CustomText variant="h2-headline" className="text-center">
              {t("title_00")}
            </CustomText>
            <CustomText variant="h2" className="-rotate-3 text-center" shadow>
              {t("title_01")}
            </CustomText>
          </View>

          <View className="max-w-[80%] w-full justify-center items-center gap-6 h-full">
            <CustomButton
              title={t("menuPlay_device_btn")}
              color="bg-primary-500"
              btnSize="sm"
              fullWidth
              buttonClassName="-rotate-1"
              onPress={() => navigation.navigate("CreateGame")}
            />
            <CustomButton
              title={t("menuPlay_host_btn")}
              color="bg-primary-900"
              btnSize="sm"
              fullWidth
            />
            <CustomButton
              title={t("menuPlay_join_btn")}
              color="bg-primary-100"
              btnSize="sm"
              fullWidth
              buttonClassName="-rotate-1"
            />
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default MenuPlayScreen;
