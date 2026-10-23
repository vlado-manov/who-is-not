import React, { useRef, useState } from "react";
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
import { useTranslation } from "react-i18next";

import { OnboardingStackParamList } from "../navigation/types";
import { useAuthStore } from "../store/useUserStore";
import CustomText from "../components/common/CustomText";
import CustomButton from "../components/common/CustomButton";
import CamNavBar from "../components/cam/CamNavBar";
import { UiStyleProvider } from "../context/UiStyleContext";
import { TT } from "../constants/tiktokTheme";
import AudioManager from "../utils/audioManager";
import ManageSubscriptionCard from "../components/premium/ManageSubscriptionCard";

type Nav = StackNavigationProp<OnboardingStackParamList, "Support">;

const SUPPORT_EMAIL = "support@whoisnot.app";
const REASON_GAP = 8;
/** Wait for the keyboard before scrolling the focused field into view. */
const FOCUS_SCROLL_DELAY_MS = 250;

/** `label` stays English: it goes into the email to the support team. */
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
  const { t } = useTranslation();

  const [selectedReason, setSelectedReason] = useState<ReasonId | null>(null);
  const [contactEmail, setContactEmail] = useState(user.email ?? "");
  const [message, setMessage] = useState("");

  const scrollRef = useRef<ScrollView>(null);
  const fieldY = useRef({ email: 0, message: 0 });
  // Brings the field being typed in to the top of the visible area, above the keyboard.
  const revealField = (field: "email" | "message") =>
    setTimeout(
      () =>
        scrollRef.current?.scrollTo({
          y: Math.max(0, fieldY.current[field] - 48),
          animated: true,
        }),
      FOCUS_SCROLL_DELAY_MS,
    );

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
            t("support_no_email_title"),
            t("support_email_us", { email: SUPPORT_EMAIL }),
          );
        }
      })
      .catch(() => {
        Alert.alert(
          t("support_error_title"),
          t("support_email_us", { email: SUPPORT_EMAIL }),
        );
      });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <UiStyleProvider value="tiktok">
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <CamNavBar
          title={t("profile_help_support")}
          backLabel={t("back_btn")}
          onBack={() => {
            AudioManager.playButtonClick();
            navigation.goBack();
          }}
        />

        <ScrollView
          ref={scrollRef}
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="interactive"
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <CustomText variant="p-small" style={styles.subtitle}>
            {t("support_subtitle")}
          </CustomText>

          {/* Membership: manage or cancel in the App Store / Google Play. */}
          <ManageSubscriptionCard style={{ marginBottom: 20 }} />

          {/* Auto-filled user info */}
          <View style={styles.card}>
            <CustomText variant="p-small" style={styles.cardLabel}>{t("support_your_info")}</CustomText>
            <View style={styles.infoRow}>
              <Ionicons name="person-circle-outline" size={18} color={TT.text2} />
              <CustomText variant="p-small" style={styles.infoText}>
                {user.name || t("support_guest")}
              </CustomText>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="finger-print-outline" size={18} color={TT.text2} />
              <CustomText variant="p-small" style={styles.infoText} numberOfLines={1}>
                ID: {user.id}
              </CustomText>
            </View>
          </View>

          {/* Reason */}
          <CustomText variant="p" style={styles.fieldLabel}>
            {t("support_help_with")}
          </CustomText>
          <View style={styles.reasonGrid}>
            {REASONS.map((r) => {
              const active = selectedReason === r.id;
              return (
                <Pressable
                  key={r.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    AudioManager.playButtonClick();
                    setSelectedReason(r.id);
                  }}
                >
                  {/* Styled on a plain View so the chip never depends on Pressable's style. */}
                  <View style={[styles.reasonTile, active && styles.reasonTileActive]}>
                    <Ionicons name={r.icon as any} size={18} color={TT.text} />
                    <CustomText
                      variant="p-small"
                      numberOfLines={1}
                      style={[styles.reasonLabel, active && styles.reasonLabelActive]}
                    >
                      {t(`support_reason_${r.id}`)}
                    </CustomText>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Contact email */}
          <CustomText variant="p" style={styles.fieldLabel}>
            {t("support_your_email")}
          </CustomText>
          <View
            style={styles.inputWrap}
            onLayout={(e) => {
              fieldY.current.email = e.nativeEvent.layout.y;
            }}
          >
            <Ionicons name="mail-outline" size={18} color={TT.text2} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={contactEmail}
              onChangeText={setContactEmail}
              onFocus={() => revealField("email")}
              placeholder="you@example.com"
              placeholderTextColor={TT.text2}
              selectionColor={TT.primary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Message */}
          <CustomText variant="p" style={styles.fieldLabel}>
            {t("support_message")}
          </CustomText>
          <View
            style={[styles.inputWrap, styles.textAreaWrap]}
            onLayout={(e) => {
              fieldY.current.message = e.nativeEvent.layout.y;
            }}
          >
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              onFocus={() => revealField("message")}
              placeholder={t("support_message_placeholder")}
              placeholderTextColor={TT.text2}
              selectionColor={TT.primary}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* Send */}
          <View style={styles.sendWrap}>
            <CustomButton
              title={t("support_send")}
              onPress={handleSend}
              disabled={!canSend}
              appearance="primary"
              fullWidth
              btnSize="md"
              fontSize="md"
              iconNode={
                <Ionicons name="send" size={18} color="#fff" />
              }
            />
          </View>

          <CustomText variant="p-xsmall" style={styles.footerNote}>
            {t("support_or_email")}{" "}
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
      </UiStyleProvider>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: TT.bg },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  subtitle: {
    color: TT.text2,
    lineHeight: 20,
    marginBottom: 20,
  },

  /* User info card */
  card: {
    backgroundColor: TT.surface2,
    borderRadius: TT.cardRadius,
    padding: 14,
    marginBottom: 24,
    gap: 6,
  },
  cardLabel: {
    color: TT.text2,
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
    color: TT.text,
    flex: 1,
  },

  /* Form fields */
  fieldLabel: {
    color: TT.text,
    marginBottom: 10,
    fontWeight: "700",
  },

  /* Reasons: chips — icon and label on one line, sized to their content */
  reasonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: REASON_GAP,
    marginBottom: 24,
  },
  reasonTile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: TT.radius,
    // A step lighter than the screen background, with a visible edge.
    backgroundColor: TT.chip,
    borderWidth: 1,
    borderColor: TT.chipBorder,
  },
  // Chosen: the whole chip fills with the accent pink.
  reasonTileActive: {
    backgroundColor: TT.primary,
    borderColor: TT.primary,
  },
  reasonLabel: {
    color: TT.text,
  },
  reasonLabelActive: {
    fontWeight: "700",
  },

  /* Inputs */
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: TT.surface2,
    borderRadius: TT.radius,
    marginBottom: 20,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    color: TT.text,
    fontSize: 15,
    fontFamily: "TikTokSans-Medium",
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
    color: TT.text2,
    textAlign: "center",
    lineHeight: 18,
  },
  emailLink: {
    color: TT.text,
    textDecorationLine: "underline",
  },
});
