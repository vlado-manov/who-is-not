// src/screens/HeroPickerScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  ImageBackground,
  Animated,
  Easing,
  Image,
  Pressable,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomText from "../components/common/CustomText";
import CustomButton from "../components/common/CustomButton";
import { backgrounds } from "../../assets/backgrounds";
import { useTranslation } from "react-i18next";
import { HEROES } from "../data/heroes";
import { Asset } from "expo-asset";
import Entypo from "@expo/vector-icons/Entypo";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";

import { CreateGameStackParamList } from "../navigation/types";
import { useGameStore } from "../store/useGameStore";
import { StackNavigationProp } from "@react-navigation/stack";
import LoadingScreen from "../components/LoadingScreen";
import Fontisto from "@expo/vector-icons/Fontisto";

type HeroNav = StackNavigationProp<CreateGameStackParamList, "HeroPicker">;
type HeroRoute = RouteProp<CreateGameStackParamList, "HeroPicker">;

const { width: W, height: H } = Dimensions.get("window");
const HERO_STAGE_HEIGHT = Math.min(Math.round(H * 0.58), 520);

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function HeroPickerScreen() {
  const route = useRoute<HeroRoute>();
  const navigation = useNavigation<HeroNav>();
  const { playerId, index } = route.params;
  const { t } = useTranslation();
  const [lockedHero, setLockedHero] = useState<(typeof HEROES)[number] | null>(
    null
  );
  const [previewing, setPreviewing] = useState(false);

  const taken = useGameStore((s) => s.takenCharacters);
  const target = useGameStore((s) => s.targetPlayersCount);
  const assignCharacter = useGameStore((s) => s.assignCharacter);

  const availableHeroes = useMemo(
    () => HEROES.filter((h) => !taken.includes(h.id)),
    [taken]
  );

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (availableHeroes.length === 0) return;
    if (idx >= availableHeroes.length) setIdx(0);
  }, [availableHeroes.length, idx]);

  const hero = availableHeroes[idx];

  const [assetsReady, setAssetsReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (availableHeroes.length > 0) {
          await Asset.loadAsync(
            availableHeroes.map((h) => h.main_image as any)
          );
        }
      } finally {
        mounted && setAssetsReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [availableHeroes]);

  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const dir = useRef<1 | -1>(1);

  const animateTo = (nextIdx: number, direction: 1 | -1) => {
    if (selected) return;
    if (availableHeroes.length <= 1) return;
    dir.current = direction;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: direction * 40,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIdx(nextIdx);
      translateX.setValue(-direction * 40);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const onPrev = () =>
    animateTo((idx - 1 + availableHeroes.length) % availableHeroes.length, -1);

  const onNext = () => animateTo((idx + 1) % availableHeroes.length, 1);

  const [selected, setSelected] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);
  const quoteOpacity = useRef(new Animated.Value(0)).current;
  const skipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (quote) {
      Animated.timing(quoteOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    } else {
      quoteOpacity.setValue(0);
    }
  }, [quote, quoteOpacity]);

  const goNext = () => {
    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }
    if (target && index < target) {
      navigation.navigate("PassDevice", { index: index + 1 });
    } else {
      navigation.navigate("Lobby");
    }
  };

  useEffect(() => {
    return () => {
      if (skipTimerRef.current) {
        clearTimeout(skipTimerRef.current);
        skipTimerRef.current = null;
      }
    };
  }, []);

  const handleSelect = () => {
    if (!hero || !hero.free || selected) return;

    setLockedHero(hero);
    assignCharacter(playerId, hero.id);
    setSelected(true);
    setQuote(randomOf(hero.quotes_selected));
    skipTimerRef.current = setTimeout(goNext, 5000);
  };

  const onSkip = () => goNext();
  const displayHero = lockedHero ?? hero;

  if (
    !assetsReady ||
    (availableHeroes.length === 0 && !lockedHero) ||
    !displayHero
  ) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg001}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        {selected && (
          <View className="absolute top-20 right-6 z-50">
            <TouchableOpacity onPress={onSkip}>
              <CustomText className="w-full underline">
                {t("hero_picker_skip")}
              </CustomText>
            </TouchableOpacity>
          </View>
        )}

        <View className="flex-1 items-center w-full justify-between px-4 pt-10 pb-[88px]">
          <View className="mt-[80px] justify-center items-center max-w-[80%]">
            {!selected ? (
              <>
                <CustomText variant="h3-headline" className="text-center">
                  {t("hero_picker_headline")}
                </CustomText>
                <CustomText variant="h3" className="text-center" shadow>
                  {t("hero_picker_headline_2")}
                </CustomText>
              </>
            ) : (
              <Animated.View style={{ opacity: quoteOpacity }}>
                <View
                  className="bg-white rounded-[16px] py-4 px-12 min-w-[85%] w-full"
                  style={styles.quoteBubbleShadow}
                >
                  <CustomText
                    variant="quote"
                    className="text-center"
                    textColor="text-customBlack-500"
                  >
                    {quote}
                  </CustomText>
                  <View
                    className="absolute -bottom-4 left-1/2 - translate-x-1/2"
                    style={styles.quoteBubbleTail}
                  />
                </View>
              </Animated.View>
            )}
          </View>

          <View style={styles.stage}>
            <Pressable
              style={[styles.arrowLeft, selected && { opacity: 0.4 }]}
              onPress={onPrev}
              disabled={selected || availableHeroes.length <= 1}
              hitSlop={16}
            >
              <Entypo name="arrow-with-circle-left" size={48} color="white" />
            </Pressable>

            {!displayHero.free && !previewing && (
              <View style={styles.lockOverlay}>
                <View
                  style={{ width: 100, height: 100 }}
                  className="justify-center items-center"
                >
                  <Fontisto name="locked" size={88} color="white" />
                </View>
                <CustomText
                  variant="quote"
                  className="text-center bg-white rounded-[16px] py-4 px-12 mt-2"
                  textColor="text-customBlack-500"
                >
                  {displayHero.name}
                </CustomText>
              </View>
            )}

            <Animated.View
              style={[
                styles.heroImageWrap,
                { opacity, transform: [{ translateX }] },
              ]}
              pointerEvents="none"
            >
              <Image
                source={displayHero.main_image}
                resizeMode="contain"
                style={[
                  styles.heroImage,
                  !displayHero.free && !previewing ? { opacity: 0.6 } : null,
                ]}
                blurRadius={displayHero.free || previewing ? 0 : 12}
              />
            </Animated.View>

            <Pressable
              style={[styles.arrowRight, selected && { opacity: 0.4 }]}
              onPress={onNext}
              disabled={selected || availableHeroes.length <= 1}
              hitSlop={16}
            >
              <Entypo name="arrow-with-circle-right" size={48} color="white" />
            </Pressable>
          </View>

          <View className="w-full px-6">
            {!displayHero.free && (
              <TouchableOpacity
                activeOpacity={1}
                onPressIn={() => setPreviewing(true)}
                onPressOut={() => setPreviewing(false)}
              >
                <CustomText
                  variant="h3-headline"
                  className="my-2 underline text-center"
                >
                  Preview
                </CustomText>
              </TouchableOpacity>
            )}
            <CustomButton
              title={
                !displayHero.free ? `Unlock` : displayHero.name.toUpperCase()
              }
              color={displayHero.free ? "bg-primary-500" : "bg-primary-500"}
              fullWidth
              btnSize="sm"
              disabled={selected}
              label={!displayHero.free}
              labelTitle={
                !displayHero.free
                  ? `$${displayHero.price.toFixed(2)}`
                  : undefined
              }
              onPress={handleSelect}
            />
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  stage: {
    position: "relative",
    width: "100%",
    height: HERO_STAGE_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImageWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    top: "50%",
    left: "50%",
    transform: [{ translateX: "-50%" }, { translateY: "-50%" }],
    width: "100%",
    height: "100%",
  },
  arrowLeft: {
    position: "absolute",
    left: 24,
    top: "50%",
    transform: [{ translateY: -24 }],
    zIndex: 50,
  },
  arrowRight: {
    position: "absolute",
    right: 24,
    top: "50%",
    transform: [{ translateY: -24 }],
    zIndex: 50,
  },
  lockOverlay: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  quoteBubbleShadow: {
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  quoteBubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
    marginTop: -1,
  },
});
