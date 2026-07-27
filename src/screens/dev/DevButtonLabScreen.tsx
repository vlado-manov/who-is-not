import React, { useState, useCallback, useRef } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Pressable,
  Animated,
  Text,
  Platform,
  ImageSourcePropType,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

import FullBleedStack from "../../components/FullBleedStack";
import ImageBackgroundWithLoadGate from "../../components/ImageBackgroundWithLoadGate";
import WarmBubblesOverlay from "../../components/WarmBubblesOverlay";
import AppImage from "../../components/AppImage";
import CustomButton from "../../components/common/CustomButton";
import CustomText from "../../components/common/CustomText";
import { backgrounds } from "../../../assets/backgrounds";
import { game_images } from "../../../assets/images";
import AudioManager from "../../utils/audioManager";

/* ── Background catalog ──────────────────────────────────────────────────── */

const BG_CATALOG: { key: string; label: string; source: any }[] = [
  { key: "bg023",  label: "bg023",  source: backgrounds.bg023  },
  { key: "bg000",  label: "bg000",  source: backgrounds.bg000  },
  { key: "bg003",  label: "bg003",  source: backgrounds.bg003  },
  { key: "bg004",  label: "bg004",  source: backgrounds.bg004  },
  { key: "bg005",  label: "bg005",  source: backgrounds.bg005  },
  { key: "bg006",  label: "bg006",  source: backgrounds.bg006  },
  { key: "bg007",  label: "bg007",  source: backgrounds.bg007  },
  { key: "bg015",  label: "bg015",  source: backgrounds.bg015  },
  { key: "bg016",  label: "bg016",  source: backgrounds.bg016  },
  { key: "bg018",  label: "bg018",  source: backgrounds.bg018  },
  { key: "bg019",  label: "bg019",  source: backgrounds.bg019  },
  { key: "bg022",  label: "bg022",  source: backgrounds.bg022  },
  { key: "bg024",  label: "bg024",  source: backgrounds.bg024  },
  { key: "bg025",  label: "bg025",  source: backgrounds.bg025  },
  { key: "bg026",  label: "bg026",  source: backgrounds.bg026  },
  { key: "bg027",  label: "bg027",  source: backgrounds.bg027  },
  { key: "bg028",  label: "bg028",  source: backgrounds.bg028  },
  { key: "bg029",  label: "bg029",  source: backgrounds.bg029  },
  { key: "bg030",  label: "bg030",  source: backgrounds.bg030  },
];

const IW = 72;
const IH = 56;
const GAP = 15;
const PAD = 24;

/* ── Section label ───────────────────────────────────────────────────────── */

function SectionLabel({ text }: { text: string }) {
  return (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionLine} />
      <CustomText variant="p-small" textColor="rgba(255,247,236,0.5)" style={styles.sectionText}>
        {text}
      </CustomText>
      <View style={styles.sectionLine} />
    </View>
  );
}

/* ── ExpButton — custom lab button with full shadow / border control ─────── */

interface ExpButtonProps {
  title: string;
  note?: string;
  onPress?: () => void;
  // background: photo image (takes priority) or gradient
  bgImage?: ImageSourcePropType;
  // semi-transparent color overlay on top of bgImage (for tinting / vignette)
  overlayColors?: string[];
  overlayStart?: { x: number; y: number };
  overlayEnd?: { x: number; y: number };
  // gradient (used when no bgImage)
  gradientColors?: string[];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
  // shape
  height?: number;
  borderRadius?: number;
  // border
  borderColor?: string;
  borderWidth?: number;
  // outer drop shadow
  dropColor?: string;
  dropY?: number;
  dropX?: number;
  dropRadius?: number;
  dropOpacity?: number;
  // outer glow (second shadow layer via sibling View)
  glowColor?: string;
  glowRadius?: number;
  // gloss
  showGloss?: boolean;
  glossOpacity?: number;
  // text
  textColor?: string;
}

