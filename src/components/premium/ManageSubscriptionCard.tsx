// src/components/premium/ManageSubscriptionCard.tsx
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import CustomText from "../common/CustomText";
import CustomButton from "../common/CustomButton";
import { TT } from "../../constants/tiktokTheme";
import { useEntitlements } from "../../store/useEntitlements";
import { useDemoUnlocks } from "../../store/useDemoUnlocks";
import { useAuthStore } from "../../store/useUserStore";
import { openManageSubscription } from "../../services/subscriptionManagement";
import { DEMO_PURCHASES } from "../../services/purchases";

/**
 * "Your subscription" with a one-tap way to manage or cancel it in the App
 * Store / Google Play. Shown only with a membership. A lifetime Expert has
 * nothing to cancel — unless a monthly subscription bought earlier is still
 * being billed, which then gets the button too.
 */
export default function ManageSubscriptionCard({
  style,
}: {
  /** Outer spacing from the screen it sits in. */
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTranslation();
  const ent = useEntitlements();
  const demoTier = useDemoUnlocks((s) => s.tier);
  const demoLifetime = useDemoUnlocks((s) => s.lifetime);
  const clearDemoTier = useDemoUnlocks((s) => s.clearTier);
  const expiresAt = useAuthStore((s) => s.user.premiumExpiresAt);

  if (ent.tier === "NONE") return null;

  const storeBilled = ent.server.hasActiveStoreSubscription;
  // The demo tier is what is shown and nothing real is billed: "cancelling" ends the demo.
  const fromDemo = DEMO_PURCHASES && demoTier === ent.tier && !storeBilled;
  const showButton = storeBilled || (fromDemo && !demoLifetime);
  const tierName = t(ent.isExpert ? "store_expert_title" : "store_premium_name");

  let body: string;
  if (ent.lifetime) {
    body = storeBilled
      ? t("store_lifetime_with_sub_note")
      : t("sub_lifetime_nothing_to_cancel");
  } else if (!showButton) body = t("sub_manage_granted");
  else if (expiresAt && !fromDemo)
    body = t("sub_manage_until", { date: new Date(expiresAt).toLocaleDateString() });
  else body = t("sub_manage_body");

  return (
    <View style={[styles.card, style]}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <Ionicons
            name={ent.isExpert ? "diamond-outline" : "star-outline"}
            size={18}
            color={TT.text}
          />
        </View>
        <View style={styles.texts}>
          <CustomText variant="label" textColor={TT.text}>
            {t("sub_manage_title")} · {tierName}
          </CustomText>
          <CustomText variant="p-small" textColor={TT.text2} allowWrap>
            {body}
          </CustomText>
        </View>
      </View>
      {showButton && (
        <CustomButton
          title={fromDemo ? t("sub_demo_clear") : t("sub_manage_cta")}
          appearance="secondary"
          fullWidth
          btnSize="sm"
          fontSize="sm"
          onPress={() => (fromDemo ? clearDemoTier() : void openManageSubscription())}
          iconNode={<Ionicons name="open-outline" size={15} color={TT.text} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: TT.surface,
    borderRadius: TT.cardRadius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  texts: { flex: 1, gap: 2 },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: TT.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
});
