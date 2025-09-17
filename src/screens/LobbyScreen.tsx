// src/screens/LobbyScreen.tsx
import React, { useMemo } from "react";
import { View, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { backgrounds } from "../../assets/backgrounds";
import CustomText from "../components/common/CustomText";
import { useGameStore } from "../store/useGameStore";
import { HEROES } from "../data/heroes";

export default function LobbyScreen() {
  const { t } = useTranslation();

  // 1) взимаме играчите от стора
  const players = useGameStore((s) => s.players);

  // 2) подготвяме удобен масив за показване
  const rows = useMemo(
    () =>
      players.map((p, idx) => {
        const hero = HEROES.find((h) => h.id === p.characterId);
        return {
          order: idx + 1,
          name: p.name || t("unnamed_player", { defaultValue: "Unnamed" }),
          heroName: hero?.name || t("no_hero", { defaultValue: "No hero" }),
        };
      }),
    [players, t]
  );

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg001}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View className="flex-1 w-full items-center px-6 pt-16">
          <CustomText variant="h3-headline" className="text-center mb-6">
            {t("lobby_title", { defaultValue: "Lobby" })}
          </CustomText>

          {/* 3) самият списък */}
          <View className="w-full max-w-[720px] gap-3">
            {rows.length === 0 ? (
              <CustomText variant="label" className="opacity-70">
                {t("no_players_yet", { defaultValue: "No players yet…" })}
              </CustomText>
            ) : (
              rows.map((r) => (
                <View
                  key={`${r.order}-${r.name}`}
                  className="w-full flex-row items-center justify-between bg-black/30 rounded-2xl px-4 py-3"
                  style={{
                    // лека сянка
                    shadowColor: "#000",
                    shadowOpacity: 0.15,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 4,
                  }}
                >
                  <CustomText variant="footnote" className="mr-3">
                    {t("player_n_label", {
                      defaultValue: `Player ${r.order}`,
                      index: r.order,
                    })}
                  </CustomText>

                  <View className="flex-1 mx-2">
                    <CustomText variant="footnote" shadow>
                      {r.name}
                    </CustomText>
                  </View>

                  <CustomText variant="footnote" className="ml-3">
                    {r.heroName}
                  </CustomText>
                </View>
              ))
            )}
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}