function ExpButton({
  title,
  note,
  onPress,
  bgImage,
  overlayColors,
  overlayStart = { x: 0, y: 0 },
  overlayEnd = { x: 1, y: 1 },
  gradientColors = ["#111", "#222"],
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 1, y: 1 },
  height = 70,
  borderRadius = 20,
  borderColor,
  borderWidth = 0,
  dropColor = "#000",
  dropY = 6,
  dropX = 0,
  dropRadius = 10,
  dropOpacity = 0.75,
  glowColor,
  glowRadius = 14,
  showGloss = true,
  glossOpacity = 0.14,
  textColor = "#fff",
}: ExpButtonProps) {
  const pressAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const onPressIn = () => {
    Animated.parallel([
      Animated.timing(pressAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start();
  };
  const onPressOut = () => {
    Animated.parallel([
      Animated.timing(pressAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const translateY = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 5] });
  const scale = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] });
  const overlayOpacity = overlayAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] });

  const dropShadow =
    Platform.OS === "ios"
      ? {
          shadowColor: dropColor,
          shadowOffset: { width: dropX, height: dropY },
          shadowOpacity: dropOpacity,
          shadowRadius: dropRadius,
        }
      : { elevation: 10 };

  const glowShadow =
    glowColor && Platform.OS === "ios"
      ? {
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: glowRadius,
        }
      : {};

  return (
    <View style={[glowShadow, { width: "100%" }]}>
      {/* glow backplate */}
      {glowColor && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            inset: -3,
            borderRadius: borderRadius + 3,
            backgroundColor: glowColor,
            opacity: 0.35,
            zIndex: -1,
          }}
        />
      )}

      <View style={[dropShadow, { borderRadius }]}>
        <Pressable
          onPress={() => { AudioManager.playButtonClick(); onPress?.(); }}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={{ width: "100%" }}
        >
          <Animated.View
            style={{
              transform: [{ translateY }, { scale }],
              borderRadius,
              overflow: "hidden",
              height,
            }}
          >
            {/* Background: photo image or gradient */}
            {bgImage ? (
              <AppImage
                source={bgImage}
                contentFit="cover"
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <LinearGradient
                colors={gradientColors as any}
                start={gradientStart}
                end={gradientEnd}
                style={StyleSheet.absoluteFill}
              />
            )}

            {/* Optional color overlay on top of photo (tint / vignette) */}
            {bgImage && overlayColors && (
              <LinearGradient
                colors={overlayColors as any}
                start={overlayStart}
                end={overlayEnd}
                style={StyleSheet.absoluteFill}
              />
            )}

            {/* Gloss highlight */}
            {showGloss && (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: 3,
                  left: 4,
                  right: 4,
                  height: "40%",
                  borderRadius: borderRadius - 2,
                  backgroundColor: `rgba(255,255,255,${glossOpacity})`,
                }}
              />
            )}

            {/* Border overlay (on top of gradient, inside clip) */}
            {borderWidth > 0 && borderColor && (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius,
                  borderWidth,
                  borderColor,
                }}
              />
            )}

            {/* Content */}
            <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                style={{
                  color: textColor,
                  fontSize: 18,
                  fontFamily: "SeymourOne-Regular",
                  textTransform: "uppercase",
                  textShadowColor: "rgba(0,0,0,0.5)",
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 5,
                }}
              >
                {title}
              </Text>
              {note ? (
                <Text
                  style={{
                    color: textColor,
                    fontSize: 10,
                    marginTop: 3,
                    opacity: 0.55,
                    fontFamily: "OpenSans-Regular",
                    letterSpacing: 0.3,
                  }}
                >
                  {note}
                </Text>
              ) : null}
            </View>

            {/* Press darkening overlay */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "#000",
                opacity: overlayOpacity,
              }}
            />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

/* ── Screen ──────────────────────────────────────────────────────────────── */

