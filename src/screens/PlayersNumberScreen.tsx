// src/screens/PlayersNumberScreen.tsx
import React, { useState } from "react";
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

type Nav = StackNavigationProp<CreateGameStackParamList, "PlayersNumber">;

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 10;

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
          hint={t("max_characters_players")}
          min={MIN_PLAYERS}
          max={MAX_PLAYERS}
          selected={players}
          onSelect={setPlayers}
          confirmLabel={t("continue_btn")}
          onConfirm={onContinue}
        />
      </LogoSheetLayout>

      <CamSettingsSheet
        visible={settingsVisible}
        showDiscussionTime
        onClose={() => setSettingsVisible(false)}
      />
    </>
  );
};

export default PlayersNumberScreen;
