// src/components/RoundScreen.tsx
import React, { useRef, useState } from "react";
import {
  View,
  ImageBackground,
  Image,
  FlatList,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ViewToken,
  FlatListProps,
  ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import CustomText from "./common/CustomText";
import CustomButton from "./common/CustomButton";
import { backgrounds } from "../../assets/backgrounds";
import { htp_images } from "../../assets/images";
import {
  CreateGameStackParamList,
  RootStackParamList,
} from "../navigation/types";
import { useGameStore } from "../store/useGameStore";
import AudioManager from "../utils/audioManager";

type CreateNav = StackNavigationProp<CreateGameStackParamList, "Round">;
type RootNav = StackNavigationProp<RootStackParamList>;
type Nav = CompositeNavigationProp<CreateNav, RootNav>;

const { width: W } = Dimensions.get("window");

type Step = {
  num: number;
  title: string;
  bullets: string[];
  image: ImageSourcePropType;
};

const TUTORIAL_STEPS: Step[] = [
  {
    num: 1,
    title: "Pass It Around",
    bullets: [
      "Each player takes the phone, reads their question, types their answer, then hands it off.",
      "Keep your poker face.",
      "And if you peek — you're the real villain here.",
    ],
    image: htp_images.htp09,
  },
  {
    num: 2,
    title: "There is a twist",
    bullets: [
      "Most of you got the same question, but one of you got a different one.",
      "You think you’re answering the same thing... then the question is revealed.",
      "That’s when the odd one realizes 'Oh, no, it's me!'",
    ],
    image: htp_images.htp08,
  },
  {
    num: 3,
    title: "Accuse loudly",
    bullets: [
      "You’ve got time to call each other out - point at people, overanalyze, yell 'YOU!' dramatically, the whole deal.",
      "When the timer ends, vote for the impostor.",
      "Trust no one. Or make them all trust you!",
    ],
    image: htp_images.htp05,
  },
];

function TutorialOverlay({
  visible,
  onSkipAll,
  onDoneAll,
}: {
  visible: boolean;
  onSkipAll: () => void;
  onDoneAll: () => void;
}) {
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList<Step>>(null);

  AudioManager.playBackgroundGame();

  const getItemLayout = (_: any, i: number) => ({
    length: W,
    offset: W * i,
    index: i,
  });

  const viewabilityConfig = { itemVisiblePercentThreshold: 70 };

  const onViewableItemsChanged = useRef<
    FlatListProps<Step>["onViewableItemsChanged"]
  >(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken<Step>[];
      changed: ViewToken<Step>[];
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
          <CustomText variant="h3-headline" className="underline">
            Skip
          </CustomText>
        </TouchableOpacity>
      </View>

      <View style={{ width: W, paddingTop: 24 }}>
        <FlatList
          ref={ref}
          data={TUTORIAL_STEPS}
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
                    {item.num}
                  </CustomText>
                </View>

                <View
                  className="bg-white rounded-2xl p-8 mt-8 w-full overflow-hidden"
                  style={{ justifyContent: "space-between" }}
                >
                  <Image
                    source={item.image}
                    resizeMode="contain"
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
          {TUTORIAL_STEPS.map((_, i) => {
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
            title={index === TUTORIAL_STEPS.length - 1 ? "Got it" : "Next"}
            onPress={() =>
              index < TUTORIAL_STEPS.length - 1 ? goTo(index + 1) : onDoneAll()
            }
          />
        </View>
      </View>
    </View>
  );
}

const RoundScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  const round = useGameStore((s) => s.round) || 1;
  const players = useGameStore((s) => s.players);
  const firstPlayerName = players?.[0]?.name;
  const initRoundQuestions = useGameStore((s) => s.initRoundQuestions);

  const [showTutorial, setShowTutorial] = useState(true);

  const onContinue = () => {
    if (!players.length) return;
    initRoundQuestions();
    navigation.navigate("Game", {
      screen: "PassDeviceGameplay",
      params: { playerIndex: 0 },
    } as never);
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-700" edges={["right", "left"]}>
      <TutorialOverlay
        visible={showTutorial}
        onSkipAll={() => setShowTutorial(false)}
        onDoneAll={() => setShowTutorial(false)}
      />
      <ImageBackground
        source={backgrounds.bg009}
        className="flex-1 relative"
        resizeMode="cover"
      >
        <View className="flex-1 justify-center relative">
          <View>
            <CustomText variant="h2" className="text-center mb-2" shadow>
              Round
            </CustomText>
            <CustomText className="text-center" variant="h0" shadow>
              {round}
            </CustomText>
          </View>
          <View className="mb-16 px-16 absolute bottom-0 left-0 right-0">
            <CustomText className="text-center my-2">
              <CustomText className="underline">{firstPlayerName}</CustomText>,
              Click START once the phone is in your hands.
            </CustomText>
            <CustomButton
              title={t("start_btn", { defaultValue: "Start" })}
              color="bg-primary-500"
              fullWidth
              onPress={onContinue}
            />
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default RoundScreen;
