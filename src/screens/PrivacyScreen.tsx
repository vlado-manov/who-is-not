import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { OnboardingStackParamList } from "../navigation/types";
import CustomText from "../components/common/CustomText";
import AudioManager from "../utils/audioManager";

type Nav = StackNavigationProp<OnboardingStackParamList, "Privacy">;

const LAST_UPDATED = "May 2025";

const sections = [
  {
    title: "1. Information We Collect",
    body: "We collect information you provide when creating an account, including your name, email address, and profile photo. We also automatically collect certain technical data such as device type, operating system, IP address, and gameplay statistics to improve the app experience.",
  },
  {
    title: "2. How We Use Your Information",
    body: "We use your information to operate and improve WhoIsNot, personalise your experience, process purchases, send important service updates, and respond to support requests. We do not sell your personal data to third parties.",
  },
  {
    title: "3. Data Sharing",
    body: "We may share your data with trusted third-party service providers who assist us in operating the app (e.g. analytics, payment processing, cloud hosting). These partners are contractually obligated to protect your data. We may also disclose data when required by law.",
  },
  {
    title: "4. In-App Purchases",
    body: "Purchases are processed by Apple App Store or Google Play. We do not store your payment card details. Transaction records are kept for legal and accounting purposes.",
  },
  {
    title: "5. Data Retention",
    body: "We retain your account data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us at support@whoisnot.app.",
  },
  {
    title: "6. Your Rights",
    body: "Depending on your location, you may have rights to access, correct, or delete your personal data, object to certain processing, or request data portability. Contact us to exercise these rights.",
  },
  {
    title: "7. Children's Privacy",
    body: "WhoIsNot is not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.",
  },
  {
    title: "8. Security",
    body: "We implement industry-standard security measures to protect your data. However, no method of transmission over the internet or electronic storage is 100% secure.",
  },
  {
    title: "9. Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. We will notify you of significant changes through the app or by email. Continued use of the app after changes constitutes acceptance of the updated policy.",
  },
  {
    title: "10. Contact Us",
    body: "If you have any questions about this Privacy Policy, please contact us at:\nsupport@whoisnot.app",
  },
];

export default function PrivacyScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#030d1a", "#071629", "#030d1a"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={["left", "right"]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={() => {
              AudioManager.playButtonClick();
              navigation.goBack();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={22} color="rgba(255,248,240,0.9)" />
            <CustomText variant="p" style={styles.backLabel}>Back</CustomText>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <CustomText variant="h3-headline" style={styles.pageTitle}>
            Privacy Policy
          </CustomText>
          <CustomText variant="p-small" style={styles.lastUpdated}>
            Last updated: {LAST_UPDATED}
          </CustomText>
          <View style={styles.divider} />
          <CustomText variant="p-small" style={styles.intro}>
            WhoIsNot ("we", "us", or "our") is committed to protecting your privacy. This policy explains how we collect, use, and protect your information when you use our mobile application.
          </CustomText>

          {sections.map((s) => (
            <View key={s.title} style={styles.section}>
              <CustomText variant="p" style={styles.sectionTitle}>
                {s.title}
              </CustomText>
              <CustomText variant="p-small" style={styles.sectionBody} allowWrap>
                {s.body}
              </CustomText>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#030d1a" },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.15)",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2 },
      android: { elevation: 2 },
    }),
  },
  backBtnPressed: { opacity: 0.7 },
  backLabel: { color: "rgba(255,248,240,0.9)", fontSize: 15 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8 },
  pageTitle: {
    color: "#fff8f0",
    marginBottom: 4,
    textAlign: "left",
  },
  lastUpdated: {
    color: "rgba(255,248,240,0.45)",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 16,
  },
  intro: {
    color: "rgba(255,248,240,0.75)",
    lineHeight: 22,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sectionTitle: {
    color: "#ffe8c0",
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionBody: {
    color: "rgba(255,248,240,0.72)",
    lineHeight: 21,
  },
});
