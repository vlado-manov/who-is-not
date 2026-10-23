import {
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useRef, useEffect } from "react";
import FullBleedStack from "../components/FullBleedStack";
import { SafeAreaView } from "react-native-safe-area-context";
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
import ProfilePremiumQuestionsCard from "../components/profile/ProfilePremiumQuestionsCard";
import ManageSubscriptionCard from "../components/premium/ManageSubscriptionCard";
import ProfileFriendsCard from "../components/profile/ProfileFriendsCard";
import RateAppModal from "../components/modals/RateAppModal";
import CamNavBar from "../components/cam/CamNavBar";
import { UiStyleProvider } from "../context/UiStyleContext";
import { TT } from "../constants/tiktokTheme";
import { useUserSettingsSheet } from "../context/UserSettingsModalContext";
import { useResponsive } from "../utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import { backgrounds } from "../../assets/backgrounds";

type Nav = StackNavigationProp<OnboardingStackParamList, "Profile">;

// ── Cool blue → green gradients on a dark navy base ──
const WARM_PHASES = [
  ["rgba(56,189,248,0.76)", "rgba(14,165,233,0.80)", "rgba(2,132,199,0.78)"],
  ["rgba(34,211,238,0.74)", "rgba(6,182,212,0.78)", "rgba(8,145,178,0.76)"],
  ["rgba(45,212,191,0.74)", "rgba(20,184,166,0.78)", "rgba(15,160,148,0.76)"],
  ["rgba(52,211,153,0.72)", "rgba(16,185,129,0.76)", "rgba(5,150,105,0.74)"],
  ["rgba(74,222,128,0.72)", "rgba(34,197,94,0.76)", "rgba(22,163,74,0.74)"],
  ["rgba(134,239,172,0.70)", "rgba(86,225,140,0.74)", "rgba(52,211,153,0.72)"],
] as const;
const WARM_N = WARM_PHASES.length;
const WARM_CYCLE_MS = WARM_N * 7500;

const PROFILE_BUBBLES = [
  {
    left: "5%",
    size: 20,
    dur: 7000,
    delay: 0,
    opacity: 0.44,
    color: "#38bdf8",
  },
  {
    left: "16%",
    size: 36,
    dur: 10400,
    delay: 1600,
    opacity: 0.24,
    color: "#22d3ee",
  },
  {
    left: "28%",
    size: 12,
    dur: 5600,
    delay: 800,
    opacity: 0.48,
    color: "#4ade80",
  },
  {
    left: "41%",
    size: 30,
    dur: 8800,
    delay: 3200,
    opacity: 0.28,
    color: "#67e8f9",
  },
  {
    left: "55%",
    size: 46,
    dur: 12800,
    delay: 5200,
    opacity: 0.18,
    color: "#a7f3d0",
  },
  {
    left: "65%",
    size: 16,
    dur: 5900,
    delay: 500,
    opacity: 0.46,
    color: "#7dd3fc",
  },
  {
    left: "76%",
    size: 28,
    dur: 9600,
    delay: 6400,
    opacity: 0.26,
    color: "#6ee7b7",
  },
  {
    left: "87%",
    size: 22,
    dur: 7400,
    delay: 2200,
    opacity: 0.38,
    color: "#34d399",
  },
  {
    left: "9%",
    size: 44,
    dur: 14000,
    delay: 7600,
    opacity: 0.16,
    color: "#bae6fd",
  },
  {
    left: "35%",
    size: 10,
    dur: 4600,
    delay: 2900,
    opacity: 0.52,
    color: "#e0f2fe",
  },
  {
    left: "52%",
    size: 18,
    dur: 7200,
    delay: 1000,
    opacity: 0.4,
    color: "#2dd4bf",
  },
  {
    left: "72%",
    size: 8,
    dur: 3800,
    delay: 4600,
    opacity: 0.54,
    color: "#86efac",
  },
  {
    left: "24%",
    size: 6,
    dur: 3200,
    delay: 6200,
    opacity: 0.52,
    color: "#a5f3fc",
  },
  {
    left: "83%",
    size: 14,
    dur: 5800,
    delay: 3800,
    opacity: 0.42,
    color: "#5eead4",
  },
] as const;

