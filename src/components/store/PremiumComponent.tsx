import React, { useRef, useEffect } from "react";
import {
  View,
  Image,
  Animated,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import CustomText from "../common/CustomText";
import { useTranslation } from "react-i18next";

const PREMIUM_IMG = {
  uri: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/316ada4e-2f7a-4cc5-aa81-b303b9cea8b3-premiumStore.webp",
};

const FEATURE_KEYS = [
  { icon: "✏️", key: "store_premium_custom_packs" },
  { icon: "🚫", key: "store_premium_no_ads" },
  { icon: "❤️", key: "store_premium_support_game" },
];

type Props = {
  onSelect?: () => void;
  loading?: boolean;
};

const PremiumComponent = ({ onSelect, loading }: Props) => {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - 32;   // marginHorizontal 16 * 2
  // image is ~5.5 : 1 landscape ratio — render at 70% width, 2× height
  const imgW = cardWidth * 0.70;
  const imgH = (imgW / 5.5) * 2;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const shimmer   = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // CTA pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // border glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1400, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1400, useNativeDriver: false }),
      ])
    ).start();

    // premium image gentle float
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -5, duration: 1800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue:  0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    // shimmer sweep on the image
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(shimmer, { toValue: 0, duration: 0,    useNativeDriver: true }),
        Animated.delay(600),
      ])
    ).start();
  }, [pulseAnim, glowAnim, floatAnim, shimmer]);

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,210,60,0.35)", "rgba(255,210,60,0.95)"],
  });

  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-imgW, imgW * 1.2],
  });

  return (
    <View style={styles.outer}>
      <Animated.View style={[styles.glowBorder, { borderColor }]}>
        <LinearGradient
          colors={["#1a0533", "#2d0b5a", "#1a0533"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* ── Tagline above image ───────────────────────────────────── */}
          <CustomText style={styles.tagline}>{t("store_premium_tagline")}</CustomText>

          {/* ── Full-width PREMIUM image with shimmer + float ────────── */}
          <View style={[styles.imgWrap, { width: imgW, height: imgH + 12 }]}>
            <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
              <Image
                source={PREMIUM_IMG}
                style={{ width: imgW, height: imgH }}
                resizeMode="contain"
              />
            </Animated.View>
            {/* shimmer sweep */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.shimmerBar,
                { height: imgH, transform: [{ translateX: shimmerX }] },
              ]}
            />
          </View>

          {/* ── Custom questions highlight ────────────────────────────── */}
          <View style={styles.customBox}>
            <View style={styles.customHeader}>
              <CustomText style={styles.customHeaderIcon}>✏️</CustomText>
              <CustomText style={styles.customHeaderText}>{t("store_premium_custom_packs")}</CustomText>
            </View>
            <CustomText style={styles.customSub}>{t("store_premium_custom_sub")}</CustomText>
            {/* Question type chips */}
            <View style={styles.chips}>
              {["10× Pick", "10× Number", "10× Input"].map((chip) => (
                <View key={chip} style={styles.chip}>
                  <CustomText style={styles.chipText}>{chip}</CustomText>
                </View>
              ))}
            </View>
            <View style={styles.refillRow}>
              <CustomText style={styles.refillIcon}>🎁</CustomText>
              <CustomText style={styles.refillText}>{t("store_premium_custom_refill")}</CustomText>
            </View>
          </View>

          {/* ── Other features ───────────────────────────────────────── */}
          <View style={styles.features}>
            {FEATURE_KEYS.slice(1).map((f) => (
              <View key={f.key} style={styles.featureRow}>
                <CustomText style={styles.featureIcon}>{f.icon}</CustomText>
                <CustomText style={styles.featureLabel}>{t(f.key)}</CustomText>
              </View>
            ))}
          </View>

          {/* ── Price ────────────────────────────────────────────────── */}
          <View style={styles.priceRow}>
            <CustomText style={styles.priceLabel}>{t("store_premium_price_only")} </CustomText>
            <CustomText style={styles.price}>$5.99</CustomText>
            <CustomText style={styles.priceSub}>{t("store_premium_price_period")}</CustomText>
          </View>

          {/* ── CTA ──────────────────────────────────────────────────── */}
          <Pressable
            onPress={onSelect}
            disabled={loading}
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <LinearGradient
                colors={["#FFD43B", "#F76B1C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <CustomText style={styles.ctaText}>
                  {loading ? "..." : t("store_premium_cta")}
                </CustomText>
              </LinearGradient>
            </Animated.View>
          </Pressable>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  glowBorder: {
    borderRadius: 24,
    borderWidth: 2,
    overflow: "hidden",
  },
  card: {
    borderRadius: 22,
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: 0,
    alignItems: "center",
    gap: 0,
  },
  tagline: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
    textAlign: "center",
    marginBottom: 6,
    paddingHorizontal: 24,
  },
  imgWrap: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  shimmerBar: {
    position: "absolute",
    top: 0,
    width: 60,
    backgroundColor: "rgba(255,255,255,0.18)",
    transform: [{ skewX: "-18deg" }],
    borderRadius: 4,
  },
  // Custom questions block
  customBox: {
    alignSelf: "stretch",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,210,60,0.22)",
    padding: 16,
    gap: 10,
  },
  customHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  customHeaderIcon: { fontSize: 20 },
  customHeaderText: { color: "#FFD43B", fontSize: 15, fontWeight: "900" },
  customSub: { color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 17 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    backgroundColor: "rgba(147,51,234,0.45)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(147,51,234,0.5)",
  },
  chipText: { color: "#e9d5ff", fontSize: 12, fontWeight: "700" },
  refillRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  refillIcon: { fontSize: 15 },
  refillText: { color: "rgba(255,210,60,0.85)", fontSize: 12, fontWeight: "700" },

  features: {
    alignSelf: "stretch",
    gap: 8,
    marginTop: 4,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.07)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  featureIcon: { fontSize: 18 },
  featureLabel: { color: "#E8D5FF", fontSize: 15, fontWeight: "600" },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 18,
  },
  priceLabel: { color: "#C4A8FF", fontSize: 16, marginBottom: 2 },
  price: { color: "#FFD43B", fontSize: 36, fontWeight: "900", lineHeight: 40 },
  priceSub: { color: "#C4A8FF", fontSize: 15, marginBottom: 4 },
  cta: {
    alignSelf: "stretch",
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#FFD43B",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  ctaGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    borderRadius: 16,
  },
  ctaText: {
    color: "#1a0533",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});

export default PremiumComponent;
