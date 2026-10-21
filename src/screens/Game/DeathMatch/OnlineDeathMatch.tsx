// src/screens/Game/DeathMatch/OnlineDeathMatch.tsx
import React from "react";

import type { DmPlayerView } from "./dm.types";
import DmMatchView from "./DmMatchView";
import { useOnlineDeathMatch } from "./useOnlineDeathMatch";

type Props = {
  finalists: [DmPlayerView, DmPlayerView];
  meId: string;
  refereeId: string;
  isHost: boolean;
  simulateOpponent: boolean;
  onFinished: (winnerIds: string[]) => void;
};

/**
 * Online duel: each finalist on their own phone. The referee's phone decides
 * and moves the match on; this component only shows the shared state.
 */
export default function OnlineDeathMatch({
  finalists,
  meId,
  refereeId,
  isHost,
  simulateOpponent,
  onFinished,
}: Props) {
  const [a, b] = finalists;
  const match = useOnlineDeathMatch({
    playerIds: [a.id, b.id],
    meId,
    refereeId,
    isHost,
    simulateOpponent,
    onFinished,
  });
  const players = { [a.id]: a, [b.id]: b };

  return (
    <DmMatchView
      state={match.state}
      players={players}
      meId={meId}
      canChooseSettings={match.isReferee}
      chooserName={players[refereeId]?.name ?? ""}
      myStopMs={match.myStopMs}
      onConfirmSettings={match.confirmSettings}
      onStopped={match.submitStop}
    />
  );
}
