// src/screens/Game/DeathMatch/useOnlineDeathMatch.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import {
  sendMultiplayerRelay,
  subscribeMultiplayerConnection,
  subscribeMultiplayerRelay,
} from "../../../api/multiplayerRelay";
import {
  DEATHMATCH_DONE_MESSAGE_TYPE,
  DEATHMATCH_STATE_MESSAGE_TYPE,
  DEATHMATCH_STOP_MESSAGE_TYPE,
  DEATHMATCH_SYNC_REQUEST_MESSAGE_TYPE,
} from "../../../constants/onlineLobby";
import { DM_HIDDEN_STOP, DM_TIMING } from "./dm.constants";
import type { DmAction, DmSettings, DmState } from "./dm.types";
import {
  createDmState,
  dmReducer,
  getMatchWinnerId,
  pickTargetMs,
} from "./dmReducer";

type Args = {
  playerIds: [string, string];
  meId: string;
  /** The finalist who runs the match (see `resolveRefereeId`). */
  refereeId: string;
  /** Only the host announces the end with `DEATHMATCH_DONE`. */
  isHost: boolean;
  /** Dev lab: there is no second phone, so the opponent's stop is simulated. */
  simulateOpponent: boolean;
  onFinished: (winnerIds: string[]) => void;
};

type Stop = { roundIndex: number; elapsedMs: number };

function asRecord(raw: unknown): Record<string, unknown> | null {
  return typeof raw === "object" && raw !== null
    ? (raw as Record<string, unknown>)
    : null;
}

function parseStop(d: Record<string, unknown>): Stop | null {
  const { roundIndex, elapsedMs } = d;
  if (typeof roundIndex !== "number" || typeof elapsedMs !== "number")
    return null;
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return null;
  if (elapsedMs > DM_TIMING.maxRunMs) return null;
  return { roundIndex, elapsedMs };
}

function parseState(raw: unknown): DmState | null {
  const s = asRecord(raw);
  if (!s || typeof s.seq !== "number") return null;
  const phase = asRecord(s.phase);
  if (!phase || typeof phase.kind !== "string") return null;
  if (!Array.isArray(s.playerIds) || !Array.isArray(s.history)) return null;
  if (!asRecord(s.wins)) return null;
  return s as unknown as DmState;
}

/** A time stays on the referee's phone until the round is scored. */
function maskState(state: DmState): DmState {
  const { round, phase } = state;
  if (!round || (phase.kind !== "turn" && phase.kind !== "pass")) return state;
  const stops: Record<string, number> = {};
  for (const id of Object.keys(round.stops)) stops[id] = DM_HIDDEN_STOP;
  return { ...state, round: { ...round, stops } };
}

/**
 * Online duel. The referee runs the reducer, picks the settings and targets and
 * broadcasts the whole state after every step; the other finalist only mirrors
 * it and reports their own stop (resent until the referee has it). The backend
 * stays a plain relay. The relay does not reconnect during a game, so a dropped
 * socket still stalls the duel — the resends only cover lost messages.
 */
