import {
  View,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { backgrounds } from "../../assets/backgrounds";
import { FontAwesome5 } from "@expo/vector-icons";
import CustomText from "../components/common/CustomText";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { StackNavigationProp } from "@react-navigation/stack";
import { OnboardingStackParamList } from "../navigation/types";
import { useAuthStore } from "../store/useUserStore";
import ProfileInfoComponent from "../components/profile/ProfileInfoComponent";
import ProfileLoginComponent from "../components/profile/ProfileLoginComponent";
import CustomButton from "../components/common/CustomButton";
import ProfileImagePickerComponent from "../components/profile/ProfileImagePickerComponent";
import ProfileSettingsComponent from "../components/profile/ProfileSettingsComponent";

type Nav = StackNavigationProp<OnboardingStackParamList, "Store">;

const ProfileScreen = () => {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const authStatus = useAuthStore((s) => s.authStatus);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  console.log("authstatus is: ", authStatus);
  console.log("userdata is: ", user);

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg001}
        style={{ flex: 1, width: "100%", height: "100%", position: "relative" }}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={{
            paddingVertical: 64,
            flexGrow: 1,
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <View className="relative">
            <View className="px-8">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="flex flex-row gap-2 items-center"
              >
                <FontAwesome5 name="arrow-left" size={16} color="white" />
                <CustomText>{t("back_btn")}</CustomText>
              </TouchableOpacity>
            </View>
            <View className="items-center w-full justify-center px-4 mt-[40px]">
              <CustomText
                variant="h3-headline"
                className="text-center w-full"
                shadow
              >
                Your
              </CustomText>
              <CustomText
                variant="h3"
                className="-rotate-3 text-center w-full"
                shadow
              >
                Profile
              </CustomText>
            </View>
            <ProfileInfoComponent
              setImagePickerVisible={setImagePickerVisible}
              setSettingsVisible={setSettingsVisible}
            />
            {authStatus === "guest" && <ProfileLoginComponent />}
            {/* Will add later */}
            {/* {authStatus != "guest" && <AchievementsSliderComponent />} */}
          </View>
          <View className="items-center">
            {authStatus != "guest" && (
              <CustomButton
                title="Logout"
                onPress={signOut}
                btnSize="xs"
                buttonClassName=" max-w-[50%] w-auto mb-4"
              />
            )}
            <View className="flex-row gap-2 mt-4">
              <TouchableOpacity>
                <CustomText className="underline">Privacy policy</CustomText>
              </TouchableOpacity>
              <CustomText>and</CustomText>
              <TouchableOpacity>
                <CustomText className="underline">
                  Terms & Conditions
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        {imagePickerVisible && (
          <ProfileImagePickerComponent
            setImagePickerVisible={setImagePickerVisible}
          />
        )}
        {settingsVisible && (
          <ProfileSettingsComponent setSettingsVisible={setSettingsVisible} />
        )}
      </ImageBackground>
    </SafeAreaView>
  );
};

export default ProfileScreen;
