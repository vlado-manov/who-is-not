// src/screens/Cam/cam.types.ts
import type { QuestionTypeApi } from "../../types/question";

export type CamPlayer = {
  id: string;
  name: string;
  color: string;
  photoUri: string | null;
};

/** A photo or video captured during a round. */
export type CamMedia = {
  kind: "photo" | "video";
  uri: string;
  /** 1-based round the item belongs to. */
  round: number;
};

export type CamRound = {
  index: number;
  /** `pick` = point at someone; `number` / `input` = write the answer and show it. */
  questionType: QuestionTypeApi;
  impostorId: string;
  /** What everyone except the impostor saw. */
  baseText: string;
  oddText: string;
  /** Alive player ids, in the order they take the phone. */
  order: string[];
};

export type CamPhase =
  | { kind: "permission" }
  | { kind: "playerCount" }
  | { kind: "nameColor"; index: number }
  | { kind: "selfie"; index: number }
  | { kind: "selfieFly"; index: number }
  | { kind: "roster" }
  | { kind: "handoff"; turn: number }
  | { kind: "peekCountdown"; turn: number }
  | { kind: "peekQuestion"; turn: number }
  | { kind: "placePhone" }
  | { kind: "voteIntro" }
  | { kind: "voteCountdown" }
  /** The question is shown and the first photo (who fits best) is taken. */
  | { kind: "questionSlam"; captured: boolean }
  | { kind: "accuseIntro" }
  | { kind: "accuseCountdown" }
  /** The second photo (who is accused) is taken. */
  | { kind: "keepsake"; captured: boolean }
  | { kind: "caughtPrompt" }
  | { kind: "livesUpdate"; caught: boolean; lostLifeIds: string[] }
  | { kind: "gameOver" };

export type CamGameState = {
  /** Bumped on every phase change; used as the React key of the phase view. */
  seq: number;
  phase: CamPhase;
  playerCount: number;
  players: CamPlayer[];
  lives: Record<string, number>;
  livesPerPlayer: 3 | 5;
  round: CamRound | null;
  roundsPlayed: number;
  /** Latest photo of the current round; null until taken or when the capture failed. */
  roundKeepsakeUri: string | null;
  media: CamMedia[];
};

export type CamAction =
  | { type: "PERMISSION_GRANTED" }
  | { type: "SETUP_READY"; count: number; livesPerPlayer: 3 | 5 }
  | { type: "PLAYER_NAMED"; id: string; name: string; color: string }
  | { type: "SELFIE_TAKEN"; uri: string }
  | { type: "SELFIE_LANDED" }
  | { type: "ROUND_PREPARED"; round: CamRound }
  | { type: "HANDOFF_YES" }
  | { type: "PEEK_COUNTED" }
  | { type: "PEEK_DONE" }
  | { type: "PHONE_PLACED" }
  | { type: "VOTE_CONFIRMED" }
  | { type: "VOTE_DONE" }
  | { type: "SLAM_CONTINUE" }
  | { type: "ACCUSE_CONFIRMED" }
  | { type: "ACCUSE_NOW" }
  | { type: "KEEPSAKE_TAKEN"; uri: string | null }
  | { type: "KEEPSAKE_SHOWN" }
  | { type: "VIDEO_RECORDED"; uri: string; round: number }
  | { type: "OUTCOME"; caught: boolean }
  | { type: "GAME_OVER" }
  | { type: "PLAY_AGAIN" };

export type CamRect = { x: number; y: number; width: number; height: number };
