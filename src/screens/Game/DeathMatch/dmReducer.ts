// src/screens/Game/DeathMatch/dmReducer.ts
import {
  DM_TARGET_MAX_MS,
  DM_TARGET_MIN_MS,
  DM_TARGET_STEP_MS,
} from "./dm.constants";
import type {
  DmAction,
  DmFormat,
  DmRound,
  DmRoundResult,
  DmState,
} from "./dm.types";

const WINS_NEEDED: Record<DmFormat, number> = { single: 1, bestOf3: 2 };

export function createDmState(
  playerIds: [string, string],
  passDevice: boolean,
): DmState {
  return {
    seq: 0,
    playerIds,
    passDevice,
    settings: null,
    round: null,
    history: [],
    wins: { [playerIds[0]]: 0, [playerIds[1]]: 0 },
    phase: { kind: "settings" },
    winnerId: null,
  };
}

/** A random target; never the same one twice in a row. `rand` is in [0, 1). */
export function pickTargetMs(rand: number, previousMs?: number): number {
  const targets: number[] = [];
  for (
    let ms = DM_TARGET_MIN_MS;
    ms <= DM_TARGET_MAX_MS;
    ms += DM_TARGET_STEP_MS
  ) {
    if (ms !== previousMs) targets.push(ms);
  }
  return targets[
    Math.min(targets.length - 1, Math.floor(rand * targets.length))
  ];
}

/**
 * Who runs an online match: the finalist with the lowest id. Both phones work
 * it out from the same two ids, so they always agree — the roster's host flag
 * is not used because not every phone has it.
 */
export function resolveRefereeId(
  finalists: ReadonlyArray<{ id: string }>,
): string | null {
  if (finalists.length === 0) return null;
  return [...finalists].sort((a, b) => (a.id < b.id ? -1 : 1))[0].id;
}

export function getOtherPlayerId(state: DmState, playerId: string): string {
  return state.playerIds[0] === playerId
    ? state.playerIds[1]
    : state.playerIds[0];
}

export function getDiffMs(round: DmRound, playerId: string): number {
  return Math.abs(round.stops[playerId] - round.targetMs);
}

export function getLastResult(state: DmState): DmRoundResult | null {
  return state.history[state.history.length - 1] ?? null;
}

/** The finalist who has won enough rounds, once there is one. */
export function getMatchWinnerId(state: DmState): string | null {
  if (!state.settings) return null;
  const needed = WINS_NEEDED[state.settings.format];
  return state.playerIds.find((id) => (state.wins[id] ?? 0) >= needed) ?? null;
}

function step(state: DmState, patch: Partial<DmState>): DmState {
  return { ...state, ...patch, seq: state.seq + 1 };
}

function scoreRound(state: DmState, round: DmRound): DmState {
  const [a, b] = state.playerIds;
  const diffA = getDiffMs(round, a);
  const diffB = getDiffMs(round, b);
  const winnerId = diffA === diffB ? null : diffA < diffB ? a : b;
  const wins = winnerId
    ? { ...state.wins, [winnerId]: (state.wins[winnerId] ?? 0) + 1 }
    : state.wins;
  return step(state, {
    round,
    wins,
    history: [...state.history, { ...round, winnerId }],
    phase: { kind: "roundResult" },
  });
}

/** Every action is accepted only in its own phase; anything else returns the same state. */
export function dmReducer(state: DmState, action: DmAction): DmState {
  const { phase, round } = state;

  switch (action.type) {
    case "SETTINGS_CONFIRMED":
      if (phase.kind !== "settings") return state;
      return step(state, {
        settings: action.settings,
        round: {
          index: 0,
          targetMs: action.targetMs,
          starterId: action.firstStarterId,
          stops: {},
        },
        phase: { kind: "targetReveal" },
      });

    case "TARGET_ACK":
      if (phase.kind !== "targetReveal" || !round) return state;
      return step(state, {
        phase: state.passDevice
          ? { kind: "pass", playerId: round.starterId }
          : { kind: "turn", playerId: round.starterId },
      });

    case "HANDOFF_DONE":
      if (phase.kind !== "pass") return state;
      return step(state, { phase: { kind: "turn", playerId: phase.playerId } });

    case "STOP_RECORDED": {
      if (phase.kind !== "turn" || !round) return state;
      if (action.playerId !== phase.playerId) return state;
      if (action.roundIndex !== round.index) return state;
      if (!Number.isFinite(action.elapsedMs) || action.elapsedMs < 0)
        return state;
      if (action.playerId in round.stops) return state;

      const nextRound: DmRound = {
        ...round,
        stops: {
          ...round.stops,
          [action.playerId]: Math.round(action.elapsedMs),
        },
      };
      const otherId = getOtherPlayerId(state, action.playerId);
      if (otherId in nextRound.stops) return scoreRound(state, nextRound);
      return step(state, {
        round: nextRound,
        phase: state.passDevice
          ? { kind: "pass", playerId: otherId }
          : { kind: "turn", playerId: otherId },
      });
    }

    case "RESULT_ACK": {
      if (phase.kind !== "roundResult" || !round) return state;
      const winnerId = getMatchWinnerId(state);
      if (winnerId) return step(state, { winnerId, phase: { kind: "done" } });
      return step(state, {
        round: {
          index: round.index + 1,
          targetMs: action.nextTargetMs,
          starterId: getOtherPlayerId(state, round.starterId),
          stops: {},
        },
        phase: { kind: "targetReveal" },
      });
    }

    default:
      return state;
  }
}
