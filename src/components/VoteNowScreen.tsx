// src/components/VoteNowScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
  StyleSheet,
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
  const markTopPx = (effectiveStageHeight - markStackOuterHeight) / 2;

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
            <Pressable style={styles.markPressable}>
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

            {mode !== "ONLINE" ? (
              <CustomText
                variant="h4-headline"
                className="px-2 text-center"
                style={styles.titleUnderMark}
              >
                {currentVoter
                  ? voterIndex === 0
                    ? t("first_player_name", { name: currentVoter.name })
                    : t("vote_now_player_turn", { name: currentVoter.name })
                  : t("first_player_up")}
              </CustomText>
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
            {mode !== "ONLINE" ? (
              <CustomText
                variant="footnote"
                className="px-2 text-center"
                style={styles.hintAboveButton}
              >
                {currentVoter
                  ? voterIndex === 0
                    ? t("first_voter_click_hint", { name: currentVoter.name })
                    : t("pass_device_vote_instruction", {
                        name: currentVoter.name,
                      })
                  : t("first_player_up")}
              </CustomText>
            ) : null}
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
  titleUnderMark: {
    marginTop: 12,
  },
  footer: {
    position: "absolute",
    bottom: 0,
  },
  hintAboveButton: {
    marginBottom: 8,
  },
  markPressable: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default VoteNowScreen;