export function useOnlineDeathMatch({
  playerIds,
  meId,
  refereeId,
  isHost,
  simulateOpponent,
  onFinished,
}: Args) {
  const isReferee = meId === refereeId;
  const [state, setState] = useState(() => createDmState(playerIds, false));
  const stateRef = useRef(state);
  /** This finalist's own times by round, for their own screen. */
  const [myStops, setMyStops] = useState<Record<number, number>>({});
  const pendingStopRef = useRef<Stop | null>(null);
  const lastStateAtRef = useRef(Date.now());

  const broadcast = useCallback(() => {
    sendMultiplayerRelay({
      type: DEATHMATCH_STATE_MESSAGE_TYPE,
      state: maskState(stateRef.current),
    });
  }, []);

  /** Referee only. Returns false when the action did not apply. */
  const apply = useCallback(
    (action: DmAction): boolean => {
      const next = dmReducer(stateRef.current, action);
      if (next === stateRef.current) return false;
      stateRef.current = next;
      setState(next);
      broadcast();
      return true;
    },
    [broadcast],
  );

  // ── Referee: take stops and sync requests from the other finalist ─────────
  useEffect(() => {
    if (!isReferee) return;
    broadcast();
    const offRelay = subscribeMultiplayerRelay((raw) => {
      const d = asRecord(raw);
      // The relay echoes our own messages back: the referee's own stop is
      // applied directly, never through the relay.
      if (!d || d.fromPlayerId === meId) return;
      if (d.type === DEATHMATCH_SYNC_REQUEST_MESSAGE_TYPE) {
        broadcast();
        return;
      }
      if (d.type !== DEATHMATCH_STOP_MESSAGE_TYPE) return;
      const stop = parseStop(d);
      if (!stop || typeof d.fromPlayerId !== "string") return;
      const applied = apply({
        type: "STOP_RECORDED",
        playerId: d.fromPlayerId,
        ...stop,
      });
      // A repeat or a stale stop: answer with the state so the sender stops resending.
      if (!applied) broadcast();
    });
    const offConn = subscribeMultiplayerConnection((conn) => {
      if (conn === "open") broadcast();
    });
    return () => {
      offRelay();
      offConn();
    };
  }, [apply, broadcast, isReferee, meId]);

  // ── Referee: move on from the target and the round result by itself ───────
  useEffect(() => {
    if (!isReferee) return;
    const kind = state.phase.kind;
    if (kind !== "targetReveal" && kind !== "roundResult") return;
    const delay =
      kind === "targetReveal"
        ? DM_TIMING.onlineTargetRevealMs
        : getMatchWinnerId(stateRef.current) !== null
          ? DM_TIMING.decidedResultMs
          : DM_TIMING.onlineResultMs;
    const deadline = Date.now() + delay;
    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      if (kind === "targetReveal") apply({ type: "TARGET_ACK" });
      else
        apply({
          type: "RESULT_ACK",
          nextTargetMs: pickTargetMs(
            Math.random(),
            stateRef.current.round?.targetMs,
          ),
        });
    };
    const timer = setTimeout(fire, delay);
    // Timers do not run in the background: catch up when the app returns.
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active" && Date.now() >= deadline) fire();
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [apply, isReferee, state.phase.kind, state.seq]);

  // ── Referee, dev lab: play the opponent's turn ────────────────────────────
  useEffect(() => {
    if (!isReferee || !simulateOpponent) return;
    const { phase, round } = state;
    if (phase.kind !== "turn" || phase.playerId === meId || !round) return;
    const timer = setTimeout(() => {
      const spread = DM_TIMING.devOpponentSpreadMs;
      apply({
        type: "STOP_RECORDED",
        playerId: phase.playerId,
        roundIndex: round.index,
        elapsedMs: Math.max(
          0,
          round.targetMs + Math.round((Math.random() * 2 - 1) * spread),
        ),
      });
    }, DM_TIMING.devOpponentDelayMs);
    return () => clearTimeout(timer);
  }, [apply, isReferee, meId, simulateOpponent, state]);

  // ── Mirror: follow the referee, resend our stop until it is in the state ──
  useEffect(() => {
    if (isReferee) return;
    const sendPending = () => {
      const pending = pendingStopRef.current;
      if (!pending) return;
      sendMultiplayerRelay({ type: DEATHMATCH_STOP_MESSAGE_TYPE, ...pending });
    };
    const requestSync = () => {
      lastStateAtRef.current = Date.now();
      sendMultiplayerRelay({
        type: DEATHMATCH_SYNC_REQUEST_MESSAGE_TYPE,
        lastSeq: stateRef.current.seq,
      });
    };

    const offRelay = subscribeMultiplayerRelay((raw) => {
      const d = asRecord(raw);
      if (!d || d.fromPlayerId !== refereeId) return;
      if (d.type === DEATHMATCH_DONE_MESSAGE_TYPE) {
        if (Array.isArray(d.winnerIds)) {
          onFinished(d.winnerIds.filter((id) => typeof id === "string"));
        }
        return;
      }
      if (d.type !== DEATHMATCH_STATE_MESSAGE_TYPE) return;
      const next = parseState(d.state);
      if (!next) return;
      lastStateAtRef.current = Date.now();
      const pending = pendingStopRef.current;
      if (pending && next.round) {
        const arrived =
          next.round.index > pending.roundIndex ||
          (next.round.index === pending.roundIndex && meId in next.round.stops);
        if (arrived) pendingStopRef.current = null;
      }
      if (next.seq <= stateRef.current.seq) return;
      stateRef.current = next;
      setState(next);
    });
    const offConn = subscribeMultiplayerConnection((conn) => {
      if (conn !== "open") return;
      sendPending();
      requestSync();
    });
    const timer = setInterval(() => {
      sendPending();
      if (Date.now() - lastStateAtRef.current > DM_TIMING.syncAfterMs) {
        requestSync();
      }
    }, DM_TIMING.stopResendMs);
    // The referee may have sent the first state before this screen opened.
    requestSync();

    return () => {
      offRelay();
      offConn();
      clearInterval(timer);
    };
  }, [isReferee, meId, onFinished, refereeId]);

  // ── Mirror: the end is sent once; if it is lost, a decided round is enough ─
  const decidedWinnerId =
    state.phase.kind === "roundResult" ? getMatchWinnerId(state) : null;
  useEffect(() => {
    if (isReferee || !decidedWinnerId) return;
    const timer = setTimeout(
      () => onFinished([decidedWinnerId]),
      DM_TIMING.onlineResultMs + DM_TIMING.onlineLostEndGraceMs,
    );
    return () => clearTimeout(timer);
  }, [decidedWinnerId, isReferee, onFinished]);

  // ── Both: leave when the match is decided ─────────────────────────────────
  useEffect(() => {
    if (state.phase.kind !== "done" || !state.winnerId) return;
    if (isReferee && isHost) {
      sendMultiplayerRelay({
        type: DEATHMATCH_DONE_MESSAGE_TYPE,
        winnerIds: [state.winnerId],
      });
    }
    onFinished([state.winnerId]);
  }, [isHost, isReferee, onFinished, state.phase.kind, state.winnerId]);

  const confirmSettings = useCallback(
    (settings: DmSettings) => {
      if (!isReferee) return;
      apply({
        type: "SETTINGS_CONFIRMED",
        settings,
        firstStarterId: playerIds[Math.random() < 0.5 ? 0 : 1],
        targetMs: pickTargetMs(Math.random()),
      });
    },
    [apply, isReferee, playerIds],
  );

  const submitStop = useCallback(
    (elapsedMs: number) => {
      const round = stateRef.current.round;
      if (!round) return;
      const stop: Stop = { roundIndex: round.index, elapsedMs };
      setMyStops((prev) => ({ ...prev, [round.index]: elapsedMs }));
      if (isReferee) {
        apply({ type: "STOP_RECORDED", playerId: meId, ...stop });
        return;
      }
      pendingStopRef.current = stop;
      sendMultiplayerRelay({ type: DEATHMATCH_STOP_MESSAGE_TYPE, ...stop });
    },
    [apply, isReferee, meId],
  );

  const myStopMs = state.round ? (myStops[state.round.index] ?? null) : null;

  return { state, isReferee, myStopMs, confirmSettings, submitStop };
}
