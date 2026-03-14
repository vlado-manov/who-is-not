import {
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import ImageBackgroundWithLoadGate from "../components/ImageBackgroundWithLoadGate";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { backgrounds } from "../../assets/backgrounds";
import { Entypo } from "@expo/vector-icons";
import CustomText from "../components/common/CustomText";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { OnboardingStackParamList } from "../navigation/types";
import { useAuthStore } from "../store/useUserStore";
import AudioManager from "../utils/audioManager";
import * as Clipboard from "expo-clipboard";
import { Share } from "react-native";
import { getReferralMe } from "../api/referral";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

type Nav = StackNavigationProp<OnboardingStackParamList, "Referral">;

const ReferralScreen = () => {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["referral", "me", user.id],
    queryFn: () => getReferralMe(user.id),
    enabled: !!user.id && !user.isGuest,
  });

  const handleCopy = async () => {
    AudioManager.playButtonClick();
    if (data?.link) {
      await Clipboard.setStringAsync(data.link);
      Alert.alert(t("copied_alert_title"), t("copied_alert_message"));
    }
  };

  const handleShare = async () => {
    AudioManager.playButtonClick();
    if (data?.link && data?.code) {
      try {
        await Share.share({
          message: `Use my code ${data.code} to join WhoIsNot! ${data.link}`,
          url: data.link,
          title: t("join_whoisnot"),
        });
      } catch {
        await Clipboard.setStringAsync(data.link);
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
            paddingVertical: 48,
            flexGrow: 1,
            paddingHorizontal: 24,
          }}
        >
          <View className="px-4">
            <TouchableOpacity
              onPress={() => {
                AudioManager.playButtonClick();
                navigation.goBack();
              }}
              className="flex flex-row gap-2 items-center mb-6"
            >
              <Entypo name="arrow-with-circle-left" size={40} color="white" />
              <CustomText className="text-white">{t("back_btn")}</CustomText>
            </TouchableOpacity>
          </View>

          <View className="items-center mb-8">
            <CustomText variant="h3-headline" className="text-center text-white">
              {t("referral_invite")}
            </CustomText>
            <CustomText variant="h3" className="-rotate-3 text-center text-white">
              {t("referral_friends")}
            </CustomText>
          </View>

          {user.isGuest && (
            <View className="rounded-2xl bg-black/50 p-6 border border-white/20">
              <CustomText className="text-white text-center mb-2">
                {t("referral_login_hint")}
              </CustomText>
              <CustomText className="text-white/70 text-center text-sm">
                {t("referral_login_sub")}
              </CustomText>
            </View>
          )}

          {!user.isGuest && (
            <>
              {isLoading && (
                <View className="rounded-2xl bg-black/50 p-6">
                  <CustomText className="text-white text-center">
                    {t("referral_loading")}
                  </CustomText>
                </View>
              )}

              {error && (
                <View className="rounded-2xl bg-black/50 p-6 border border-amber-500/50">
                  <CustomText className="text-amber-200 text-center">
                    {t("referral_error")}
                  </CustomText>
                </View>
              )}

              {data && !error && (
                <>
                  <View className="rounded-2xl bg-black/50 p-6 border border-white/20 mb-4">
                    <CustomText className="text-white/80 text-sm mb-2">
                      {t("referral_your_code")}
                    </CustomText>
                    <CustomText
                      variant="h4"
                      className="text-white font-mono mb-4"
                    >
                      {data.code}
                    </CustomText>
                    <CustomText className="text-white/80 text-sm mb-2 break-all">
                      {data.link}
                    </CustomText>
                    <View className="flex-row gap-3 mt-4">
                      <TouchableOpacity
                        onPress={handleCopy}
                        className="flex-1 rounded-xl bg-amber-500/90 py-3 items-center"
                      >
                        <CustomText className="text-black font-semibold">
                          {t("copy_link")}
                        </CustomText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleShare}
                        className="flex-1 rounded-xl bg-white/20 py-3 items-center border border-white/40"
                      >
                        <CustomText className="text-white font-semibold">
                          {t("share")}
                        </CustomText>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {data.campaigns.length > 0 && (
                    <View className="rounded-2xl bg-black/50 p-6 border border-white/20">
                      <CustomText className="text-white font-semibold mb-4">
                        {t("referral_campaigns")}
                      </CustomText>
                      {data.campaigns.map((c) => (
                        <View
                          key={c.id}
                          className="mb-4 pb-4 border-b border-white/10 last:border-0 last:mb-0 last:pb-0"
                        >
                          <CustomText className="text-white font-medium">
                            {c.title}
                          </CustomText>
                          <CustomText className="text-white/70 text-sm mt-1">
                            {t("referral_invites_progress", { current: c.currentCount, required: c.requiredCount })}
                            {c.rewardUnlocked ? ` ${t("referral_unlocked")}` : ""}
                          </CustomText>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </ScrollView>
      </ImageBackgroundWithLoadGate>
    </SafeAreaView>
  );
};

export default ReferralScreen;
