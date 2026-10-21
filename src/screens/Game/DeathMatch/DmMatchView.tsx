// src/screens/Game/DeathMatch/DmMatchView.tsx
import React from "react";

import { DmScoreContext, type DmScore } from "./components/DmFrame";
import { DM_HIDDEN_STOP } from "./dm.constants";
import type { DmPlayerView, DmSettings, DmState } from "./dm.types";
import { getLastResult, getMatchWinnerId, getOtherPlayerId } from "./dmReducer";
import DmPassPhase from "./phases/DmPassPhase";
import DmRoundResultPhase from "./phases/DmRoundResultPhase";
import DmSettingsPhase from "./phases/DmSettingsPhase";
import DmStopwatchPhase, { DmWatchingPhase } from "./phases/DmStopwatchPhase";
import DmTargetRevealPhase from "./phases/DmTargetRevealPhase";

type Props = {
  state: DmState;
  players: Record<string, DmPlayerView>;
  /** Online: the finalist holding this phone. Null on a shared phone. */
  meId: string | null;
  canChooseSettings: boolean;
  /** Who sets the duel up, for the other finalist's waiting note. */
  chooserName: string;
  /** Online: this finalist's own time in the current round, once stopped. */
  myStopMs: number | null;
  onConfirmSettings: (settings: DmSettings) => void;
  onStopped: (elapsedMs: number) => void;
  /** Pass & play only — online the referee moves on by itself. */
  onAckTarget?: () => void;
  onHandoffDone?: () => void;
  onAckResult?: () => void;
};

/** Rounds that counted so far (a tied round is replayed under the same number). */
function countDecided(state: DmState): number {
  return state.history.filter((r) => r.winnerId !== null).length;
}

/** Wraps the phase with the running score while a best-2-of-3 duel is on. */
export default function DmMatchView(props: Props) {
  const { state, players } = props;
  const [a, b] = state.playerIds;
  const score: DmScore | null =
    state.settings?.format === "bestOf3" && state.phase.kind !== "settings"
      ? {
          left: { name: players[a]?.name ?? "", wins: state.wins[a] ?? 0 },
          right: { name: players[b]?.name ?? "", wins: state.wins[b] ?? 0 },
        }
      : null;
  return (
    <DmScoreContext.Provider value={score}>
      <DmPhaseView {...props} />
    </DmScoreContext.Provider>
  );
}

/** Shows the duel phase the match is in. Shared by pass & play and online. */
function DmPhaseView({
  state,
  players,
  meId,
  canChooseSettings,
  chooserName,
  myStopMs,
  onConfirmSettings,
  onStopped,
  onAckTarget,
  onHandoffDone,
  onAckResult,
}: Props) {
  const { phase, round, settings } = state;
  const blind = settings?.visibility === "blind";
  const name = (id: string) => players[id]?.name ?? "";

  if (phase.kind === "settings" || !round || !settings) {
    return (
      <DmSettingsPhase
        canChoose={canChooseSettings}
        chooserName={chooserName}
        onConfirm={onConfirmSettings}
      />
    );
  }

  if (phase.kind === "targetReveal") {
    return (
      <DmTargetRevealPhase
        key={round.index}
        roundNumber={countDecided(state) + 1}
        targetMs={round.targetMs}
        starterName={name(round.starterId)}
        blind={blind}
        onContinue={onAckTarget}
      />
    );
  }

  if (phase.kind === "pass") {
    const otherId = getOtherPlayerId(state, phase.playerId);
    return (
      <DmPassPhase
        key={`${round.index}-${phase.playerId}`}
        toName={name(phase.playerId)}
        lockedName={otherId in round.stops ? name(otherId) : undefined}
        onReady={() => onHandoffDone?.()}
      />
    );
  }

  if (phase.kind === "turn") {
    const isMine = meId === null || phase.playerId === meId;
    if (!isMine) {
      return (
        <DmWatchingPhase
          opponentName={name(phase.playerId)}
          targetMs={round.targetMs}
          blind={blind}
          myStopMs={myStopMs}
        />
      );
    }
    return (
      <DmStopwatchPhase
        // A fresh stopwatch for every attempt.
        key={`${round.index}-${phase.playerId}`}
        playerName={name(phase.playerId)}
        targetMs={round.targetMs}
        blind={blind}
        confirmToContinue={meId === null}
        onStopped={onStopped}
      />
    );
  }

  // roundResult, and `done` for the moment before the screen leaves.
  const result = getLastResult(state);
  const [a, b] = state.playerIds;
  if (!result || !players[a] || !players[b]) return null;
  const hasTimes =
    result.stops[a] !== DM_HIDDEN_STOP && result.stops[b] !== DM_HIDDEN_STOP;
  if (!hasTimes) return null;
  return (
    <DmRoundResultPhase
      roundNumber={countDecided(state) + (result.winnerId === null ? 1 : 0)}
      result={result}
      players={[players[a], players[b]]}
      onContinue={phase.kind === "roundResult" ? onAckResult : undefined}
    />
  );
}
