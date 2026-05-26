import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { backgrounds } from "../../../assets/backgrounds";
import CustomText from "../common/CustomText";
import CustomButton from "../common/CustomButton";
import PurpleConfirmModal from "../common/PurpleConfirmModal";
import { useAuthStore } from "../../store/useUserStore";
import {
  createUserCustomQuestion,
  deleteUserCustomQuestion,
  fetchUserCustomPackSummary,
  fetchUserCustomQuestions,
  type CustomQuestionDto,
} from "../../api/questions";
import AudioManager from "../../utils/audioManager";
import { OnboardingStackParamList } from "../../navigation/types";

type Nav = StackNavigationProp<OnboardingStackParamList, "Profile">;
type QuestionType = "pick" | "number" | "input";

const TYPES: QuestionType[] = ["pick", "number", "input"];

// ── Premium image icons ───────────────────────────────────────────────────────
const TYPE_IMAGES: Record<QuestionType, string> = {
  pick: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/55e6dda5-402a-47eb-9753-60237e691c77-pickIcon.webp",
  number:
    "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/b71c9406-9fc8-46db-bc65-b545d66471f1-numberIconn.webp",
  input:
    "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/14f751d9-1e74-4bbc-b09c-e66c1d7e91d7-numberIcon.webp",
};

// ── Type metadata — colors match the mockup ───────────────────────────────────
const TYPE_META: Record<
  QuestionType,
  {
    name: string;
    label: string;
    desc: string;
    placeholder: string;
    color: string;
    accent: string;
    bg: string;
    glow: string;
  }
> = {
  pick: {
    name: "Pick",
    label: "Who is most likely to…",
    desc: "One person gets chosen",
    placeholder: "e.g. Who is most likely to stay up until 5am? 🌙",
    color: "#059669",
    accent: "#10b981",
    bg: "rgba(16,185,129,0.10)",
    glow: "rgba(16,185,129,0.45)",
  },
  number: {
    name: "Number",
    label: "Give me a number…",
    desc: "Answer with a number",
    placeholder: "e.g. How many cups of coffee a day? ☕",
    color: "#d97706",
    accent: "#f59e0b",
    bg: "rgba(245,158,11,0.10)",
    glow: "rgba(245,158,11,0.45)",
  },
  input: {
    name: "Write",
    label: "Write your answer…",
    desc: "Free text, anything goes",
    placeholder: "e.g. What would you do if you woke up famous? 🌟",
    color: "#7c3aed",
    accent: "#8b5cf6",
    bg: "rgba(139,92,246,0.10)",
    glow: "rgba(139,92,246,0.45)",
  },
};

const CARD_SHADOW = {
  shadowColor: "#000" as const,
  shadowOpacity: 0.1,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 3 },
  elevation: 5,
};

// ── Animated gradient layers per type ────────────────────────────────────────
const TYPE_GRADS: Record<
  QuestionType,
  {
    base: readonly [string, string];
    pulse: readonly [string, string];
    active: readonly [string, string];
  }
> = {
  pick: {
    base: ["rgba(16,185,129,0.07)", "rgba(5,150,105,0.04)"],
    pulse: ["rgba(52,211,153,0.18)", "rgba(16,185,129,0.22)"],
    active: ["rgba(16,185,129,0.20)", "rgba(4,120,87,0.26)"],
  },
  number: {
    base: ["rgba(245,158,11,0.07)", "rgba(217,119,6,0.04)"],
    pulse: ["rgba(251,191,36,0.20)", "rgba(245,158,11,0.24)"],
    active: ["rgba(251,191,36,0.22)", "rgba(217,119,6,0.28)"],
  },
  input: {
    base: ["rgba(139,92,246,0.07)", "rgba(109,40,217,0.04)"],
    pulse: ["rgba(167,139,250,0.20)", "rgba(139,92,246,0.24)"],
    active: ["rgba(139,92,246,0.22)", "rgba(109,40,217,0.28)"],
  },
};

const DONATE_ICON_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/c8b2181c-6921-41bd-a210-30768f20d010-questionsBoxIcon.webp";

