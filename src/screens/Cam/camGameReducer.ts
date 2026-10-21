// src/screens/Cam/camGameReducer.ts
import { CAM_END_ALIVE_COUNT } from "./cam.constants";
import type {
  CamAction,
  CamGameState,
  CamPhase,
  CamPlayer,
} from "./cam.types";

export const initialCamGameState: CamGameState = {
  seq: 0,
  phase: { kind: "permission" },
  playerCount: 0,
  players: [],
  lives: {},
  livesPerPlayer: 3,
  round: null,
  roundsPlayed: 0,
  roundKeepsakeUri: null,
  media: [],
};

export function getAlivePlayers(state: CamGameState): CamPlayer[] {
  return state.players.filter((p) => (state.lives[p.id] ?? 0) > 0);
}

export function isCamGameFinished(state: CamGameState): boolean {
  return getAlivePlayers(state).length <= CAM_END_ALIVE_COUNT;
}

/** Alive players with the most lives; more than one means a shared win. */
export function getCamWinners(state: CamGameState): CamPlayer[] {
  const alive = getAlivePlayers(state);
  const best = Math.max(0, ...alive.map((p) => state.lives[p.id] ?? 0));
  return alive.filter((p) => (state.lives[p.id] ?? 0) === best);
}

function go(state: CamGameState, phase: CamPhase): CamGameState {
  return { ...state, phase, seq: state.seq + 1 };
}

function fullLives(state: CamGameState): Record<string, number> {
  const lives: Record<string, number> = {};
  for (const p of state.players) lives[p.id] = state.livesPerPlayer;
  return lives;
}

function applyOutcome(state: CamGameState, caught: boolean): CamGameState {
  const round = state.round;
  if (!round) return state;

  // Caught → the impostor loses a life; not caught → every other alive player does.
  const lostLifeIds = caught
    ? [round.impostorId]
    : round.order.filter((id) => id !== round.impostorId);
  const lives = { ...state.lives };
  for (const id of lostLifeIds) {
    lives[id] = Math.max(0, (lives[id] ?? 0) - 1);
  }
  return go(
    { ...state, lives, roundsPlayed: state.roundsPlayed + 1 },
    { kind: "livesUpdate", caught, lostLifeIds },
  );
}

/**
 * Pure phase machine. Every action is accepted only in the phase it belongs to,
 * so stale timers and double taps are dropped.
 * Kept as one flat switch on purpose: each case is a single transition and the
 * whole game flow reads top to bottom in one place.
 */
export function camGameReducer(
  state: CamGameState,
  action: CamAction,
): CamGameState {
  const { phase } = state;

  switch (action.type) {
    case "PERMISSION_GRANTED":
      if (phase.kind !== "permission") return state;
      return go(state, { kind: "playerCount" });

    case "SETUP_READY":
      if (phase.kind !== "playerCount") return state;
      return go(
        {
          ...state,
          playerCount: action.count,
          livesPerPlayer: action.livesPerPlayer,
          players: [],
        },
        { kind: "nameColor", index: 0 },
      );

    case "PLAYER_NAMED": {
      if (phase.kind !== "nameColor") return state;
      const player: CamPlayer = {
        id: action.id,
        name: action.name,
        color: action.color,
        photoUri: null,
      };
      return go(
        { ...state, players: [...state.players, player] },
        { kind: "selfie", index: phase.index },
      );
    }

    case "SELFIE_TAKEN": {
      if (phase.kind !== "selfie") return state;
      const players = state.players.map((p, i) =>
        i === phase.index ? { ...p, photoUri: action.uri } : p,
      );
      return go({ ...state, players }, { kind: "selfieFly", index: phase.index });
    }

    case "SELFIE_LANDED": {
      if (phase.kind !== "selfieFly") return state;
      const next = phase.index + 1;
      if (next < state.playerCount) {
        return go(state, { kind: "nameColor", index: next });
      }
      return go({ ...state, lives: fullLives(state) }, { kind: "roster" });
    }

    case "ROUND_PREPARED":
      if (phase.kind !== "roster" && phase.kind !== "livesUpdate") return state;
      return go(
        { ...state, round: action.round, roundKeepsakeUri: null },
        { kind: "handoff", turn: 0 },
      );

    case "HANDOFF_YES":
      if (phase.kind !== "handoff") return state;
      return go(state, { kind: "peekCountdown", turn: phase.turn });

    case "PEEK_COUNTED":
      if (phase.kind !== "peekCountdown") return state;
      return go(state, { kind: "peekQuestion", turn: phase.turn });

    case "PEEK_DONE": {
      if (phase.kind !== "peekQuestion" || !state.round) return state;
      const next = phase.turn + 1;
      return next < state.round.order.length
        ? go(state, { kind: "handoff", turn: next })
        : go(state, { kind: "placePhone" });
    }

    case "PHONE_PLACED":
      if (phase.kind !== "placePhone") return state;
      return go(state, { kind: "voteIntro" });

    case "VOTE_CONFIRMED":
      if (phase.kind !== "voteIntro") return state;
      return go(state, { kind: "voteCountdown" });

    case "VOTE_DONE":
      if (phase.kind !== "voteCountdown") return state;
      return go(state, { kind: "questionSlam", captured: false });

    case "SLAM_CONTINUE":
      if (phase.kind !== "questionSlam") return state;
      return go(state, { kind: "accuseIntro" });

    case "ACCUSE_CONFIRMED":
      if (phase.kind !== "accuseIntro") return state;
      return go(state, { kind: "accuseCountdown" });

    case "ACCUSE_NOW":
      if (phase.kind !== "accuseCountdown") return state;
      return go(state, { kind: "keepsake", captured: false });

    // A photo is taken twice per round: with the question, and when accusing.
    case "KEEPSAKE_TAKEN":
      if (
        (phase.kind !== "questionSlam" && phase.kind !== "keepsake") ||
        phase.captured
      ) {
        return state;
      }
      return {
        ...state,
        roundKeepsakeUri: action.uri,
        media:
          action.uri && state.round
            ? [
                ...state.media,
                { kind: "photo", uri: action.uri, round: state.round.index },
              ]
            : state.media,
        phase: { ...phase, captured: true },
      };

    // A recording can finish in any phase (it is stopped when the round ends).
    case "VIDEO_RECORDED":
      return {
        ...state,
        media: [
          ...state.media,
          { kind: "video", uri: action.uri, round: action.round },
        ],
      };

    case "KEEPSAKE_SHOWN":
      if (phase.kind !== "keepsake" || !phase.captured) return state;
      return go(state, { kind: "caughtPrompt" });

    case "OUTCOME":
      if (phase.kind !== "caughtPrompt") return state;
      return applyOutcome(state, action.caught);

    case "GAME_OVER":
      if (phase.kind !== "livesUpdate") return state;
      return go(state, { kind: "gameOver" });

    case "PLAY_AGAIN":
      if (phase.kind !== "gameOver") return state;
      return go(
        {
          ...state,
          lives: fullLives(state),
          round: null,
          roundsPlayed: 0,
          roundKeepsakeUri: null,
          media: [],
        },
        { kind: "roster" },
      );

    default:
      return state;
  }
}
