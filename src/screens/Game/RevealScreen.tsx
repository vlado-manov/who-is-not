// src/screens/Game/RevealScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Image,
  ImageBackground,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";

import { Player, useGameStore } from "../../store/useGameStore";
import { GameStackParamList } from "../../navigation/types";
import CustomText from "../../components/common/CustomText";
import CustomButton from "../../components/common/CustomButton";

import { backgrounds } from "../../../assets/backgrounds";
import { QUESTIONS } from "../../data/questions";
import { game_images } from "../../../assets/images";
import QuestionPlate from "../../components/game/QuestionPlate";
import { useAuthStore } from "../../store/useUserStore";
import { useHeroesStore } from "../../store/useHeroesStore";
import { useTrackRoundEndedMutation } from "../../api/hooks/useAnalyticsMutations";

type Nav = StackNavigationProp<GameStackParamList, "Reveal">;

const RevealScreen = () => {
  const navigation = useNavigation<Nav>();
  const scaleAnim = useRef(new Animated.Value(15)).current;
  // const marginTopAnim = useRef(new Animated.Value(0)).current;
  const topTitleOpacity = useRef(new Animated.Value(0)).current;
  const [characterLoaded, setCharacterLoaded] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  const [hideAnimatedTitle, setHideAnimatedTitle] = useState(false);
  const plateTranslateY = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(80)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const hasRevealedCTA = useRef(false);

  const players = useGameStore((s) => s.players);
  const heroes = useHeroesStore((s) => s.heroes);
  const gameId = useGameStore((s) => s.gameId);
  const mode = useGameStore((s) => s.mode);
  const currentRoundId = useGameStore((s) => s.currentRoundId);
  const votes = useGameStore((s) => s.votes);
  const oddOneId = useGameStore((s) => s.oddOneId);
  const currentOddQuestionId = useGameStore((s) => s.currentOddQuestionId);
  const applyRoundScores = useGameStore((s) => s.applyRoundScores);
  const round = useGameStore((s) => s.round);
  const userId = useAuthStore((s) => s.user.id);
  const trackRoundEndedMutation = useTrackRoundEndedMutation();
  useEffect(() => {
    if (!characterLoaded) return;
    if (hasRevealedCTA.current) return;
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      // Animated.timing(marginTopAnim, {
      //   toValue: 40,
      //   duration: 700,
      //   useNativeDriver: false,
      // }),
    ]).start(() => {
      Animated.timing(topTitleOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setHideAnimatedTitle(true);
        setTimeout(() => {
          revealCTA();
        }, 2000);
      });
    });
  }, [characterLoaded]);

  const revealCTA = () => {
    if (hasRevealedCTA.current) return;
    hasRevealedCTA.current = true;
    setShowCTA(true);

    // Бутонът – остава както е (той ти харесва)
    Animated.parallel([
      Animated.timing(buttonTranslateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),

      // QuestionPlate – прост, естествен motion
      Animated.sequence([
        // леко повдигане
        Animated.timing(plateTranslateY, {
          toValue: 0,
          duration: 60,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Animated.timing(plateTranslateY, {
        //   toValue: -64,
        //   duration: 120,
        //   easing: Easing.out(Easing.cubic),
        //   useNativeDriver: true,
        // }),
        // Animated.timing(plateTranslateY, {
        //   toValue: 0, // 🎯 финал
        //   duration: 120,
        //   easing: Easing.out(Easing.cubic),
        //   useNativeDriver: true,
        // }),
        Animated.timing(plateTranslateY, {
          toValue: -48,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        // връщане към финалната позиция
        Animated.timing(plateTranslateY, {
          toValue: -24, // 🎯 финал
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        // микродвижение за живот
        Animated.timing(plateTranslateY, {
          toValue: -32,
          duration: 80,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.timing(plateTranslateY, {
          toValue: -24,
          duration: 80,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  /* -------------------------------------------------------------------------- */
  /* DATA */
  /* -------------------------------------------------------------------------- */

  const imposter = useMemo(
    () => players.find((p) => p.id === oddOneId),
    [players, oddOneId]
  );

  const imposterCharacter = imposter
    ? heroes.find((h) => h.id === imposter.characterId)
    : undefined;

  const imposterQuestion = useMemo(
    () => QUESTIONS.find((q) => q.id === currentOddQuestionId),
    [currentOddQuestionId]
  );

  const { topTargets, maxVotes } = useMemo(() => {
    const tally: Record<string, number> = {};
    Object.values(votes).forEach((targetId) => {
      tally[targetId] = (tally[targetId] || 0) + 1;
    });

    const max = Math.max(0, ...Object.values(tally));
    const top = Object.entries(tally)
      .filter(([, v]) => v === max && max > 0)
      .map(([id]) => players.find((p) => p.id === id))
      .filter(Boolean) as Player[];

    return { topTargets: top, maxVotes: max };
  }, [votes, players]);

  const votedWinner =
    maxVotes > 0 && topTargets.length === 1 ? topTargets[0] : null;

  const impostorLost =
    votedWinner && imposter && votedWinner.id === imposter.id;

  /* -------------------------------------------------------------------------- */
  /* ASSETS */
  /* -------------------------------------------------------------------------- */

  const backgroundImage = impostorLost ? backgrounds.bg030 : backgrounds.bg029;

  const titleImage = impostorLost
    ? game_images.lostRound
    : game_images.wonRound;

  const questionFrameImage = impostorLost
    ? backgrounds.bg016
    : backgrounds.bg005;

  // const characterImage = impostorLost
  //   ? imposterCharacter?.lostImage
  //   : imposterCharacter?.wonImage;

  const characterImageSource = useMemo(() => {
    if (!imposterCharacter) return null;

    const images = impostorLost
      ? imposterCharacter.loseImages
      : imposterCharacter.winImages;

    if (!images || images.length === 0) return null;

    // ако някой ден имаш повече от 1 – ще е готово 🎲
    return images[Math.floor(Math.random() * images.length)];
  }, [imposterCharacter, impostorLost]);

  /* -------------------------------------------------------------------------- */
  /* ACTION */
  /* -------------------------------------------------------------------------- */

  const handleContinue = async () => {
    if (gameId && currentRoundId) {
      try {
        await trackRoundEndedMutation.mutateAsync({
          gameId,
          roundId: currentRoundId,
          mode,
          roundIndex: (round || 0) + 1,
          userId,
        });
      } catch (e) {
        console.warn("track ROUND_ENDED failed", e);
      }
    }

    applyRoundScores();
    navigation.navigate("Standings");
  };

  if (!imposter || !imposterCharacter) return null;

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgroundImage}
        style={styles.bg}
        resizeMode="cover"
      >
        {/* TOP TITLE */}
        {/* <View style={styles.topTitleWrap}>
          <Image
            source={titleImage}
            resizeMode="contain"
            style={styles.topTitleImage}
          />
        </View> */}

        <View
          style={[
            styles.quoteBubble,
            styles.quoteBubbleShadow,
            {
              display: "none",
            },
          ]}
        >
          <CustomText
            variant="quote"
            className="text-center"
            textColor="text-customBlack-500"
          >
            Ugh, brb, gotta see you in a minute, check the tv.
          </CustomText>

          <View style={styles.quoteBubbleTailWrap}>
            <View style={styles.quoteBubbleTail} />
          </View>
        </View>
        <Animated.View
          style={[
            styles.topTitleWrap,
            {
              opacity: topTitleOpacity,
              // display: "none",
            },
          ]}
        >
          <Image
            source={titleImage}
            resizeMode="contain"
            style={styles.topTitleImage}
          />
        </Animated.View>

        {!hideAnimatedTitle && (
          <Animated.View
            style={[
              styles.topTitleWrap2,
              {
                // justifyContent: "center",
                // marginTop: marginTopAnim,
                // display: "none",
              },
            ]}
          >
            <Animated.Image
              source={titleImage}
              resizeMode="contain"
              style={[
                styles.topTitleImage2,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            />
          </Animated.View>
        )}

        {/* <View style={styles.topTitleWrap2}>
          <Image
            source={titleImage}
            resizeMode="contain"
            style={styles.topTitleImage2}
          />
        </View> */}

        {/* CHARACTER IMAGE */}
        <View style={styles.characterWrap}>
          {characterImageSource && (
            <Image
              source={characterImageSource}
              resizeMode="contain"
              style={styles.characterImage}
              onLoadEnd={() => setCharacterLoaded(true)}
            />
          )}
        </View>

        {/* QUESTION FRAME */}
        <View style={styles.questionWrap}>
          {/* <Image
            source={questionFrameImage}
            resizeMode="contain"
            style={styles.questionFrame}
          />

          <View style={styles.questionTextOverlay}>
            <CustomText
              variant="h5-headline"
              className="text-center px-8"
              textColor="#313131"
            >
              {imposterQuestion?.text}
            </CustomText>
          </View> */}
          <View style={{ paddingHorizontal: 40, width: "100%" }}>
            <Animated.View
              style={{
                transform: [{ translateY: plateTranslateY }],
              }}
            >
              <QuestionPlate
                title={`This is what ${imposter.name} was answering 👀`}
                text={imposterQuestion?.text ?? ""}
                background={questionFrameImage}
                mode={impostorLost ? "dark" : "light"}
              />
            </Animated.View>

            {showCTA && (
              <Animated.View
                style={{
                  opacity: buttonOpacity,
                  transform: [{ translateY: buttonTranslateY }],
                  width: "100%",
                }}
              >
                <CustomButton
                  title="Continue"
                  fullWidth
                  backgroundImage={
                    impostorLost ? backgrounds.bg003 : backgrounds.bg026
                  }
                  shadowColor={impostorLost ? "#771717" : "#005f07"}
                  onPress={handleContinue}
                />
              </Animated.View>
            )}
          </View>
        </View>

        {/* CTA */}
        {/* <View style={styles.ctaWrap}>
          <CustomButton title="Continue" fullWidth onPress={handleContinue} />
        </View> */}
      </ImageBackground>
    </SafeAreaView>
  );
};

export default RevealScreen;

/* -------------------------------------------------------------------------- */
/* STYLES */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    justifyContent: "space-between",
  },

  topTitleWrap: {
    marginTop: 40,
    alignItems: "center",
    zIndex: 1,
  },
  topTitleImage: {
    width: "100%",
    height: 240,
  },
  topTitleWrap2: {
    position: "absolute",
    top: "0%",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    zIndex: 1,
  },
  topTitleImage2: {
    marginTop: 40,
    width: "100%",
    height: 240,
    // transform: [{ scale: 1 }],
  },

  characterWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: "0%",
    left: "0%",
    width: "100%",
    height: "100%",
    // transform: [{ translateX: -200 }, { translateY: -280 }],
  },
  characterImage: {
    width: "85%",
    height: "85%",
  },

  questionWrap: {
    alignItems: "center",
    marginBottom: 40,
  },
  questionFrame: {
    width: "100%",
    height: 320,
  },
  questionTextOverlay: {
    position: "absolute",
    top: 64,
    left: 32,
    right: 32,
    bottom: 24,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  ctaWrap: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },

  quoteBubble: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 22,
    minWidth: "92%",
    maxWidth: "92%",
    alignSelf: "center",
    marginTop: 80,
    zIndex: 1,
  },
  quoteBubbleShadow: {
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  quoteBubbleTailWrap: {
    position: "absolute",
    bottom: -14,
    left: "50%",
    transform: [{ translateX: -12 }],
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
  },
});
