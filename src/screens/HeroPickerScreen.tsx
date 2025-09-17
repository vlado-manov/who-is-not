// src/screens/HeroPickerScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  ImageBackground,
  Animated,
  Easing,
  Image,
  Pressable,
  Text,
  TouchableOpacity,
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

// ❗ ползвам същия тип, който ти си дал
import { CreateGameStackParamList } from "../navigation/types";
import { useGameStore } from "../store/useGameStore";
import { StackNavigationProp } from "@react-navigation/stack";
import LoadingScreen from "../components/LoadingScreen";
import Fontisto from "@expo/vector-icons/Fontisto";

type HeroNav = StackNavigationProp<CreateGameStackParamList, "HeroPicker">;
type HeroRoute = RouteProp<CreateGameStackParamList, "HeroPicker">;

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

  // ─────────────────────────────────────────────────────────────
  // 1) Вземаме от стора кои герои вече са взети, целта N, и екшъните
  // ─────────────────────────────────────────────────────────────
  const taken = useGameStore((s) => s.takenCharacters);
  const target = useGameStore((s) => s.targetPlayersCount);
  const assignCharacter = useGameStore((s) => s.assignCharacter);

  // ─────────────────────────────────────────────────────────────
  // 2) Списък с налични герои (филтрираме заетите)
  //    -> така вече избран герой изобщо НЕ се появява
  // ─────────────────────────────────────────────────────────────
  const availableHeroes = useMemo(
    () => HEROES.filter((h) => !taken.includes(h.id)),
    [taken]
  );

  // ─────────────────────────────────────────────────────────────
  // 3) Индекс и текущ герой върху филтрирания списък
  // ─────────────────────────────────────────────────────────────
  const [idx, setIdx] = useState(0);

  // ако списъкът се смали или изпразни → връщаме idx в граници
  useEffect(() => {
    if (availableHeroes.length === 0) return;
    if (idx >= availableHeroes.length) setIdx(0);
  }, [availableHeroes.length, idx]);

  const hero = availableHeroes[idx];

  // ─────────────────────────────────────────────────────────────
  // 4) Preload само наличните изображения (за гладък UI)
  // ─────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────
  // 5) Анимации (slide out → switch → slide in) – твоите
  // ─────────────────────────────────────────────────────────────
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const dir = useRef<1 | -1>(1);

  const animateTo = (nextIdx: number, direction: 1 | -1) => {
    if (selected) return; // стрелките са изключени след избор
    if (availableHeroes.length <= 1) return; // няма какво да въртим
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

  // ─────────────────────────────────────────────────────────────
  // 6) Избор → цитат + Skip → авто-напред след 2s
  // ─────────────────────────────────────────────────────────────
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

  // навигация напред според това дали има още играчи
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

  // чистене на таймера при unmount (предпазва от side-effects)
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

    setLockedHero(hero); // 👈 заключи текущия видим герой
    assignCharacter(playerId, hero.id);
    setSelected(true);
    setQuote(randomOf(hero.quotes_selected));
    skipTimerRef.current = setTimeout(goNext, 99999999999999999);
  };

  const onSkip = () => goNext();
  const displayHero = lockedHero ?? hero;

  // ─────────────────────────────────────────────────────────────
  // 7) Guards за празни/зареждащи състояния
  // ─────────────────────────────────────────────────────────────
  if (
    !assetsReady ||
    (availableHeroes.length === 0 && !lockedHero) ||
    !displayHero
  ) {
    return <LoadingScreen />;
  }

  // ─────────────────────────────────────────────────────────────
  // 8) UI
  // ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg001}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        {/* Skip в горния десен ъгъл – само след избор */}
        {selected && (
          <View className="absolute top-20 right-6 z-50">
            <TouchableOpacity onPress={onSkip}>
              <CustomText className="w-full underline">Skip</CustomText>
            </TouchableOpacity>
          </View>
        )}

        <View className="flex-1 items-center w-full justify-between px-4 pt-10 pb-[88px]">
          {/* Заглавие / Цитат */}
          <View className="mt-[80px] justify-center items-center max-w-[80%]">
            {!selected ? (
              <>
                <CustomText variant="h3-headline" className="text-center">
                  Choose your
                </CustomText>
                <CustomText variant="h3" className="text-center" shadow>
                  HERO
                </CustomText>
              </>
            ) : (
              <Animated.View style={{ opacity: quoteOpacity }}>
                <View
                  className="bg-white rounded-[16px] py-4 px-12 min-w-[85%] w-full"
                  style={{
                    shadowColor: "#000",
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 6,
                  }}
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
                    style={{
                      width: 0,
                      height: 0,
                      borderLeftWidth: 12,
                      borderRightWidth: 12,
                      borderTopWidth: 14,
                      borderLeftColor: "transparent",
                      borderRightColor: "transparent",
                      borderTopColor: "#FFFFFF",
                      marginTop: -1,
                    }}
                  />
                </View>
              </Animated.View>
            )}
          </View>

          {/* Карусел */}
          <View className="flex-1 items-center justify-center w-full">
            <Pressable
              className={`absolute left-6 top-1/2 -translate-y-1/2 z-50 ${selected ? "opacity-40" : ""}`}
              onPress={onPrev}
              disabled={selected || availableHeroes.length <= 1}
              hitSlop={16}
            >
              <Entypo name="arrow-with-circle-left" size={48} color="white" />
            </Pressable>

            {/* Платените герои са disabled в MVP */}
            {!displayHero.free && !previewing && (
              <View className="px-12 flex-col absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 text-center justify-center items-center max-w-[75%]">
                <View className="w-[100px] h-[100px]">
                  <Fontisto
                    name="locked"
                    size={88}
                    color="white"
                    className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2"
                  />
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
              style={{ opacity, transform: [{ translateX }] }}
              className="flex-1 items-center justify-center relative"
            >
              <Image
                source={displayHero.main_image}
                resizeMode="contain"
                className={`max-w-[90%] transition-all ${!displayHero.free && !previewing ? "opacity-60" : ""}`}
                blurRadius={displayHero.free || previewing ? 0 : 12}
              />
            </Animated.View>

            <Pressable
              className={`absolute right-6 top-1/2 -translate-y-1/2 ${selected ? "opacity-40" : ""}`}
              onPress={onNext}
              disabled={selected || availableHeroes.length <= 1}
              hitSlop={16}
            >
              <Entypo name="arrow-with-circle-right" size={48} color="white" />
            </Pressable>
          </View>

          {/* Бутон за избор */}
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
