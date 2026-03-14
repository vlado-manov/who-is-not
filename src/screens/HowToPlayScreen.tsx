import React, { useRef, useState } from "react";
import {
  View,
  ImageBackground,
  TouchableOpacity,
  FlatList,
  Dimensions,
  TouchableWithoutFeedback,
  FlatListProps,
  ViewToken,
  ScrollView,
  ImageSourcePropType,
} from "react-native";
import AppImage from "../components/AppImage";
import { SafeAreaView } from "react-native-safe-area-context";
import { backgrounds } from "../../assets/backgrounds";
import { Entypo } from "@expo/vector-icons";
import CustomText from "../components/common/CustomText";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { OnboardingStackParamList } from "../navigation/types";
import { StackNavigationProp } from "@react-navigation/stack";
import AudioManager from "../utils/audioManager";
import { htp_images } from "../../assets/images";

type Nav = StackNavigationProp<OnboardingStackParamList, "Rules">;

type Step = {
  num: number;
  title: string;
  bullets: string[];
  image: ImageSourcePropType;
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

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
  showPrev?: boolean;
  showNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  t: (key: string) => string;
};

function StepCard({
  step,
  showPrev,
  showNext,
  onPrev,
  onNext,
  t,
}: StepCardProps) {
  return (
    <View
      style={{
        width: SCREEN_W,
        paddingHorizontal: 0,
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 8,
      }}
    >
      <View style={{ width: "80%", position: "relative" }}>
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
            style={{ width: "100%", height: 225 }}
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
  const { t } = useTranslation();
  const steps = React.useMemo(() => getHtpSteps(t), [t]);
  const [index, setIndex] = useState(0);
  const flatRef = useRef<FlatList<Step>>(null);

  const getItemLayout = (_: any, i: number) => ({
    length: SCREEN_W,
    offset: SCREEN_W * i,
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
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg023}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={{
            paddingVertical: 64,
            alignItems: "center",
            flexGrow: 1,
          }}
        >
          <View className="px-8 w-full mt-6">
            <TouchableOpacity
              onPress={() => {
                AudioManager.playButtonClick();
                navigation.goBack();
              }}
              className="flex flex-row gap-2 items-center"
            >
              <Entypo name="arrow-with-circle-left" size={48} color="white" />
            </TouchableOpacity>
          </View>

          <View className="items-center w-full justify-center px-4">
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
              snapToInterval={SCREEN_W}
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
      </ImageBackground>
    </SafeAreaView>
  );
};

export default HowToPlayScreen;
