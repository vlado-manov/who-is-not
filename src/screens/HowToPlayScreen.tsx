import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Pressable,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ImageSourcePropType,
  useWindowDimensions,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AppImage from "../components/AppImage";
import FullBleedStack from "../components/FullBleedStack";
import { SafeAreaView } from "react-native-safe-area-context";
import CamButton from "../components/cam/CamButton";
import CamNavBar from "../components/cam/CamNavBar";
import CamText from "../components/cam/CamText";
import { CAM_TEXT } from "./Cam/cam.constants";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import { navigateBackSafe } from "../navigation/navigateBackSafe";
import { useTranslation } from "react-i18next";
import { OnboardingStackParamList, type RulesMode } from "../navigation/types";
import { StackNavigationProp } from "@react-navigation/stack";
import { htp_images } from "../../assets/images";

type Nav = StackNavigationProp<OnboardingStackParamList, "Rules">;

// ── Animated red → pink → orange background ───────────────────────────────────
const HG0 = [
  "rgba(185,28,28,0.52)",
  "rgba(200,20,20,0.54)",
  "rgba(160,18,18,0.50)",
] as const;
const HG1 = [
  "rgba(220,38,38,0.52)",
  "rgba(239,68,68,0.54)",
  "rgba(185,28,28,0.50)",
] as const;
const HG2 = [
  "rgba(234,88,12,0.50)",
  "rgba(249,115,22,0.52)",
  "rgba(220,60,10,0.50)",
] as const;
const HG3 = [
  "rgba(219,39,119,0.48)",
  "rgba(236,72,153,0.52)",
  "rgba(190,24,93,0.48)",
] as const;

const HTP_BUBBLES = [
  {
    left: "4%",
    size: 18,
    dur: 6800,
    delay: 0,
    opacity: 0.45,
    color: "#fca5a5",
  },
  {
    left: "15%",
    size: 34,
    dur: 10200,
    delay: 1800,
    opacity: 0.25,
    color: "#f87171",
  },
  {
    left: "27%",
    size: 12,
    dur: 5400,
    delay: 700,
    opacity: 0.5,
    color: "#fb923c",
  },
  {
    left: "40%",
    size: 28,
    dur: 8400,
    delay: 3000,
    opacity: 0.3,
    color: "#f9a8d4",
  },
  {
    left: "54%",
    size: 44,
    dur: 12500,
    delay: 5000,
    opacity: 0.18,
    color: "#fecdd3",
  },
  {
    left: "66%",
    size: 14,
    dur: 5800,
    delay: 400,
    opacity: 0.48,
    color: "#fdba74",
  },
  {
    left: "77%",
    size: 30,
    dur: 9400,
    delay: 6200,
    opacity: 0.26,
    color: "#fca5a5",
  },
  {
    left: "88%",
    size: 22,
    dur: 7600,
    delay: 2000,
    opacity: 0.38,
    color: "#fbcfe8",
  },
  {
    left: "8%",
    size: 46,
    dur: 13800,
    delay: 7500,
    opacity: 0.14,
    color: "#fed7aa",
  },
  {
    left: "34%",
    size: 10,
    dur: 4400,
    delay: 2800,
    opacity: 0.52,
    color: "#ffe4e6",
  },
  {
    left: "51%",
    size: 20,
    dur: 7000,
    delay: 900,
    opacity: 0.4,
    color: "#f97316",
  },
  {
    left: "72%",
    size: 8,
    dur: 3800,
    delay: 4400,
    opacity: 0.54,
    color: "#fb7185",
  },
  {
    left: "22%",
    size: 6,
    dur: 3200,
    delay: 6000,
    opacity: 0.55,
    color: "#fda4af",
  },
  {
    left: "83%",
    size: 16,
    dur: 5600,
    delay: 3600,
    opacity: 0.42,
    color: "#ea580c",
  },
] as const;

