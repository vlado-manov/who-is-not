import React, { useRef, useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  FlatList,
  TouchableWithoutFeedback,
  FlatListProps,
  ViewToken,
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
import CustomText from "../components/common/CustomText";
import ScreenTopBar from "../components/common/ScreenTopBar";
import { useNavigation } from "@react-navigation/native";
import { navigateBackSafe } from "../navigation/navigateBackSafe";
import { useTranslation } from "react-i18next";
import { OnboardingStackParamList } from "../navigation/types";
import { StackNavigationProp } from "@react-navigation/stack";
import { htp_images } from "../../assets/images";
import { useResponsive } from "../utils/responsive";
import { useUserSettingsSheet } from "../context/UserSettingsModalContext";

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

function getHtpSteps(t: (key: string) => string): Step[] {
  return [
    {
      num: 1,
      title: t("htp_gather_title"),
      bullets: [t("htp_gather_1"), t("htp_gather_2")],
      image: htp_images.htp03,
    },
    {
      num: 2,
      title: t("htp_question_title"),
      bullets: [t("htp_question_1"), t("htp_question_2")],
      image: htp_images.htp08,
    },
    {
      num: 3,
      title: t("htp_discuss_title"),
      bullets: [t("htp_discuss_1"), t("htp_discuss_2"), t("htp_discuss_3")],
      image: htp_images.htp05,
    },
    {
      num: 4,
      title: t("htp_vote_title"),
      bullets: [t("htp_vote_1"), t("htp_vote_2")],
      image: htp_images.htp06,
    },
    {
      num: 5,
      title: t("htp_reveal_title"),
      bullets: [t("htp_reveal_1"), t("htp_reveal_2"), t("htp_reveal_3")],
      image: htp_images.htp07,
    },
  ];
}

type StepCardProps = {
  step: Step;
  itemWidth: number;
  imageHeight: number;
  showPrev?: boolean;
  showNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  t: (key: string) => string;
};

function StepCard({
  step,
  itemWidth,
  imageHeight,
  showPrev,
  showNext,
  onPrev,
  onNext,
  t,
}: StepCardProps) {
  return (
    <View
      style={{
        width: itemWidth,
        paddingHorizontal: 0,
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 8,
      }}
    >
      <View style={{ width: "80%", maxWidth: 480, position: "relative" }}>
        <View
          className="bg-primary-500 rounded-2xl items-center justify-center"
          style={{
            position: "absolute",
            top: -8,
            alignSelf: "center",
            width: 64,
            height: 64,
            zIndex: 1,
          }}
        >
          <CustomText
            variant="h3"
            className="text-primary-500"
            responsive={false}
          >
            {step.num}
          </CustomText>
        </View>
        {showPrev ? (
          <View className="absolute left-4">
            <TouchableOpacity
              onPress={onPrev}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CustomText className="underline">{t("htp_prev")}</CustomText>
            </TouchableOpacity>
          </View>
        ) : null}

        {showNext ? (
          <View className="absolute right-4">
            <TouchableOpacity
              onPress={onNext}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CustomText className="underline">{t("htp_next")}</CustomText>
            </TouchableOpacity>
          </View>
        ) : null}
        <View
          className="bg-white rounded-2xl p-8 mt-8 w-full overflow-hidden"
          style={{ justifyContent: "space-between" }}
        >
          <AppImage
            source={step.image}
            contentFit="contain"
            style={{ width: "100%", height: imageHeight }}
          />
          <View>
            <CustomText variant="h5" textColor="black" className="text-center">
              {step.title}
            </CustomText>
            {step.bullets.map((b, i) => (
              <CustomText
                key={i}
                textColor="black"
                className={i === 0 ? "mt-4" : "mt-2"}
              >
                {b}
              </CustomText>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const HowToPlayScreen = () => {
  const navigation = useNavigation<Nav>();
  const { openUserSettings } = useUserSettingsSheet();
  const { t } = useTranslation();
  const { horizontalPadding, topIconSize } = useResponsive();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth >= 768;
  const steps = React.useMemo(() => getHtpSteps(t), [t]);
  const [index, setIndex] = useState(0);
  const flatRef = useRef<FlatList<Step>>(null);
  const cardImageHeight = Math.min(225, Math.max(160, windowHeight * 0.28));

  const getItemLayout = (_: any, i: number) => ({
    length: windowWidth,
    offset: windowWidth * i,
    index: i,
  });
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
  }).current;
  const onViewableItemsChanged = useRef<
    FlatListProps<Step>["onViewableItemsChanged"]
  >(
    (info: {
      viewableItems: ViewToken<Step>[];
      changed: ViewToken<Step>[];
    }) => {
      const i = info.viewableItems?.[0]?.index;
      if (typeof i === "number") setIndex(i);
    },
  ).current;

  const goTo = (i: number) => {
    flatRef.current?.scrollToIndex({ index: i, animated: true });
    setIndex(i);
  };

  return (
    <FullBleedStack
      rootStyle={styles.root}
      backdrop={<AnimatedHtpBackground />}
    >
      <SafeAreaView style={styles.safe} edges={["left", "right"]}>
        <View style={{ flex: 1 }}>
          <ScreenTopBar
            variant="soloBackFromCenter"
            horizontalPadding={horizontalPadding}
            topIconSize={topIconSize}
            showBack
            onSettings={() => openUserSettings()}
            onProfile={() => {}}
            onBack={() => navigateBackSafe(navigation)}
            backAccessibilityLabel={t("back_btn")}
          />
          <ScrollView
            contentContainerStyle={{
              paddingTop: 72,
              paddingBottom: 16,
              alignItems: "center",
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View
              className="items-center justify-center px-4"
              style={[{ width: "100%" }, isTablet && { maxWidth: 560 }]}
            >
              <CustomText variant="h3-headline" className="text-center w-full">
                {t("htp_heading_1")}
              </CustomText>
              <CustomText variant="h3" className="-rotate-3 text-center w-full">
                {t("htp_heading_2")}
              </CustomText>
            </View>

            <View style={{ flex: 1, marginTop: 32 }}>
              <FlatList
                ref={flatRef}
                data={steps}
                keyExtractor={(it) => `step-${it.num}`}
                renderItem={({ item }) => (
                  <StepCard
                    step={item}
                    itemWidth={windowWidth}
                    imageHeight={cardImageHeight}
                    showPrev={index > 0}
                    showNext={index < steps.length - 1}
                    onPrev={() => goTo(index - 1)}
                    onNext={() => goTo(index + 1)}
                    t={t}
                  />
                )}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={windowWidth}
                decelerationRate="fast"
                getItemLayout={getItemLayout}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                disableIntervalMomentum
              />

              <View className="w-full items-center justify-center flex-row">
                {steps.map((_: Step, i: number) => {
                  const active = i === index;
                  return (
                    <TouchableWithoutFeedback key={i} onPress={() => goTo(i)}>
                      <View
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 999,
                          marginHorizontal: 6,
                          backgroundColor: active
                            ? "#fff"
                            : "rgba(255,255,255,0.6)",
                        }}
                      />
                    </TouchableWithoutFeedback>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </FullBleedStack>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#140304" },
  safe: { flex: 1, backgroundColor: "transparent" },
});

export default HowToPlayScreen;
