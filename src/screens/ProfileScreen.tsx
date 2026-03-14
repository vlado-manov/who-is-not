import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import ImageBackgroundWithLoadGate from "../components/ImageBackgroundWithLoadGate";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { Share } from "react-native";
import { Entypo } from "@expo/vector-icons";
import { backgrounds } from "../../assets/backgrounds";
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
import { getReferralMe } from "../api/referral";

type Nav = StackNavigationProp<OnboardingStackParamList, "Store">;

const ProfileScreen = () => {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const authStatus = useAuthStore((s) => s.authStatus);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { loading, error, global, kpis, refresh } = useBackendStats();
  const [imagePickerVisible, setImagePickerVisible] = useState(false);

  const { data: referralData, isLoading: referralLoading } = useQuery({
    queryKey: ["referral", "me", user.id],
    queryFn: () => getReferralMe(user.id),
    enabled: !!user.id && authStatus !== "guest",
  });

  const handleCopyReferral = async () => {
    AudioManager.playButtonClick();
    if (referralData?.link) {
      await Clipboard.setStringAsync(referralData.link);
      Alert.alert(t("copied_alert_title"), t("copied_alert_message"));
    }
  };

  const handleShareReferral = async () => {
    AudioManager.playButtonClick();
    if (referralData?.link && referralData?.code) {
      try {
        await Share.share({
          message: `Use my code ${referralData.code} to join WhoIsNot! ${referralData.link}`,
          url: referralData.link,
          title: t("join_whoisnot"),
        });
      } catch {
        await Clipboard.setStringAsync(referralData.link);
        Alert.alert(t("link_copied_title"), t("link_copied_message"));
      }
    }
  };

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackgroundWithLoadGate
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
                {t("your_profile_1")}
              </CustomText>
              <CustomText variant="h3" className="-rotate-3 text-center w-full">
                {t("your_profile_2")}
              </CustomText>
            </View>
            <ProfileInfoComponent
              setImagePickerVisible={setImagePickerVisible}
            />

            {/* <View className="mx-6 mt-6 rounded-2xl bg-black/45 p-4 border border-white/15">
              <View className="flex-row items-center justify-between mb-2">
                <CustomText variant="h6-headline">{t("live_stats")}</CustomText>
                <TouchableOpacity onPress={() => void refresh()}>
                  <CustomText className="underline text-xs">{t("refresh")}</CustomText>
                </TouchableOpacity>
              </View>
              <CustomText className="text-xs opacity-70 mb-3">
                {t("source_label")}: {getApiBaseUrl()}
              </CustomText>
              {loading && <CustomText>{t("loading_stats")}</CustomText>}
              {!loading && error && (
                <CustomText className="text-red-200">{t("stats_error")}: {error}</CustomText>
              )}
              {!loading && !error && global && kpis && (
                <View className="gap-1">
                  <CustomText>{t("games_started")}: {global.gamesStarted}</CustomText>
                  <CustomText>{t("games_finished")}: {global.gamesFinished}</CustomText>
                  <CustomText>{t("total_rounds")}: {global.totalRounds}</CustomText>
                  <CustomText>
                    {t("completion")}: {(kpis.completionRate * 100).toFixed(1)}%
                  </CustomText>
                </View>
              )}
            </View> */}
            {/* {authStatus !== "guest" && (
              <View className="mx-6 mt-4 rounded-2xl bg-black/45 p-4 border border-white/20">
                <CustomText variant="h6-headline" className="text-white mb-1">
                  {t("invite_friends")}
                </CustomText>
                <CustomText className="text-white/70 text-sm mb-3">
                  {t("invite_friends_share_hint")}
                </CustomText>
                {referralLoading && (
                  <ActivityIndicator
                    size="small"
                    color="#fbbf24"
                    style={{ paddingVertical: 8 }}
                  />
                )}
                {referralData && !referralLoading && (
                  <>
                    <View className="flex-row items-center gap-2 mb-3">
                      <CustomText className="text-amber-400 font-mono text-sm">
                        {referralData.code}
                      </CustomText>
                      <TouchableOpacity
                        onPress={handleCopyReferral}
                        className="rounded-lg bg-amber-500/90 px-3 py-2"
                      >
                        <CustomText className="text-black text-xs font-semibold">
                          {t("copy_link")}
                        </CustomText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleShareReferral}
                        className="rounded-lg bg-white/20 px-3 py-2 border border-white/40"
                      >
                        <CustomText className="text-white text-xs font-semibold">
                          {t("share")}
                        </CustomText>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        AudioManager.playButtonClick();
                        navigation.navigate("Referral");
                      }}
                      className="flex-row items-center gap-1"
                    >
                      <CustomText className="text-amber-400/90 text-sm underline">
                        {t("see_rewards_campaigns")}
                      </CustomText>
                      <Entypo
                        name="chevron-right"
                        size={16}
                        color="rgba(251,191,36,0.9)"
                      />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )} */}
            {authStatus === "guest" && <ProfileLoginComponent />}
          </View>
          <View className="items-center">
            {authStatus != "guest" && (
              <CustomButton
                title={t("logout")}
                onPress={signOut}
                buttonClassName=" max-w-[50%] w-auto mb-4"
                appearance="tertiary"
                fullWidth
                backgroundImage={backgrounds.bg015}
                glow
                glowColor="rgba(255,167,73,0.8)"
                shadowColor="#540d0d"
              />
            )}
            <View className="flex-row gap-2 mt-4">
              <TouchableOpacity>
                <CustomText className="underline">
                  {t("privacy_policy")}
                </CustomText>
              </TouchableOpacity>
              <CustomText>{t("and")}</CustomText>
              <TouchableOpacity>
                <CustomText className="underline">{t("terms")}</CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        {imagePickerVisible && (
          <ProfileImagePickerComponent
            setImagePickerVisible={setImagePickerVisible}
          />
        )}
      </ImageBackgroundWithLoadGate>
    </SafeAreaView>
  );
};

export default ProfileScreen;
