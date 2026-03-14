// src/components/TutorialOverlay.tsx
import React, { useRef, useState } from "react";
import {
  View,
  FlatList,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ViewToken,
  FlatListProps,
  ImageSourcePropType,
} from "react-native";
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
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList<TutorialStep>>(null);

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
    <View className="absolute inset-0 z-[99] items-center justify-center">
      <View className="inset-0 absolute bg-[rgba(0,0,0,0.85)] w-full h-full" />

      <View className="absolute top-20 right-12 z-[100]">
        <TouchableOpacity onPress={onSkipAll}>
          <CustomText variant="p" className="underline">
            {t("skip")}
          </CustomText>
        </TouchableOpacity>
      </View>

      <View style={{ width: W, paddingTop: 24 }}>
        <FlatList
          ref={ref}
          data={steps}
          keyExtractor={(it) => `tstep-${it.num}`}
          renderItem={({ item }) => (
            <View
              style={{
                width: W,
                alignItems: "center",
                justifyContent: "flex-start",
                paddingTop: 8,
              }}
            >
              <View style={{ width: "80%", position: "relative" }}>
                <View
                  className="bg-primary-400 rounded-2xl items-center justify-center"
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
                    {item.num}
                  </CustomText>
                </View>

                <View
                  className="bg-white rounded-2xl p-8 mt-8 w-full overflow-hidden"
                  style={{ justifyContent: "space-between" }}
                >
                  <AppImage
                    source={item.image}
                    contentFit="contain"
                    style={{ width: "100%", height: 220 }}
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

        <View className="w-full items-center justify-center mt-6 mb-2 flex-row">
          {steps.map((_, i) => {
            const active = i === index;
            return (
              <TouchableWithoutFeedback key={i} onPress={() => goTo(i)}>
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    marginHorizontal: 6,
                    backgroundColor: active ? "#fff" : "rgba(255,255,255,0.6)",
                  }}
                />
              </TouchableWithoutFeedback>
            );
          })}
        </View>

        <View className="items-center mt-4">
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
      </View>
    </View>
  );
}
