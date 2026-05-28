import React, { useMemo, useRef, useEffect } from "react";
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import FullBleedStack from "../components/FullBleedStack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { navigateBackSafe } from "../navigation/navigateBackSafe";
import { StackNavigationProp } from "@react-navigation/stack";
import { useQuery } from "@tanstack/react-query";

import CustomText from "../components/common/CustomText";
import PremiumComponent from "../components/store/PremiumComponent";
import HeroSliderComponent from "../components/store/HeroSliderComponent";
import LoadingComponent from "../components/store/LoadingComponent";
import SuccessComponent from "../components/store/SuccessComponent";
import BundleComponent from "../components/store/BundleComponent";
import { OnboardingStackParamList } from "../navigation/types";
import { ICharacter } from "../types/character";
import { BUNDLES } from "../data/bundles";
import ScreenTopBar from "../components/common/ScreenTopBar";
import { useUserSettingsSheet } from "../context/UserSettingsModalContext";
import { useResponsive } from "../utils/responsive";
import AnimatedLogoHero from "../components/AnimatedLogoHero";
import { useHeroesStore } from "../store/useHeroesStore";
import { fetchCatalogCharacterProducts } from "../api/catalog";
import { queryKeys } from "../api/queryKeys";
import { useAuthStore } from "../store/useUserStore";
import { IBundle } from "../types/bundle";
import { trackItemPurchased } from "../api/analytics";
import { useStorePurchase } from "../hooks/useStorePurchase";
import { IAP_SKUS, IAP_FALLBACK_PRICES } from "../services/iapConstants";

type Nav = StackNavigationProp<OnboardingStackParamList, "Store">;

export type StoreHeroItem = ICharacter & {
  productId?: string;
  currency?: string;
};

