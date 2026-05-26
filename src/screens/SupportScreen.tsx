import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Linking,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { OnboardingStackParamList } from "../navigation/types";
import { useAuthStore } from "../store/useUserStore";
import CustomText from "../components/common/CustomText";
import CustomButton from "../components/common/CustomButton";
import AudioManager from "../utils/audioManager";

type Nav = StackNavigationProp<OnboardingStackParamList, "Support">;

const SUPPORT_EMAIL = "support@whoisnot.app";

const REASONS = [
  { id: "game_issue", label: "Issue with the game", icon: "game-controller-outline" },
  { id: "payment", label: "Payment / purchase", icon: "card-outline" },
  { id: "account", label: "Account problem", icon: "person-outline" },
  { id: "feedback", label: "Feedback", icon: "chatbubble-outline" },
  { id: "idea", label: "Idea / suggestion", icon: "bulb-outline" },
  { id: "bug", label: "Bug report", icon: "bug-outline" },
  { id: "other", label: "Other", icon: "ellipsis-horizontal-circle-outline" },
] as const;

type ReasonId = (typeof REASONS)[number]["id"];

export default function SupportScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const [selectedReason, setSelectedReason] = useState<ReasonId | null>(null);
  const [contactEmail, setContactEmail] = useState(user.email ?? "");
  const [message, setMessage] = useState("");

  const selectedLabel = REASONS.find((r) => r.id === selectedReason)?.label ?? "";

  const canSend = selectedReason !== null && contactEmail.trim().length > 3 && message.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    AudioManager.playButtonClick();

    const subject = encodeURIComponent(`[WhoIsNot Support] ${selectedLabel}`);
    const bodyLines = [
      `Reason: ${selectedLabel}`,
      `Name: ${user.name || "Guest"}`,
      `User ID: ${user.id}`,
      `Contact email: ${contactEmail.trim()}`,
      "",
      message.trim(),
    ];
    const body = encodeURIComponent(bodyLines.join("\n"));
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

    Linking.canOpenURL(mailto)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(mailto);
        } else {
          Alert.alert(
            "No email app found",
            `Please email us directly at ${SUPPORT_EMAIL}`,
          );
        }
      })
      .catch(() => {
        Alert.alert("Error", `Please email us directly at ${SUPPORT_EMAIL}`);
      });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <CustomText variant="h3-headline" style={styles.pageTitle}>
            Contact Support
          </CustomText>
          <CustomText variant="p-small" style={styles.subtitle}>
            We're here to help. Fill in the form below and we'll get back to you as soon as possible.
          </CustomText>

          {/* Auto-filled user info */}
          <View style={styles.card}>
            <CustomText variant="p-small" style={styles.cardLabel}>Your info (auto-filled)</CustomText>
            <View style={styles.infoRow}>
              <Ionicons name="person-circle-outline" size={18} color="rgba(255,232,192,0.7)" />
              <CustomText variant="p-small" style={styles.infoText}>
                {user.name || "Guest"}
              </CustomText>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="finger-print-outline" size={18} color="rgba(255,232,192,0.7)" />
              <CustomText variant="p-small" style={styles.infoText} numberOfLines={1}>
                ID: {user.id}
              </CustomText>
            </View>
          </View>

          {/* Reason */}
          <CustomText variant="p" style={styles.fieldLabel}>
            What can we help you with?
          </CustomText>
          <View style={styles.reasonGrid}>
            {REASONS.map((r) => {
              const active = selectedReason === r.id;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => {
                    AudioManager.playButtonClick();
                    setSelectedReason(r.id);
                  }}
                  style={({ pressed }) => [
                    styles.reasonChip,
                    active && styles.reasonChipActive,
                    pressed && !active && styles.reasonChipPressed,
                  ]}
                >
                  <Ionicons
                    name={r.icon as any}
                    size={18}
                    color={active ? "#ffcc44" : "rgba(255,248,240,0.65)"}
                  />
                  <CustomText
                    variant="p-small"
                    style={[styles.reasonLabel, active && styles.reasonLabelActive]}
                  >
                    {r.label}
                  </CustomText>
                </Pressable>
              );
            })}
          </View>

          {/* Contact email */}
          <CustomText variant="p" style={styles.fieldLabel}>
            Your email address
          </CustomText>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color="rgba(255,232,192,0.5)" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={contactEmail}
              onChangeText={setContactEmail}
              placeholder="you@example.com"
              placeholderTextColor="rgba(255,248,240,0.3)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Message */}
          <CustomText variant="p" style={styles.fieldLabel}>
            Message
          </CustomText>
          <View style={[styles.inputWrap, styles.textAreaWrap]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Describe your issue or feedback..."
              placeholderTextColor="rgba(255,248,240,0.3)"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* Send */}
          <View style={styles.sendWrap}>
            <CustomButton
              title="Send Message"
              onPress={handleSend}
              disabled={!canSend}
              appearance="primary"
              fullWidth
              btnSize="md"
              fontSize="md"
              glow={canSend}
              glowColor="rgba(255,113,28,0.5)"
              shadowColor="#7a2200"
              iconNode={
                <Ionicons name="send" size={18} color="#fff" />
              }
            />
          </View>

          <CustomText variant="p-xsmall" style={styles.footerNote}>
            Or email us directly at{" "}
            <CustomText
              variant="p-xsmall"
              style={styles.emailLink}
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            >
              {SUPPORT_EMAIL}
            </CustomText>
          </CustomText>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  content: { paddingHorizontal: 20, paddingTop: 8 },
  pageTitle: {
    color: "#fff8f0",
    marginBottom: 6,
  },
  subtitle: {
    color: "rgba(255,248,240,0.6)",
    lineHeight: 20,
    marginBottom: 20,
  },

  /* User info card */
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 6,
  },
  cardLabel: {
    color: "rgba(255,248,240,0.4)",
    marginBottom: 4,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    color: "rgba(255,248,240,0.75)",
    flex: 1,
  },

  /* Form fields */
  fieldLabel: {
    color: "#ffe8c0",
    marginBottom: 10,
    fontWeight: "600",
  },

  /* Reason chips */
  reasonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  reasonChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  reasonChipActive: {
    backgroundColor: "rgba(255,160,30,0.18)",
    borderColor: "#ffcc44",
  },
  reasonChipPressed: { opacity: 0.75 },
  reasonLabel: {
    color: "rgba(255,248,240,0.7)",
    fontSize: 13,
  },
  reasonLabelActive: {
    color: "#ffdd88",
    fontWeight: "600",
  },

  /* Inputs */
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 20,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    color: "rgba(255,248,240,0.9)",
    fontSize: 15,
    fontFamily: Platform.OS === "ios" ? "System" : undefined,
    paddingVertical: 12,
  },
  textAreaWrap: {
    alignItems: "flex-start",
    paddingVertical: 4,
  },
  textArea: {
    minHeight: 110,
    paddingTop: 10,
  },

  /* Send */
  sendWrap: { marginBottom: 16 },
  footerNote: {
    color: "rgba(255,248,240,0.4)",
    textAlign: "center",
    lineHeight: 18,
  },
  emailLink: {
    color: "rgba(255,200,100,0.8)",
    textDecorationLine: "underline",
  },
});
