import {
  View,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { backgrounds } from "../../assets/backgrounds";
import { Entypo } from "@expo/vector-icons";
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
import AudioManager from "../utils/audioManager";
import { useBackendStats } from "../hooks/useBackendStats";
import { getApiBaseUrl } from "../api/client";

type Nav = StackNavigationProp<OnboardingStackParamList, "Store">;

const ProfileScreen = () => {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const authStatus = useAuthStore((s) => s.authStatus);
  const signOut = useAuthStore((s) => s.signOut);
  const { loading, error, global, kpis, refresh } = useBackendStats();
  const [imagePickerVisible, setImagePickerVisible] = useState(false);

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg023}
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
                onPress={() => {
                  AudioManager.playButtonClick();
                  navigation.goBack();
                }}
                className="flex flex-row gap-2 items-center"
              >
                <Entypo name="arrow-with-circle-left" size={48} color="white" />
              </TouchableOpacity>
            </View>
            <View className="items-center w-full justify-center px-4 mt-[40px]">
              <CustomText variant="h3-headline" className="text-center w-full">
                Your
              </CustomText>
              <CustomText variant="h3" className="-rotate-3 text-center w-full">
                Profile
              </CustomText>
            </View>
            <ProfileInfoComponent
              setImagePickerVisible={setImagePickerVisible}
            />

            <View className="mx-6 mt-6 rounded-2xl bg-black/45 p-4 border border-white/15">
              <View className="flex-row items-center justify-between mb-2">
                <CustomText variant="h6-headline">Live Stats</CustomText>
                <TouchableOpacity onPress={() => void refresh()}>
                  <CustomText className="underline text-xs">Refresh</CustomText>
                </TouchableOpacity>
              </View>
              <CustomText className="text-xs opacity-70 mb-3">
                Source: {getApiBaseUrl()}
              </CustomText>
              {loading && <CustomText>Loading stats...</CustomText>}
              {!loading && error && (
                <CustomText className="text-red-200">Stats error: {error}</CustomText>
              )}
              {!loading && !error && global && kpis && (
                <View className="gap-1">
                  <CustomText>Games started: {global.gamesStarted}</CustomText>
                  <CustomText>Games finished: {global.gamesFinished}</CustomText>
                  <CustomText>Total rounds: {global.totalRounds}</CustomText>
                  <CustomText>
                    Completion: {(kpis.completionRate * 100).toFixed(1)}%
                  </CustomText>
                </View>
              )}
            </View>
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
      </ImageBackground>
    </SafeAreaView>
  );
};

export default ProfileScreen;