// ── Section header ──────────────────────────────────────────────────────────
function SectionHeader({
  emoji,
  title,
  subtitle,
  delay = 0,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  delay?: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(22)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        speed: 16,
        bounciness: 5,
        delay,
        useNativeDriver: true,
      } as any),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);
  return (
    <Animated.View
      style={[
        sectionHeaderStyles.wrap,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <LinearGradient
        colors={["rgba(147,51,234,0.22)", "rgba(109,40,217,0.1)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={sectionHeaderStyles.inner}
      >
        <View style={sectionHeaderStyles.leftBorder} />
        <CustomText style={sectionHeaderStyles.emoji}>{emoji}</CustomText>
        <View style={sectionHeaderStyles.textWrap}>
          <CustomText style={sectionHeaderStyles.title}>{title}</CustomText>
          {subtitle && (
            <CustomText style={sectionHeaderStyles.subtitle}>
              {subtitle}
            </CustomText>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const sectionHeaderStyles = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginTop: 28, marginBottom: 16 },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(147,51,234,0.25)",
  },
  leftBorder: {
    width: 3,
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#9333ea",
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  emoji: { fontSize: 22 },
  textWrap: { flex: 1 },
  title: { color: "#fff", fontSize: 17, fontWeight: "900" },
  subtitle: { color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 1 },
});

// ── Store header (logo + character) ──────────────────────────────────────────
const LOGO_SRC = {
  uri: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/b1ea7ed2-9f89-40b4-b206-33e0ab2eb722-whoisnotlogo.webp",
};
const CHAR_SRC = {
  uri: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/7ef4f29a-2bd9-4bf5-a5c3-d5f69fc4d254-shutupandtakemymoney.webp",
};

function StoreHeader() {
  const { logo, htpOverlay } = useResponsive();
  const { t } = useTranslation();
  return (
    <View style={{ alignItems: "center" }}>
      <AnimatedLogoHero
        logoSource={LOGO_SRC}
        overlaySource={CHAR_SRC}
        logoWidth={logo.width}
        logoHeight={logo.height}
        overlayLayout={htpOverlay}
        marginTop={120}
      />
      <CustomText
        variant="h3"
        className="-rotate-3 text-center"
        style={{ paddingHorizontal: 32 }}
        shadow
      >
        {t("store_shop_label")}
      </CustomText>
    </View>
  );
}

// ── Animated gradient background with floating bubbles ───────────────────────
const BUBBLE_DEFS = [
  // purples — large & medium
  {
    left: "4%",
    size: 22,
    dur: 6000,
    delay: 0,
    opacity: 0.22,
    color: "#c084fc",
  },
  {
    left: "15%",
    size: 42,
    dur: 9200,
    delay: 1200,
    opacity: 0.12,
    color: "#a855f7",
  },
  {
    left: "28%",
    size: 14,
    dur: 5200,
    delay: 600,
    opacity: 0.26,
    color: "#d946ef",
  },
  {
    left: "44%",
    size: 36,
    dur: 11800,
    delay: 4200,
    opacity: 0.08,
    color: "#9333ea",
  },
  // pinks / magentas
  {
    left: "38%",
    size: 28,
    dur: 7800,
    delay: 2200,
    opacity: 0.16,
    color: "#f472b6",
  },
  {
    left: "53%",
    size: 48,
    dur: 12200,
    delay: 3800,
    opacity: 0.09,
    color: "#ec4899",
  },
  {
    left: "64%",
    size: 12,
    dur: 4600,
    delay: 400,
    opacity: 0.28,
    color: "#f9a8d4",
  },
  {
    left: "74%",
    size: 32,
    dur: 9600,
    delay: 6200,
    opacity: 0.1,
    color: "#db2777",
  },
  // blues / cyans / indigo
  {
    left: "71%",
    size: 24,
    dur: 7000,
    delay: 1700,
    opacity: 0.18,
    color: "#60a5fa",
  },
  {
    left: "84%",
    size: 38,
    dur: 10400,
    delay: 3000,
    opacity: 0.1,
    color: "#818cf8",
  },
  {
    left: "91%",
    size: 16,
    dur: 5800,
    delay: 700,
    opacity: 0.22,
    color: "#38bdf8",
  },
  {
    left: "7%",
    size: 44,
    dur: 13000,
    delay: 7400,
    opacity: 0.07,
    color: "#6366f1",
  },
  // golds / oranges
  {
    left: "9%",
    size: 30,
    dur: 8600,
    delay: 2900,
    opacity: 0.13,
    color: "#fbbf24",
  },
  {
    left: "33%",
    size: 12,
    dur: 4800,
    delay: 4600,
    opacity: 0.24,
    color: "#fde68a",
  },
  {
    left: "57%",
    size: 22,
    dur: 7400,
    delay: 1100,
    opacity: 0.16,
    color: "#fb923c",
  },
  {
    left: "80%",
    size: 18,
    dur: 6200,
    delay: 5000,
    opacity: 0.18,
    color: "#f59e0b",
  },
  // greens / teals
  {
    left: "20%",
    size: 10,
    dur: 3800,
    delay: 3500,
    opacity: 0.28,
    color: "#34d399",
  },
  {
    left: "48%",
    size: 46,
    dur: 14000,
    delay: 5800,
    opacity: 0.06,
    color: "#2dd4bf",
  },
  {
    left: "88%",
    size: 20,
    dur: 6800,
    delay: 640,
    opacity: 0.14,
    color: "#4ade80",
  },
  // extra small sparkles
  {
    left: "25%",
    size: 8,
    dur: 3400,
    delay: 1800,
    opacity: 0.32,
    color: "#e879f9",
  },
  {
    left: "60%",
    size: 6,
    dur: 2800,
    delay: 900,
    opacity: 0.35,
    color: "#a78bfa",
  },
  {
    left: "42%",
    size: 10,
    dur: 3600,
    delay: 6800,
    opacity: 0.3,
    color: "#fbbf24",
  },
  {
    left: "77%",
    size: 8,
    dur: 3000,
    delay: 2200,
    opacity: 0.32,
    color: "#60a5fa",
  },
  {
    left: "13%",
    size: 6,
    dur: 2600,
    delay: 4400,
    opacity: 0.38,
    color: "#c084fc",
  },
] as const;

function FloatingBubble({
  left,
  size,
  dur,
  delay,
  opacity,
  color,
}: {
  left: string;
  size: number;
  dur: number;
  delay: number;
  opacity: number;
  color: string;
}) {
  const { height } = useWindowDimensions();
  const posY = useRef(new Animated.Value(0)).current;
  const alpha = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = () => {
      posY.setValue(0);
      alpha.setValue(0);
      Animated.parallel([
        Animated.timing(posY, {
          toValue: -(height + size * 2),
          duration: dur,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(alpha, {
            toValue: opacity,
            duration: dur * 0.12,
            useNativeDriver: true,
          }),
          Animated.timing(alpha, {
            toValue: opacity * 0.8,
            duration: dur * 0.68,
            useNativeDriver: true,
          }),
          Animated.timing(alpha, {
            toValue: 0,
            duration: dur * 0.2,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => run());
    };
    const t = setTimeout(run, delay);
    return () => clearTimeout(t);
  }, [height, size, dur, delay, opacity, posY, alpha]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        bottom: -size,
        left: left as any,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: alpha,
        transform: [{ translateY: posY }],
      }}
    />
  );
}

// Gradient phases — clearly distinct hues so the shift is always visible
const G0 = {
  colors: ["#0d0030", "#150048", "#060020"] as const,
  locs: [0, 0.5, 1] as const,
};
// blue-violet — more blue
const G1 = {
  colors: ["#0a1a70", "#1e0068", "#061448"] as const,
  locs: [0, 0.55, 1] as const,
};
// deep magenta-purple — more red
const G2 = {
  colors: ["#4a0050", "#200028", "#380010"] as const,
  locs: [0, 0.45, 1] as const,
};
// indigo-teal (bright cool shift)
const G3 = {
  colors: ["#001a60", "#080e58", "#0a2040"] as const,
  locs: [0, 0.5, 1] as const,
};

function AnimatedStoreBackground({ scrollY }: { scrollY?: Animated.Value }) {
  // Each Animated.Value starts at a different point in its cycle → instant visual offset
  const p1 = useRef(new Animated.Value(0.7)).current;
  const p2 = useRef(new Animated.Value(0.2)).current;
  const p3 = useRef(new Animated.Value(0.85)).current;

  // Independent loops — NO Animated.delay (unreliable with native driver)
  // Visible color shift every 1.8 s
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(p1, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(p1, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(p2, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(p2, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(p3, {
          toValue: 0,
          duration: 3800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(p3, {
          toValue: 0.9,
          duration: 3800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [p1, p2, p3]);

  // Scroll-driven extra layer: fades in as user scrolls down
  const scrollOpacity = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 250, 600],
        outputRange: [0, 0.5, 0.85],
        extrapolate: "clamp",
      })
    : 0;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Always-visible base */}
      <LinearGradient
        colors={G0.colors}
        locations={G0.locs}
        style={StyleSheet.absoluteFill}
      />
      {/* Phase 1 — blue-violet */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: p1 }]}>
        <LinearGradient
          colors={G1.colors}
          locations={G1.locs}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Phase 2 — deep magenta */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: p2 }]}>
        <LinearGradient
          colors={G2.colors}
          locations={G2.locs}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Phase 3 — indigo-teal */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: p3 }]}>
        <LinearGradient
          colors={G3.colors}
          locations={G3.locs}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Scroll-driven deepening */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: scrollOpacity }]}
      >
        <LinearGradient
          colors={["#0a0030", "#200060", "#0d0040"]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Soft centre bloom */}
      <LinearGradient
        colors={["transparent", "rgba(147,51,234,0.14)", "transparent"]}
        start={{ x: 0.5, y: 0.15 }}
        end={{ x: 0.5, y: 0.85 }}
        style={StyleSheet.absoluteFill}
      />
      {BUBBLE_DEFS.map((b, i) => (
        <FloatingBubble key={i} {...b} />
      ))}
    </View>
  );
}

