// src/components/VoteNowScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
  StyleSheet,
  ImageBackground,
} from "react-native";
import AppImage from "./AppImage";
import FullBleedStack from "./FullBleedStack";
import ImageBackgroundWithLoadGate from "./ImageBackgroundWithLoadGate";
import WarmBubblesOverlay from "./WarmBubblesOverlay";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { backgrounds } from "../../assets/backgrounds";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CustomText from "./common/CustomText";
import CustomButton from "./common/CustomButton";
import { GameStackParamList } from "../navigation/types";
import { useGameStore } from "../store/useGameStore";
import { game_images } from "../../assets/images";
import { usePreventBack } from "../hooks/usePreventBack";
import { GameMode } from "../api/analytics";
import { getOnlinePlayerIndex } from "../utils/onlinePlayerIndex";
import { getVoteMarkImageUrlForLang } from "../api/publicImages";
import {
  getHorizontalPadding,
  getLogoBox,
  getVoteMarkBox,
  getVoteNowDecoration,
} from "../utils/responsive";
import { reportMultiplayerDiagnostic } from "../utils/multiplayerDiagnostics";
import AudioManager from "../utils/audioManager";

const VOTE_NOW_IMAGE_URLS = [
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/536c3912-ecb7-485e-a434-6702f142fdc9-voteNow1.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/2976fe36-14fd-4af7-ad91-4c564127e758-voteNow2.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/b555d650-3b61-4bb8-8b95-3a5908af8c09-voteNow3.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/9ac5f955-b106-4456-b882-256ae7f2da6e-voteNow4.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/44a2c8db-e7d3-4842-9149-3f76646c8145-voteNow6.webp",
];

type R = RouteProp<GameStackParamList, "VoteNow">;
type Nav = StackNavigationProp<GameStackParamList, "VoteNow">;

const VoteNowScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { voterIndex } = useRoute<R>().params;
  usePreventBack();
  const continuedRef = useRef(false);
  const players = useGameStore((s) => s.players);
  const mode = useGameStore((s) => s.mode) as GameMode;
  const onlinePlayerId = useGameStore((s) => s.onlinePlayerId);

  const currentVoter = players[voterIndex];
  const randomVoteNowImage = useMemo(
    () =>
      VOTE_NOW_IMAGE_URLS[
        Math.floor(Math.random() * VOTE_NOW_IMAGE_URLS.length)
      ],
    [],
  );

  const voteMarkUri = getVoteMarkImageUrlForLang(i18n.language);
  const animatedVoteMarkScale = useRef(new Animated.Value(25)).current;
  const animatedVoteMarkTranslateY = useRef(new Animated.Value(-800)).current;
  const animatedVoteMarkRotate = useRef(new Animated.Value(0)).current;
  const animatedVoteMarkOpacity = useRef(new Animated.Value(1)).current;
  const staticVoteMarkOpacity = useRef(new Animated.Value(0)).current;
  const screenShake = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth >= 768 && windowWidth > windowHeight;
  const pad = getHorizontalPadding(windowWidth);
  const logoBox = getLogoBox(windowWidth, pad);
  const { voteMark, deco } = useMemo(() => {
    const baseVoteMark = getVoteMarkBox(windowWidth);
    const baseDeco = getVoteNowDecoration(logoBox.width);
    const maxH = Math.min(
      baseVoteMark.height,
      Math.max(96, windowHeight * 0.32),
    );
    const scale = maxH / baseVoteMark.height;
    return {
      voteMark: {
        width: baseVoteMark.width * scale,
        height: baseVoteMark.height * scale,
      },
      deco: {
        width: baseDeco.width * scale,
        height: baseDeco.height * scale,
        top: baseDeco.top * scale,
        left: baseDeco.left * scale,
      },
    };
  }, [windowWidth, windowHeight, logoBox.width]);

  /** Include space above the mark box so negative-offset decoration counts toward vertical centering. */
  const markStackOuterHeight = voteMark.height + Math.max(0, -deco.top);
  const decoLeftCentered = Math.max(0, (voteMark.width - deco.width) / 2);
  const [stageHeight, setStageHeight] = useState(0);

  /** Prefer measured stage; until onLayout, window height avoids bad % fallbacks that pushed title near the footer. */
  const effectiveStageHeight = stageHeight > 0 ? stageHeight : windowHeight;
  const markTopPx = (effectiveStageHeight - markStackOuterHeight) / 2 - 120;

  const onStartVoting = () => {
    if (continuedRef.current) return;
    if (!currentVoter) return;
    if (mode === "ONLINE" && !onlinePlayerId) {
      reportMultiplayerDiagnostic("vote_now_missing_online_player_id", {
        playersCount: players.length,
      });
      return;
    }
    continuedRef.current = true;
    const resolvedVoterIndex =
      mode === "ONLINE" ? getOnlinePlayerIndex(players, onlinePlayerId) : voterIndex;
    navigation.navigate("Vote", { voterIndex: resolvedVoterIndex });
  };

  useEffect(() => {
    void AudioManager.playBackgroundGame();
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(animatedVoteMarkTranslateY, {
          toValue: 0,
          speed: 14,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.timing(animatedVoteMarkScale, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(animatedVoteMarkRotate, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(animatedVoteMarkOpacity, {
          toValue: 0,
          duration: 130,
          useNativeDriver: true,
        }),
        Animated.timing(staticVoteMarkOpacity, {
          toValue: 1,
          duration: 130,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(screenShake, {
          toValue: 1,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(screenShake, {
          toValue: -1,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(screenShake, {
          toValue: 1,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(screenShake, {
          toValue: 0,
          duration: 60,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <FullBleedStack
      rootStyle={{ flex: 1, backgroundColor: "#0a0a0a" }}
      backdrop={
        <ImageBackgroundWithLoadGate
          source={isTablet ? backgrounds.bg023t : backgrounds.bg023}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          <WarmBubblesOverlay variant="intense" />
        </ImageBackgroundWithLoadGate>
      }
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "transparent" }}
        edges={["right", "left"]}
      >
        <View
          style={styles.stage}
          pointerEvents="box-none"
          onLayout={(e) => setStageHeight(e.nativeEvent.layout.height)}
        >
          <Animated.View
            style={[
              styles.markLayer,
              {
                left: pad,
                right: pad,
                top: markTopPx,
                zIndex: 10,
                transform: [
                  {
                    translateX: screenShake.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-8, 8],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable style={[styles.markPressable, { zIndex: 2 }]}>
              <View
                style={{
                  width: voteMark.width,
                  height: markStackOuterHeight,
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: voteMark.width,
                    height: voteMark.height,
                    position: "relative",
                  }}
                >
                  <Animated.View
                    style={{
                      width: voteMark.width,
                      height: voteMark.height,
                      zIndex: 5,
                      position: "absolute",
                      left: 0,
                      top: 0,
                      opacity: animatedVoteMarkOpacity,
                      transform: [
                        { translateY: animatedVoteMarkTranslateY },
                        { scale: animatedVoteMarkScale },
                        {
                          rotate: animatedVoteMarkRotate.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["-900deg", "0deg"],
                          }),
                        },
                      ],
                    }}
                  >
                    <AppImage
                      source={{ uri: voteMarkUri }}
                      style={{ width: voteMark.width, height: voteMark.height }}
                      contentFit="contain"
                    />
                  </Animated.View>

                  <Animated.View
                    style={{
                      width: voteMark.width,
                      height: voteMark.height,
                      zIndex: 6,
                      opacity: staticVoteMarkOpacity,
                    }}
                  >
                    <AppImage
                      source={{ uri: voteMarkUri }}
                      style={{ width: voteMark.width, height: voteMark.height }}
                      contentFit="contain"
                    />
                  </Animated.View>

                  <AppImage
                    source={{ uri: randomVoteNowImage }}
                    style={{
                      width: deco.width,
                      height: deco.height,
                      position: "absolute",
                      top: deco.top,
                      left: decoLeftCentered,
                      zIndex: 1,
                    }}
                    contentFit="contain"
                  />
                  <AppImage
                    source={game_images.logoMusicOn}
                    style={{
                      width: logoBox.width,
                      height: logoBox.height,
                      opacity: 0,
                      position: "absolute",
                    }}
                    contentFit="contain"
                  />
                </View>
              </View>
            </Pressable>

            {mode !== "ONLINE" && currentVoter ? (
              <View style={[styles.nameplateShadow, { marginTop: deco.top + 24, zIndex: 1 }]} pointerEvents="none">
                <ImageBackground
                  source={backgrounds.bg005}
                  resizeMode="stretch"
                  imageStyle={{ borderRadius: 18 }}
                  style={styles.namePlate}
                >
                  <View style={styles.nameCardIconRow}>
                    <MaterialCommunityIcons name="account-group" size={26} color="#c45e1a" />
                    <CustomText
                      variant="p-small"
                      textColor="#7c3a10"
                      style={{ fontFamily: "Onest-SemiBold", textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      {t("hand_phone_to")}
                    </CustomText>
                  </View>
                  <CustomText
                    variant="h2"
                    className="text-center px-2"
                    textColor="#3b1a08"
                    style={{ fontFamily: "SofiaSansExtraCondensed-Bold" }}
                  >
                    {currentVoter.name}
                  </CustomText>
                  <CustomText
                    variant="p-small"
                    className="text-center"
                    textColor="#a05020"
                    style={{ fontFamily: "Onest-SemiBold", marginTop: 2 }}
                  >
                    {voterIndex === 0 ? t("vote_now_first_label") : t("vote_now_turn_label")}
                  </CustomText>
                </ImageBackground>
              </View>
            ) : null}

          </Animated.View>

          <View
            style={[
              styles.footer,
              {
                left: pad,
                right: pad,
                paddingBottom: insets.bottom + 16,
              },
            ]}
          >
            <CustomButton
              title={t("its_me")}
              backgroundImage={backgrounds.bg026}
              glow
              glowColor="rgba(41,255,25,0.8)"
              shadowColor="#005f07"
              horizontalPadding={Math.min(48, pad + 20)}
              fullWidth
              onPress={onStartVoting}
            />
            {mode !== "ONLINE" ? (
              <View style={styles.warnHintRow}>
                <View style={styles.warnIconGlow}>
                  <MaterialCommunityIcons name="alert" size={20} color="#fbbf24" />
                </View>
                <CustomText
                  variant="footnote"
                  textColor="rgba(255,255,255,0.88)"
                  style={{ fontFamily: "Onest-SemiBold" }}
                >
                  {t("vote_now_only_tap")}
                </CustomText>
              </View>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </FullBleedStack>
  );
};

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    position: "relative",
  },
  markLayer: {
    position: "absolute",
    alignItems: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
  },
  markPressable: {
    alignItems: "center",
    justifyContent: "center",
  },
  nameplateShadow: {
    alignSelf: "stretch",
    shadowColor: "#fff",
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 14,
  },
  namePlate: {
    borderRadius: 18,
    paddingTop: 64,
    paddingBottom: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#ffd800",
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(251,192,32,1)",
  },
  nameCardIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  warnHintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  warnIconGlow: {
    shadowColor: "#fbbf24",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
});

export default VoteNowScreen;
