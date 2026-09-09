import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import ImageBackgroundWithLoadGate from "../ImageBackgroundWithLoadGate";
import WarmBubblesOverlay from "../WarmBubblesOverlay";
import CustomText from "../common/CustomText";
import { backgrounds } from "../../../assets/backgrounds";

type Props = {
  visible: boolean;
  messageKey?: string;
  /**
   * "fullscreen" — replaces the whole screen (bg023 + WarmBubbles). Use for eliminated spectators.
   * "popup"      — card only over a dim/blur backdrop on top of the current screen (default).
   */
  variant?: "fullscreen" | "popup";
};

function PulsingRing({ delay, size, color }: { delay: number; size: number; color: string }) {
  const scale   = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1,   duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0,   duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 0.6, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity, scale]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

function DotsIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (val: Animated.Value, d: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(d),
          Animated.timing(val, { toValue: -6, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0,  duration: 300, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
          Animated.delay(600),
        ]),
      );
    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 200);
    const a3 = anim(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  const dotStyle = { width: 7, height: 7, borderRadius: 4, backgroundColor: "#fbbf24", marginHorizontal: 3 };

  return (
    <View style={styles.dotsRow}>
      <Animated.View style={[dotStyle, { transform: [{ translateY: dot1 }] }]} />
      <Animated.View style={[dotStyle, { transform: [{ translateY: dot2 }] }]} />
      <Animated.View style={[dotStyle, { transform: [{ translateY: dot3 }] }]} />
    </View>
  );
}

function WaitCard({ cardOpacity, cardScale, message, subtitle }: {
  cardOpacity: Animated.Value;
  cardScale: Animated.Value;
  message: string;
  subtitle: string;
}) {
  return (
    <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
      <LinearGradient colors={["#1a0533", "#2d0b5a", "#1a1a2e"]} style={styles.gradient}>

        <View style={styles.iconRingWrap}>
          <PulsingRing size={120} color="rgba(251,191,36,0.5)" delay={0}   />
          <PulsingRing size={120} color="rgba(251,191,36,0.3)" delay={500} />
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="timer-sand" size={36} color="#fbbf24" />
          </View>
        </View>

        <CustomText
          variant="h5"
          textColor="#ffe89e"
          className="text-center"
          sizeDelta={4}
          style={styles.title}
        >
          {message}
        </CustomText>

        <CustomText
          variant="footnote"
          textColor="rgba(255,255,255,0.55)"
          className="text-center"
          style={styles.subtitle}
        >
          {subtitle}
        </CustomText>

        <DotsIndicator />

      </LinearGradient>
    </Animated.View>
  );
}

export default function OnlineWaitPlayersOverlay({
  visible,
  messageKey = "online_wait_other_players",
  variant = "popup",
}: Props) {
  const { t } = useTranslation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth >= 768 && windowWidth > windowHeight;

  const cardScale   = useRef(new Animated.Value(0.85)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      Animated.timing(cardOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
      return;
    }
    cardScale.setValue(0.85);
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(cardScale,   { toValue: 1, duration: 340, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
    ]).start();
  }, [visible, cardOpacity, cardScale]);

  if (!visible) return null;

  const message  = t(messageKey);
  const subtitle = t("online_wait_subtitle");

  if (variant === "popup") {
    return (
      <View pointerEvents="auto" style={StyleSheet.absoluteFill}>
        <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.dimOverlay]} />
        <View style={styles.centeredWrap}>
          <WaitCard cardOpacity={cardOpacity} cardScale={cardScale} message={message} subtitle={subtitle} />
        </View>
      </View>
    );
  }

  // fullscreen variant — own background with bg023 + WarmBubbles
  return (
    <ImageBackgroundWithLoadGate
      source={isTablet ? backgrounds.bg023t : backgrounds.bg023}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
      showChildrenWhileLoading
      noBlur
    >
      <WarmBubblesOverlay variant="intense" />
      <View pointerEvents="auto" style={styles.centeredWrap}>
        <WaitCard cardOpacity={cardOpacity} cardScale={cardScale} message={message} subtitle={subtitle} />
      </View>
    </ImageBackgroundWithLoadGate>
  );
}

const styles = StyleSheet.create({
  dimOverlay: {
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  centeredWrap: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(180,120,255,0.3)",
    shadowColor: "#9333ea",
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 20,
    width: "100%",
    maxWidth: 340,
  },
  gradient: {
    paddingVertical: 36,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  iconRingWrap: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(40,22,8,0.95)",
    borderWidth: 2,
    borderColor: "rgba(251,191,36,0.6)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#fbbf24",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  title: {
    fontFamily: "SofiaSansExtraCondensed-Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Onest-SemiBold",
    marginBottom: 20,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