const DONATE_ICON_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/951b8784-dbee-4520-9cc5-091221b351d4-donateIcon.webp";

// ── Support card ─────────────────────────────────────────────────────────────
function SupportCard() {
  const { t } = useTranslation();
  const { width: screenW } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: 500,
      useNativeDriver: true,
    }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [fadeAnim, pulseAnim]);

  // icon occupies 40% of card inner width (card = capped width - 40 due to marginH 20 each side)
  const effectiveW = Math.min(screenW, 560);
  const iconW = (effectiveW - 40) * 0.4;

  return (
    <Animated.View style={[supportStyles.wrap, { opacity: fadeAnim }]}>
      <View style={supportStyles.inner}>
        {/* Donate icon — 40% width */}
        <Animated.View
          style={{ width: iconW, transform: [{ scale: pulseAnim }] }}
        >
          <Image
            source={{ uri: DONATE_ICON_URI }}
            style={{ width: iconW, height: iconW, alignSelf: "center" }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Text + button */}
        <View style={supportStyles.textWrap}>
          <CustomText style={supportStyles.title}>
            {t("store_support_title")}
          </CustomText>
          <CustomText style={supportStyles.body}>
            {t("store_support_body")}
          </CustomText>
          <Pressable style={supportStyles.btn} hitSlop={8}>
            <LinearGradient
              colors={["#e11d48", "#be123c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={supportStyles.btnGrad}
            >
              <CustomText style={supportStyles.btnText}>
                ❤️ {t("store_support_btn")}
              </CustomText>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Restore row ───────────────────────────────────────────────────────────────
function RestoreRow({
  onRestore,
  isLoading,
}: {
  onRestore: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.restoreRow}>
      <Pressable onPress={onRestore} disabled={isLoading} hitSlop={12}>
        <CustomText style={styles.restoreText}>
          {isLoading ? t("store_restoring") : t("store_restore")}
        </CustomText>
      </Pressable>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
const StoreScreen = () => {
  const navigation = useNavigation<Nav>();
  const { openUserSettings } = useUserSettingsSheet();
  const { t } = useTranslation();
  const { horizontalPadding, topIconSize, isTablet } = useResponsive();
  const userId = useAuthStore((s) => s.user.id);
  const isPremium = useAuthStore((s) => s.user.isPremium);

  const { purchase, restore, isLoading, state, lastResult, reset } =
    useStorePurchase();
  const [successHero, setSuccessHero] = React.useState<ICharacter | null>(null);
  const [successBundle, setSuccessBundle] = React.useState<IBundle | null>(
    null,
  );
  const [successPremium, setSuccessPremium] = React.useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const heroes = useHeroesStore((s) => s.heroes);
  const { data: catalogProducts = [] } = useQuery({
    queryKey: queryKeys.catalogCharacterProducts,
    queryFn: fetchCatalogCharacterProducts,
    staleTime: 5 * 60_000,
  });

  const paidHeroes = useMemo((): StoreHeroItem[] => {
    const byCharId = new Map(
      catalogProducts
        .filter((p) => p.itemRefId)
        .map((p) => [
          p.itemRefId!,
          {
            productId: p.productId,
            price: p.price / 100,
            discountPrice: p.discountPrice != null ? p.discountPrice / 100 : 0,
            currency: p.currency,
          },
        ]),
    );
    return heroes
      .filter((h) => !h.free && !h.unlocked)
      .map((h) => {
        const cat = byCharId.get(h.id);
        return {
          ...h,
          productId: cat?.productId,
          ...(cat && {
            price: cat.price,
            discountPrice: cat.discountPrice,
          }),
        };
      });
  }, [heroes, catalogProducts]);

  // ── Purchase handlers ──────────────────────────────────────────────────────
  const handlePremiumBuy = async () => {
    const result = await purchase(IAP_SKUS.PREMIUM_MONTHLY);
    if (result.success) {
      setSuccessPremium(true);
    }
    void trackItemPurchased({
      playerId: userId,
      userId,
      itemType: "subscription",
      itemId: IAP_SKUS.PREMIUM_MONTHLY,
      price: 5.99,
      currency: "USD",
      quantity: 1,
    }).catch(() => {});
  };

  const handleHeroBuy = async (hero: StoreHeroItem) => {
    const sku = (hero.productId ?? hero.slug) as any;
    const result = await purchase(sku);
    if (result.success) setSuccessHero(hero);
    void trackItemPurchased({
      playerId: userId,
      userId,
      itemType: "character",
      itemId: hero.productId ?? hero.id,
      price: hero.discountPrice > 0 ? hero.discountPrice : hero.price,
      currency: hero.currency ?? "USD",
      quantity: 1,
    }).catch(() => {});
  };

  const handleBundleBuy = async (bundle: IBundle) => {
    const result = await purchase(bundle.productId as any);
    if (result.success) setSuccessBundle(bundle);
    void trackItemPurchased({
      playerId: userId,
      userId,
      itemType: "bundle",
      itemId: bundle.productId ?? bundle.id,
      price: bundle.discountPrice > 0 ? bundle.discountPrice : bundle.price,
      currency: bundle.currency,
      quantity: 1,
    }).catch(() => {});
  };

  const handleRestore = () => restore();

  return (
    <FullBleedStack
      rootStyle={styles.root}
      backdrop={<AnimatedStoreBackground scrollY={scrollY} />}
    >
      <SafeAreaView style={styles.safe} edges={["left", "right"]}>
        <ScreenTopBar
          variant="soloBackFromCenter"
          horizontalPadding={horizontalPadding}
          topIconSize={topIconSize}
          showBack
          onSettings={() => openUserSettings()}
          onProfile={() => {}}
          onBack={() => navigateBackSafe(navigation)}
          backAccessibilityLabel={t("back_btn")}
        />

        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            isTablet && { alignItems: "center" },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
        >
          <View style={[{ width: "100%" }, isTablet && { maxWidth: 560 }]}>
            {/* ── Store Header — logo + character ───────────────────── */}
            <StoreHeader />

            {/* ── Premium ───────────────────────────────────────────────── */}
            {!isPremium && (
              <>
                <SectionHeader
                  emoji="⚡"
                  title={t("store_go_premium")}
                  subtitle={t("store_go_premium_subtitle")}
                  delay={100}
                />
                <PremiumComponent
                  onSelect={handlePremiumBuy}
                  loading={isLoading}
                />
              </>
            )}

            {isPremium && (
              <View style={styles.premiumOwned}>
                <CustomText style={styles.premiumOwnedText}>
                  {t("store_premium_owned")}
                </CustomText>
              </View>
            )}

            {/* ── Heroes ────────────────────────────────────────────────── */}
            {paidHeroes.length > 0 && (
              <>
                <SectionHeader
                  emoji="⚔️"
                  title={t("store_heroes_section")}
                  subtitle={t("store_heroes_subtitle", {
                    count: paidHeroes.length,
                  })}
                  delay={180}
                />
                <HeroSliderComponent
                  data={paidHeroes}
                  itemSize={128}
                  gap={12}
                  sidePadding={20}
                  onSelect={handleHeroBuy}
                />
              </>
            )}

            {/* ── Bundles ───────────────────────────────────────────────── */}
            <SectionHeader
              emoji="🎁"
              title={t("store_bundles_section")}
              subtitle={t("store_bundles_subtitle")}
              delay={260}
            />
            {BUNDLES.map((bundle, i) => (
              <BundleComponent
                key={bundle.id}
                item={bundle}
                onSelect={handleBundleBuy}
                delay={300 + i * 100}
                scrollY={scrollY}
              />
            ))}

            {/* ── Footer ────────────────────────────────────────────────── */}
            <SupportCard />
            <RestoreRow
              onRestore={handleRestore}
              isLoading={isLoading && state === "loading"}
            />
          </View>
        </ScrollView>

        {/* ── Overlays ──────────────────────────────────────────────── */}
        {isLoading && <LoadingComponent />}

        {successHero && (
          <SuccessComponent
            visible={!!successHero}
            hero={successHero}
            onContinue={() => setSuccessHero(null)}
          />
        )}

        {successPremium && (
          <View style={styles.premiumSuccessOverlay}>
            <LinearGradient
              colors={["#1a0533", "#2d0b5a"]}
              style={styles.premiumSuccessCard}
            >
              <CustomText style={styles.premiumSuccessEmoji}>⚡</CustomText>
              <CustomText
                variant="h2-small"
                style={{ color: "#FFD43B" }}
                shadow
              >
                {t("store_success_premium_title")}
              </CustomText>
              <CustomText style={styles.premiumSuccessBody}>
                {t("store_success_premium_body")}
              </CustomText>
              <Pressable
                onPress={() => setSuccessPremium(false)}
                style={styles.premiumSuccessBtn}
              >
                <LinearGradient
                  colors={["#FFD43B", "#F76B1C"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.premiumSuccessBtnGrad}
                >
                  <CustomText style={styles.premiumSuccessBtnText}>
                    {t("store_success_lets_go")}
                  </CustomText>
                </LinearGradient>
              </Pressable>
            </LinearGradient>
          </View>
        )}
      </SafeAreaView>
    </FullBleedStack>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0314" },
  safe: { flex: 1, backgroundColor: "transparent" },
  scroll: {
    paddingTop: 16,
    paddingBottom: 16,
  },

  // ── Premium owned badge
  premiumOwned: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "rgba(255,212,59,0.12)",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,212,59,0.3)",
  },
  premiumOwnedText: {
    color: "#FFD43B",
    fontSize: 17,
    fontWeight: "800",
  },

  // ── Restore row
  restoreRow: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 12,
  },
  restoreText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 14,
    textDecorationLine: "underline",
  },

  // ── Premium success overlay
  premiumSuccessOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.88)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  premiumSuccessCard: {
    marginHorizontal: 28,
    borderRadius: 28,
    padding: 32,
    alignItems: "center",
    gap: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,212,59,0.5)",
  },
  premiumSuccessEmoji: { fontSize: 56 },
  premiumSuccessBody: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  premiumSuccessBtn: {
    alignSelf: "stretch",
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 4,
  },
  premiumSuccessBtnGrad: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 14,
  },
  premiumSuccessBtnText: {
    color: "#1a0533",
    fontSize: 18,
    fontWeight: "900",
  },
});

const supportStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 4,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 18,
  },
  textWrap: { flex: 1, gap: 8 },
  title: { color: "rgba(255,255,255,0.82)", fontSize: 14, fontWeight: "700" },
  body: { color: "rgba(255,255,255,0.42)", fontSize: 12, lineHeight: 18 },
  btn: { alignSelf: "flex-start", borderRadius: 10, overflow: "hidden" },
  btnGrad: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnText: { color: "#fff", fontSize: 12, fontWeight: "800" },
});

export default StoreScreen;