export default function DevButtonLabScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [bgIndex, setBgIndex] = useState(0);
  const nextBg = useCallback(() => setBgIndex((i) => (i + 1) % BG_CATALOG.length), []);
  const activeBg = BG_CATALOG[bgIndex];

  return (
    <FullBleedStack
      rootStyle={{ flex: 1, backgroundColor: "#0a0a0a" }}
      backdrop={
        <ImageBackgroundWithLoadGate
          source={activeBg.source}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          <WarmBubblesOverlay variant="normal" />
        </ImageBackgroundWithLoadGate>
      }
    >
      <SafeAreaView style={{ flex: 1 }} edges={["right", "left"]}>
        {/* Active BG chip */}
        <View style={[styles.bgChip, { top: insets.top + 10 }]}>
          <CustomText variant="p-small" textColor="rgba(255,247,236,0.9)">
            {activeBg.label}
          </CustomText>
          <CustomText variant="p-xsmall" textColor="rgba(255,247,236,0.45)">
            {bgIndex + 1} / {BG_CATALOG.length}  ·  tap any button to cycle bg
          </CustomText>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 48,
            paddingHorizontal: PAD,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* ← Back */}
          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="← BACK"
              appearance="danger"
              variant="pill"
              btnSize="xs"
              fontSize="xs"
              onPress={() => navigation.goBack()}
              fullWidth
            />
          </View>

          {/* ═══ GRADIENT APPEARANCES ═══════════════════════════════════════ */}
          <SectionLabel text="GRADIENT APPEARANCES" />

          <View style={{ marginBottom: GAP }}>
            <CustomButton title="PRIMARY" appearance="primary" btnSize="md" fontSize="md" fullWidth onPress={nextBg} />
          </View>
          <View style={{ marginBottom: GAP }}>
            <CustomButton title="SECONDARY" appearance="secondary" btnSize="md" fontSize="md" fullWidth onPress={nextBg} />
          </View>
          <View style={{ marginBottom: GAP }}>
            <CustomButton title="TERTIARY" appearance="tertiary" btnSize="md" fontSize="md" fullWidth onPress={nextBg} />
          </View>
          <View style={{ marginBottom: GAP }}>
            <CustomButton title="DANGER" appearance="danger" btnSize="md" fontSize="md" fullWidth onPress={nextBg} />
          </View>

          {/* ═══ PHOTO BACKGROUNDS ══════════════════════════════════════════ */}
          <SectionLabel text="PHOTO BACKGROUNDS" />

          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="PLAY NOW"
              backgroundImage={backgrounds.bg026}
              glow glowColor="rgba(41,255,25,0.8)" shadowColor="#005f07"
              btnSize="md" fontSize="md" fullWidth onPress={nextBg}
            />
          </View>
          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="STORE"
              appearance="secondary" btnSize="sm" fontSize="sm"
              backgroundImage={backgrounds.bg022} shadowColor="#410047"
              label="Ad-free 😎"
              icon={game_images.storeIcon} iconWidth={IW} iconHeight={IH} iconSize={IW}
              iconOverlayPreset="store" iconRotation="4deg" iconLeft={-28} iconTop={3}
              fullWidth onPress={nextBg}
            />
          </View>
          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="HOW TO PLAY"
              appearance="tertiary" btnSize="sm" fontSize="sm"
              backgroundImage={backgrounds.bg015} shadowColor="#540d0d"
              icon={game_images.rulebookIcon} iconWidth={IW} iconHeight={IH} iconSize={IW}
              iconOverlayPreset="rulebook" iconRotation="-11deg" iconRight={-32}
              fullWidth onPress={nextBg}
            />
          </View>
          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="PLAYER NAME"
              appearance="tertiary" btnSize="xs" fontSize="sm"
              backgroundImage={backgrounds.bg018}
              glow glowColor="rgba(255,204,0,1)" shadowColor="#834400"
              fullWidth onPress={nextBg}
            />
          </View>

          {/* ═══ SIZES ══════════════════════════════════════════════════════ */}
          <SectionLabel text="SIZES  ·  lg / sm / xs  (md shown above)" />

          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="SIZE LG  (h96)"
              backgroundImage={backgrounds.bg026}
              glow glowColor="rgba(41,255,25,0.8)" shadowColor="#005f07"
              btnSize="lg" fontSize="lg" fullWidth onPress={nextBg}
            />
          </View>
          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="SIZE SM  (h64)"
              backgroundImage={backgrounds.bg026}
              glow glowColor="rgba(41,255,25,0.8)" shadowColor="#005f07"
              btnSize="sm" fontSize="sm" fullWidth onPress={nextBg}
            />
          </View>
          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="SIZE XS  (h56)"
              backgroundImage={backgrounds.bg026}
              glow glowColor="rgba(41,255,25,0.8)" shadowColor="#005f07"
              btnSize="xs" fontSize="xs" fullWidth onPress={nextBg}
            />
          </View>

          {/* ═══ PILL VARIANT ═══════════════════════════════════════════════ */}
          <SectionLabel text="PILL VARIANT" />

          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="PILL · PRIMARY CTA"
              variant="pill" backgroundImage={backgrounds.bg026}
              glow glowColor="rgba(41,255,25,0.8)" shadowColor="#005f07"
              btnSize="md" fontSize="md" fullWidth onPress={nextBg}
            />
          </View>
          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="PILL · SECONDARY"
              variant="pill" appearance="secondary"
              btnSize="sm" fontSize="sm" fullWidth onPress={nextBg}
            />
          </View>
          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="PILL · DANGER"
              variant="pill" appearance="danger"
              btnSize="sm" fontSize="sm" fullWidth onPress={nextBg}
            />
          </View>

          {/* ═══ GLOW COLORS ════════════════════════════════════════════════ */}
          <SectionLabel text="GLOW COLORS" />

          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="GLOW GREEN"
              backgroundImage={backgrounds.bg026}
              glow glowColor="rgba(41,255,25,0.8)" shadowColor="#005f07"
              btnSize="sm" fontSize="sm" fullWidth onPress={nextBg}
            />
          </View>
          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="GLOW GOLD"
              backgroundImage={backgrounds.bg018}
              glow glowColor="rgba(255,204,0,1)" shadowColor="#834400"
              btnSize="sm" fontSize="sm" fullWidth onPress={nextBg}
            />
          </View>
          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="GLOW RED"
              appearance="danger"
              glow glowColor="rgba(255,70,70,0.9)" shadowColor="#8b0000"
              btnSize="sm" fontSize="sm" fullWidth onPress={nextBg}
            />
          </View>
          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="GLOW PURPLE"
              appearance="secondary"
              glow glowColor="rgba(204,78,237,0.85)" shadowColor="#410047"
              btnSize="sm" fontSize="sm" fullWidth onPress={nextBg}
            />
          </View>

          {/* ═══ ICON STYLES ════════════════════════════════════════════════ */}
          <SectionLabel text="ICON STYLES" />

          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="OVERLAY LEFT"
              appearance="secondary" backgroundImage={backgrounds.bg022} shadowColor="#410047"
              icon={game_images.partyModeIcon} iconWidth={IW} iconHeight={IH} iconSize={IW}
              iconOverlayPreset="party" iconRotation="-8deg"
              btnSize="sm" fontSize="sm" fullWidth onPress={nextBg}
            />
          </View>
          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="OVERLAY RIGHT"
              appearance="tertiary" backgroundImage={backgrounds.bg015} shadowColor="#540d0d"
              icon={game_images.htpIcon} iconWidth={IW} iconHeight={IH} iconSize={IW}
              iconOverlayPreset="rulebook" iconRotation="8deg" iconRight={-32}
              btnSize="sm" fontSize="sm" fullWidth onPress={nextBg}
            />
          </View>
          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="INLINE ICON"
              backgroundImage={backgrounds.bg026}
              glow glowColor="rgba(41,255,25,0.8)" shadowColor="#005f07"
              icon={game_images.passDevice} iconWidth={52} iconHeight={52} iconPosition="inline"
              btnSize="md" fontSize="md" fullWidth onPress={nextBg}
            />
          </View>
          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="JOIN GAME"
              appearance="secondary" backgroundImage={backgrounds.bg022} shadowColor="#410047"
              icon={game_images.joinGameIcon} iconWidth={44} iconHeight={44} iconPosition="inline"
              btnSize="sm" fontSize="sm" fullWidth onPress={nextBg}
            />
          </View>

          {/* ═══ BADGE / LABEL ══════════════════════════════════════════════ */}
          <SectionLabel text="BADGE / LABEL" />

          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="PARTY MODE"
              appearance="secondary" backgroundImage={backgrounds.bg022} shadowColor="#410047"
              label="NEW" labelSide="right"
              btnSize="sm" fontSize="sm" fullWidth onPress={nextBg}
            />
          </View>
          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="BONUS ROUND!"
              appearance="secondary" backgroundImage={backgrounds.bg022} shadowColor="#410047"
              glow glowColor="rgba(255,204,0,0.9)"
              label="×2 XP" labelSide="left"
              btnSize="sm" fontSize="sm" fullWidth onPress={nextBg}
            />
          </View>

          {/* ═══ STATES ═════════════════════════════════════════════════════ */}
          <SectionLabel text="STATES" />

          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="DISABLED"
              backgroundImage={backgrounds.bg026}
              glow glowColor="rgba(41,255,25,0.8)" shadowColor="#005f07"
              btnSize="md" fontSize="md" disabled fullWidth onPress={nextBg}
            />
          </View>
          <View style={{ marginBottom: GAP }}>
            <CustomButton
              title="SOLID COLOR"
              solidColor="#1a1a2e"
              btnSize="sm" fontSize="sm" fullWidth onPress={nextBg}
            />
          </View>

          {/* ═══════════════════════════════════════════════════════════════
              EXPERIMENTAL DESIGNS
              Custom shadows · borders · gradient combos · glow layers
          ═══════════════════════════════════════════════════════════════ */}
          <SectionLabel text="EXPERIMENTAL DESIGNS" />

          {/* 1 — Neon Ghost: dark center, colored neon border, outer glow */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="NEON GHOST"
              note="2px neon border · strong outer glow · no gloss"
              onPress={nextBg}
              gradientColors={["#0c1a0c", "#111f11"]}
              borderColor="rgba(41,255,25,0.85)"
              borderWidth={2}
              glowColor="rgba(41,255,25,0.9)"
              glowRadius={18}
              dropColor="#001200"
              dropY={4}
              dropRadius={6}
              dropOpacity={0.9}
              showGloss={false}
            />
          </View>

          {/* 2 — Gold Foil: horizontal shimmer, warm deep shadow, thin border */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="GOLD FOIL"
              note="3-stop shimmer gradient · gold border · warm shadow"
              onPress={nextBg}
              gradientColors={["#4a2d00", "#e8c84a", "#4a2d00"]}
              gradientStart={{ x: 0, y: 0.5 }}
              gradientEnd={{ x: 1, y: 0.5 }}
              borderColor="rgba(201,168,76,0.9)"
              borderWidth={1}
              dropColor="#2a1500"
              dropY={10}
              dropRadius={14}
              dropOpacity={0.95}
              glowColor="rgba(232,200,74,0.45)"
              glowRadius={10}
              glossOpacity={0.2}
            />
          </View>

          {/* 3 — Glassmorphism: white/translucent, thin white border, soft shadow */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="GLASSMORPHISM"
              note="white/20% gradient · 1px white border · light drop shadow"
              onPress={nextBg}
              gradientColors={["rgba(255,255,255,0.22)", "rgba(255,255,255,0.07)"]}
              gradientStart={{ x: 0, y: 0 }}
              gradientEnd={{ x: 0, y: 1 }}
              borderColor="rgba(255,255,255,0.3)"
              borderWidth={1}
              dropColor="#000"
              dropY={6}
              dropRadius={20}
              dropOpacity={0.25}
              glossOpacity={0.18}
            />
          </View>

          {/* 4 — Deep Void: near-black, purple tint, massive deep shadow */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="DEEP VOID"
              note="near-black · 1px purple border · y:14 deep shadow"
              onPress={nextBg}
              gradientColors={["#06060f", "#0e0e1e"]}
              borderColor="rgba(120,60,200,0.35)"
              borderWidth={1}
              dropColor="#000"
              dropY={14}
              dropRadius={24}
              dropOpacity={0.98}
              glowColor="rgba(100,50,180,0.4)"
              glowRadius={12}
              glossOpacity={0.06}
            />
          </View>

          {/* 5 — Crimson Blade: dark red, pill, sharp shadow, red border */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="CRIMSON BLADE"
              note="dark crimson pill · 1px red border · tight drop"
              onPress={nextBg}
              gradientColors={["#3d0000", "#7a0000"]}
              borderColor="rgba(255,80,80,0.55)"
              borderWidth={1}
              borderRadius={999}
              dropColor="#200000"
              dropY={6}
              dropRadius={8}
              dropOpacity={0.95}
              glowColor="rgba(200,30,30,0.4)"
              glowRadius={10}
            />
          </View>

          {/* 6 — Arctic Ice: blue diagonal, cyan border, blue glow */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="ARCTIC ICE"
              note="3-stop blue diagonal · 1px cyan border · blue glow"
              onPress={nextBg}
              gradientColors={["#0a2d4a", "#1565c0", "#42a5f5"]}
              gradientStart={{ x: 0, y: 1 }}
              gradientEnd={{ x: 1, y: 0 }}
              borderColor="rgba(100,210,255,0.65)"
              borderWidth={1}
              dropColor="#001524"
              dropY={8}
              dropRadius={16}
              dropOpacity={0.85}
              glowColor="rgba(30,144,255,0.55)"
              glowRadius={14}
            />
          </View>

          {/* 7 — Obsidian: near-black gray, barely-there border, tight shadow only */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="OBSIDIAN"
              note="iOS dark gray · 1px white/8% border · no glow — pure depth"
              onPress={nextBg}
              gradientColors={["#1c1c1e", "#2c2c2e"]}
              borderColor="rgba(255,255,255,0.08)"
              borderWidth={1}
              dropColor="#000"
              dropY={8}
              dropRadius={12}
              dropOpacity={0.98}
              glossOpacity={0.07}
            />
          </View>

          {/* 8 — Aurora: 3-stop rainbow pill, purple glow */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="AURORA BURST"
              note="3-stop rainbow pill · no border · purple glow"
              onPress={nextBg}
              gradientColors={["#00c9ff", "#7b2ff7", "#ff6ec7"]}
              gradientStart={{ x: 0, y: 0.5 }}
              gradientEnd={{ x: 1, y: 0.5 }}
              borderRadius={999}
              dropColor="#3d0080"
              dropY={6}
              dropRadius={10}
              dropOpacity={0.8}
              glowColor="rgba(123,47,247,0.6)"
              glowRadius={16}
            />
          </View>

          {/* 9 — Copper: warm metallic, copper border, warm shadow */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="COPPER ALLOY"
              note="3-stop copper · 1px border · warm drop shadow"
              onPress={nextBg}
              gradientColors={["#2a1200", "#c97a3a", "#8b5e3c"]}
              gradientStart={{ x: 0, y: 0 }}
              gradientEnd={{ x: 1, y: 1 }}
              borderColor="rgba(184,115,51,0.8)"
              borderWidth={1}
              dropColor="#1a0800"
              dropY={8}
              dropRadius={12}
              dropOpacity={0.9}
              glowColor="rgba(200,120,60,0.35)"
              glowRadius={8}
            />
          </View>

          {/* 10 — Inferno: fire gradient, intense orange outer glow, no border */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="INFERNO"
              note="fire 3-stop gradient · no border · glowRadius:22 intense"
              onPress={nextBg}
              gradientColors={["#ff4e00", "#ff8c00", "#ffd700"]}
              gradientStart={{ x: 0, y: 1 }}
              gradientEnd={{ x: 1, y: 0 }}
              dropColor="#6b1900"
              dropY={8}
              dropRadius={8}
              dropOpacity={0.9}
              glowColor="rgba(255,100,0,0.85)"
              glowRadius={22}
              glossOpacity={0.22}
            />
          </View>

          {/* 11 — Electric Blue: very dark, 2px electric cyan neon border */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="ELECTRIC BLUE"
              note="dark center · 2px cyan neon border · cyan glow"
              onPress={nextBg}
              gradientColors={["#001122", "#002244"]}
              borderColor="rgba(0,220,255,0.85)"
              borderWidth={2}
              dropColor="#000"
              dropY={4}
              dropRadius={8}
              dropOpacity={0.8}
              glowColor="rgba(0,220,255,0.75)"
              glowRadius={16}
              showGloss={false}
            />
          </View>

          {/* 12 — Sunset: warm horizontal fade, pink glow, no border */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="SUNSET FADE"
              note="pink → coral → gold horizontal · no border · pink glow"
              onPress={nextBg}
              gradientColors={["#ff6b9d", "#ff8e53", "#ffd93d"]}
              gradientStart={{ x: 0, y: 0.5 }}
              gradientEnd={{ x: 1, y: 0.5 }}
              dropColor="#7a1a2a"
              dropY={7}
              dropRadius={12}
              dropOpacity={0.8}
              glowColor="rgba(255,107,157,0.5)"
              glowRadius={12}
            />
          </View>

          {/* 13 — Deep Emerald: forest green, green border + glow */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="DEEP EMERALD"
              note="forest green diagonal · 1px emerald border · green glow"
              onPress={nextBg}
              gradientColors={["#003320", "#006640"]}
              gradientStart={{ x: 0, y: 0 }}
              gradientEnd={{ x: 1, y: 1 }}
              borderColor="rgba(0,210,90,0.6)"
              borderWidth={1}
              dropColor="#001a10"
              dropY={8}
              dropRadius={14}
              dropOpacity={0.9}
              glowColor="rgba(0,200,80,0.5)"
              glowRadius={12}
            />
          </View>

          {/* 14 — Silver Chrome: metallic horizontal shimmer, white border */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="SILVER CHROME"
              note="metallic shimmer · 1px white/50% border · silver glow"
              onPress={nextBg}
              gradientColors={["#4a4a4a", "#d4d4d4", "#5a5a5a"]}
              gradientStart={{ x: 0, y: 0.5 }}
              gradientEnd={{ x: 1, y: 0.5 }}
              borderColor="rgba(255,255,255,0.5)"
              borderWidth={1}
              dropColor="#111"
              dropY={8}
              dropRadius={12}
              dropOpacity={0.9}
              glowColor="rgba(200,200,200,0.4)"
              glowRadius={10}
              textColor="#111"
            />
          </View>

          {/* 15 — Ultra Violet: deep purple, violet border + glow, heavy shadow */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="ULTRA VIOLET"
              note="deep purple gradient · 1px violet border · violet glow"
              onPress={nextBg}
              gradientColors={["#1a0040", "#4a0080", "#6600cc"]}
              gradientStart={{ x: 0, y: 0 }}
              gradientEnd={{ x: 1, y: 1 }}
              borderColor="rgba(180,100,255,0.6)"
              borderWidth={1}
              dropColor="#0d0020"
              dropY={10}
              dropRadius={18}
              dropOpacity={0.95}
              glowColor="rgba(150,50,255,0.6)"
              glowRadius={16}
            />
          </View>

          {/* ═══════════════════════════════════════════════════════════════
              PHOTO BACKGROUND EXPERIMENTS
              Each uses a real scene image + border / glow / overlay treatment
          ═══════════════════════════════════════════════════════════════ */}
          <SectionLabel text="PHOTO BG EXPERIMENTS" />

          {/* P1 — bg003 · dark tint + teal neon border, pill */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="BG003 · TEAL NEON"
              note="dark vignette overlay · 2px teal border · pill · teal glow"
              onPress={nextBg}
              bgImage={backgrounds.bg003}
              overlayColors={["rgba(0,0,0,0.55)", "rgba(0,30,30,0.35)"]}
              borderColor="rgba(0,220,200,0.85)"
              borderWidth={2}
              borderRadius={999}
              dropColor="#000"
              dropY={6}
              dropRadius={12}
              dropOpacity={0.8}
              glowColor="rgba(0,220,200,0.7)"
              glowRadius={16}
              showGloss={false}
            />
          </View>

          {/* P2 — bg004 · warm amber overlay + gold border, deep shadow */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="BG004 · GOLDEN HOUR"
              note="warm amber overlay · 1px gold border · deep y:12 shadow"
              onPress={nextBg}
              bgImage={backgrounds.bg004}
              overlayColors={["rgba(80,40,0,0.45)", "rgba(180,100,0,0.2)"]}
              overlayStart={{ x: 0, y: 1 }}
              overlayEnd={{ x: 1, y: 0 }}
              borderColor="rgba(220,170,50,0.8)"
              borderWidth={1}
              dropColor="#3d2000"
              dropY={12}
              dropRadius={18}
              dropOpacity={0.9}
              glowColor="rgba(220,160,40,0.45)"
              glowRadius={12}
            />
          </View>

          {/* P3 — bg005 · parchment — cream border, no glow, classic */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="BG005 · PARCHMENT"
              note="light warm overlay · 1px cream border · no glow · classic depth"
              onPress={nextBg}
              bgImage={backgrounds.bg005}
              overlayColors={["rgba(30,15,0,0.4)", "rgba(60,30,0,0.15)"]}
              borderColor="rgba(220,195,140,0.7)"
              borderWidth={1}
              dropColor="#1a0d00"
              dropY={8}
              dropRadius={10}
              dropOpacity={0.85}
              glossOpacity={0.12}
            />
          </View>

          {/* P4 — bg006 · fire orange glow, no border, intense */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="BG006 · FIRE HAZE"
              note="dark vignette · no border · glowRadius:20 orange"
              onPress={nextBg}
              bgImage={backgrounds.bg006}
              overlayColors={["rgba(0,0,0,0.5)", "rgba(80,30,0,0.3)"]}
              overlayStart={{ x: 0.5, y: 0 }}
              overlayEnd={{ x: 0.5, y: 1 }}
              dropColor="#4a1500"
              dropY={8}
              dropRadius={10}
              dropOpacity={0.9}
              glowColor="rgba(255,110,20,0.75)"
              glowRadius={20}
              showGloss={false}
            />
          </View>

          {/* P5 — bg007 · cool blue tint + silver border */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="BG007 · MOONLIGHT"
              note="cool blue overlay · 1px silver/white border · blue-silver glow"
              onPress={nextBg}
              bgImage={backgrounds.bg007}
              overlayColors={["rgba(10,20,60,0.45)", "rgba(0,10,40,0.25)"]}
              borderColor="rgba(180,210,255,0.55)"
              borderWidth={1}
              dropColor="#000814"
              dropY={8}
              dropRadius={16}
              dropOpacity={0.85}
              glowColor="rgba(120,170,255,0.45)"
              glowRadius={14}
            />
          </View>

          {/* P6 — bg015 · no overlay, bright red border on dark texture */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="BG015 · CRIMSON EDGE"
              note="no overlay · 2px bright red border · red glow · tight shadow"
              onPress={nextBg}
              bgImage={backgrounds.bg015}
              borderColor="rgba(255,60,60,0.9)"
              borderWidth={2}
              dropColor="#1a0000"
              dropY={6}
              dropRadius={8}
              dropOpacity={0.95}
              glowColor="rgba(255,50,50,0.6)"
              glowRadius={14}
              showGloss={false}
            />
          </View>

          {/* P7 — bg016 · white/ghost border + light shadow, no tint */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="BG016 · GHOST FRAME"
              note="no overlay · 1px white/40% border · minimal shadow · clean"
              onPress={nextBg}
              bgImage={backgrounds.bg016}
              borderColor="rgba(255,255,255,0.4)"
              borderWidth={1}
              dropColor="#000"
              dropY={4}
              dropRadius={8}
              dropOpacity={0.6}
              glossOpacity={0.08}
            />
          </View>

          {/* P8 — bg018 · gold — push the gold texture with double border trick */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="BG018 · SOVEREIGN"
              note="dark vignette · 2px gold border · outer gold shimmer glow"
              onPress={nextBg}
              bgImage={backgrounds.bg018}
              overlayColors={["rgba(20,10,0,0.35)", "rgba(0,0,0,0.1)"]}
              borderColor="rgba(255,210,60,0.9)"
              borderWidth={2}
              dropColor="#1a0d00"
              dropY={10}
              dropRadius={14}
              dropOpacity={0.9}
              glowColor="rgba(255,200,50,0.65)"
              glowRadius={18}
            />
          </View>

          {/* P9 — bg019 · rose/violet overlay + pink border */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="BG019 · ROSE DUSK"
              note="rose overlay · 1px pink border · pink glow"
              onPress={nextBg}
              bgImage={backgrounds.bg019}
              overlayColors={["rgba(60,0,40,0.4)", "rgba(120,20,80,0.2)"]}
              borderColor="rgba(255,130,180,0.65)"
              borderWidth={1}
              dropColor="#2a0020"
              dropY={8}
              dropRadius={14}
              dropOpacity={0.85}
              glowColor="rgba(255,100,160,0.5)"
              glowRadius={14}
            />
          </View>

          {/* P10 — bg022 · push the purple: 2px neon purple border, pill, intense glow */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="BG022 · ULTRA PURPLE"
              note="dark overlay · 2px neon purple border · pill · intense violet glow"
              onPress={nextBg}
              bgImage={backgrounds.bg022}
              overlayColors={["rgba(20,0,40,0.5)", "rgba(60,0,80,0.3)"]}
              borderColor="rgba(220,80,255,0.9)"
              borderWidth={2}
              borderRadius={999}
              dropColor="#1a0030"
              dropY={6}
              dropRadius={10}
              dropOpacity={0.9}
              glowColor="rgba(200,60,255,0.8)"
              glowRadius={20}
              showGloss={false}
            />
          </View>

          {/* P11 — bg026 · green — no overlay, transparent 2px border to show texture raw */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="BG026 · RAW GREEN"
              note="no overlay · 2px green/50% border · max glow · no gloss"
              onPress={nextBg}
              bgImage={backgrounds.bg026}
              borderColor="rgba(41,255,25,0.5)"
              borderWidth={2}
              dropColor="#001200"
              dropY={8}
              dropRadius={12}
              dropOpacity={0.9}
              glowColor="rgba(41,255,25,1)"
              glowRadius={24}
              showGloss={false}
            />
          </View>

          {/* P12 — bg027 · AI art — diagonal violet→transparent overlay + soft border */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="BG027 · DREAMSCAPE"
              note="diagonal violet vignette · 1px lavender border · soft glow"
              onPress={nextBg}
              bgImage={backgrounds.bg027}
              overlayColors={["rgba(40,0,80,0.5)", "rgba(0,0,0,0.1)"]}
              borderColor="rgba(180,140,255,0.55)"
              borderWidth={1}
              dropColor="#0a0020"
              dropY={8}
              dropRadius={16}
              dropOpacity={0.85}
              glowColor="rgba(160,100,255,0.5)"
              glowRadius={14}
            />
          </View>

          {/* P13 — bg028 · AI art — cyan/teal horizontal overlay + electric border */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="BG028 · ELECTRIC TIDE"
              note="teal overlay · 2px cyan border · horizontal · electric glow"
              onPress={nextBg}
              bgImage={backgrounds.bg028}
              overlayColors={["rgba(0,40,60,0.4)", "rgba(0,80,80,0.2)"]}
              overlayStart={{ x: 0, y: 0.5 }}
              overlayEnd={{ x: 1, y: 0.5 }}
              borderColor="rgba(0,220,255,0.8)"
              borderWidth={2}
              dropColor="#001a22"
              dropY={6}
              dropRadius={12}
              dropOpacity={0.85}
              glowColor="rgba(0,200,255,0.65)"
              glowRadius={16}
              showGloss={false}
            />
          </View>

          {/* P14 — bg029 · dark overlay + forest green border, heavy y:14 shadow */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="BG029 · DEEP FOREST"
              note="heavy dark overlay · 1px emerald border · y:14 shadow"
              onPress={nextBg}
              bgImage={backgrounds.bg029}
              overlayColors={["rgba(0,0,0,0.55)", "rgba(0,20,10,0.3)"]}
              borderColor="rgba(30,200,80,0.65)"
              borderWidth={1}
              dropColor="#000a05"
              dropY={14}
              dropRadius={20}
              dropOpacity={0.95}
              glowColor="rgba(20,180,70,0.45)"
              glowRadius={12}
            />
          </View>

          {/* P15 — bg030 · amber/sunset overlay + gold border, warm deep shadow */}
          <View style={{ marginBottom: GAP }}>
            <ExpButton
              title="BG030 · EMBER"
              note="amber vignette bottom-up · 1px warm gold border · glowRadius:18"
              onPress={nextBg}
              bgImage={backgrounds.bg030}
              overlayColors={["rgba(0,0,0,0.1)", "rgba(80,30,0,0.55)"]}
              overlayStart={{ x: 0.5, y: 0 }}
              overlayEnd={{ x: 0.5, y: 1 }}
              borderColor="rgba(220,150,40,0.7)"
              borderWidth={1}
              dropColor="#2a1000"
              dropY={10}
              dropRadius={16}
              dropOpacity={0.9}
              glowColor="rgba(220,130,30,0.55)"
              glowRadius={18}
            />
          </View>

        </ScrollView>
      </SafeAreaView>
    </FullBleedStack>
  );
}

/* ── Styles ──────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  bgChip: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 10,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,247,236,0.18)",
  },
  sectionWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: GAP,
    marginTop: 8,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,247,236,0.15)",
  },
  sectionText: {
    flexShrink: 1,
    textAlign: "center",
  },
});
