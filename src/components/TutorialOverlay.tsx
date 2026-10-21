// src/components/TutorialOverlay.tsx
import React, { useRef, useState } from "react";
import {
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import AppImage from "./AppImage";
import CamButton from "./cam/CamButton";
import CamText from "./cam/CamText";
import { htp_images } from "../../assets/images";
import { TT } from "../constants/tiktokTheme";

export type TutorialStep = {
  num: number;
  title: string;
  bullets: string[];
  image: ImageSourcePropType;
};

export function getTutorialSteps(t: (key: string) => string): TutorialStep[] {
  return [
    {
      num: 1,
      title: t("tutorial_pass_around_title"),
      bullets: [t("tutorial_pass_around_1"), t("tutorial_pass_around_2"), t("tutorial_pass_around_3")],
      image: htp_images.htp09,
    },
    {
      num: 2,
      title: t("tutorial_twist_title"),
      bullets: [t("tutorial_twist_1"), t("tutorial_twist_2"), t("tutorial_twist_3")],
      image: htp_images.htp08,
    },
    {
      num: 3,
      title: t("tutorial_accuse_title"),
      bullets: [t("tutorial_accuse_1"), t("tutorial_accuse_2"), t("tutorial_accuse_3")],
      image: htp_images.htp05,
    },
  ];
}

type Props = {
  visible: boolean;
  onSkipAll: () => void;
  onDoneAll: () => void;
  steps: TutorialStep[];
};

const GUTTER = 24;
const DOT = 6;

/**
 * Quick tutorial at the start of a game: the same three slides and texts as
 * before, laid out the way app onboarding usually is — Skip in the corner, a
 * large illustration, a bold headline with short points under it, progress
 * dots and one full-width button — in the dark TikTok look of the popups.
 */
export default function TutorialOverlay({ visible, onSkipAll, onDoneAll, steps }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const pagerRef = useRef<ScrollView>(null);

  if (!visible || steps.length === 0) return null;

  const isLast = index >= steps.length - 1;
  const imageHeight = Math.max(160, Math.min(300, height * 0.34));

  // The step follows the scroll position, so swiping and the button agree.
  const syncIndex = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    const clamped = Math.max(0, Math.min(steps.length - 1, next));
    setIndex((current) => (current === clamped ? current : clamped));
  };
  const goTo = (i: number) => {
    pagerRef.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]}>
      <View style={[styles.header, { marginTop: insets.top + 8 }]}>
        <Pressable accessibilityRole="button" hitSlop={10} onPress={onSkipAll}>
          <CamText variant="subtitle">{t("skip")}</CamText>
        </Pressable>
      </View>

      <ScrollView
        ref={pagerRef}
        style={styles.pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={syncIndex}
        onMomentumScrollEnd={syncIndex}
      >
        {steps.map((step) => (
          <View key={step.num} style={[styles.page, { width }]}>
            <View style={styles.imageTile}>
              <AppImage
                source={step.image}
                contentFit="contain"
                style={{ width: "100%", height: imageHeight }}
              />
            </View>
            <View style={styles.texts}>
              <CamText variant="question">{step.title}</CamText>
              {step.bullets.map((bullet, i) => (
                <CamText key={i} variant="subtitle" style={styles.bullet}>
                  {bullet}
                </CamText>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.dots}>
          {steps.map((step, i) => (
            <View key={step.num} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <CamButton
          title={isLast ? t("continue_btn") : t("next")}
          onPress={() => (isLast ? onDoneAll() : goTo(index + 1))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 99,
    backgroundColor: TT.bg,
  },
  header: {
    height: 44,
    paddingHorizontal: GUTTER,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  pager: {
    flex: 1,
  },
  page: {
    paddingHorizontal: GUTTER,
    justifyContent: "center",
    gap: 28,
  },
  imageTile: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
  },
  texts: {
    gap: 10,
  },
  bullet: {
    fontSize: 16,
    lineHeight: 23,
    opacity: 0.9,
  },
  footer: {
    paddingHorizontal: GUTTER,
    paddingTop: 12,
    gap: 20,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: {
    width: DOT * 4,
    backgroundColor: TT.text,
  },
});
