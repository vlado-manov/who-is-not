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

type Nav = StackNavigationProp<OnboardingStackParamList, "Terms">;

const LAST_UPDATED = "May 2025";

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: "By downloading, installing, or using WhoIsNot, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the app.",
  },
  {
    title: "2. Use of the App",
    body: "WhoIsNot is a social deduction party game intended for entertainment purposes. You agree to use the app only for lawful purposes and in a way that does not infringe the rights of others. You must not attempt to reverse-engineer, decompile, or disassemble any part of the app.",
  },
  {
    title: "3. User Accounts",
    body: "You may use WhoIsNot as a guest or by creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorised use.",
  },
  {
    title: "4. In-App Purchases",
    body: "WhoIsNot offers optional in-app purchases including premium question packs and cosmetic items. All purchases are final and non-refundable except as required by applicable law or the policies of Apple App Store / Google Play. Prices may change at any time.",
  },
  {
    title: "5. Intellectual Property",
    body: "All content in WhoIsNot, including but not limited to text, graphics, logos, audio, and game mechanics, is owned by or licensed to us and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written consent.",
  },
  {
    title: "6. User-Generated Content",
    body: "If you create custom questions or other content within the app, you grant us a non-exclusive, royalty-free licence to use, display, and distribute that content within the app. You are responsible for ensuring your content does not violate any laws or third-party rights.",
  },
  {
    title: "7. Disclaimers",
    body: "WhoIsNot is provided \"as is\" without warranties of any kind, express or implied. We do not guarantee that the app will be uninterrupted, error-free, or free of harmful components. Use the app at your own risk.",
  },
  {
    title: "8. Limitation of Liability",
    body: "To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of or inability to use the app, even if we have been advised of the possibility of such damages.",
  },
  {
    title: "9. Changes to Terms",
    body: "We reserve the right to modify these Terms at any time. We will notify you of material changes through the app. Continued use after changes constitutes acceptance of the new Terms.",
  },
  {
    title: "10. Governing Law",
    body: "These Terms are governed by the laws of the jurisdiction in which we operate. Any disputes shall be resolved through binding arbitration or in the courts of that jurisdiction.",
  },
  {
    title: "11. Contact",
    body: "For any questions about these Terms, please contact us at:\nsupport@whoisnot.app",
  },
];

export default function TermsScreen() {
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
            Terms & Conditions
          </CustomText>
          <CustomText variant="p-small" style={styles.lastUpdated}>
            Last updated: {LAST_UPDATED}
          </CustomText>
          <View style={styles.divider} />
          <CustomText variant="p-small" style={styles.intro}>
            Please read these Terms & Conditions carefully before using WhoIsNot. These terms govern your access to and use of our mobile application and services.
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