function ProfileBubble({
  left,
  size,
  dur,
  delay,
  opacity,
  color,
}: {
  left: string;
  size: number;
  dur: number;
  delay: number;
  opacity: number;
  color: string;
}) {
  const { height } = useWindowDimensions();
  const posY = useRef(new Animated.Value(0)).current;
  const alpha = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const run = () => {
      posY.setValue(0);
      alpha.setValue(0);
      Animated.parallel([
        Animated.timing(posY, {
          toValue: -(height + size * 2),
          duration: dur,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(alpha, {
            toValue: opacity,
            duration: dur * 0.12,
            useNativeDriver: true,
          }),
          Animated.timing(alpha, {
            toValue: opacity * 0.7,
            duration: dur * 0.68,
            useNativeDriver: true,
          }),
          Animated.timing(alpha, {
            toValue: 0,
            duration: dur * 0.2,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => run());
    };
    const t = setTimeout(run, delay);
    return () => clearTimeout(t);
  }, [height, size, dur, delay, opacity, posY, alpha]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        bottom: -size,
        left: left as any,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: alpha,
        transform: [{ translateY: posY }],
      }}
    />
  );
}

function AnimatedProfileBackground() {
  // Cross-fade warm gradient phases
  const cycle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(cycle, {
        toValue: WARM_N,
        duration: WARM_CYCLE_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [cycle]);

  const phaseOpacity = (i: number): Animated.AnimatedInterpolation<number> => {
    const half = 0.88;
    if (i === 0) {
      return cycle.interpolate({
        inputRange: [0, half, WARM_N - half, WARM_N],
        outputRange: [1, 0, 0, 1],
        extrapolate: "clamp",
      });
    }
    return cycle.interpolate({
      inputRange: [Math.max(0, i - half), i, Math.min(WARM_N, i + half)],
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    });
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={["#030d1a", "#040e18", "#041016"]}
        style={StyleSheet.absoluteFill}
      />
      {WARM_PHASES.map((colors, i) => (
        <Animated.View
          key={i}
          style={[StyleSheet.absoluteFill, { opacity: phaseOpacity(i) }]}
        >
          <LinearGradient
            colors={[...colors]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ))}
      <LinearGradient
        colors={["transparent", "rgba(56,211,203,0.12)", "transparent"]}
        start={{ x: 0.5, y: 0.12 }}
        end={{ x: 0.5, y: 0.88 }}
        style={StyleSheet.absoluteFill}
      />
      {PROFILE_BUBBLES.map((b, i) => (
        <ProfileBubble key={i} {...b} />
      ))}
    </View>
  );
}

const ProfileScreen = () => {
  const navigation = useNavigation<Nav>();
  const { openUserSettings } = useUserSettingsSheet();
  const { t } = useTranslation();
  const authStatus = useAuthStore((s) => s.authStatus);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const { isTablet } = useResponsive();

  return (
    <FullBleedStack
      rootStyle={styles.root}
      backdrop={<AnimatedProfileBackground />}
    >
      <UiStyleProvider value="tiktok">
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={{ flex: 1 }}>
          <CamNavBar
            title={`${t("your_profile_1")} ${t("your_profile_2")}`}
            backLabel={t("back_btn")}
            onBack={() => navigateBackSafe(navigation)}
            right={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("game_settings")}
                hitSlop={8}
                onPress={() => openUserSettings()}
              >
                <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
              </Pressable>
            }
          />
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingTop: 8,
              paddingBottom: 16,
              alignItems: isTablet ? "center" : undefined,
            }}
          >
            <View style={[{ width: "100%" }, isTablet && { maxWidth: 560 }]}>
            {/* One gap between whichever sections are shown; the sections carry no vertical margins of their own. */}
            <View style={{ gap: TT.sectionGap }}>
              <ProfileInfoComponent
                setImagePickerVisible={setImagePickerVisible}
              />
              <ManageSubscriptionCard style={{ marginHorizontal: 16, width: "auto" }} />
              <ProfilePremiumQuestionsCard />
              <ProfileFriendsCard />

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
            <View style={footerStyles.wrap}>
              <View style={footerStyles.links}>
                {FOOTER_LINKS.map((link) => (
                  <TouchableOpacity
                    key={link.id}
                    hitSlop={8}
                    style={footerStyles.supportBtn}
                    onPress={() => {
                      if (link.id === "review") setReviewVisible(true);
                      else navigation.navigate(link.route);
                    }}
                  >
                    <View style={footerStyles.linkIcon}>
                      <Ionicons name={link.icon} size={18} color={TT.text} />
                    </View>
                    <CustomText style={footerStyles.supportText}>
                      {t(link.labelKey)}
                    </CustomText>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={TT.text2}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <RateAppModal
                visible={reviewVisible}
                onClose={() => setReviewVisible(false)}
              />
                {authStatus !== "guest" && (
                  <View style={footerStyles.logoutWrap}>
                    <CustomButton
                      title={t("logout")}
                      backgroundImage={backgrounds.bg015}
                      glow
                      glowColor="rgba(255,50,50,0.6)"
                      glowIntensity={14}
                      shadowColor="#1a0000"
                      borderColor="rgba(255,60,60,0.9)"
                      borderWidth={2}
                      fullWidth
                      onPress={signOut}
                    />
                  </View>
                )}
              <View style={footerStyles.legalRow}>
                <TouchableOpacity
                  hitSlop={10}
                  style={footerStyles.legalBtn}
                  onPress={() => navigation.navigate("Privacy")}
                >
                  <CustomText style={footerStyles.legalText}>
                    {t("privacy_policy")}
                  </CustomText>
                </TouchableOpacity>
                <View style={footerStyles.legalDot} />
                <TouchableOpacity
                  hitSlop={10}
                  style={footerStyles.legalBtn}
                  onPress={() => navigation.navigate("Terms")}
                >
                  <CustomText style={footerStyles.legalText}>
                    {t("terms")}
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>
            </View>
          </ScrollView>
          {imagePickerVisible && (
            <ProfileImagePickerComponent
              setImagePickerVisible={setImagePickerVisible}
            />
          )}
        </View>
      </SafeAreaView>
      </UiStyleProvider>
    </FullBleedStack>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#030d1a" },
  safe: { flex: 1, backgroundColor: "transparent" },
});

/**
 * Footer links, top to bottom. "Review" opens the rating popup; "Support the
 * game" leads to the Store, where the donation card is.
 */
const FOOTER_LINKS = [
  {
    id: "review",
    icon: "star-outline",
    labelKey: "profile_review_game",
    route: "Support",
  },
  {
    id: "help",
    icon: "help-circle-outline",
    labelKey: "profile_help_support",
    route: "Support",
  },
  {
    id: "donate",
    icon: "heart-outline",
    labelKey: "profile_support_game",
    route: "Store",
  },
] as const;

const footerStyles = StyleSheet.create({
  links: {
    width: "100%",
    // Same step as between the cards above.
    gap: TT.sectionGap,
  },
  wrap: {
    alignItems: "center",
    // Same 16pt side margin as the cards above.
    paddingHorizontal: 16,
    paddingTop: TT.sectionGap,
    paddingBottom: 12,
    gap: TT.sectionGap,
  },
  logoutWrap: { width: "100%", alignSelf: "stretch" },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.2)",
  },
  legalBtn: {},
  legalText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  legalDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  // Same card, icon tile and title as the Friends card header above.
  supportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    backgroundColor: TT.surface,
    borderRadius: TT.cardRadius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  linkIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: TT.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  supportText: {
    flex: 1,
    color: TT.text,
    fontSize: 14,
    fontWeight: "800",
  },
});

export default ProfileScreen;
