// src/hooks/useReportGameCompletion.ts
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { postGameCompletion } from "../api/gameCompletions";
import { queryKeys } from "../api/queryKeys";
import { useGameStore } from "../store/useGameStore";
import { useAuthStore } from "../store/useUserStore";

/**
 * On the end-of-game screen: counts this game for the device's own user (online
 * every player's device reports for itself; pass & play the phone's owner).
 * Games count towards "play N games" unlocks; anything unlocked is merged in
 * and the hero list is refreshed. Must run before any early return of the
 * screen, so eliminated players count too.
 */
export function useReportGameCompletion(): void {
  const queryClient = useQueryClient();
  const sentRef = useRef<string | null>(null);
  const gameId = useGameStore((s) => s.gameId);
  const gameRunId = useGameStore((s) => s.gameRunId);
  const mode = useGameStore((s) => s.mode);
  const userId = useAuthStore((s) => s.user.id);
  const patchUser = useAuthStore((s) => s.patchUser);

  // The run that ended is the one current when this screen opened. A rematch
  // started from here gets a new run id while the screen is still mounted —
  // that one must not be counted before it is played.
  const endedRunRef = useRef(gameRunId ?? gameId);

  useEffect(() => {
    // A rematch is a new run of the same game: it counts again (on its own end).
    const key = endedRunRef.current;
    if (!key || !userId || key.startsWith("dev_") || gameId?.startsWith("dev_")) {
      return;
    }
    if (sentRef.current === key) return;
    sentRef.current = key;
    postGameCompletion(userId, {
      gameId: key.slice(0, 64),
      mode: mode === "ONLINE" ? "ONLINE" : "LOCAL",
    })
      .then((result) => {
        if (!result.newlyUnlockedIds.length) return;
        patchUser((prev) => ({
          ...prev,
          unlockedCharacterIds: [
            ...new Set([...(prev.unlockedCharacterIds ?? []), ...result.newlyUnlockedIds]),
          ],
        }));
        void queryClient.invalidateQueries({ queryKey: queryKeys.characters });
      })
      .catch((e) => {
        sentRef.current = null;
        console.warn("game completion report failed", e);
      });
  }, [gameId, gameRunId, mode, patchUser, queryClient, userId]);
}
