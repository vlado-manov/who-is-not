import { View, Text, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { backgrounds } from "../../assets/backgrounds";
import CustomText from "../components/common/CustomText";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import CustomInput from "../components/common/CustomInput";
import { useState } from "react";
import CustomButton from "../components/common/CustomButton";
import { CreateGameStackParamList } from "../navigation/types";
import { useGameStore } from "../store/useGameStore";

type Nav = StackNavigationProp<CreateGameStackParamList, "PlayersNumber">;

const PlayersNumberScreen = () => {
  const [players, setPlayers] = useState<string>("");
  const beginLocalGame = useGameStore((s) => s.beginLocalGame);
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  const handleChange = (txt: string) => {
    const digits = txt.replace(/\D/g, "").slice(0, 2);
    if (!digits) return setPlayers("");
    const n = Math.min(parseInt(digits, 10), 10);
    setPlayers(String(n));
  };

  const onContinue = () => {
    const n = parseInt(players || "0", 10);
    if (!n || n < 3) {
      return;
    }
    beginLocalGame(n);
    navigation.navigate("Name", { index: 1 });
  };

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg001}
        style={{ flex: 1, width: "100%", height: "100%" }}
        resizeMode="cover"
      >
        <View className="flex-1 items-center w-full justify-between px-4 gap-3 relative pt-40">
          <View className="justify-center items-center absolute top-24  w-full">
            <CustomText variant="h2-headline" className="text-center" shadow>
              {t("title_00")}
            </CustomText>
            <CustomText variant="h2" className="-rotate-3 text-center" shadow>
              {t("title_01")}
            </CustomText>
          </View>
          <View className="max-w-[80%] w-full justify-center items-center h-full">
            <CustomText variant="label">
              {t("players_number_label_text")}
            </CustomText>
            <CustomInput
              value={players}
              onChangeText={handleChange}
              keyboardType="number-pad"
              maxLength={2}
              returnKeyType="done"
            />
            <CustomText variant="footnote" className="my-4">
              {t("max_characters_players")}
            </CustomText>
            <CustomButton
              title={t("continue_btn")}
              color="bg-primary-500"
              btnSize="lg"
              fullWidth
              buttonClassName="mt-2"
              onPress={onContinue}
            />
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default PlayersNumberScreen;
