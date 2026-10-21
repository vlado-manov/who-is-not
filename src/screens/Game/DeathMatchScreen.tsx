// src/screens/Game/DeathMatchScreen.tsx
import { resolvePlayerHero } from "../../game/resolvePlayerHero";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import {
  CommonActions,
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { GameMode } from "../../api/analytics";
import AppImage from "../../components/AppImage";
import FullBleedStack from "../../components/FullBleedStack";
import { usePreventBack } from "../../hooks/usePreventBack";
import AudioManager from "../../utils/audioManager";
import { GameStackParamList } from "../../navigation/types";
import { useGameStore } from "../../store/useGameStore";
import { useHeroesStore } from "../../store/useHeroesStore";
import { DM_BG_URIS } from "./DeathMatch/dm.constants";
import type { DmPlayerView } from "./DeathMatch/dm.types";
import { resolveRefereeId } from "./DeathMatch/dmReducer";
import LocalDeathMatch from "./DeathMatch/LocalDeathMatch";
import OnlineDeathMatch from "./DeathMatch/OnlineDeathMatch";
import DmHowToPlayPhase from "./DeathMatch/phases/DmHowToPlayPhase";
import DmIntroPhase from "./DeathMatch/phases/DmIntroPhase";

type Nav = StackNavigationProp<GameStackParamList, "DeathMatch">;

type Stage = "intro" | "how_to_play" | "match";

/**
 * Sudden Death between the last two players: a stopwatch duel. The game picks
 * a target time, each finalist stops the watch as close to it as they can, and
 * the closer one wins. See DEATHMATCH_GAMEPLAY_PLAN.md.
 */
export default function DeathMatchScreen() {
  const navigation = useNavigation<Nav>();
  usePreventBack();
  // The duel has its own music, from the intro to the last round.
  useFocusEffect(
    useCallback(() => {
      void AudioManager.playDeathMatchBg();
    }, []),
  );

  const players = useGameStore((s) => s.players);
  const lives = useGameStore((s) => s.lives);
  const mode = useGameStore((s) => s.mode) as GameMode;
  const gameId = useGameStore((s) => s.gameId);
  const onlinePlayerId = useGameStore((s) => s.onlinePlayerId);
  const onlineIsHost = useGameStore((s) => s.onlineIsHost);
  const setDeathMatchWinners = useGameStore((s) => s.setDeathMatchWinners);
  const heroes = useHeroesStore((s) => s.heroes);

  const [stage, setStage] = useState<Stage>("intro");
  const doneRef = useRef(false);

  const dmBgUri = useMemo(
    () => DM_BG_URIS[Math.floor(Math.random() * DM_BG_URIS.length)],
    [],
  );

  const alivePlayers = useMemo(
    () => players.filter((p) => (lives[p.id] ?? 0) > 0),
    [lives, players],
  );

  /** The two finalists, in `players` order, with the art each phase needs. */
  const finalists = useMemo((): [DmPlayerView, DmPlayerView] | null => {
    const [p0, p1] = alivePlayers;
    if (!p0 || !p1) return null;
    const toView = (p: typeof p0): DmPlayerView => {
      const hero = resolvePlayerHero(heroes, p);
      return {
        id: p.id,
        name: p.name,
        profileImage: hero?.profileImage ?? null,
        heroImage: hero?.deathmatch_image ?? null,
      };
    };
    return [toView(p0), toView(p1)];
  }, [alivePlayers, heroes]);

  const isDevGame = gameId?.startsWith("dev_") === true;
  // Dev lab has one phone: it referees and plays the opponent itself.
  const refereeId = useMemo(
    () =>
      isDevGame
        ? (onlinePlayerId ?? null)
        : resolveRefereeId(alivePlayers.slice(0, 2)),
    [alivePlayers, isDevGame, onlinePlayerId],
  );

  const finish = useCallback(
    (winnerIds: string[]) => {
      if (doneRef.current) return;
      doneRef.current = true;
      setDeathMatchWinners(winnerIds);
      const iLost =
        mode === "ONLINE" &&
        onlinePlayerId != null &&
        !winnerIds.includes(onlinePlayerId);
      if (iLost) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: "PlayerDeath",
                params: { variant: "continue", deadPlayerId: onlinePlayerId },
              },
            ],
          }),
        );
      } else {
        navigation.dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: "Winner" }] }),
        );
      }
    },
    [navigation, setDeathMatchWinners, mode, onlinePlayerId],
  );

  const renderStage = () => {
    if (!finalists) return null;
    const [p0, p1] = finalists;

    if (stage === "intro") {
      // Online the local player stands on the left.
      const swap = mode === "ONLINE" && onlinePlayerId === p1.id;
      return (
        <DmIntroPhase
          leftHeroImage={swap ? p1.heroImage : p0.heroImage}
          rightHeroImage={swap ? p0.heroImage : p1.heroImage}
          onDone={() => setStage("how_to_play")}
        />
      );
    }
    if (stage === "how_to_play") {
      return <DmHowToPlayPhase onDone={() => setStage("match")} />;
    }
    if (mode === "ONLINE") {
      if (!onlinePlayerId || !refereeId) return null;
      return (
        <OnlineDeathMatch
          finalists={finalists}
          meId={onlinePlayerId}
          refereeId={refereeId}
          isHost={onlineIsHost === true}
          simulateOpponent={isDevGame}
          onFinished={finish}
        />
      );
    }
    return <LocalDeathMatch finalists={finalists} onFinished={finish} />;
  };

  return (
    <FullBleedStack
      rootStyle={styles.root}
      backdrop={
        <AppImage
          source={{ uri: dmBgUri }}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
        />
      }
    >
      {renderStage()}
    </FullBleedStack>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
});
