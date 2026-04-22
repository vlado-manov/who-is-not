/** Minimum players in room before host can start (matches local party mode). */
export const MIN_ONLINE_PLAYERS = 3;

/** WebSocket JSON `type` when host starts (guests follow). */
export const LOBBY_START_MESSAGE_TYPE = "lobby_start_game";

/** Host broadcasts deterministic round question state so all clients match (not per-device RNG). */
export const ROUND_STATE_MESSAGE_TYPE = "round_state";

/** Client asks server to reserve a hero; server broadcasts `hero_claim_ok` or sends `hero_claim_denied` to sender. */
export const HERO_CLAIM_MESSAGE_TYPE = "hero_claim";
export const HERO_CLAIM_OK_MESSAGE_TYPE = "hero_claim_ok";
export const HERO_CLAIM_DENIED_MESSAGE_TYPE = "hero_claim_denied";

/** Client signals readiness for a named phase; server broadcasts when all participants are ready. */
export const PLAYER_READY_MESSAGE_TYPE = "player_ready";
export const MP_PHASE_ALL_READY_MESSAGE_TYPE = "mp_phase_all_ready";

/** Discussion phase (Results screen) — text chat broadcast to the room. */
export const DISCUSSION_CHAT_MESSAGE_TYPE = "discussion_chat";

/** Dead players only — shadow-realm chat (client filters by eliminated / lives). */
export const DEAD_CHAT_MESSAGE_TYPE = "dead_chat";

/** Winner closed fun-fact overlay; host can show restart/quit after this. */
export const WINNER_FACT_DISMISSED_MESSAGE_TYPE = "winner_fact_dismissed";

/** Vote cast (targetId); server adds fromPlayerId as voter. */
export const VOTE_CAST_MESSAGE_TYPE = "vote_cast";

/** Answer submitted for current round; `answer` string (pick = target player id). Server adds fromPlayerId. */
export const ANSWER_CAST_MESSAGE_TYPE = "answer_cast";

/** Host: restart session for everyone (same heroes / same roster). */
export const HOST_SESSION_RESTART_MESSAGE_TYPE = "host_session_restart";

/** Host: new game with different heroes (everyone). */
export const HOST_SESSION_NEW_HEROES_MESSAGE_TYPE = "host_session_new_heroes";

/** Host: end session for everyone (return to menu). */
export const HOST_CLOSE_SESSION_MESSAGE_TYPE = "host_close_session";

/** Client voluntarily left the game (broadcast before disconnect). */
export const PLAYER_LEFT_GAME_MESSAGE_TYPE = "player_left_game";

export function mpPhaseRound1Start(): string {
  return "round1_start";
}

/** All clients signal this after hero pick + name + final quote animation (ONLINE). */
export function mpPhaseHeroIntroComplete(): string {
  return "hero_intro_complete";
}
/** `round` = store round (completed count); active round number = round + 1. */
export function mpPhaseAnswers(activeRoundNumber: number): string {
  return `answers_r${activeRoundNumber}`;
}
export function mpPhasePreVote(activeRoundNumber: number): string {
  return `pre_vote_r${activeRoundNumber}`;
}
export function mpPhaseVotes(activeRoundNumber: number): string {
  return `votes_r${activeRoundNumber}`;
}
