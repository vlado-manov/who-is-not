// src/components/store/ExpertComponent.tsx
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";

import CustomText from "../common/CustomText";
import { formatPrice } from "../../game/unlocks";
import { PARTY_ABOVE_TEN_ENABLED, PLAYER_LIMITS } from "../../game/playerLimits";
import { tierPlanCents, type TierPlan } from "../../services/iapConstants";

type Props = {
  /** Number of heroes in the game (shown in the benefits). */
  heroCount: number;
  onSelect: (plan: Extract<TierPlan, "expert_monthly" | "expert_lifetime">) => void;
  loading?: boolean;
};

/**
 * Expert: the whole game unlocked — every hero and outfit, every pack and
 * question type, the largest player counts. Monthly, or once for good.
 */
export default function ExpertComponent({ heroCount, onSelect, loading }: Props) {
  const { t } = useTranslation();
  const [plan, setPlan] = useState<"expert_monthly" | "expert_lifetime">("expert_lifetime");
  const price = tierPlanCents(plan);
  const partyMax =
    PARTY_ABOVE_TEN_ENABLED && heroCount > PLAYER_LIMITS.party.premium
      ? heroCount
      : PLAYER_LIMITS.party.premium;

  const benefits = [
    { icon: "⭐", text: t("store_expert_everything") },
    { icon: "🦸", text: t("store_expert_heroes", { count: heroCount }) },
    { icon: "🎉", text: t("store_expert_party", { count: partyMax }) },
    { icon: "🌍", text: t("store_expert_online") },
  ];

  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={["#1b0d3d", "#3b1478", "#1b0d3d"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <CustomText style={styles.title}>{t("store_expert_title")}</CustomText>
        <CustomText style={styles.subtitle}>{t("store_expert_subtitle")}</CustomText>

        <View style={styles.benefits}>
          {benefits.map((b) => (
            <View key={b.text} style={styles.row}>
              <CustomText style={styles.rowIcon}>{b.icon}</CustomText>
              <CustomText style={styles.rowText}>{b.text}</CustomText>
            </View>
          ))}
        </View>

        {/* Monthly / lifetime */}
        <View style={styles.toggle} accessibilityRole="radiogroup">
          {(["expert_monthly", "expert_lifetime"] as const).map((p) => {
            const on = plan === p;
            const cents = tierPlanCents(p);
            return (
              <Pressable
                key={p}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setPlan(p)}
                style={[styles.option, on && styles.optionOn]}
              >
                <CustomText style={[styles.optionLabel, on && styles.optionLabelOn]}>
                  {t(p === "expert_monthly" ? "store_plan_monthly" : "store_plan_lifetime")}
                </CustomText>
                <CustomText style={[styles.optionPrice, on && styles.optionLabelOn]}>
                  {formatPrice(cents.cents, cents.currency)}
                  {p === "expert_monthly" ? t("store_premium_price_period") : ""}
                </CustomText>
              </Pressable>
            );
          })}
        </View>
        {plan === "expert_lifetime" && (
          <CustomText style={styles.note}>{t("store_plan_lifetime_note")}</CustomText>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={() => onSelect(plan)}
          disabled={loading}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
        >
          <LinearGradient
            colors={["#C4B5FD", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <CustomText style={styles.ctaText}>
              {loading ? "..." : `${t("store_expert_cta")} · ${formatPrice(price.cents, price.currency)}`}
            </CustomText>
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(196,181,253,0.6)",
    overflow: "hidden",
  },
  card: { paddingVertical: 22, paddingHorizontal: 16, gap: 12 },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
    marginTop: -6,
  },
  benefits: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.07)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  rowIcon: { fontSize: 18 },
  rowText: { flex: 1, color: "#E8D5FF", fontSize: 15, fontWeight: "600" },
  toggle: { flexDirection: "row", gap: 8 },
  option: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.35)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  optionOn: { backgroundColor: "#FFFFFF", borderColor: "#FFFFFF" },
  optionLabel: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "700" },
  optionLabelOn: { color: "#1b0d3d" },
  optionPrice: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", marginTop: 2 },
  note: { color: "#C4B5FD", fontSize: 12, textAlign: "center", marginTop: -4 },
  cta: { borderRadius: 16, overflow: "hidden", marginTop: 4 },
  ctaGradient: { paddingVertical: 16, alignItems: "center", borderRadius: 16 },
  ctaText: { color: "#1b0d3d", fontSize: 17, fontWeight: "900", letterSpacing: 0.3 },
});
