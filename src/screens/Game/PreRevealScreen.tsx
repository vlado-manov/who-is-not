import { resolvePlayerHero } from "../../game/resolvePlayerHero";
import React, { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { GameStackParamList } from "../../navigation/types";
import PreRevealLoadingLayer, {
  REEL_ENDING_NAMES,
  type PreRevealPlayer,
} from "../../components/PreRevealLoadingLayer";
import { usePreventBack } from "../../hooks/usePreventBack";
import { useGameStore } from "../../store/useGameStore";
import { useHeroesStore } from "../../store/useHeroesStore";

type PreRevealNavProp = StackNavigationProp<GameStackParamList, "PreReveal">;

const PreRevealScreen = () => {
  const navigation = useNavigation<PreRevealNavProp>();
  usePreventBack();

  const players = useGameStore((s) => s.players);
  const lives = useGameStore((s) => s.lives);
  const oddOneId = useGameStore((s) => s.oddOneId);
  const mode = useGameStore((s) => s.mode);
  const round = useGameStore((s) => s.round);
  const heroes = useHeroesStore((s) => s.heroes);

  /** The players still in the game, as they appear on the reel. */
  const reelPlayers = useMemo((): PreRevealPlayer[] => {
    const alive = players.filter(
      (p) => (lives[p.id] ?? 0) > 0 || p.id === oddOneId,
    );
    return alive.map((p) => ({
      id: p.id,
      name: p.name,
      image: resolvePlayerHero(heroes, p)?.profileImage ?? null,
    }));
  }, [heroes, lives, oddOneId, players]);

  /**
   * Which of the reel's endings this round gets. It is derived from the round
   * and the impostor rather than drawn at random on each phone, so online
   * every phone shows the same ending and reaches the reveal together — while
   * nobody can tell in advance which one it will be.
   */
  const ending = useMemo(() => {
    const seed = `${round}:${oddOneId ?? ""}`;
    let sum = 0;
    for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
    return REEL_ENDING_NAMES[sum % REEL_ENDING_NAMES.length];
  }, [oddOneId, round]);

  const onDone = useCallback(() => {
    navigation.replace("Reveal");
  }, [navigation]);

  if (mode === "ONLINE") {
    // Every phone is here at the same moment: the reel starts by itself so
    // they all reach the reveal together.
    return (
      <PreRevealLoadingLayer
        players={reelPlayers}
        targetId={oddOneId ?? null}
        autoStart
        ending={ending}
        onDone={onDone}
      />
    );
  }
  // Pass & play: whoever holds the phone presses the button.
  return (
    <PreRevealLoadingLayer
      players={reelPlayers}
      targetId={oddOneId ?? null}
      autoStart={false}
      ending={ending}
      onDone={onDone}
    />
  );
};

export default PreRevealScreen;
