// src/components/premium/PlayerLimitSheet.tsx
import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import { openStoreOverlay } from "../../navigation/openStoreOverlay";
import { useTranslation } from "react-i18next";

import CamButton from "../cam/CamButton";
import CamSheet from "../cam/CamSheet";
import CamText from "../cam/CamText";
import { formatPrice } from "../../game/unlocks";
import type { LockReason } from "../../game/playerLimits";
import { tierPlanCents, type TierPlan } from "../../services/iapConstants";
import { purchaseItem } from "../../services/purchases";
import { useAuthStore } from "../../store/useUserStore";

type Props = {
  visible: boolean;
  /** Online lobby: the room keeps going, so no leaving it for the store. */
  allowStore?: boolean;
  /** The locked player count that was tapped. */
  count: number | null;
  reason: LockReason | null;
  onClose: () => void;
};

const price = (plan: TierPlan) => {
  const p = tierPlanCents(plan);
  return formatPrice(p.cents, p.currency);
};

/**
 * Why a player count is locked and what unlocks it: Premium, Expert, or more
 * heroes. Buying here unlocks the count at once (the picker reads membership
 * live), so the player stays on the screen they were on.
 */
export default function PlayerLimitSheet({
  visible,
  count,
  reason,
  onClose,
  allowStore = true,
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const userId = useAuthStore((s) => s.user.id);
  const [buying, setBuying] = useState(false);

  if (!reason || count === null) return null;

  const buy = async (plan: TierPlan) => {
    setBuying(true);
    const outcome = await purchaseItem({ kind: "TIER", plan }, userId);
    setBuying(false);
    if (outcome.success) onClose();
    else Alert.alert(t("required_alert_title"), outcome.error ?? t("lock_purchase_failed"));
  };

  const browseHeroes = () => {
    onClose();
    openStoreOverlay(navigation);
  };

  let body: string;
  switch (reason.kind) {
    case "PREMIUM":
      body = t("limit_premium_body", { count, free: reason.free });
      break;
    case "PREMIUM_AND_HEROES":
      body = t("limit_premium_heroes_body", { count });
      break;
    case "MORE_HEROES":
      body = t("limit_more_heroes_body", { owned: reason.owned, missing: reason.missing });
      break;
    case "ROOM_PERK":
      body = t("limit_room_perk_body");
      break;
  }

  const premiumCta = (
    <CamButton
      key="premium"
      title={t("limit_cta_premium", { price: price("premium_monthly") })}
      onPress={() => void buy("premium_monthly")}
    />
  );
  const expertCtas = [
    <CamButton
      key="expert_lifetime"
      variant="secondary"
      title={t("limit_cta_expert_lifetime", { price: price("expert_lifetime") })}
      onPress={() => void buy("expert_lifetime")}
    />,
    <CamButton
      key="expert_monthly"
      variant="secondary"
      title={t("limit_cta_expert_monthly", { price: price("expert_monthly") })}
      onPress={() => void buy("expert_monthly")}
    />,
  ];
  const heroesCta = (
    <CamButton
      key="heroes"
      variant="secondary"
      title={t("limit_cta_browse_heroes")}
      onPress={browseHeroes}
    />
  );

  let ctas: React.ReactNode[];
  switch (reason.kind) {
    case "PREMIUM":
      ctas = [premiumCta, ...expertCtas];
      break;
    case "PREMIUM_AND_HEROES":
      // Expert covers both: membership and every hero.
      ctas = [...expertCtas, premiumCta];
      break;
    case "MORE_HEROES":
      ctas = allowStore ? [heroesCta, ...expertCtas] : expertCtas;
      break;
    case "ROOM_PERK":
      ctas = allowStore ? [heroesCta] : [];
      break;
  }

  return (
    <CamSheet
      visible={visible}
      onClose={onClose}
      title={t("limit_sheet_title", { count })}
      closeLabel={t("close")}
    >
      <View style={styles.body}>
        <CamText variant="subtitle" center>
          {body}
        </CamText>
        {buying ? <ActivityIndicator size="large" color="#FFFFFF" /> : ctas}
      </View>
    </CamSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 12 },
});
