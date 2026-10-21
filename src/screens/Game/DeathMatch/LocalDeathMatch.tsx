// src/screens/Game/DeathMatch/LocalDeathMatch.tsx
import React, { useEffect, useReducer } from "react";

import type { DmPlayerView } from "./dm.types";
import DmMatchView from "./DmMatchView";
import { DM_TIMING } from "./dm.constants";
import {
  createDmState,
  dmReducer,
  getMatchWinnerId,
  pickTargetMs,
} from "./dmReducer";

type Props = {
  finalists: [DmPlayerView, DmPlayerView];
  onFinished: (winnerIds: string[]) => void;
};

/** Pass & play duel: one phone, this app decides everything, buttons move it on. */
export default function LocalDeathMatch({ finalists, onFinished }: Props) {
  const [a, b] = finalists;
  const [state, dispatch] = useReducer(dmReducer, undefined, () =>
    createDmState([a.id, b.id], true),
  );

  useEffect(() => {
    if (state.phase.kind === "done" && state.winnerId) {
      onFinished([state.winnerId]);
    }
  }, [onFinished, state.phase.kind, state.winnerId]);

  // The deciding round needs no tap: after a moment the celebration starts.
  const decided =
    state.phase.kind === "roundResult" && getMatchWinnerId(state) !== null;
  useEffect(() => {
    if (!decided) return;
    const timer = setTimeout(
      () => dispatch({ type: "RESULT_ACK", nextTargetMs: 0 }),
      DM_TIMING.decidedResultMs,
    );
    return () => clearTimeout(timer);
  }, [decided]);

  return (
    <DmMatchView
      state={state}
      players={{ [a.id]: a, [b.id]: b }}
      meId={null}
      canChooseSettings
      chooserName=""
      myStopMs={null}
      onConfirmSettings={(settings) =>
        dispatch({
          type: "SETTINGS_CONFIRMED",
          settings,
          firstStarterId: Math.random() < 0.5 ? a.id : b.id,
          targetMs: pickTargetMs(Math.random()),
        })
      }
      onAckTarget={() => dispatch({ type: "TARGET_ACK" })}
      onHandoffDone={() => dispatch({ type: "HANDOFF_DONE" })}
      onStopped={(elapsedMs) => {
        if (state.phase.kind !== "turn" || !state.round) return;
        dispatch({
          type: "STOP_RECORDED",
          playerId: state.phase.playerId,
          roundIndex: state.round.index,
          elapsedMs,
        });
      }}
      onAckResult={
        decided
          ? undefined
          : () =>
              dispatch({
                type: "RESULT_ACK",
                nextTargetMs: pickTargetMs(
                  Math.random(),
                  state.round?.targetMs,
                ),
              })
      }
    />
  );
}
