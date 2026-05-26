import { useCallback, useEffect, useState } from "react";
import { useGameStore } from "../store/useGameStore";
import { subscribeMultiplayerRelay } from "../api/multiplayerRelay";
import { VOTE_CAST_MESSAGE_TYPE } from "../constants/onlineLobby";

export type FeedEvent = {
  id: string;
  text: string;
  ts: number;
};

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function useGameEventFeed(active: boolean): FeedEvent[] {
  const [events, setEvents] = useState<FeedEvent[]>([]);

  const append = useCallback((text: string) => {
    setEvents((prev) => [...prev, { id: uid(), text, ts: Date.now() }]);
  }, []);

  useEffect(() => {
    if (!active) return;

    const introTimer = setTimeout(() => {
      append("👀  You're watching the game — updates will appear here as rounds progress");
    }, 400);

    const st = useGameStore.getState();
    let prevRound = st.round;
    let prevLives = { ...st.lives };
    let prevPhase = st.phase;
    let prevQuestionId = st.currentBaseQuestionId;

    const unsubStore = useGameStore.subscribe((s) => {
      // New round
      if (s.round !== prevRound) {
        append(`⚔️  Round ${s.round + 1}`);
        prevRound = s.round;
      }

      // Life changes — compare every player
      for (const [id, life] of Object.entries(s.lives)) {
        const prev = prevLives[id] ?? life;
        if (life < prev) {
          const name = s.players.find((p) => p.id === id)?.name ?? "Someone";
          if (life <= 0) {
            append(`💀  ${name} was eliminated`);
          } else {
            append(`💔  ${name} lost a life — ${life} remaining`);
          }
        }
      }
      prevLives = { ...s.lives };

      // Phase change
      if (s.phase !== prevPhase) {
        if (s.phase === "voting") append("🗳️  Players are voting");
        prevPhase = s.phase;
      }

      // New question (base question only — odd/impostor question is intentionally hidden)
      if (s.currentBaseQuestionId && s.currentBaseQuestionId !== prevQuestionId) {
        const q = s.gameQuestions?.find((gq) => gq.id === s.currentBaseQuestionId);
        if (q) append(`❓  "${q.text}"`);
        prevQuestionId = s.currentBaseQuestionId;
      }
    });

    // Relay: who voted for whom
    const unsubRelay = subscribeMultiplayerRelay((raw) => {
      const d = raw as { type?: string; fromPlayerId?: string; targetId?: string };
      if (d.type !== VOTE_CAST_MESSAGE_TYPE) return;
      const { players } = useGameStore.getState();
      const voter = players.find((p) => p.id === d.fromPlayerId);
      const target = players.find((p) => p.id === d.targetId);
      if (voter && target) {
        append(`🗳️  ${voter.name} voted for ${target.name}`);
      }
    });

    return () => {
      clearTimeout(introTimer);
      unsubStore();
      unsubRelay();
    };
  }, [active, append]);

  return events;
}
