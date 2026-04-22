import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ImageBackground,
  StyleSheet,
  View,
  Dimensions,
  ImageSourcePropType,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CommonActions,
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";

import { GameMode } from "../../api/analytics";
import { sendMultiplayerRelay } from "../../api/multiplayerRelay";
import { GameStackParamList } from "../../navigation/types";
import { useGameStore } from "../../store/useGameStore";
import { useHeroesStore } from "../../store/useHeroesStore";
import { usePreventBack } from "../../hooks/usePreventBack";
import AppImage from "../../components/AppImage";
import PlayerDeathGrayscaleImage from "../../components/game/PlayerDeathGrayscaleImage";
import CustomButton from "../../components/common/CustomButton";
import { backgrounds } from "../../../assets/backgrounds";
import { game_images } from "../../../assets/images";
import {
  DEATH_X_PART_1_URI,
  DEATH_X_PART_2_URI,
  YOU_DIED_TITLE_URI,
  YOU_DIED_TITLE_URI_ALT,
} from "../../constants/deathScreen";
import { PLAYER_LEFT_GAME_MESSAGE_TYPE } from "../../constants/onlineLobby";

type Nav = StackNavigationProp<GameStackParamList, "PlayerDeath">;
type R = RouteProp<GameStackParamList, "PlayerDeath">;

const HEART_RED_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/eb11ec00-734c-4d5a-b982-69ce7f9d0245-heartRed.webp";
const HEART_BLACK_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/ea21d9fe-366e-41fe-867b-cc57ddd3ad6d-heartBlack.webp";
const { width: SCREEN_W } = Dimensions.get("window");
/** Same motion as RevealScreen title entry (zoom + spin + spring Y). */
const DEATH_TITLE_IMG_H = 280;
const DEATH_TITLE_MARGIN_TOP = 20;
function deathTitleTargetOffsetY(screenH: number) {
  return DEATH_TITLE_MARGIN_TOP + DEATH_TITLE_IMG_H / 2 - screenH / 2;
}

function startAnim(a: Animated.CompositeAnimation) {
  return new Promise<void>((resolve) => a.start(() => resolve()));
}

