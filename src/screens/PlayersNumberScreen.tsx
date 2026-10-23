// src/screens/PlayersNumberScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";

import { game_images } from "../../assets/images";
import { trackPlayerSessionStarted } from "../api/analytics";
import CamSettingsSheet from "../components/cam/CamSettingsSheet";
import LogoSheetLayout from "../components/LogoSheetLayout";
import PlayerCountSheet from "../components/PlayerCountSheet";
import { goBackFromCreateGameToMenu } from "../navigation/goBackFromCreateGameToMenu";
import { CreateGameStackParamList } from "../navigation/types";
import { useGameStore } from "../store/useGameStore";
import { useAuthStore } from "../store/useUserStore";
import { useEntitlements, useRefreshEntitlementsOnMount } from "../store/useEntitlements";
import { getPartyLimit, PLAYER_LIMITS, type LockReason } from "../game/playerLimits";
import PlayerLimitSheet from "../components/premium/PlayerLimitSheet";

type Nav = StackNavigationProp<CreateGameStackParamList, "PlayersNumber">;

/**
 * Party mode: how many players. Logo over the game background, and the count
 * picker in the white sheet below — the same layout as online host and Cam Mode.
 */
const PlayersNumberScreen = () => {
  const [players, setPlayers] = useState<number | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const beginLocalGame = useGameStore((s) => s.beginLocalGame);
  const startGameSession = useGameStore((s) => s.startGameSession);
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const userId = useAuthStore((s) => s.user.id);
  const ent = useEntitlements();
  useRefreshEntitlementsOnMount();
  // 3–6 free, up to 10 with Premium; above 10 a hero for every player.
  const limit = useMemo(
    () =>
      getPartyLimit({
        tier: ent.tier,
        unlockedHeroCount: ent.unlockedHeroIds.size,
        totalHeroCount: ent.totalHeroCount,
      }),
    [ent.tier, ent.unlockedHeroIds, ent.totalHeroCount],
  );
  const [locked, setLocked] = useState<{ count: number; reason: LockReason } | null>(null);

  // Membership ended while here: a chosen count above the limit is cleared.
  useEffect(() => {
    if (players !== null && players > limit.max) setPlayers(null);
  }, [limit.max, players]);

  const onContinue = (count: number) => {
    void trackPlayerSessionStarted({
      userId,
      source: "CREATE_GAME",
      step: "players_count_confirmed",
      mode: "LOCAL",
      language: i18n.language,
      playersCount: count,
    }).catch((e) => {
      console.warn(
        "track PLAYER_SESSION_STARTED(players_count_confirmed) failed",
        e,
      );
    });
    beginLocalGame(count);
    startGameSession("LOCAL");
    navigation.navigate("HeroPicker", { index: 1 });
  };

  return (
    <>
      <LogoSheetLayout
        overlaySource={game_images.playersNumberLogoOverlay}
        onBack={() => goBackFromCreateGameToMenu(navigation)}
        backLabel={t("players_back_menu", { defaultValue: "Menu" })}
        onSettings={() => setSettingsVisible(true)}
        settingsLabel={t("game_settings")}
        helpMode="party"
      >
        <PlayerCountSheet
          title={t("cam_players_title")}
          hint={
            ent.isPremium
              ? t("players_hint_party_premium", { max: limit.max })
              : t("players_hint_party_free", {
                  free: PLAYER_LIMITS.party.free,
                  premium: PLAYER_LIMITS.party.premium,
                })
          }
          min={limit.min}
          max={limit.shownMax}
          selected={players}
          onSelect={setPlayers}
          isLocked={(count) => limit.lockOf(count) !== null}
          onLockedPress={(count) => {
            const reason = limit.lockOf(count);
            if (reason) setLocked({ count, reason });
          }}
          confirmLabel={t("continue_btn")}
          onConfirm={onContinue}
        />
      </LogoSheetLayout>

      <CamSettingsSheet
        visible={settingsVisible}
        showDiscussionTime
        onClose={() => setSettingsVisible(false)}
      />

      <PlayerLimitSheet
        visible={locked !== null}
        count={locked?.count ?? null}
        reason={locked?.reason ?? null}
        onClose={() => setLocked(null)}
      />
    </>
  );
};

export default PlayersNumberScreen;
