import React, { useEffect, useMemo } from "react";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { GameMode } from "../../api/analytics";
import {
  subscribeMultiplayerRelay,
  disconnectMultiplayerRelay,
} from "../../api/multiplayerRelay";
import {
  HOST_CLOSE_SESSION_MESSAGE_TYPE,
  HOST_SESSION_NEW_HEROES_MESSAGE_TYPE,
  HOST_SESSION_RESTART_MESSAGE_TYPE,
  PLAYER_LEFT_GAME_MESSAGE_TYPE,
} from "../../constants/onlineLobby";
import { GameStackParamList } from "../../navigation/types";
import { useGameStore } from "../../store/useGameStore";
import { useRoomNotificationStore } from "../../store/useRoomNotificationStore";

type Nav = StackNavigationProp<GameStackParamList>;

/**
 * Guests follow host session actions; shows presence notifications.
 * Mount inside Game stack so navigation targets Round / parent CreateGame.
 */
export default function OnlineSessionSyncListener() {
  const navigation = useNavigation<Nav>();
  const parentNav = navigation.getParent();
  const mode = useGameStore((s) => s.mode) as GameMode;
  const onlinePlayerId = useGameStore((s) => s.onlinePlayerId);
  const players = useGameStore((s) => s.players);
  const restartWithSamePlayersAndHeroes = useGameStore(
    (s) => s.restartWithSamePlayersAndHeroes
  );
  const resetGameState = useGameStore((s) => s.reset);
  const reset = useGameStore((s) => s.reset);
  const showBanner = useRoomNotificationStore((s) => s.show);

  const hostPlayerId = useMemo(
    () => players.find((p) => p.isHost)?.id,
    [players]
  );

  useEffect(() => {
    if (mode !== "ONLINE") return;
    const unsub = subscribeMultiplayerRelay((raw) => {
      const d = raw as {
        type?: string;
        fromPlayerId?: string;
        playerId?: string;
      };

      if (d.type === "player_disconnected" && typeof d.playerId === "string") {
        if (d.playerId === onlinePlayerId) return;
        const name = players.find((p) => p.id === d.playerId)?.name ?? "?";
        showBanner(`player_disconnected:${d.playerId}:${name}`);
        return;
      }

      if (d.type === PLAYER_LEFT_GAME_MESSAGE_TYPE) {
        if (typeof d.fromPlayerId !== "string") return;
        if (d.fromPlayerId === onlinePlayerId) return;
        const name = players.find((p) => p.id === d.fromPlayerId)?.name ?? "?";
        showBanner(`player_left:${d.fromPlayerId}:${name}`);
        return;
      }

      if (!hostPlayerId || d.fromPlayerId !== hostPlayerId) return;
      if (d.fromPlayerId === onlinePlayerId) return;

      if (d.type === HOST_SESSION_RESTART_MESSAGE_TYPE) {
        restartWithSamePlayersAndHeroes();
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Round" }],
          })
        );
        return;
      }

      if (d.type === HOST_SESSION_NEW_HEROES_MESSAGE_TYPE) {
        resetGameState();
        parentNav?.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: "CreateGame",
                state: {
                  index: 0,
                  routes: [{ name: "PlayersNumber" }],
                },
              },
            ],
          })
        );
        return;
      }

      if (d.type === HOST_CLOSE_SESSION_MESSAGE_TYPE) {
        disconnectMultiplayerRelay();
        reset();
        parentNav?.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Onboarding", params: { screen: "Menu" } }],
          })
        );
      }
    });
    return unsub;
  }, [
    hostPlayerId,
    mode,
    navigation,
    onlinePlayerId,
    parentNav,
    players,
    reset,
    resetGameState,
    restartWithSamePlayersAndHeroes,
    showBanner,
  ]);

  return null;
}
