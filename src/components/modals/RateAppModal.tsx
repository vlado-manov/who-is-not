// src/components/modals/RateAppModal.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { apiPost } from "../../api/client";
import { useAuthStore } from "../../store/useUserStore";
import AudioManager from "../../utils/audioManager";
import AppImage from "../AppImage";
import CamButton from "../cam/CamButton";
import CamSheet from "../cam/CamSheet";
import CamText from "../cam/CamText";
import CamTextInput from "../cam/CamTextInput";

const STORE_URL_IOS = "itms-apps://itunes.apple.com/app/id6744697505";
const STORE_URL_ANDROID = "market://details?id=com.vladimirmanov.whoisnot";

/** Picture above the sheet: height / width, and how much of it the sheet covers. */
const REVIEW_ART_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/b8300793-c232-47ff-9332-48047dd5ff78-htpIcon.webp";
const REVIEW_ART_ASPECT = 1.282;
const REVIEW_ART_TUCK = 0.4;
const REVIEW_ART_MAX = 380;
/** The review sheet has its own colour instead of the dark default. */
const REVIEW_SHEET_COLOR = "#3A1D8A";

const STAR_COUNT = 5;
const STAR_SIZE = 44;
const STAR_ON = "#FFD60A";
const STAR_OFF = "rgba(255,255,255,0.35)";
/** From this rating up the player is sent to the store; below, asked what to improve. */
const STORE_RATING = 4;
const FEEDBACK_MAX_LEN = 300;
/** Pause after a star is picked, and how long the thanks stays before closing. */
const AFTER_PICK_MS = 550;
const THANKS_MS = 2200;

type Step = "rate" | "feedback" | "thanks";

type StarProps = {
  selected: boolean;
  label: string;
  onPress: () => void;
};

/** One star (a vector icon, so it shows in every font) that pops when picked. */
function Star({ selected, label, onPress }: StarProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const wasSelected = useRef(false);

  useEffect(() => {
    if (selected && !wasSelected.current) {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.35,
          duration: 110,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          speed: 22,
          bounciness: 14,
          useNativeDriver: true,
        }),
      ]).start();
    }
    wasSelected.current = selected;
  }, [scale, selected]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => {
        AudioManager.playButtonClick();
        onPress();
      }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={selected ? "star" : "star-outline"}
          size={STAR_SIZE}
          color={selected ? STAR_ON : STAR_OFF}
        />
      </Animated.View>
    </Pressable>
  );
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * "Review the game": a bottom sheet in the same flat look as the other sheets.
 * Four or five stars open the store page; fewer ask what to improve and send
 * that to the backend. Ends with a short thanks and closes by itself.
 */
export default function RateAppModal({ visible, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [rating, setRating] = useState(0);
  const [step, setStep] = useState<Step>("rate");
  const [feedback, setFeedback] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { width: windowWidth } = useWindowDimensions();
  const artWidth = Math.min(REVIEW_ART_MAX, windowWidth * 0.86);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  // A fresh start every time it opens; nothing fires after it closes.
  useEffect(() => {
    if (visible) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRating(0);
    setStep("rate");
    setFeedback("");
  }, [visible]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const thankAndClose = () => {
    setStep("thanks");
    later(onClose, THANKS_MS);
  };

  const pickRating = (value: number) => {
    if (rating !== 0) return;
    setRating(value);
    if (value < STORE_RATING) {
      later(() => setStep("feedback"), AFTER_PICK_MS);
      return;
    }
    later(() => {
      const url = Platform.OS === "ios" ? STORE_URL_IOS : STORE_URL_ANDROID;
      void Linking.canOpenURL(url)
        .then((ok) => (ok ? Linking.openURL(url) : undefined))
        .catch(() => {});
      thankAndClose();
    }, AFTER_PICK_MS);
  };

  const submitFeedback = () => {
    Keyboard.dismiss();
    void apiPost(
      "/app-feedback",
      {
        rating,
        text: feedback,
        platform: Platform.OS,
        userId: user.isGuest ? null : user.id,
        userEmail: user.isGuest ? null : (user.email ?? null),
        userName: user.isGuest ? null : user.name,
        language: i18n.language?.slice(0, 2).toUpperCase() ?? "EN",
      },
      { skipAuth: true, skipContractCheck: true },
    ).catch(() => {});
    thankAndClose();
  };

  const title =
    step === "rate"
      ? t("review_title")
      : step === "feedback"
        ? t("review_feedback_title")
        : t("review_thanks_title");

  return (
    <CamSheet
      visible={visible}
      onClose={onClose}
      title={title}
      closeLabel={t("close")}
      backgroundColor={REVIEW_SHEET_COLOR}
      blurBackdrop
      // The same picture the popup had before, standing on top of the sheet.
      topArt={
        step === "thanks" ? undefined : (
          <AppImage
            source={{ uri: REVIEW_ART_URI }}
            contentFit="contain"
            style={{
              width: artWidth,
              height: artWidth * REVIEW_ART_ASPECT,
              marginBottom: -artWidth * REVIEW_ART_TUCK,
            }}
          />
        )
      }
    >
      {step === "rate" && (
        <View style={styles.block}>
          <CamText variant="subtitle" center>
            {t("review_subtitle")}
          </CamText>
          <View style={styles.stars}>
            {Array.from({ length: STAR_COUNT }, (_, i) => (
              <Star
                key={i}
                selected={i < rating}
                label={t("review_star_label", { n: i + 1 })}
                onPress={() => pickRating(i + 1)}
              />
            ))}
          </View>
          <CamText variant="subtitle" center>
            {rating === 0
              ? t("review_hint_pick")
              : rating >= STORE_RATING
                ? t("review_hint_store")
                : t("review_hint_improve")}
          </CamText>
        </View>
      )}

      {step === "feedback" && (
        <View style={styles.block}>
          <CamText variant="subtitle" center>
            {t("review_feedback_subtitle")}
          </CamText>
          <CamTextInput
            value={feedback}
            onChangeText={setFeedback}
            maxLength={FEEDBACK_MAX_LEN}
            placeholder={t("review_feedback_placeholder")}
            multiline
            autoFocus
          />
          <View style={styles.actions}>
            <CamButton
              title={t("skip")}
              variant="secondary"
              style={styles.action}
              onPress={onClose}
            />
            <CamButton
              title={t("review_feedback_send")}
              style={styles.action}
              disabled={feedback.trim().length === 0}
              onPress={submitFeedback}
            />
          </View>
        </View>
      )}

      {step === "thanks" && (
        <View style={styles.block}>
          <Ionicons
            name="heart"
            size={48}
            color="#FE2C55"
            style={styles.thanksIcon}
          />
          <CamText variant="subtitle" center>
            {t("review_thanks_body")}
          </CamText>
        </View>
      )}
    </CamSheet>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 16,
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  action: {
    flex: 1,
  },
  thanksIcon: {
    alignSelf: "center",
  },
});
