import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import CustomText from "../common/CustomText";
import { backgrounds } from "../../../assets/backgrounds";
import { usePlateModalCardWidth } from "./usePlateModalCardWidth";
import { apiPost } from "../../api/client";
import { useAuthStore } from "../../store/useUserStore";
import { useTranslation } from "react-i18next";

const STORE_URL_IOS = "itms-apps://itunes.apple.com/app/id6744697505";
const STORE_URL_ANDROID = "market://details?id=com.vladimirmanov.whoisnot";

const STAR_COUNT = 5;
const STAGGER_MS = 85;

type Step = "rate" | "feedback" | "thanks";

// ─── Single animated star ────────────────────────────────────────────────────

type StarProps = {
  index: number;
  selected: boolean;
  onPress: () => void;
  runKey: number;
};

function AnimatedStar({ index, selected, onPress, runKey }: StarProps) {
  const entranceScale = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const selectScale = useRef(new Animated.Value(1)).current;
  const prevSelected = useRef(false);

  // Entrance bounce + continuous pulse loop
  useEffect(() => {
    entranceScale.setValue(0);
    pulseScale.setValue(1);

    const timer = setTimeout(() => {
      Animated.spring(entranceScale, {
        toValue: 1,
        speed: 13,
        bounciness: 19,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        entranceScale.setValue(1);
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseScale, {
              toValue: 1.09,
              duration: 1000 + index * 55,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(pulseScale, {
              toValue: 1,
              duration: 1000 + index * 55,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }, STAGGER_MS * index);

    return () => {
      clearTimeout(timer);
      entranceScale.stopAnimation();
      pulseScale.stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);

  // Pop when freshly selected
  useEffect(() => {
    if (selected && !prevSelected.current) {
      Animated.sequence([
        Animated.timing(selectScale, {
          toValue: 1.4,
          duration: 110,
          useNativeDriver: true,
        }),
        Animated.spring(selectScale, {
          toValue: 1,
          speed: 22,
          bounciness: 14,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevSelected.current = selected;
  }, [selected, selectScale]);

  const gold = selected ? "#FFD700" : "rgba(160,100,40,0.38)";
  const glowColor = selected
    ? "rgba(255,205,0,0.95)"
    : "rgba(180,120,0,0.15)";
  const glowRadius = selected ? 16 : 3;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.72} hitSlop={8}>
      <Animated.View
        style={{
          transform: [
            {
              scale: Animated.multiply(
                Animated.multiply(entranceScale, pulseScale),
                selectScale
              ),
            },
          ],
        }}
      >
        <CustomText
          style={[
            styles.star,
            { color: gold, textShadowColor: glowColor, textShadowRadius: glowRadius },
          ]}
        >
          ★
        </CustomText>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main modal ──────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function RateAppModal({ visible, onClose }: Props) {
  const plateWidth = usePlateModalCardWidth();
  const user = useAuthStore((s) => s.user);
  const { i18n } = useTranslation();
  const [rating, setRating] = useState(0);
  const [step, setStep] = useState<Step>("rate");
  const [feedback, setFeedback] = useState("");
  const [starKey, setStarKey] = useState(0);

  // Animations
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.72)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  // Card entrance / reset
  useEffect(() => {
    if (!visible) {
      cardScale.setValue(0.72);
      cardOpacity.setValue(0);
      backdropOpacity.setValue(0);
      contentOpacity.setValue(1);
      setRating(0);
      setStep("rate");
      setFeedback("");
      return;
    }
    setStarKey((k) => k + 1);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        speed: 14,
        bounciness: 9,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, cardScale, cardOpacity, backdropOpacity, contentOpacity]);

  // Cross-fade helper between steps
  const transitionTo = useCallback(
    (next: Step, delay = 0) => {
      setTimeout(() => {
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start(() => {
          setStep(next);
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }).start();
        });
      }, delay);
    },
    [contentOpacity]
  );

  // React to star selection
  useEffect(() => {
    if (rating === 0) return;
    if (rating >= 4) {
      // High rating → open store, then show thanks and auto-close
      const url =
        Platform.OS === "ios" ? STORE_URL_IOS : STORE_URL_ANDROID;
      setTimeout(async () => {
        try {
          const ok = await Linking.canOpenURL(url);
          if (ok) await Linking.openURL(url);
        } catch {}
        transitionTo("thanks");
        setTimeout(onClose, 2200);
      }, 550);
    } else {
      // Low rating → ask for feedback
      transitionTo("feedback", 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rating]);

  function handleFeedbackSubmit() {
    Keyboard.dismiss();
    transitionTo("thanks");
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
      { skipAuth: true, skipContractCheck: true }
    ).catch(() => {});
    setTimeout(onClose, 2200);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}
        pointerEvents="none"
      >
        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.52)" },
          ]}
        />
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={styles.centerer} onPress={onClose}>
          <Animated.View
            style={{
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
              width: plateWidth,
            }}
          >
            <Pressable style={styles.cardOuter} onPress={() => {}}>
              {/* Top decoration image — hidden on thanks step */}
              {step !== "thanks" && (
                <Image
                  source={{ uri: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/b8300793-c232-47ff-9332-48047dd5ff78-htpIcon.webp" }}
                  resizeMode="contain"
                  style={[styles.topDecoration, {
                    width: plateWidth + 10,
                    height: Math.round((plateWidth + 10) * 1.282),
                    top: -Math.round((plateWidth + 10) * 0.821),
                  }]}
                />
              )}

              {/* Close button — pokes outside top-right corner */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.8}
                hitSlop={10}
              >
                <LinearGradient
                  colors={["#FF4020", "#BB0000"]}
                  start={{ x: 0.1, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.closeBtnGrad}
                >
                  <CustomText style={styles.closeX}>✕</CustomText>
                </LinearGradient>
              </TouchableOpacity>

              {/* Plate */}
              <View style={styles.plateShadow}>
                <ImageBackground
                  source={backgrounds.bg005}
                  resizeMode="stretch"
                  imageStyle={{ borderRadius: 18 }}
                  style={[styles.plate, { width: plateWidth }]}
                >
                  <Animated.View
                    style={[styles.content, { opacity: contentOpacity }]}
                  >
                    {step === "rate" && (
                      <RateStep
                        rating={rating}
                        setRating={setRating}
                        starKey={starKey}
                      />
                    )}
                    {step === "feedback" && (
                      <FeedbackStep
                        feedback={feedback}
                        setFeedback={setFeedback}
                        onSubmit={handleFeedbackSubmit}
                        onSkip={onClose}
                      />
                    )}
                    {step === "thanks" && <ThanksStep />}
                  </Animated.View>
                </ImageBackground>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Step: Rate ──────────────────────────────────────────────────────────────

function RateStep({
  rating,
  setRating,
  starKey,
}: {
  rating: number;
  setRating: (r: number) => void;
  starKey: number;
}) {
  return (
    <>
      <CustomText
        variant="h5"
        textColor="#592410"
        className="text-center"
        allowWrap
        style={styles.title}
      >
        Enjoying the game?
      </CustomText>

      <CustomText
        variant="p-small"
        textColor="#762a05"
        className="text-center"
        allowWrap
        style={styles.subtitle}
      >
        Tap a star to rate Who Is Not!
      </CustomText>

      <View style={styles.starsRow}>
        {Array.from({ length: STAR_COUNT }).map((_, i) => (
          <AnimatedStar
            key={i}
            index={i}
            selected={i < rating}
            runKey={starKey}
            onPress={() => setRating(i + 1)}
          />
        ))}
      </View>

      <CustomText
        variant="p-xsmall"
        textColor="rgba(89,36,16,0.38)"
        className="text-center"
        style={{ marginTop: 10 }}
      >
        {rating === 0
          ? "Select a rating above"
          : rating >= 4
          ? "Great! Taking you to the store…"
          : "Thanks — tell us what to improve!"}
      </CustomText>
    </>
  );
}

// ─── Step: Feedback ──────────────────────────────────────────────────────────

function FeedbackStep({
  feedback,
  setFeedback,
  onSubmit,
  onSkip,
}: {
  feedback: string;
  setFeedback: (s: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  return (
    <>
      <CustomText
        variant="h5"
        textColor="#592410"
        className="text-center"
        allowWrap
        style={styles.title}
      >
        What could we improve?
      </CustomText>

      <CustomText
        variant="p-small"
        textColor="#762a05"
        className="text-center"
        allowWrap
        style={styles.subtitle}
      >
        Your feedback helps us make the game better for everyone.
      </CustomText>

      <View style={styles.inputWrap}>
        <TextInput
          value={feedback}
          onChangeText={setFeedback}
          placeholder="Tell us what you think…"
          placeholderTextColor="rgba(89,36,16,0.38)"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={styles.textInput}
          maxLength={500}
        />
      </View>

      <View style={styles.divider} />

      <TouchableOpacity
        onPress={onSubmit}
        activeOpacity={0.82}
        style={styles.rateBtnWrap}
      >
        <LinearGradient
          colors={["#3DDC6A", "#1B9E42"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rateBtnGrad}
        >
          <CustomText
            variant="h6-headline"
            textColor="#ffffff"
            responsive={false}
            style={{ fontSize: 16 }}
          >
            Send feedback
          </CustomText>
        </LinearGradient>
      </TouchableOpacity>

      <Pressable onPress={onSkip} style={styles.laterBtn}>
        <CustomText
          variant="p-small"
          textColor="rgba(89,36,16,0.42)"
          className="text-center"
        >
          Skip
        </CustomText>
      </Pressable>
    </>
  );
}

// ─── Step: Thanks ────────────────────────────────────────────────────────────

function ThanksStep() {
  return (
    <>
      <CustomText
        variant="h5"
        textColor="#592410"
        className="text-center"
        allowWrap
        style={styles.title}
      >
        Thank you!
      </CustomText>

      <CustomText
        variant="p-small"
        textColor="#762a05"
        className="text-center"
        allowWrap
        style={[styles.subtitle, { marginBottom: 24 }]}
      >
        We read every message and will use your input to improve the game.
      </CustomText>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  cardOuter: { position: "relative" },

  // Close button — pokes out of top-right corner
  closeBtn: {
    position: "absolute",
    top: -15,
    right: -15,
    zIndex: 20,
    elevation: 20,
  },
  closeBtnGrad: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF5500",
    shadowOpacity: 0.9,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 2 },
  },
  closeX: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 18,
    includeFontPadding: false,
  },

  // Top decoration — height and top are set inline, proportional to card width
  topDecoration: {
    position: "absolute",
    left: -5,
    zIndex: 0,
    elevation: 0,
  },

  // Plate
  plateShadow: {
    shadowColor: "#FF7A00",
    shadowOpacity: 0.75,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 4 },
    elevation: 14,
  },
  plate: {
    borderRadius: 18,
    paddingHorizontal: 26,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: "center",
    shadowColor: "#ffd800",
    shadowOpacity: 0.85,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(251,192,32,1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(160,110,60,0.7)",
    overflow: "hidden",
  },
  content: {
    alignSelf: "stretch",
    alignItems: "center",
  },

  title: { marginBottom: 6 },
  subtitle: { marginBottom: 14, lineHeight: 18, opacity: 0.88 },

  // Stars
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginVertical: 6,
  },
  star: {
    fontSize: 46,
    textShadowOffset: { width: 0, height: 0 },
  },

  // Feedback input
  inputWrap: {
    alignSelf: "stretch",
    backgroundColor: "rgba(89,36,16,0.07)",
    borderWidth: 1.5,
    borderColor: "rgba(89,36,16,0.22)",
    borderRadius: 14,
    marginBottom: 4,
    overflow: "hidden",
  },
  textInput: {
    alignSelf: "stretch",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: "#592410",
    fontFamily: Platform.OS === "ios" ? "System" : undefined,
    lineHeight: 21,
    minHeight: 80,
  },

  divider: {
    alignSelf: "stretch",
    height: 1,
    backgroundColor: "rgba(89,36,16,0.16)",
    marginVertical: 16,
  },

  // Buttons
  rateBtnWrap: {
    alignSelf: "stretch",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#1B9E42",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  rateBtnGrad: {
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 14,
  },
  laterBtn: {
    marginTop: 13,
    paddingVertical: 4,
  },
});