export default function PlayerDeathScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { variant, deadPlayerId } = route.params;
  const { height: windowHeight } = useWindowDimensions();
  usePreventBack();

  const mode = useGameStore((s) => s.mode) as GameMode;

  const players = useGameStore((s) => s.players);
  const heroes = useHeroesStore((s) => s.heroes);
  const setOnlineSpectating = useGameStore((s) => s.setOnlineSpectating);

  const bgTint = useRef(new Animated.Value(0)).current;
  const burningHeartPulse = useRef(new Animated.Value(0)).current;
  const heartSlotOpacity = useRef(new Animated.Value(1)).current;
  const titleBlockOpacity = useRef(new Animated.Value(0)).current;
  const titleEntryScale = useRef(new Animated.Value(50)).current;
  const titleEntryRotate = useRef(new Animated.Value(0)).current;
  const titleEntryTranslateY = useRef(new Animated.Value(0)).current;
  const titleStaticOpacity = useRef(new Animated.Value(0)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const grayLayer = useRef(new Animated.Value(0)).current;
  const x1 = useRef(new Animated.Value(0)).current;
  const x2 = useRef(new Animated.Value(0)).current;
  const optsOpacity = useRef(new Animated.Value(0)).current;
  const optsY = useRef(new Animated.Value(40)).current;

  const [showBlackHeart, setShowBlackHeart] = useState(false);
  const [showHeartSlot, setShowHeartSlot] = useState(true);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [showFlyingTitle, setShowFlyingTitle] = useState(false);
  const [titleUri, setTitleUri] = useState(YOU_DIED_TITLE_URI);

  const deadPlayer = useMemo(
    () => players.find((p) => p.id === deadPlayerId),
    [players, deadPlayerId],
  );

  const hero = useMemo(
    () =>
      deadPlayer?.characterId
        ? heroes.find((h) => h.id === deadPlayer.characterId)
        : undefined,
    [deadPlayer?.characterId, heroes],
  );

  const loseImage: ImageSourcePropType | null = useMemo(() => {
    if (!hero) return null;
    const byVar = hero.loseImagesByVariant?.NORMAL;
    const pool = byVar && byVar.length > 0 ? byVar : (hero.loseImages ?? []);
    if (pool.length > 0) return pool[0] as ImageSourcePropType;
    return (hero.main_image ?? hero.profileImage) as ImageSourcePropType;
  }, [hero]);

  const heroStageHeight = Math.max(280, Math.round(windowHeight * 0.5));
  const heroImgSize = Math.min(SCREEN_W * 1.25, heroStageHeight * 1.15);
  const crossSize = Math.min(SCREEN_W * 0.55, heroStageHeight * 0.55);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setShowHeartSlot(true);
      setShowBlackHeart(false);
      burningHeartPulse.setValue(0);
      heartSlotOpacity.setValue(1);
      titleBlockOpacity.setValue(0);
      titleEntryScale.setValue(50);
      titleEntryRotate.setValue(0);
      titleEntryTranslateY.setValue(0);
      titleStaticOpacity.setValue(0);
      setShowFlyingTitle(false);
      bgTint.setValue(0);
      heroOpacity.setValue(0);
      grayLayer.setValue(0);
      x1.setValue(0);
      x2.setValue(0);
      optsOpacity.setValue(0);
      optsY.setValue(40);

      await startAnim(
        Animated.sequence([
          Animated.timing(burningHeartPulse, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(burningHeartPulse, {
            toValue: 0,
            duration: 440,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      );
      if (cancelled) return;

      setShowBlackHeart(true);

      await startAnim(
        Animated.parallel([
          Animated.timing(heartSlotOpacity, {
            toValue: 0,
            duration: 760,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(bgTint, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      );
      if (cancelled) return;

      setShowHeartSlot(false);

      titleBlockOpacity.setValue(1);
      setShowFlyingTitle(true);

      await startAnim(
        Animated.parallel([
          Animated.timing(titleEntryScale, {
            toValue: 1,
            duration: 850,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
          }),
          Animated.timing(titleEntryRotate, {
            toValue: 1,
            duration: 850,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(titleEntryTranslateY, {
            toValue: deathTitleTargetOffsetY(windowHeight),
            speed: 14,
            bounciness: 8,
            useNativeDriver: true,
          }),
        ]),
      );
      if (cancelled) return;

      setShowFlyingTitle(false);
      titleStaticOpacity.setValue(1);

      heroOpacity.setValue(1);
      await startAnim(
        Animated.parallel([
          Animated.timing(grayLayer, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(420),
            Animated.timing(x1, {
              toValue: 1,
              duration: 380,
              easing: Easing.out(Easing.back(1.15)),
              useNativeDriver: true,
            }),
            Animated.delay(80),
            Animated.timing(x2, {
              toValue: 1,
              duration: 380,
              easing: Easing.out(Easing.back(1.15)),
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
      if (cancelled) return;

      if (variant === "gameOver") {
        return;
      }

      await startAnim(
        Animated.parallel([
          Animated.timing(optsOpacity, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(optsY, {
            toValue: 0,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      );
      if (cancelled) return;
      setShowActionButtons(true);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [
    bgTint,
    burningHeartPulse,
    grayLayer,
    heartSlotOpacity,
    heroOpacity,
    titleBlockOpacity,
    titleEntryRotate,
    titleEntryScale,
    titleEntryTranslateY,
    optsOpacity,
    optsY,
    titleStaticOpacity,
    variant,
    windowHeight,
    x1,
    x2,
  ]);

  const heartScale = burningHeartPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.45],
  });

  const handleSpectate = () => {
    setOnlineSpectating(true);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Round" }],
      }),
    );
  };

  const handleQuit = () => {
    if (mode === "ONLINE") {
      sendMultiplayerRelay({ type: PLAYER_LEFT_GAME_MESSAGE_TYPE });
    }
    setOnlineSpectating(false);
    useGameStore.getState().reset();
    const parent = navigation.getParent();
    parent?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Onboarding", params: { screen: "Menu" } }],
      }),
    );
  };

  const showContinueOptions = variant === "continue" && showActionButtons;

  return (
    <SafeAreaView style={styles.safe} edges={["right", "left"]}>
      <View style={styles.root}>
        <ImageBackground
          source={backgrounds.bg023}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "#000",
              opacity: bgTint,
            },
          ]}
        />

        {showHeartSlot && (
          <Animated.View
            style={[styles.heartAbsolute, { opacity: heartSlotOpacity }]}
            pointerEvents="none"
            collapsable={false}
          >
            <View style={styles.heartPlate}>
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                {!showBlackHeart ? (
                  <AppImage
                    source={{ uri: HEART_RED_URI }}
                    style={styles.heart}
                    contentFit="contain"
                  />
                ) : (
                  <AppImage
                    source={{ uri: HEART_BLACK_URI }}
                    style={styles.heart}
                    contentFit="contain"
                  />
                )}
              </Animated.View>
            </View>
          </Animated.View>
        )}

        {showFlyingTitle && (
          <Animated.View
            style={[styles.titleFlyingWrap, { opacity: titleBlockOpacity }]}
            pointerEvents="none"
          >
            <Animated.View
              style={{
                transform: [
                  { translateY: titleEntryTranslateY },
                  { scale: titleEntryScale },
                  {
                    rotate: titleEntryRotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["-900deg", "0deg"],
                    }),
                  },
                ],
              }}
            >
              <AppImage
                source={{ uri: titleUri }}
                style={styles.youDiedTitleImg}
                contentFit="contain"
                onError={() => setTitleUri(YOU_DIED_TITLE_URI_ALT)}
              />
            </Animated.View>
          </Animated.View>
        )}

        <Animated.View
          style={[styles.titleSlot, { opacity: titleBlockOpacity }]}
        >
          <Animated.View
            style={[styles.titleInner, { opacity: titleStaticOpacity }]}
          >
            <AppImage
              source={{ uri: titleUri }}
              style={styles.youDiedTitleImg}
              contentFit="contain"
              accessibilityLabel={t("player_death_title")}
              onError={() => setTitleUri(YOU_DIED_TITLE_URI_ALT)}
            />
          </Animated.View>
        </Animated.View>

        {loseImage && (
          <Animated.View
            style={[
              styles.heroWrap,
              { height: heroStageHeight, opacity: heroOpacity },
            ]}
          >
            <View
              style={{ width: heroImgSize, height: heroImgSize }}
              collapsable={false}
            >
              <AppImage
                source={loseImage}
                style={StyleSheet.absoluteFillObject}
                contentFit="contain"
              />
              <Animated.View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, { opacity: grayLayer }]}
              >
                <PlayerDeathGrayscaleImage
                  source={loseImage}
                  size={heroImgSize}
                />
              </Animated.View>
            </View>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.crossAbs,
                {
                  opacity: x1,
                  transform: [
                    {
                      scale: x1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.88, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <AppImage
                source={{ uri: DEATH_X_PART_1_URI }}
                style={{ width: crossSize, height: crossSize }}
                contentFit="contain"
              />
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.crossAbs,
                {
                  opacity: x2,
                  transform: [
                    {
                      scale: x2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.88, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <AppImage
                source={{ uri: DEATH_X_PART_2_URI }}
                style={{ width: crossSize, height: crossSize }}
                contentFit="contain"
              />
            </Animated.View>
          </Animated.View>
        )}

        {showContinueOptions && (
          <Animated.View
            style={[
              styles.opts,
              {
                opacity: optsOpacity,
                transform: [{ translateY: optsY }],
              },
            ]}
          >
            <View style={styles.optBtnWrap}>
              <CustomButton
                title={t("player_death_spectate")}
                onPress={handleSpectate}
                backgroundImage={backgrounds.bg026}
                fullWidth
                btnSize="sm"
                fontSizePx={14}
                horizontalPadding={10}
                shadowColor="#005f07"
                icon={game_images.spectateGameIcon}
                iconWidth={88}
                iconHeight={64}
                iconSize={88}
                iconOverlayPreset="play"
                iconRotation="-8deg"
                iconLeft={-24}
              />
            </View>
            <View style={styles.optBtnWrap}>
              <CustomButton
                title={t("player_death_quit_lobby")}
                onPress={handleQuit}
                btnSize="sm"
                backgroundImage={backgrounds.bg015}
                glow
                horizontalPadding={14}
                icon={game_images.leaveGameIcon}
                iconWidth={88}
                iconHeight={64}
                iconSize={88}
                iconTop={0}
                iconOverlayPreset="store"
                iconRotation="0deg"
                glowColor="rgba(80,13,13,0.75)"
                shadowColor="#540d0d"
              />
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  root: { flex: 1, backgroundColor: "#000" },
  heartAbsolute: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  /** 70% of previous 0.8 × screen width */
  heart: {
    width: SCREEN_W * 0.4,
    height: SCREEN_W * 0.4,
  },
  heartPlate: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  titleFlyingWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  titleSlot: {
    position: "relative",
    alignItems: "center",
    minHeight: 200,
    marginTop: 20,
  },
  titleInner: {
    width: "100%",
    alignItems: "center",
  },
  youDiedTitleImg: {
    width: SCREEN_W,
    height: 280,
    alignSelf: "center",
  },
  heroWrap: {
    marginTop: 8,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  crossAbs: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  opts: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingHorizontal: 24,
    gap: 16,
    marginTop: 40,
    width: "100%",
    maxWidth: "100%",
  },
  optBtnWrap: {
    flex: 1,
    minWidth: 0,
  },
});