function HtpBubble({
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

function AnimatedHtpBackground() {
  const t1 = useRef(new Animated.Value(0.5)).current;
  const t2 = useRef(new Animated.Value(0.8)).current;
  const t3 = useRef(new Animated.Value(0.2)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(t1, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(t1, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(t2, {
          toValue: 0,
          duration: 3600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(t2, {
          toValue: 0.9,
          duration: 3600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(t3, {
          toValue: 1,
          duration: 4400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(t3, {
          toValue: 0,
          duration: 4400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [t1, t2, t3]);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={["#1a0508", "#140304", "#180406"]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient colors={HG0} style={StyleSheet.absoluteFill} />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: t1 }]}>
        <LinearGradient colors={HG1} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: t2 }]}>
        <LinearGradient colors={HG2} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: t3 }]}>
        <LinearGradient colors={HG3} style={StyleSheet.absoluteFill} />
      </Animated.View>
      {/* Warm pink-red centre bloom */}
      <LinearGradient
        colors={["transparent", "rgba(244,63,94,0.16)", "transparent"]}
        start={{ x: 0.5, y: 0.1 }}
        end={{ x: 0.5, y: 0.9 }}
        style={StyleSheet.absoluteFill}
      />
      {HTP_BUBBLES.map((b, i) => (
        <HtpBubble key={i} {...b} />
      ))}
    </View>
  );
}

type Step = {
  num: number;
  title: string;
  bullets: string[];
  image: ImageSourcePropType;
};

type StepDef = Omit<Step, "num">;

/**
 * The steps for the game type the player has already chosen. The rounds are
 * the same in party and online play; only the first step differs (together
 * with one phone, or apart on a call). Cam Mode plays differently throughout.
 */
function getHtpSteps(t: (key: string) => string, mode?: RulesMode): Step[] {
  const step = (
    prefix: string,
    bullets: number,
    image: ImageSourcePropType,
  ) => ({
    title: t(`${prefix}_title`),
    bullets: Array.from({ length: bullets }, (_, i) => t(`${prefix}_${i + 1}`)),
    image,
  });

  const rounds: StepDef[] = [
    step("htp_question", 2, htp_images.htp08),
    step("htp_discuss", 3, htp_images.htp05),
    step("htp_vote", 2, htp_images.htp06),
    step("htp_reveal", 3, htp_images.htp07),
  ];

  let steps: StepDef[];
  if (mode === "cam") {
    steps = [
      step("htp_cam_setup", 2, htp_images.htp03),
      step("htp_cam_question", 2, htp_images.htp08),
      step("htp_cam_point", 3, htp_images.htp05),
      step("htp_cam_lives", 2, htp_images.htp07),
    ];
  } else if (mode === "party") {
    steps = [step("htp_party", 2, htp_images.htp03), ...rounds];
  } else if (mode === "online") {
    steps = [step("htp_online", 2, htp_images.htp03), ...rounds];
  } else {
    // Opened without a game type: the general version.
    steps = [step("htp_gather", 2, htp_images.htp03), ...rounds];
  }
  return steps.map((s, i) => ({ ...s, num: i + 1 }));
}

type StepCardProps = {
  step: Step;
  total: number;
  itemWidth: number;
  imageHeight: number;
  t: (key: string, options?: Record<string, unknown>) => string;
};

/** One tutorial page: illustration tile, "step n of m", a headline and short points. */
function StepCard({ step, total, itemWidth, imageHeight, t }: StepCardProps) {
  return (
    <View style={[styles.page, { width: itemWidth }]}>
      <View style={styles.imageTile}>
        <AppImage
          source={step.image}
          contentFit="contain"
          style={{ width: "100%", height: imageHeight }}
        />
      </View>
      <CamText variant="subtitle" style={styles.stepLabel}>
        {t("htp_step_of", { n: step.num, total })}
      </CamText>
      <CamText variant="title" style={styles.title}>
        {step.title}
      </CamText>
      <View style={styles.bullets}>
        {step.bullets.map((bullet, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <CamText variant="subtitle" style={styles.bulletText}>
              {bullet}
            </CamText>
          </View>
        ))}
      </View>
    </View>
  );
}

const HowToPlayScreen = () => {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const route = useRoute<RouteProp<OnboardingStackParamList, "Rules">>();
  const mode = route.params?.mode;
  const steps = React.useMemo(() => getHtpSteps(t, mode), [t, mode]);
  const [index, setIndex] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const pageWidth = Math.min(windowWidth, HTP.maxWidth);
  const imageHeight = Math.min(260, Math.max(150, windowHeight * 0.3));
  const isLast = index === steps.length - 1;

  // The current step always follows the scroll position, however it moved:
  // a finger swipe, the button, the dots or the back chevron.
  const syncIndex = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
    const clamped = Math.max(0, Math.min(steps.length - 1, next));
    setIndex((current) => (current === clamped ? current : clamped));
  };

  const goTo = (i: number) => {
    pagerRef.current?.scrollTo({ x: i * windowWidth, animated: true });
    // Also set directly, in case the scroll events are late or missing.
    setIndex(i);
  };
  const close = () => navigateBackSafe(navigation);
  // Standard back: one step back, and out of the tutorial from the first step.
  const goBack = () => (index > 0 ? goTo(index - 1) : close());

  return (
    <FullBleedStack
      rootStyle={styles.root}
      backdrop={<AnimatedHtpBackground />}
    >
      <SafeAreaView
        style={styles.safe}
        edges={["top", "left", "right", "bottom"]}
      >
        <CamNavBar
          title={`${t("htp_heading_1")} ${t("htp_heading_2")}`}
          backLabel={t("back_btn")}
          onBack={goBack}
          right={
            !isLast && (
              <Pressable accessibilityRole="button" hitSlop={8} onPress={close}>
                <CamText variant="subtitle" numberOfLines={1}>
                  {t("htp_skip")}
                </CamText>
              </Pressable>
            )
          }
        />

        {/* A plain paged scroller: five pages do not need a virtualised list. */}
        <ScrollView
          ref={pagerRef}
          style={styles.pager}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={syncIndex}
          onMomentumScrollEnd={syncIndex}
          onScrollEndDrag={syncIndex}
        >
          {steps.map((step) => (
            <ScrollView
              key={step.num}
              style={{ width: windowWidth }}
              contentContainerStyle={styles.pageScroll}
              showsVerticalScrollIndicator={false}
            >
              <StepCard
                step={step}
                total={steps.length}
                itemWidth={pageWidth}
                imageHeight={imageHeight}
                t={t}
              />
            </ScrollView>
          ))}
        </ScrollView>

        {/* Fixed footer: progress dots, then one full-width primary button. */}
        <View style={[styles.footer, { width: pageWidth }]}>
          <View style={styles.dots}>
            {steps.map((step, i) => (
              <Pressable
                key={step.num}
                accessibilityRole="button"
                accessibilityLabel={t("htp_step_of", {
                  n: step.num,
                  total: steps.length,
                })}
                hitSlop={8}
                onPress={() => goTo(i)}
              >
                <View style={[styles.dot, i === index && styles.dotActive]} />
              </Pressable>
            ))}
          </View>
          <CamButton
            title={isLast ? t("htp_done") : t("htp_next")}
            variant={isLast ? "dark" : "primary"}
            onPress={() => (isLast ? close() : goTo(index + 1))}
          />
        </View>
      </SafeAreaView>
    </FullBleedStack>
  );
};

/** TikTok-like metrics for the tutorial: 44pt bar, 16pt gutters, 8pt radii. */
const HTP = {
  gutter: 16,
  radius: 8,
  maxWidth: 480,
  dot: 6,
} as const;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#140304" },
  safe: { flex: 1, backgroundColor: "transparent" },
  pager: {
    flex: 1,
  },
  pageScroll: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 16,
  },
  page: {
    paddingHorizontal: HTP.gutter,
  },
  imageTile: {
    backgroundColor: "#FFFFFF",
    borderRadius: HTP.radius * 2,
    padding: HTP.gutter,
  },
  stepLabel: {
    marginTop: 24,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.75,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    marginTop: 4,
  },
  bullets: {
    marginTop: 12,
    gap: 10,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    // Sits on the first text line.
    marginTop: 8,
    backgroundColor: CAM_TEXT,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.9,
  },
  footer: {
    alignSelf: "center",
    paddingHorizontal: HTP.gutter,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 16,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: HTP.dot,
    height: HTP.dot,
    borderRadius: HTP.dot / 2,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: {
    width: HTP.dot * 3,
    backgroundColor: "#FFFFFF",
  },
});

export default HowToPlayScreen;
