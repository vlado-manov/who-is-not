import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ImageBackground,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { backgrounds } from "../../../assets/backgrounds";
import CustomButton from "../../components/common/CustomButton";
import FullBleedStack from "../../components/FullBleedStack";
import ImageBackgroundWithLoadGate from "../../components/ImageBackgroundWithLoadGate";

type R = RouteProp<OnboardingStackParamList, "DevFontPreview">;
type Nav = StackNavigationProp<OnboardingStackParamList, "DevFontPreview">;

const SAMPLE_ROUND = "Round 3 of 5";
const SAMPLE_QUESTION = "Who is NOT a morning person?";
const SAMPLE_HINT = "Pick whoever you think fits this question best";

const SAMPLE_PLAYERS = [
  { name: "Silent Vanessa", color: "#be5456" },
  { name: "Dad GPT",        color: "#c87a30" },
  { name: "Brochain",       color: "#29ff19" },
  { name: "Virala",         color: "#7b2ff7" },
];

export default function DevFontPreviewScreen() {
  const navigation = useNavigation<Nav>();
  const { fontFamily, label } = useRoute<R>().params;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth >= 768 && windowWidth > windowHeight;
  const numCols = isTablet ? 3 : 2;

  const scale = Math.min(1, windowWidth / 390);
  const roundFontSize    = Math.round(16 * scale);
  const questionFontSize = Math.round(28 * scale);
  const hintFontSize     = Math.round(12 * scale);

  const playerRows: (typeof SAMPLE_PLAYERS)[] = [];
  for (let i = 0; i < SAMPLE_PLAYERS.length; i += numCols) {
    playerRows.push(SAMPLE_PLAYERS.slice(i, i + numCols));
  }

  return (
    <FullBleedStack
      rootStyle={styles.root}
      backdrop={
        <ImageBackgroundWithLoadGate
          source={backgrounds.bg023}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      }
    >
      <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>

        {/* ── TOP BAR ──────────────────────────────────────── */}
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={[styles.backText, { fontFamily }]}>← Back</Text>
          </Pressable>
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { fontFamily }]} numberOfLines={1}>
              {label}
            </Text>
          </View>
        </View>

        {/* ── SCROLLABLE CONTENT ───────────────────────────── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* QUESTION CARD — mirrors QuestionScreen namePlate */}
          <View
            style={[
              styles.cardPad,
              isTablet && { maxWidth: 560, alignSelf: "center", width: "100%" },
            ]}
          >
            <View style={styles.namePlateShadow}>
              <ImageBackground
                source={backgrounds.bg005}
                resizeMode="stretch"
                imageStyle={{ borderRadius: 18 }}
                style={styles.namePlate}
              >
                <Text style={[styles.roundText, { fontFamily, fontSize: roundFontSize }]}>
                  {SAMPLE_ROUND}
                </Text>

                <View style={styles.nameDivider} />

                <Text
                  style={[styles.questionText, { fontFamily, fontSize: questionFontSize }]}
                  numberOfLines={4}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  {SAMPLE_QUESTION}
                </Text>

                <View style={styles.nameDivider} />

                <Text style={[styles.hintText, { fontFamily, fontSize: hintFontSize }]}>
                  {SAMPLE_HINT}
                </Text>
              </ImageBackground>
            </View>
          </View>

          {/* PLAYER GRID — mirrors AvatarPickButton layout */}
          <View
            style={[
              styles.gridPad,
              isTablet && { maxWidth: 560, alignSelf: "center", width: "100%" },
            ]}
          >
            {playerRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((player) => (
                  <View
                    key={player.name}
                    style={[styles.cell, isTablet && styles.cellTablet]}
                  >
                    {/* Placeholder avatar */}
                    <View style={[styles.avatarCircle, { backgroundColor: player.color + "33", borderColor: player.color }]}>
                      <Text style={[styles.avatarInitial, { fontFamily, color: player.color }]}>
                        {player.name.charAt(0)}
                      </Text>
                    </View>

                    {/* Name button — same -mt-4 overlap as real screen */}
                    <CustomButton
                      title={player.name}
                      btnSize="xs"
                      fontSize="sm"
                      glow
                      fullWidth
                      buttonClassName="-mt-4"
                      titleFontFamily={fontFamily}
                      glowColor="rgba(255,204,0,0.8)"
                      shadowColor="#834400"
                      gradientColors={["#7a4800", "#c8860a", "#f5d060", "#c8860a", "#7a4800"]}
                      gradientStart={{ x: 0, y: 0.5 }}
                      gradientEnd={{ x: 1, y: 0.5 }}
                    />
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </FullBleedStack>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  safe: { flex: 1, backgroundColor: "transparent" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  backBtn: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  backText: {
    color: "#fff",
    fontSize: 14,
  },
  badge: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  badgeText: {
    color: "#ffd700",
    fontSize: 14,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 48,
    gap: 48,
  },

  cardPad: { paddingHorizontal: 24 },

  namePlateShadow: {
    shadowColor: "#fff",
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 14,
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
  roundText: {
    color: "#762a05",
    textAlign: "center",
    textTransform: "uppercase",
  },
  nameDivider: {
    width: "88%",
    height: 1,
    marginVertical: 8,
    backgroundColor: "rgba(89,36,16,0.5)",
  },
  questionText: {
    color: "#592410",
    textAlign: "center",
    textTransform: "uppercase",
  },
  hintText: {
    color: "#762a05",
    textAlign: "center",
  },

  gridPad: { paddingHorizontal: 24 },
  row: {
    flexDirection: "row",
    marginBottom: 40,
    width: "100%",
  },
  cell: {
    width: "50%",
    paddingHorizontal: 8,
    alignItems: "center",
  },
  cellTablet: { width: "33.33%" },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: -12,
  },
  avatarInitial: {
    fontSize: 48,
    textTransform: "uppercase",
  },
});
