// src/api/gameCompletions.ts
import { apiPost } from "./client";

export type GameCompletionResult = {
  /** Games this user has played to the end, in total. */
  completed: number;
  /** Heroes / skins this game just unlocked ("play N games" locks). */
  newlyUnlockedIds: string[];
};

/** Reports that this device's user played a game to the end. Counted once per game. */
export function postGameCompletion(
  userId: string,
  body: { gameId: string; mode: "LOCAL" | "ONLINE" },
) {
  return apiPost<GameCompletionResult>(
    `/users/${encodeURIComponent(userId)}/game-completions`,
    body,
  );
}