// ─────────────────────────────────────────────────────────────────────────────
// PromoCard (non-premium users)
// ─────────────────────────────────────────────────────────────────────────────
function PromoCard({ onGoToStore }: { onGoToStore: () => void }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim, floatAnim]);

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -7],
  });

  return (
    <View style={P.outer}>
      <ImageBackground
        source={backgrounds.bg005}
        resizeMode="stretch"
        imageStyle={{ borderRadius: 20 }}
        style={P.plate}
      >
        <View style={P.headerRow}>
          <View style={P.iconWrap}>
            <Ionicons name="create" size={24} color="#762a05" />
          </View>
          <View style={{ flex: 1 }}>
            <CustomText style={P.title}>Custom Questions</CustomText>
            <CustomText style={P.sub}>Write your own, play your way</CustomText>
          </View>
          <View style={P.badge}>
            <CustomText style={P.badgeText}>PREMIUM</CustomText>
          </View>
        </View>
        <View style={P.divider} />
        <View style={P.previewRow}>
          {TYPES.map((t) => (
            <View key={t} style={P.previewItem}>
              <Image
                source={{ uri: TYPE_IMAGES[t] }}
                style={P.previewImg}
                resizeMode="contain"
              />
              <CustomText style={P.previewLabel}>
                {TYPE_META[t].name}
              </CustomText>
            </View>
          ))}
        </View>
        <View style={P.divider} />
        <Animated.View
          style={{ transform: [{ scale: pulseAnim }, { translateY: floatY }] }}
        >
          <CustomButton
            title="Get Premium"
            appearance="primary"
            btnSize="sm"
            fontSize="sm"
            fullWidth
            glow
            glowColor="rgba(249,115,22,0.55)"
            shadowColor="#c2410c"
            onPress={onGoToStore}
            iconNode={<Ionicons name="star" size={18} color="#fff" />}
          />
        </Animated.View>
        <CustomText style={P.hint}>
          Your questions play automatically in every game
        </CustomText>
      </ImageBackground>
    </View>
  );
}

