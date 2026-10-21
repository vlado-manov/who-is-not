import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { game_images } from "../../../../assets/images";
import LogoSheetLayout from "../../../components/LogoSheetLayout";
import PlayerCountSheet from "../../../components/PlayerCountSheet";
import { CAM_MAX_PLAYERS, CAM_MIN_PLAYERS } from "../cam.constants";

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
          hint={status === "error" ? t("cam_load_failed") : t("cam_players_hint")}
          min={CAM_MIN_PLAYERS}
          max={CAM_MAX_PLAYERS}
          selected={selected}
          onSelect={setSelected}
          confirmLabel={t("continue_btn")}
          onConfirm={onConfirm}
          loading={loading}
        />
      </LogoSheetLayout>
    </View>
  );
}
