// src/screens/HeroPicker/UnlockSheet.tsx
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import CamButton from "../../components/cam/CamButton";
import CamSheet from "../../components/cam/CamSheet";
import CamText from "../../components/cam/CamText";
import { formatPrice, unlockOf } from "../../game/unlocks";
import { PARTY_ABOVE_TEN_ENABLED, PLAYER_LIMITS } from "../../game/playerLimits";
import type { ICharacter } from "../../types/character";

type Props = {
  visible: boolean;
  /** The hero or skin that is locked. */
  item: ICharacter | null;
  /** For a skin whose hero is still locked: that hero (it must come first). */
  lockedHero: ICharacter | null;
  onClose: () => void;
  /** Resolves when the purchase finished; true = unlocked. */
  onBuy: () => Promise<boolean>;
  /** Opens the store (Expert: every hero and outfit). */
  onOpenStore?: () => void;
};

/**
 * Why something is locked and how to get it: buy it, earn it by playing, or
 * either. A skin of a locked hero only says to unlock the hero first.
 */
export default function UnlockSheet({
  visible,
  item,
  lockedHero,
  onClose,
  onBuy,
  onOpenStore,
}: Props) {
  const { t } = useTranslation();
  const [buying, setBuying] = useState(false);
  if (!item) return null;
  const unlock = unlockOf(item);
  const action = unlock.action;
  const sold = unlock.mode === "BUY" || unlock.mode === "BUY_OR_ACTION";
  const price = unlock.discountPrice ?? unlock.price;
  const isBaseHero = !item.parentCharacterId;

  const buy = async () => {
    setBuying(true);
    try {
      await onBuy();
    } finally {
      setBuying(false);
    }
  };

  return (
    <CamSheet visible={visible} onClose={onClose} title={item.name} closeLabel={t("close")}>
      {lockedHero ? (
        <CamText variant="subtitle" center>
          {t("lock_requires_hero", { hero: lockedHero.name })}
        </CamText>
      ) : (
        <View style={styles.body}>
          {sold ? (
            buying ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <CamButton
                title={t("lock_buy_cta", { price: formatPrice(price) })}
                onPress={() => void buy()}
              />
            )
          ) : null}

          {sold && action ? (
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <CamText variant="subtitle">{t("lock_or")}</CamText>
              <View style={styles.orLine} />
            </View>
          ) : null}

          {action ? (
            <View style={styles.action}>
              <CamText variant="body" center>
                {t("lock_action_games", { count: action.target })}
              </CamText>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${Math.min(100, (action.progress / Math.max(1, action.target)) * 100)}%` },
                  ]}
                />
              </View>
              <CamText variant="subtitle" center>
                {t("lock_progress", { current: Math.min(action.progress, action.target), target: action.target })}
              </CamText>
            </View>
          ) : null}

          {/* What a hero adds besides itself: a bought one an online place,
              any one a bigger one-phone game. */}
          {isBaseHero && sold ? (
            <CamText variant="subtitle" center>
              {t("lock_hero_perk_note", { max: PLAYER_LIMITS.online.max })}
            </CamText>
          ) : null}
          {isBaseHero && !sold && PARTY_ABOVE_TEN_ENABLED ? (
            <CamText variant="subtitle" center>
              {t("lock_hero_party_note")}
            </CamText>
          ) : null}

          {onOpenStore ? (
            <CamButton
              variant="secondary"
              title={t("lock_expert_upsell")}
              onPress={() => {
                onClose();
                onOpenStore();
              }}
            />
          ) : null}
        </View>
      )}
    </CamSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 16,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  action: {
    gap: 10,
  },
  track: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  fill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: "#FFD966",
  },
});