const P = StyleSheet.create({
  outer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: "hidden",
    borderColor: "rgba(251,192,32,0.55)",
    shadowColor: "#ffd800",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  plate: {
    borderRadius: 20,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(251,192,32,1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(160,110,60,0.7)",
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(118,42,5,0.12)",
    borderWidth: 1,
    borderColor: "rgba(160,110,60,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#3d1502", fontSize: 15, fontWeight: "800" },
  sub: { color: "rgba(118,42,5,0.78)", fontSize: 12, marginTop: 1 },
  badge: {
    backgroundColor: "rgba(251,191,36,0.5)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(160,110,60,0.45)",
  },
  badgeText: {
    color: "#3d1502",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  divider: { height: 1, backgroundColor: "rgba(89,36,16,0.22)" },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
  },
  previewItem: { alignItems: "center", gap: 6 },
  previewImg: { width: 72, height: 80 },
  previewLabel: { color: "#592410", fontSize: 11, fontWeight: "700" },
  hint: { color: "rgba(89,36,16,0.50)", fontSize: 11, textAlign: "center" },
});

// ─────────────────────────────────────────────────────────────────────────────
// TypeCard — animated gradient bg; bold colored title at all times
// ─────────────────────────────────────────────────────────────────────────────
function TypeCard({
  type,
  active,
  count,
  limit,
  onPress,
}: {
  type: QuestionType;
  active: boolean;
  count: number;
  limit: number;
  onPress: () => void;
}) {
  const m = TYPE_META[type];
  const g = TYPE_GRADS[type];
  const full = count >= limit;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const floatLoop = useRef<Animated.CompositeAnimation | null>(null);
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  const pressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      speed: 30,
      bounciness: 0,
      useNativeDriver: true,
    } as any).start();
  const pressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      speed: 22,
      bounciness: 12,
      useNativeDriver: true,
    } as any).start();

  // Gradient pulse — always running, faster when active
  useEffect(() => {
    pulseLoop.current?.stop();
    const dur = active ? 1400 : 2600;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: dur,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: dur,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.current = loop;
    loop.start();
    return () => pulseLoop.current?.stop();
  }, [active, pulseAnim]);

  // Float icon when active
  useEffect(() => {
    if (active) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 1300,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1300,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      floatLoop.current = loop;
      loop.start();
    } else {
      floatLoop.current?.stop();
      floatAnim.setValue(0);
    }
    return () => floatLoop.current?.stop();
  }, [active, floatAnim]);

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  return (
    <Animated.View style={[TC.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={{ flex: 1 }}
      >
        <View
          style={[
            TC.card,
            active
              ? { borderColor: m.accent, borderWidth: 2 }
              : { borderColor: "rgba(0,0,0,0.08)", borderWidth: 1 },
            full && !active && { opacity: 0.55 },
          ]}
        >
          {/* Base gradient — always visible */}
          <LinearGradient
            colors={active ? g.active : g.base}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Pulse overlay — animated */}
          <Animated.View
            style={[StyleSheet.absoluteFillObject, { opacity: pulseAnim }]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={g.pulse}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>

          {/* Active top accent bar */}
          {active && (
            <View style={[TC.topBar, { backgroundColor: m.accent }]} />
          )}

          {/* Premium image — floats when active */}
          <Animated.View style={{ transform: [{ translateY: floatY }] }}>
            <Image
              source={{ uri: TYPE_IMAGES[type] }}
              style={TC.icon}
              resizeMode="contain"
            />
          </Animated.View>

          <CustomText
            style={[TC.name, { color: active ? m.color : m.color + "bb" }]}
          >
            {m.name}
          </CustomText>
          <CustomText style={TC.desc} numberOfLines={2}>
            {m.desc}
          </CustomText>

          <View style={TC.slotBar}>
            <View
              style={[
                TC.slotFill,
                {
                  width: `${Math.min(100, (count / limit) * 100)}%` as any,
                  backgroundColor: full ? "#dc2626" : m.accent,
                },
              ]}
            />
          </View>
          <CustomText style={[TC.slotLabel, full && { color: "#b91c1c" }]}>
            {full ? "Full" : `${count} / ${limit}`}
          </CustomText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const TC = StyleSheet.create({
  wrapper: { flex: 1 },
  card: {
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 12,
    alignItems: "center",
    gap: 4,
    minHeight: 148,
    overflow: "hidden",
    backgroundColor: "#fff",
    ...CARD_SHADOW,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 16,
  },
  icon: { width: 68, height: 78, marginBottom: 2 },
  name: { fontSize: 13, fontWeight: "900", letterSpacing: 0.2 },
  desc: { color: "#9ca3af", fontSize: 9, textAlign: "center", lineHeight: 13 },
  slotBar: {
    height: 3,
    width: "80%",
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.07)",
    overflow: "hidden",
    marginTop: 4,
  },
  slotFill: { height: "100%", borderRadius: 2 },
  slotLabel: { color: "#9ca3af", fontSize: 9, fontWeight: "700" },
});

// ─────────────────────────────────────────────────────────────────────────────
// AddToPackButton — animated, game-like gradient button
// ─────────────────────────────────────────────────────────────────────────────
function AddToPackButton({
  enabled,
  saving,
  typeFull,
  onPress,
}: {
  enabled: boolean;
  saving: boolean;
  typeFull: boolean;
  onPress: () => void;
}) {
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const bounceLoop = useRef<Animated.CompositeAnimation | null>(null);
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    bounceLoop.current?.stop();
    if (enabled && !saving) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.035,
            duration: 550,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 550,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      bounceLoop.current = loop;
      loop.start();
    } else {
      bounceAnim.setValue(1);
    }
    return () => bounceLoop.current?.stop();
  }, [enabled, saving, bounceAnim]);

  const pressIn = () =>
    Animated.spring(pressAnim, {
      toValue: 0.94,
      speed: 40,
      bounciness: 0,
      useNativeDriver: true,
    } as any).start();
  const pressOut = () =>
    Animated.spring(pressAnim, {
      toValue: 1,
      speed: 22,
      bounciness: 10,
      useNativeDriver: true,
    } as any).start();

  const gradColors = typeFull
    ? (["#9ca3af", "#6b7280"] as const)
    : enabled && !saving
      ? (["#ea580c", "#fbbf24"] as const)
      : (["#d1d5db", "#9ca3af"] as const);

  return (
    <Animated.View
      style={{ transform: [{ scale: bounceAnim }, { scale: pressAnim }] }}
    >
      <Pressable
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        disabled={!enabled || saving}
        style={ABP.wrap}
      >
        <LinearGradient
          colors={gradColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={ABP.grad}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : typeFull ? (
            <>
              <Ionicons name="lock-closed" size={15} color="#fff" />
              <CustomText style={ABP.label}>Limit reached</CustomText>
            </>
          ) : (
            <>
              <CustomText style={ABP.heart}>❤️</CustomText>
              <CustomText style={ABP.label}>ADD TO MY PACK</CustomText>
            </>
          )}
        </LinearGradient>
        {/* Glow when enabled */}
        {enabled && !saving && !typeFull && (
          <View style={ABP.glow} pointerEvents="none" />
        )}
      </Pressable>
    </Animated.View>
  );
}

