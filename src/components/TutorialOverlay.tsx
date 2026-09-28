// src/components/TutorialOverlay.tsx
import React, { useRef, useState } from "react";
import {
  View,
  FlatList,
  Dimensions,
  TouchableWithoutFeedback,
  ViewToken,
  FlatListProps,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppImage from "./AppImage";
import CustomText from "./common/CustomText";
import CustomButton from "./common/CustomButton";
import { backgrounds } from "../../assets/backgrounds";
import { htp_images } from "../../assets/images";
import { useTranslation } from "react-i18next";

const { width: W } = Dimensions.get("window");

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

export default function TutorialOverlay({ visible, onSkipAll, onDoneAll, steps }: Props) {
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList<TutorialStep>>(null);

  // Scale the illustration so the whole overlay fits on compact screens.
  // 0.26 * 667 (iPhone SE) = 173px — enough to be meaningful without overflow.
  const imageHeight = Math.max(120, Math.min(220, windowHeight * 0.26));

  const getItemLayout = (_: unknown, i: number) => ({
    length: W,
    offset: W * i,
    index: i,
  });

  const viewabilityConfig = { itemVisiblePercentThreshold: 70 };

  const onViewableItemsChanged = useRef<
    FlatListProps<TutorialStep>["onViewableItemsChanged"]
  >(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken[];
      changed: ViewToken[];
    }) => {
      const i = viewableItems?.[0]?.index;
      if (typeof i === "number") setIndex(i);
    }
  ).current;

  const goTo = (i: number) => {
    ref.current?.scrollToIndex({ index: i, animated: true });
    setIndex(i);
  };

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]}>
      <View style={[StyleSheet.absoluteFill, styles.backdrop]} />

      {/*
        SafeAreaView ensures the content respects notch/home-indicator insets.
        All interactive elements are in normal document flow — no absolute
        positioning — so Skip can never overlap Next.
      */}
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
        <View style={styles.center}>
          <View style={{ width: W, paddingTop: 24 }}>
            <FlatList
              ref={ref}
              data={steps}
              keyExtractor={(it) => `tstep-${it.num}`}
              renderItem={({ item }) => (
                <View style={styles.slide}>
                  <View style={styles.cardWrap}>
                    {/* Step number badge */}
                    <View style={styles.badge}>
                      <CustomText
                        variant="h3"
                        className="text-primary-500"
                        responsive={false}
                      >
                        {item.num}
                      </CustomText>
                    </View>

                    <View style={styles.card}>
                      <AppImage
                        source={item.image}
                        contentFit="contain"
                        style={{ width: "100%", height: imageHeight }}
                      />
                      <View>
                        <CustomText
                          variant="h5"
                          textColor="black"
                          className="text-center"
                        >
                          {item.title}
                        </CustomText>
                        {item.bullets.map((b, i) => (
                          <CustomText
                            key={i}
                            textColor="black"
                            className={i === 0 ? "mt-4" : "mt-2"}
                            style={{ fontFamily: "Onest-SemiBold" }}
                          >
                            {b}
                          </CustomText>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              )}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={W}
              decelerationRate="fast"
              getItemLayout={getItemLayout}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              disableIntervalMomentum
            />

            {/* Pagination dots */}
            <View style={styles.dotsRow}>
              {steps.map((_, i) => {
                const active = i === index;
                return (
                  <TouchableWithoutFeedback key={i} onPress={() => goTo(i)}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: active ? "#fff" : "rgba(255,255,255,0.6)" },
                      ]}
                    />
                  </TouchableWithoutFeedback>
                );
              })}
            </View>

            {/* Next / Got it button */}
            <View style={styles.nextWrap}>
              <CustomButton
                title={index === steps.length - 1 ? t("got_it") : t("next")}
                onPress={() =>
                  index < steps.length - 1 ? goTo(index + 1) : onDoneAll()
                }
                backgroundImage={backgrounds.bg026}
                glow
                glowColor="rgba(41,255,25,0.8)"
                shadowColor="#005f07"
                horizontalPadding={48}
              />
            </View>

            {/*
              Skip — part of normal flow, always rendered BELOW Next.
              No absolute positioning → no possible overlap.
            */}
            <View style={styles.skipWrap}>
              <Pressable
                onPress={onSkipAll}
                hitSlop={{ top: 12, right: 24, bottom: 12, left: 24 }}
                style={({ pressed }) => [
                  styles.skipBtn,
                  pressed && styles.skipBtnPressed,
                ]}
              >
                <CustomText variant="p" style={styles.skipLabel}>
                  {t("skip")}
                </CustomText>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 99,
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  safeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  slide: {
    width: W,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 8,
  },
  cardWrap: {
    width: "80%",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -8,
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#a855f7", // bg-primary-400
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    marginTop: 32,
    width: "100%",
    overflow: "hidden",
    justifyContent: "space-between",
  },
  dotsRow: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 24,
    marginBottom: 8,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    marginHorizontal: 6,
  },
  nextWrap: {
    alignItems: "center",
    marginTop: 16,
  },
  skipWrap: {
    alignItems: "center",
    marginTop: 12,
    paddingBottom: 4,
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  skipBtnPressed: {
    opacity: 0.55,
  },
  skipLabel: {
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    fontFamily: "Onest-SemiBold",
  },
});
