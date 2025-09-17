// src/screens/WelcomeScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, ImageBackground, Animated, ImageStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/RootNavigator";
import CustomText from "../components/common/CustomText";
import CustomButton from "../components/common/CustomButton";
import LanguageSelector from "../components/LanguageSelector";
import { backgrounds } from "../../assets/backgrounds";
import { character_avatars } from "../../assets/characters";
import { StackNavigationProp } from "@react-navigation/stack";

type Nav = StackNavigationProp<RootStackParamList, "Welcome">;

type Bubble = {
  opacity: Animated.Value;
  tx: Animated.Value;
  ty: Animated.Value;
  scale: Animated.Value;
  fromX: number;
  fromY: number;
};

const HOLD_MS = 700;
const ENTER_STAGGER = 700;
const EXIT_STAGGER = 700;

export default function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  // --- Welcome UI fade-in ---
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const [welcomeVisible, setWelcomeVisible] = useState(false);

  // --- Bubbles (overview) ---
  // Начални офсети (откъде „влизат“)
  const bubbles = useMemo(() => {
    const mk = (fromX: number, fromY: number): Bubble => ({
      opacity: new Animated.Value(0),
      tx: new Animated.Value(fromX),
      ty: new Animated.Value(fromY),
      scale: new Animated.Value(0.8),
      fromX,
      fromY,
    });
    return {
      susie: mk(-60, -50), // влизане отляво-отгоре
      pete: mk(-70, 80), // влизане отляво-отдолу
      booena: mk(80, 70), // влизане отдясно-отдолу
      simpalot: mk(70, -60), // влизане отдясно-отгоре
    };
  }, []);

  const enter = (b: Bubble) =>
    Animated.parallel([
      Animated.timing(b.opacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.spring(b.tx, {
        toValue: 0,
        useNativeDriver: true,
        speed: 12,
        bounciness: 6,
      }),
      Animated.spring(b.ty, {
        toValue: 0,
        useNativeDriver: true,
        speed: 12,
        bounciness: 6,
      }),
      Animated.spring(b.scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 6,
      }),
    ]);

  const exit = (b: Bubble) =>
    Animated.parallel([
      Animated.timing(b.opacity, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(b.tx, {
        toValue: b.fromX,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(b.ty, {
        toValue: b.fromY,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(b.scale, {
        toValue: 0.8,
        duration: 260,
        useNativeDriver: true,
      }),
    ]);

  useEffect(() => {
    // timeline: enter (stagger) -> hold -> exit (stagger) -> welcome UI fade-in
    const seq = Animated.stagger(ENTER_STAGGER, [
      enter(bubbles.susie),
      enter(bubbles.pete),
      enter(bubbles.booena),
      enter(bubbles.simpalot),
    ]);

    seq.start(() => {
      const hold = setTimeout(() => {
        Animated.stagger(EXIT_STAGGER, [
          exit(bubbles.susie),
          exit(bubbles.pete),
          exit(bubbles.booena),
          exit(bubbles.simpalot),
        ]).start(() => {
          // показваме welcome UI
          setWelcomeVisible(true);
          Animated.stagger(140, [
            Animated.timing(btnOpacity, {
              toValue: 1,
              duration: 450,
              useNativeDriver: true,
            }),
            Animated.timing(bottomOpacity, {
              toValue: 1,
              duration: 450,
              useNativeDriver: true,
            }),
          ]).start();
        });
      }, HOLD_MS);

      return () => clearTimeout(hold);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Помощен компонент за балон
  const BubbleImage = ({
    source,
    style,
    b,
  }: {
    source: any;
    style: ImageStyle;
    b: Bubble;
  }) => (
    <Animated.Image
      source={source}
      style={[
        style,
        {
          transform: [
            { translateX: b.tx },
            { translateY: b.ty },
            { scale: b.scale },
          ],
          opacity: b.opacity,
        },
      ]}
      resizeMode="contain"
    />
  );

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg001}
        style={{ flex: 1, width: "100%", height: "100%" }}
        resizeMode="cover"
      >
        {/* Заглавията остават видими през всички фази */}
        <View className="flex-1 items-center w-full justify-center px-4">
          <CustomText variant="h2-headline" className="text-center" shadow>
            {t("title_00")}
          </CustomText>
          <CustomText variant="h2" className="-rotate-3 text-center" shadow>
            {t("title_01")}
          </CustomText>

          {/* Start бутон – само когато сме във Welcome фазата */}
          {welcomeVisible ? (
            <Animated.View style={{ opacity: btnOpacity }} className="mt-8">
              <CustomButton
                title={t("start_btn")}
                color="bg-primary-500"
                onPress={() => navigation.navigate("Menu")}
              />
            </Animated.View>
          ) : (
            // Запазваме място, за да няма „подскачане“ на layout
            <View style={{ height: 80 }} />
          )}
        </View>

        {/* Language selector – долу; появява се след балоните */}
        {welcomeVisible && (
          <Animated.View
            style={{ opacity: bottomOpacity }}
            className="w-full p-8 items-center justify-center absolute bottom-0"
          >
            <CustomText className="my-2">{t("language_pick_btn")}</CustomText>
            <LanguageSelector />
          </Animated.View>
        )}

        {/* OVERVIEW BUBBLES (видими само преди welcome фазата) */}
        {!welcomeVisible && (
          <>
            <BubbleImage
              source={character_avatars.susie}
              b={bubbles.susie}
              style={{
                position: "absolute",
                bottom: "10%",
                right: "10%",
                width: 146,
                height: 140,
              }}
            />
            <BubbleImage
              source={character_avatars.pete}
              b={bubbles.pete}
              style={{
                position: "absolute",
                top: "5%",
                left: "12%",
                width: 148,
                height: 152,
              }}
            />
            <BubbleImage
              source={character_avatars.booena}
              b={bubbles.booena}
              style={{
                position: "absolute",
                bottom: "23%",
                left: "15%",

                width: 150,
                height: 150,
              }}
            />
            <BubbleImage
              source={character_avatars.simpalot}
              b={bubbles.simpalot}
              style={{
                position: "absolute",
                top: "15%",
                left: "50%",
                transform: "translateX(-50%)",
                width: 165,
                height: 200,
              }}
            />
          </>
        )}
      </ImageBackground>
    </SafeAreaView>
  );
}
