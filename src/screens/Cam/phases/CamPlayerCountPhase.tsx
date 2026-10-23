import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { game_images } from "../../../../assets/images";
import LogoSheetLayout from "../../../components/LogoSheetLayout";
import PlayerCountSheet from "../../../components/PlayerCountSheet";
import PlayerLimitSheet from "../../../components/premium/PlayerLimitSheet";
import { getCamLimit, PLAYER_LIMITS, type LockReason } from "../../../game/playerLimits";
import { useEntitlements, useRefreshEntitlementsOnMount } from "../../../store/useEntitlements";

type Props = {
  status: "idle" | "loading" | "error";
  /** Called only when the choice is confirmed; this starts loading the questions. */
  onConfirm: (count: number) => void;
  onOpenSettings: () => void;
  onExit: () => void;
};

/**
 * Player count for Cam Mode, full screen over the camera: the same logo-and-
 * sheet layout as party mode. Pick a number, then confirm.
 */
export default function CamPlayerCountPhase({
  status,
  onConfirm,
  onOpenSettings,
  onExit,
}: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
  const loading = status === "loading";
  const { tier, isPremium } = useEntitlements();
  useRefreshEntitlementsOnMount();
  // 3–4 free, up to 9 with Premium.
  const limit = useMemo(() => getCamLimit({ tier }), [tier]);
  const [locked, setLocked] = useState<{ count: number; reason: LockReason } | null>(null);

  useEffect(() => {
    if (selected !== null && selected > limit.max) setSelected(null);
  }, [limit.max, selected]);

  const hint =
    status === "error"
      ? t("cam_load_failed")
      : isPremium
        ? t("cam_players_hint")
        : t("cam_players_hint_free", {
            free: PLAYER_LIMITS.cam.free,
            premium: PLAYER_LIMITS.cam.premium,
          });

  return (
    <View style={StyleSheet.absoluteFill}>
      <LogoSheetLayout
        overlaySource={game_images.playersNumberLogoOverlay}
        onBack={onExit}
        backLabel={t("cam_exit")}
        // No settings while the questions are loading.
        onSettings={loading ? undefined : onOpenSettings}
        settingsLabel={t("game_settings")}
        helpMode="cam"
      >
        <PlayerCountSheet
          title={t("cam_players_title")}
          hint={hint}
          min={limit.min}
          max={limit.shownMax}
          selected={selected}
          onSelect={setSelected}
          isLocked={(count) => limit.lockOf(count) !== null}
          onLockedPress={(count) => {
            const reason = limit.lockOf(count);
            if (reason) setLocked({ count, reason });
          }}
          confirmLabel={t("continue_btn")}
          onConfirm={onConfirm}
          loading={loading}
        />
      </LogoSheetLayout>

      <PlayerLimitSheet
        visible={locked !== null}
        count={locked?.count ?? null}
        reason={locked?.reason ?? null}
        onClose={() => setLocked(null)}
      />
    </View>
  );
}