const ABP = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: "visible",
    shadowColor: "#ea580c",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  grad: {
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
  },
  heart: { fontSize: 18 },
  label: { color: "#fff", fontSize: 15, fontWeight: "900", letterSpacing: 0.6 },
  glow: {
    position: "absolute",
    inset: -4,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(251,191,36,0.45)",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SimpleQuestionCard — minimal clean row; tap = open delete confirm
// ─────────────────────────────────────────────────────────────────────────────
function SimpleQuestionCard({
  item,
  index,
  listVisible,
  onTap,
}: {
  item: CustomQuestionDto;
  index: number;
  listVisible: boolean;
  onTap: (item: CustomQuestionDto) => void;
}) {
  const m = TYPE_META[item.type as QuestionType];

  const entryAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (listVisible) {
      const t = setTimeout(() => {
        Animated.spring(entryAnim, {
          toValue: 1,
          speed: 14,
          bounciness: 9,
          useNativeDriver: true,
        } as any).start();
      }, index * 55);
      return () => clearTimeout(t);
    } else {
      entryAnim.setValue(0);
    }
  }, [listVisible, index, entryAnim]);

  const scale = entryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });
  const translateY = entryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  const pressAnim = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(pressAnim, {
      toValue: 0.97,
      speed: 40,
      bounciness: 0,
      useNativeDriver: true,
    } as any).start();
  const pressOut = () =>
    Animated.spring(pressAnim, {
      toValue: 1,
      speed: 22,
      bounciness: 6,
      useNativeDriver: true,
    } as any).start();

  return (
    <Animated.View
      style={{ opacity: entryAnim, transform: [{ scale }, { translateY }] }}
    >
      <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
        <Pressable
          onPressIn={pressIn}
          onPressOut={pressOut}
          onPress={() => onTap(item)}
          style={SQ.row}
        >
          <Image
            source={{ uri: TYPE_IMAGES[item.type as QuestionType] }}
            style={SQ.icon}
            resizeMode="contain"
          />
          <View style={SQ.textWrap}>
            <View
              style={[
                SQ.pill,
                { backgroundColor: m.bg, borderColor: m.accent + "55" },
              ]}
            >
              <CustomText style={[SQ.pillLabel, { color: m.color }]}>
                {m.name.toUpperCase()}
              </CustomText>
            </View>
            <CustomText style={SQ.questionText} numberOfLines={1}>
              {item.text}
            </CustomText>
          </View>
          <Ionicons
            name="chevron-forward"
            size={15}
            color="#d1d5db"
            style={{ flexShrink: 0 }}
          />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const SQ = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: "#fff",
  },
  icon: { width: 28, height: 32, flexShrink: 0 },
  textWrap: { flex: 1, gap: 3 },
  pill: {
    alignSelf: "flex-start",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  pillLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
  questionText: {
    color: "#1f2937",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// EmptyPackCard — donate-style teaser when no questions written yet
// ─────────────────────────────────────────────────────────────────────────────
function EmptyPackCard() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: 300,
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

  return (
    <Animated.View style={[EP.wrap, { opacity: fadeAnim }]}>
      <View style={EP.inner}>
        {/* Pulsing icon */}
        <Animated.Image
          source={{ uri: DONATE_ICON_URI }}
          style={[EP.icon, { transform: [{ scale: pulseAnim }] }]}
          resizeMode="contain"
        />
        {/* Text */}
        <View style={EP.textWrap}>
          <CustomText style={EP.title}>
            Your pack is empty — be the legend 🎉
          </CustomText>
          <CustomText style={EP.body}>
            Write questions only your crew gets. The more personal, the louder
            the laughs.
          </CustomText>
        </View>
      </View>
    </Animated.View>
  );
}

const EP = StyleSheet.create({
  wrap: {
    marginTop: 10,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  inner: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  icon: { width: 120, height: 120, flexShrink: 0 },
  textWrap: { flex: 1, gap: 6 },
  title: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  body: { color: "rgba(255,255,255,0.50)", fontSize: 11, lineHeight: 17 },
});

// ─────────────────────────────────────────────────────────────────────────────
// SavedQuestionsCard — collapsible "My Saved Questions" clean white card
// ─────────────────────────────────────────────────────────────────────────────
function SavedQuestionsCard({
  items,
  onTap,
}: {
  items: CustomQuestionDto[];
  onTap: (item: CustomQuestionDto) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const arrowBounce = useRef(new Animated.Value(0)).current;
  const bounceLoop = useRef<Animated.CompositeAnimation | null>(null);
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: expanded ? 1 : 0,
      speed: 9,
      bounciness: 6,
      useNativeDriver: false,
    } as any).start();
  }, [expanded, expandAnim]);

  useEffect(() => {
    if (expanded) {
      bounceLoop.current?.stop();
      arrowBounce.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowBounce, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(arrowBounce, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(2400),
      ]),
    );
    bounceLoop.current = loop;
    loop.start();
    return () => loop.stop();
  }, [expanded, arrowBounce]);

  const maxHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, items.length * 68 + 16],
  });
  const arrowY = arrowBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });

  const pressIn = () =>
    Animated.spring(pressAnim, {
      toValue: 0.98,
      speed: 40,
      bounciness: 0,
      useNativeDriver: true,
    } as any).start();
  const pressOut = () =>
    Animated.spring(pressAnim, {
      toValue: 1,
      speed: 24,
      bounciness: 6,
      useNativeDriver: true,
    } as any).start();

  return (
    <View style={MSQ.card}>
      {/* Header */}
      <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
        <Pressable
          onPress={() => {
            AudioManager.playButtonClick();
            setExpanded((v) => !v);
          }}
          onPressIn={pressIn}
          onPressOut={pressOut}
          style={MSQ.header}
        >
          <View style={MSQ.headerIconWrap}>
            <Ionicons name="albums-outline" size={18} color="#10b981" />
          </View>
          <CustomText style={MSQ.headerTitle}>My Saved Questions</CustomText>
          <View style={MSQ.badge}>
            <CustomText style={MSQ.badgeNum}>{items.length}</CustomText>
          </View>
          <Animated.View
            style={{ transform: [{ translateY: expanded ? 0 : arrowY }] }}
          >
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={18}
              color="#9ca3af"
            />
          </Animated.View>
        </Pressable>
      </Animated.View>

      {/* Expandable list */}
      <Animated.View
        style={[MSQ.listWrap, { maxHeight }]}
        pointerEvents={expanded ? "auto" : "none"}
      >
        <View style={MSQ.topDivider} />
        {items.map((item, i) => (
          <React.Fragment key={item.id}>
            <SimpleQuestionCard
              item={item}
              index={i}
              listVisible={expanded}
              onTap={onTap}
            />
            {i < items.length - 1 && <View style={MSQ.rowDivider} />}
          </React.Fragment>
        ))}
      </Animated.View>
    </View>
  );
}

