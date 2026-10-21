// src/screens/Game/DeathMatch/dm.types.ts

/** `blind` hides the running time after the first second. */
export type DmVisibility = "visible" | "blind";
/** One round decides it, or the first to win two rounds. */
export type DmFormat = "single" | "bestOf3";

export type DmSettings = {
  visibility: DmVisibility;
  format: DmFormat;
};

export type DmRound = {
  /** Grows with every round, replays of a tie included. Identifies a stop. */
  index: number;
  targetMs: number;
  starterId: string;
  /** playerId → time they stopped at, in ms. */
  stops: Record<string, number>;
};

/** A finished round. `winnerId` is null when both were equally far (replayed). */
export type DmRoundResult = DmRound & { winnerId: string | null };

export type DmPhase =
  | { kind: "settings" }
  | { kind: "targetReveal" }
  /** Pass & play only: hand the phone to this player. */
  | { kind: "pass"; playerId: string }
  | { kind: "turn"; playerId: string }
  | { kind: "roundResult" }
  | { kind: "done" };

export type DmState = {
  /** Bumped on every step; online it orders the referee's snapshots. */
  seq: number;
  playerIds: [string, string];
  /** One shared phone (pass & play) — adds the hand-over step. */
  passDevice: boolean;
  settings: DmSettings | null;
  round: DmRound | null;
  history: DmRoundResult[];
  wins: Record<string, number>;
  phase: DmPhase;
  winnerId: string | null;
};

export type DmAction =
  | {
      type: "SETTINGS_CONFIRMED";
      settings: DmSettings;
      firstStarterId: string;
      targetMs: number;
    }
  | { type: "TARGET_ACK" }
  | { type: "HANDOFF_DONE" }
  | {
      type: "STOP_RECORDED";
      playerId: string;
      roundIndex: number;
      elapsedMs: number;
    }
  | { type: "RESULT_ACK"; nextTargetMs: number };

/** What a phase needs to show a finalist. */
export type DmPlayerView = {
  id: string;
  name: string;
  profileImage: import("react-native").ImageSourcePropType | null;
  heroImage: import("react-native").ImageSourcePropType | null;
};
