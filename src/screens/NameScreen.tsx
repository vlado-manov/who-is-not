import { View, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { backgrounds } from "../../assets/backgrounds";
import CustomText from "../components/common/CustomText";
import { useTranslation } from "react-i18next";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import CustomInput from "../components/common/CustomInput";
import { useState } from "react";
import CustomButton from "../components/common/CustomButton";
import { CreateGameStackParamList } from "../navigation/types";
import { useGameStore } from "../store/useGameStore";

type NameRoute = RouteProp<CreateGameStackParamList, "Name">;
type Nav = StackNavigationProp<CreateGameStackParamList, "Name">;

const NameScreen = () => {
  const [name, setName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const route = useRoute<NameRoute>();
  const navigation = useNavigation<Nav>();
  const { index } = route.params;
  const addPlayer = useGameStore((s) => s.addPlayer);
  const { t } = useTranslation();

  const onContinue = () => {
    const trimmed = name.trim();

    if (!trimmed || trimmed.length < 3) {
      setError(
        t("max_characters_name_error", {
          defaultValue: "Name must be at least 3 letters",
        })
      );
      return;
    }

    setError(null);

    const id = Date.now().toString();
    addPlayer({ id, name: trimmed, connected: true });

    navigation.navigate("HeroPicker", { index });
  };

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg001}
        style={{ flex: 1, width: "100%", height: "100%" }}
        resizeMode="cover"
      >
        <View className="flex-1 items-center w-full justify-between px-4 gap-3 relative pt-40">
          <View className="justify-center items-center absolute top-24 w-full">
            <CustomText variant="h2-headline" className="text-center">
              {t("title_00")}
            </CustomText>
            <CustomText variant="h2" className="-rotate-3 text-center" shadow>
              {t("title_01")}
            </CustomText>
          </View>

          <View className="max-w-[80%] w-full justify-center items-center h-full relative">
            <CustomText variant="label">{t("name_label_text")}</CustomText>
            <CustomInput
              value={name}
              onChangeText={setName}
              returnKeyType="done"
              maxLength={8}
            />

            <CustomText variant="footnote" className="my-4">
              {t("max_characters_name")}
            </CustomText>

            <CustomButton
              title={t("continue_btn")}
              color="bg-primary-500"
              fullWidth
              buttonClassName="mt-2"
              onPress={onContinue}
            />

            {error && (
              <CustomText variant="footnote" className="text-red-500 mt-4">
                {error}
              </CustomText>
            )}

            <CustomText variant="label" className="absolute bottom-12">
              {t("player_label_text")} {index}
            </CustomText>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default NameScreen;
