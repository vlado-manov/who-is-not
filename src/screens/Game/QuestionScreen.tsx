// src/screens/Game/QuestionScreen.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  ImageBackground,
  ScrollView,
  View,
  Pressable,
  Image,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { backgrounds } from "../../../assets/backgrounds";
import CustomText from "../../components/common/CustomText";
import CustomButton from "../../components/common/CustomButton";
import CustomInput from "../../components/common/CustomInput";

import { Player, useGameStore } from "../../store/useGameStore";
import { IQuestion } from "../../types/question";
import { QUESTIONS } from "../../data/questions";
import { GameStackParamList } from "../../navigation/types";
import { LinearGradient } from "expo-linear-gradient";
import AudioManager from "../../utils/audioManager";
import { useHeroesStore } from "../../store/useHeroesStore";

type Nav = StackNavigationProp<GameStackParamList, "Question">;
type R = RouteProp<GameStackParamList, "Question">;

/* -------------------------------------------------------------------------- */
/* Avatar Pick Button (LOCAL, GAME-SPECIFIC) */
/* -------------------------------------------------------------------------- */

type AvatarPickButtonProps = {
  name: string;
  avatar?: any;
  color: string;
  selected?: boolean;
  onPress: () => void;
};

const AvatarPickButton = ({
  name,
  avatar,
  color,
  selected,
  onPress,
}: AvatarPickButtonProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const longPressTimeout = useRef<number | null>(null);
  const isLongPressActive = useRef(false);

  /* -------------------- SCALE (avatar + button) -------------------- */

  const scaleUp = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const scaleDown = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  /* -------------------- ROTATION (avatar ONLY) -------------------- */

  const startSlowRotation = () => {
    isLongPressActive.current = true;
    rotateAnim.setValue(0);

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const releaseSpin = () => {
    if (!isLongPressActive.current) return;

    isLongPressActive.current = false;
    rotateAnim.stopAnimation();

    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 4,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  /* -------------------- PRESS HANDLERS -------------------- */

  const onPressIn = () => {
    scaleUp();

    longPressTimeout.current = setTimeout(() => {
      startSlowRotation();
    }, 1500);
  };

  const onPressOut = () => {
    scaleDown();

    if (longPressTimeout.current !== null) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }

    releaseSpin();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      {/* SCALE WRAPPER (avatar + button) */}
      <Animated.View
        style={{
          alignItems: "center",
          transform: [{ scale: scaleAnim }],
        }}
      >
        {/* ROTATE WRAPPER (avatar ONLY) */}
        <Animated.View style={{ transform: [{ rotate }] }}>
          <View
            style={[
              styles.avatarCircle,
              {
                borderColor: selected ? "#fff" : color,
                shadowColor: color,
                shadowOpacity: selected ? 0.9 : 0.4,
                shadowRadius: selected ? 14 : 6,
              },
            ]}
          >
            {avatar && <Image source={avatar} style={styles.avatarImage} />}
          </View>
        </Animated.View>

        {/* BUTTON (NO ROTATION) */}
        <CustomButton
          title={name}
          appearance="tertiary"
          btnSize="xs"
          fontSize="sm"
          backgroundImage={backgrounds.bg018}
          glow
          fullWidth
          onPress={onPress}
          glowColor="rgba(255,204,0,1)"
          shadowColor="#834400"
        />
      </Animated.View>
    </Pressable>
  );
};

/* -------------------------------------------------------------------------- */

const QuestionScreen = () => {
  const navigation = useNavigation<Nav>();
  const { playerIndex } = useRoute<R>().params;

  const round = useGameStore((s) => s.round) || 1;
  const players = useGameStore((s) => s.players);
  const heroes = useHeroesStore((s) => s.heroes);
  const oddOneId = useGameStore((s) => s.oddOneId);
  const baseQuestionId = useGameStore((s) => s.currentBaseQuestionId);
  const oddQuestionId = useGameStore((s) => s.currentOddQuestionId);
  const setAnswer = useGameStore((s) => s.setAnswer);
  const plateScale = useRef(new Animated.Value(40)).current;
  const plateOpacity = useRef(new Animated.Value(0)).current;
  const screenShake = useRef(new Animated.Value(0)).current;

  const currentPlayer = players[playerIndex];

  const [numberAnswer, setNumberAnswer] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const playerRows = useMemo<Player[][]>(() => {
    const rows: Player[][] = [];
    for (let i = 0; i < players.length; i += 2) {
      rows.push(players.slice(i, i + 2));
    }
    return rows;
  }, [players]);

  const question: IQuestion | null = useMemo(() => {
    if (!currentPlayer || !baseQuestionId || !oddQuestionId) return null;

    const isOdd = currentPlayer.id === oddOneId;
    const targetId = isOdd ? oddQuestionId : baseQuestionId;

    return QUESTIONS.find((q) => q.id === targetId) ?? null;
  }, [currentPlayer, baseQuestionId, oddQuestionId, oddOneId]);

  if (!currentPlayer || !question) return null;

  const isNumber = question.type === "number";
  const isPick = question.type === "pick";

  const goToNextStep = () => {
    const isLast = playerIndex >= players.length - 1;

    if (!isLast) {
      navigation.navigate("PassDeviceGameplay", {
        playerIndex: playerIndex + 1,
      });
    } else {
      AudioManager.stopBackground();
      navigation.navigate("Results");
    }
  };

  const handleSubmitNumber = () => {
    if (!numberAnswer.trim()) return;
    setAnswer(currentPlayer.id, numberAnswer.trim());
    goToNextStep();
  };

  const handlePickPlayer = (pickedId: string) => {
    setSelectedPlayerId(pickedId);
    setAnswer(currentPlayer.id, pickedId);
    goToNextStep();
  };
  React.useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(plateScale, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(3)),
          useNativeDriver: true,
        }),
        Animated.timing(plateOpacity, {
          toValue: 1,
          duration: 200,
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
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg023}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: 96,
            paddingBottom: isNumber ? 32 : 96,
            flexGrow: 1,
            justifyContent: "space-between",
          }}
        >
          <Animated.View
            style={{
              transform: [
                {
                  translateX: screenShake.interpolate({
                    inputRange: [-1, 1],
                    outputRange: [-8, 8],
                  }),
                },
              ],
            }}
          >
            <View style={{ paddingHorizontal: 24 }}>
              <Animated.View
                style={[
                  styles.namePlateShadow,
                  {
                    opacity: plateOpacity,
                    transform: [{ scale: plateScale }],
                  },
                ]}
              >
                <ImageBackground
                  source={backgrounds.bg005}
                  resizeMode="stretch"
                  imageStyle={{ borderRadius: 18 }}
                  style={styles.namePlate}
                >
                  {/* <LinearGradient
                  colors={["#FFF7EC", "#F3E1C8"]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFill}
                /> */}

                  {/* CONTENT */}
                  <CustomText
                    variant="p"
                    className="text-center"
                    textColor="#762a05"
                  >
                    ROUND {round}
                  </CustomText>

                  <View style={styles.nameDivider} />

                  <CustomText
                    variant="h6-headline"
                    className="text-center"
                    textColor="#592410"
                  >
                    {question.text}
                  </CustomText>

                  <View style={styles.nameDivider} />

                  <CustomText
                    variant="p-small"
                    className="text-center"
                    textColor="#762a05"
                  >
                    Pick who fits best
                  </CustomText>
                </ImageBackground>
              </Animated.View>
            </View>
            {/* CONTENT */}
            {isPick && (
              <View className="px-6" style={{ marginTop: 64 }}>
                {playerRows.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} style={styles.row}>
                    {row.map((player) => {
                      const characterData = heroes.find(
                        (h) => h.id === player.characterId
                      );

                      return (
                        <View key={player.id} style={styles.cell}>
                          <View>
                            <AvatarPickButton
                              name={player.name}
                              avatar={characterData?.profileImage}
                              color={`#${characterData?.color ?? "ffffff"}`}
                              selected={selectedPlayerId === player.id}
                              onPress={() => handlePickPlayer(player.id)}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}

            {isNumber && (
              <View className="px-6 gap-6">
                <CustomInput
                  value={numberAnswer}
                  onChangeText={setNumberAnswer}
                  keyboardType="numeric"
                  placeholder="Type your magic number"
                />
                <CustomButton title="Next" onPress={handleSubmitNumber} />
              </View>
            )}

            {/* {isPick && (
            <CustomText variant="p" className="text-center px-8 mt-10">
              Pick whoever you think fits this question best
              {"\n"}(you can pick yourself as well)
            </CustomText>
          )} */}
          </Animated.View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default QuestionScreen;

/* -------------------------------------------------------------------------- */
/* STYLES */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    // gap: 32,
    marginBottom: 40,
    width: "100%",
  },

  cell: {
    width: "50%",
    paddingHorizontal: 16, // ≈ 32px gap
    alignItems: "center",
    justifyContent: "center",
  },

  nameDivider: {
    width: "88%",
    height: 1,
    marginVertical: 8,
    backgroundColor: "rgba(89,36,16,0.5)",
  },
  avatarCircle: {
    // width: 104,
    // height: 104,
    // borderRadius: 52,
    // borderWidth: 4,
    // backgroundColor: "#1f1f1f",
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 6 },
  },
  avatarImage: {
    width: 164,
    height: 164,
    marginBottom: -20,
    // borderRadius: 39,
  },
  headerContainer: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
    borderRadius: 20,
    marginVertical: 24,
    marginHorizontal: 24,
    padding: 24,
    position: "relative",
    backgroundColor: "rgba(0,0,0,0.25)",

    // iOS shadow (bottom)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 16,

    // Android
    elevation: 14,
  },

  roundButton: {
    position: "absolute",
    top: -22,
    alignSelf: "center",

    backgroundColor: "#FA3A00",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 32,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 10,
  },

  headerGlowWrapper: {
    position: "relative",
    marginHorizontal: 24,
    marginVertical: 24,
  },

  headerBackGlow: {
    position: "absolute",
    top: -45, // излиза над card-а
    left: -20,
    right: -20,
    height: 120, // височина на светлината

    backgroundColor: "rgba(250, 58, 0, 0.45)", // 🔴 ЧЕРВЕНО

    borderRadius: 80,

    // iOS – истински blur halo
    shadowColor: "#FA3A00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,

    // Android – най-доброто възможно
    elevation: 24,
  },
  namePlateShadow: {
    shadowColor: "#fff",
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 14,
    zIndex: 999,
  },
  namePlate: {
    borderRadius: 18,
    paddingHorizontal: 32,
    paddingVertical: 24,
    alignItems: "center",
    shadowColor: "#ffd800",
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(251,192,32,1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(160,110,60,0.7)",
  },
  questionText: {},
  questionSubText: {},
});
