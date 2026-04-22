import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import ImageBackgroundWithLoadGate from "../components/ImageBackgroundWithLoadGate";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { Share } from "react-native";
import { backgrounds } from "../../assets/backgrounds";
import CustomText from "../components/common/CustomText";
import { useNavigation } from "@react-navigation/native";
import { navigateBackSafe } from "../navigation/navigateBackSafe";
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
import ScreenTopBar from "../components/common/ScreenTopBar";
import { useResponsive } from "../utils/responsive";

type Nav = StackNavigationProp<OnboardingStackParamList, "Profile">;

const ProfileScreen = () => {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const authStatus = useAuthStore((s) => s.authStatus);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { loading, error, global, kpis, refresh } = useBackendStats();
  const [imagePickerVisible, setImagePickerVisible] = useState(false);

  const { horizontalPadding, topIconSize } = useResponsive();
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
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
        <ImageBackgroundWithLoadGate
          source={backgrounds.bg023}
          showChildrenWhileLoading
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          <ScreenTopBar
            variant="soloBackFromCenter"
            horizontalPadding={horizontalPadding}
            topIconSize={topIconSize}
            showBack
            onSettings={() => {}}
            onProfile={() => {}}
            onBack={() => navigateBackSafe(navigation)}
            backAccessibilityLabel={t("back_btn")}
          />
          <ScrollView
            contentContainerStyle={{
              paddingTop: 72,
              paddingBottom: 48,
              flexGrow: 1,
              justifyContent: "space-between",
              position: "relative",
            }}
          >
            <View className="relative">
              <View className="items-center w-full justify-center px-4 mt-2">
                <CustomText
                  variant="h3-headline"
                  className="text-center w-full"
                >
                  {t("your_profile_1")}
                </CustomText>
                <CustomText
                  variant="h3"
                  className="-rotate-3 text-center w-full"
                >
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
            <View className="items-center" style={{ paddingHorizontal: 40 }}>
              {authStatus != "guest" && (
                <CustomButton
                  title={t("logout")}
                  onPress={signOut}
                  buttonClassName="mb-4"
                  appearance="tertiary"
                  fullWidth
                  btnSize="sm"
                  fontSize="sm"
                  backgroundImage={backgrounds.bg015}
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
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  safe: { flex: 1, backgroundColor: "transparent" },
});

export default ProfileScreen;
