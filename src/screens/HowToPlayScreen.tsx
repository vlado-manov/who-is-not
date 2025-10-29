import { StatusBar } from "expo-status-bar";
import React, { useMemo, useRef, useState } from "react";
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
  Image,
} from "react-native";
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

const STEPS: Step[] = [
  {
    num: 1,
    title: "Gather your crew",
    bullets: [
      "Get your friends together — in one room or on a quick call or video chat.",
      "You’ll need to talk, bluff, and overanalyze everything.",
    ],
    image: htp_images.htp03,
  },
  {
    num: 2,
    title: "Everyone gets a question",
    bullets: [
      "Each player gets a question — except one who secretly gets a *different* one.",
      "That person is the Impostor… but even they don’t know it yet! Everyone answers truthfully — no lying yet!",
    ],
    image: htp_images.htp08,
  },
  // {
  //   num: 3,
  //   title: "Answer honestly",
  //   bullets: [
  //     "Everyone answers truthfully to their question.",
  //     "This is important. Remember at this point you don't know if you are the impostor or not.",
  //   ],
  //   image: htp_images.htp09,
  // },
  {
    num: 3,
    title: "Discuss & Accuse",
    bullets: [
      "All answers appear. Talk, argue, defend, and accuse.",
      "This is when the Impostor finally sees the real question — and realizes it’s them.Now they must blend in… or fake it till they make it.",
      "Your goal? Find him.",
    ],
    image: htp_images.htp05,
  },
  {
    num: 4,
    title: "Vote",
    bullets: [
      "When time’s up, everyone votes who they think the Impostor is.",
      "Votes are revealed — but the suspense stays until the end! Did you caught it?",
    ],
    image: htp_images.htp06,
  },
  {
    num: 5,
    title: "Reveal the twist 🤯",
    bullets: [
      "The true Impostor is revealed — and so is their secret question!",
      "Laugh, scream, or cry — depends on how well you guessed.",
      "Then brace yourself for a new round of chaos.",
    ],
    image: htp_images.htp07,
  },
  // {
  //   num: 7,
  //   title: "Start next round",
  //   bullets: [
  //     "Laugh, scream, or cry — depends on how well you guessed.",

  //     "Then after everything is said and done, prepare for new question, new Impostor, new chaos.",
  //   ],
  //   image: htp_images.htp10,
  // },
];

type StepCardProps = {
  step: Step;
  showPrev?: boolean;
  showNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
};

function StepCard({ step, showPrev, showNext, onPrev, onNext }: StepCardProps) {
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
        {/* бейдж */}
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

        {/* Prev / Next – показваме според активния индекс от родителя */}
        {showPrev ? (
          <View className="absolute left-4">
            <TouchableOpacity
              onPress={onPrev}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CustomText className="underline">Prev</CustomText>
            </TouchableOpacity>
          </View>
        ) : null}

        {showNext ? (
          <View className="absolute right-4">
            <TouchableOpacity
              onPress={onNext}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CustomText className="underline">Next</CustomText>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* карта */}
        <View
          className="bg-white rounded-2xl p-8 mt-8 w-full overflow-hidden"
          style={{ justifyContent: "space-between" }}
        >
          <Image
            source={step.image}
            resizeMode="contain"
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
    }
  ).current;

  const goTo = (i: number) => {
    flatRef.current?.scrollToIndex({ index: i, animated: true });
    setIndex(i);
  };

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg001}
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
          {/* Header */}
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

          {/* Заглавие */}
          <View className="items-center w-full justify-center px-4 mt-[40px]">
            <CustomText
              variant="h3-headline"
              className="text-center w-full"
              shadow
            >
              How to
            </CustomText>
            <CustomText
              variant="h3"
              className="-rotate-3 text-center w-full"
              shadow
            >
              Play
            </CustomText>
          </View>

          {/* Карусел */}
          <View style={{ flex: 1, marginTop: 32 }}>
            <FlatList
              ref={flatRef}
              data={STEPS}
              keyExtractor={(it) => `step-${it.num}`}
              renderItem={({ item }) => (
                <StepCard
                  step={item}
                  showPrev={index > 0}
                  showNext={index < STEPS.length - 1}
                  onPrev={() => goTo(index - 1)}
                  onNext={() => goTo(index + 1)}
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

            {/* Dots */}
            <View className="w-full items-center justify-center mt-6 mb-8 flex-row">
              {STEPS.map((_, i) => {
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