const MSQ = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    ...CARD_SHADOW,
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  headerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(16,185,129,0.1)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: { flex: 1, color: "#1f2937", fontSize: 14, fontWeight: "800" },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fbbf24",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeNum: { color: "#78350f", fontSize: 13, fontWeight: "900" },
  listWrap: { overflow: "hidden" },
  topDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginHorizontal: 16,
  },
  rowDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginHorizontal: 52,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfilePremiumQuestionsCard() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.authStatus === "guest");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<CustomQuestionDto[]>([]);
  const [selectedType, setSelectedType] = useState<QuestionType | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [limitPerType, setLimitPerType] = useState(10);
  const [counts, setCounts] = useState<Record<QuestionType, number>>({
    pick: 0,
    number: 0,
    input: 0,
  });
  const [deleteTarget, setDeleteTarget] = useState<CustomQuestionDto | null>(
    null,
  );

  // Input panel slide-in
  const inputAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(inputAnim, {
      toValue: selectedType !== null ? 1 : 0,
      speed: 14,
      bounciness: 7,
      useNativeDriver: false,
    } as any).start();
  }, [selectedType, inputAnim]);
  const inputMaxHeight = inputAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 260],
  });
  const inputOpacity = inputAnim.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0, 1],
  });

  // Data
  const refresh = useCallback(async () => {
    if (!user.id || !user.isPremium) return;
    setLoading(true);
    setError(null);
    try {
      const [summary, list] = await Promise.all([
        fetchUserCustomPackSummary(user.id),
        fetchUserCustomQuestions(user.id),
      ]);
      setItems(list.items ?? []);
      setLimitPerType(summary.limits.perType);
      setCounts({
        pick: summary.counts?.pick ?? 0,
        number: summary.counts?.number ?? 0,
        input: summary.counts?.input ?? 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load questions.");
    } finally {
      setLoading(false);
    }
  }, [user.id, user.isPremium]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const canCreate = useMemo(
    () =>
      selectedType !== null &&
      text.trim().length >= 3 &&
      counts[selectedType] < limitPerType,
    [text, counts, selectedType, limitPerType],
  );

  const onCreate = useCallback(async () => {
    if (!canCreate || !user.id || !selectedType) return;
    setSaving(true);
    setError(null);
    try {
      await createUserCustomQuestion(user.id, {
        text: text.trim(),
        type: selectedType,
      });
      setText("");
      setSelectedType(null);
      await refresh();
      AudioManager.playButtonClick();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create question.");
    } finally {
      setSaving(false);
    }
  }, [canCreate, user.id, text, selectedType, refresh]);

  const onDeleteConfirmed = useCallback(async () => {
    if (!deleteTarget || !user.id) return;
    setSaving(true);
    setError(null);
    try {
      await deleteUserCustomQuestion(user.id, deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setSaving(false);
    }
  }, [deleteTarget, user.id, refresh]);

  if (isGuest) return null;
  if (!user.isPremium)
    return <PromoCard onGoToStore={() => navigation.navigate("Store")} />;

  const activeM = selectedType ? TYPE_META[selectedType] : null;
  const typeFull = selectedType ? counts[selectedType] >= limitPerType : false;
  const charLimit = 160;

  return (
    <View style={C.outer}>
      {/* ── Main white card ──────────────────────────────────────── */}
      <View style={C.card}>
        {/* Header */}
        <View style={C.header}>
          <View style={C.headerIconWrap}>
            <Ionicons name="library-outline" size={20} color="#d97706" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={C.headerTitleRow}>
              <CustomText style={C.headerTitle}>My Question Pack</CustomText>
              <View style={C.premiumBadge}>
                <Ionicons name="star" size={8} color="#92400e" />
                <CustomText style={C.premiumBadgeText}>PREMIUM</CustomText>
              </View>
            </View>
            <CustomText style={C.headerSub}>
              Tap a type, write your question, and it will play in every game
              automatically!
            </CustomText>
          </View>
          {loading && <ActivityIndicator color="#d97706" size="small" />}
        </View>

        <View style={C.divider} />

        {/* Type cards */}
        <View style={C.typeSection}>
          <View style={C.typeRow}>
            {TYPES.map((type) => (
              <TypeCard
                key={type}
                type={type}
                active={selectedType === type}
                count={counts[type]}
                limit={limitPerType}
                onPress={() => {
                  AudioManager.playButtonClick();
                  setSelectedType((prev) => (prev === type ? null : type));
                  setText("");
                  setError(null);
                }}
              />
            ))}
          </View>
        </View>

        {/* Input panel — slides in when a type is selected */}
        <Animated.View
          style={[
            C.inputPanel,
            { maxHeight: inputMaxHeight, opacity: inputOpacity },
          ]}
          pointerEvents={selectedType ? "auto" : "none"}
        >
          <View style={C.inputPanelInner}>
            <View style={C.divider} />
            <View style={C.inputSection}>
              {/* Eyebrow row */}
              {activeM && (
                <View style={C.inputEyebrow}>
                  <Image
                    source={{
                      uri: selectedType ? TYPE_IMAGES[selectedType] : undefined,
                    }}
                    style={C.eyebrowImg}
                    resizeMode="contain"
                  />
                  <View style={{ flex: 1 }}>
                    <CustomText
                      style={[C.eyebrowTitle, { color: activeM.color }]}
                    >
                      New {activeM.name.toLowerCase()} question
                    </CustomText>
                    <CustomText style={C.eyebrowSub}>
                      {activeM.label}
                    </CustomText>
                  </View>
                  {typeFull && (
                    <View style={C.fullChip}>
                      <Ionicons name="lock-closed" size={10} color="#b91c1c" />
                      <CustomText style={C.fullChipText}>Full</CustomText>
                    </View>
                  )}
                </View>
              )}

              <View
                style={[
                  C.inputWrap,
                  activeM &&
                    text.length > 0 && { borderColor: activeM.accent + "80" },
                  typeFull && C.inputWrapFull,
                ]}
              >
                <TextInput
                  value={text}
                  onChangeText={(v) => setText(v.slice(0, charLimit))}
                  placeholder={
                    typeFull
                      ? "You've reached the limit for this type"
                      : (activeM?.placeholder ?? "")
                  }
                  placeholderTextColor={
                    typeFull ? "rgba(185,28,28,0.5)" : "#9ca3af"
                  }
                  multiline
                  editable={!typeFull && !!selectedType}
                  style={[C.input, activeM && { color: activeM.color }]}
                />
                {text.length > 0 && (
                  <View style={C.charRow}>
                    <CustomText
                      style={[
                        C.charCount,
                        text.length > charLimit * 0.9 && { color: "#b45309" },
                      ]}
                    >
                      {text.length} / {charLimit}
                    </CustomText>
                  </View>
                )}
              </View>

              <AddToPackButton
                enabled={canCreate && !saving}
                saving={saving}
                typeFull={typeFull}
                onPress={() => void onCreate()}
              />

              {error && (
                <View style={C.errorRow}>
                  <Ionicons name="warning-outline" size={14} color="#b91c1c" />
                  <CustomText style={C.errorText}>{error}</CustomText>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </View>

      {/* ── Saved questions / empty state ───────────────────────── */}
      {items.length > 0 ? (
        <SavedQuestionsCard
          items={items}
          onTap={(item) => setDeleteTarget(item)}
        />
      ) : !loading ? (
        <EmptyPackCard />
      ) : null}

      {/* ── Delete confirmation — centered purple popup ──────────── */}
      <PurpleConfirmModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        emoji="🗑️"
        title="Delete question?"
        body={
          deleteTarget
            ? `"${deleteTarget.text.slice(0, 72)}${deleteTarget.text.length > 72 ? "…" : ""}"`
            : ""
        }
        cancelLabel="Keep it"
        confirmLabel={saving ? "Deleting…" : "Delete"}
        confirmColors={["#dc2626", "#b91c1c"]}
        onConfirm={() => void onDeleteConfirmed()}
      />
    </View>
  );
}

const C = StyleSheet.create({
  outer: { marginHorizontal: 16, marginTop: 16, marginBottom: 20 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    ...CARD_SHADOW,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  headerTitle: { color: "#111827", fontSize: 15, fontWeight: "800" },
  headerSub: { color: "#6b7280", fontSize: 11.5, marginTop: 4, lineHeight: 17 },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(251,191,36,0.18)",
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.55)",
  },
  premiumBadgeText: {
    color: "#92400e",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.07)",
    marginHorizontal: 16,
  },
  typeSection: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 8 },
  typeRow: { flexDirection: "row", gap: 8 },

  inputPanel: { overflow: "hidden" },
  inputPanelInner: {},
  inputSection: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 12,
  },

  inputEyebrow: { flexDirection: "row", alignItems: "center", gap: 10 },
  eyebrowImg: { width: 38, height: 44, flexShrink: 0 },
  eyebrowTitle: { fontSize: 13, fontWeight: "800" },
  eyebrowSub: { color: "#9ca3af", fontSize: 11, marginTop: 1 },

  fullChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(254,226,226,0.9)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.3)",
  },
  fullChipText: { color: "#b91c1c", fontSize: 10, fontWeight: "700" },

  inputWrap: {
    borderWidth: 1.5,
    borderRadius: 14,
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "#f9fafb",
    overflow: "hidden",
  },
  inputWrapFull: {
    borderColor: "rgba(220,38,38,0.4)",
    backgroundColor: "rgba(254,226,226,0.5)",
  },
  input: {
    minHeight: 68,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    color: "#111827",
    fontSize: 14,
    lineHeight: 22,
  },
  charRow: { paddingHorizontal: 14, paddingBottom: 8, alignItems: "flex-end" },
  charCount: { color: "#9ca3af", fontSize: 10, fontWeight: "600" },

  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { color: "#b91c1c", fontSize: 12, flex: 1 },

  emptyWrap: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 8,
    marginTop: 8,
  },
  emptyImgRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyImg: { width: 52, height: 58 },
  emptyTitle: { color: "#374151", fontSize: 14, fontWeight: "800" },
  emptyText: {
    color: "#6b7280",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
