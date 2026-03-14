import { apiPost } from "./client";

export type GameMode = "LOCAL" | "ONLINE";

type TrackEventPayload = {
  eventId: string;
  type:
    | "GAME_STARTED"
    | "ROUND_STARTED"
    | "ROUND_ENDED"
    | "GAME_FINISHED"
    | "CHARACTER_SELECTED"
    | "ITEM_PURCHASED"
    | "PLAYER_SESSION_STARTED";
  userId?: string;
  payload: Record<string, unknown>;
};

type TrackEventResponse = { accepted: boolean };

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function trackEvent(data: TrackEventPayload) {
  return apiPost<TrackEventResponse>("/events", data);
}

export async function trackGameStarted(input: {
  gameId: string;
  mode: GameMode;
  playersCount: number;
  language?: string;
  userId?: string;
  packs?: string[];
}) {
  return trackEvent({
    eventId: makeId("evt_game_started"),
    type: "GAME_STARTED",
    userId: input.userId,
    payload: {
      gameId: input.gameId,
      mode: input.mode,
      playersCount: input.playersCount,
      language: input.language,
      ...(input.packs && input.packs.length ? { packs: input.packs } : {}),
    },
  });
}

export async function trackRoundStarted(input: {
  gameId: string;
  roundId: string;
  mode: GameMode;
  roundIndex: number;
  userId?: string;
}) {
  return trackEvent({
    eventId: makeId("evt_round_started"),
    type: "ROUND_STARTED",
    userId: input.userId,
    payload: {
      gameId: input.gameId,
      roundId: input.roundId,
      mode: input.mode,
      roundIndex: input.roundIndex,
    },
  });
}

export async function trackRoundEnded(input: {
  gameId: string;
  roundId: string;
  mode: GameMode;
  roundIndex: number;
  userId?: string;
}) {
  return trackEvent({
    eventId: makeId("evt_round_ended"),
    type: "ROUND_ENDED",
    userId: input.userId,
    payload: {
      gameId: input.gameId,
      roundId: input.roundId,
      mode: input.mode,
      roundIndex: input.roundIndex,
    },
  });
}

export async function trackGameFinished(input: {
  gameId: string;
  mode: GameMode;
  userId?: string;
}) {
  return trackEvent({
    eventId: makeId("evt_game_finished"),
    type: "GAME_FINISHED",
    userId: input.userId,
    payload: {
      gameId: input.gameId,
      mode: input.mode,
    },
  });
}

export async function trackCharacterSelected(input: {
  gameId: string;
  characterId: string;
  mode: GameMode;
  playerId?: string;
  userId?: string;
}) {
  return trackEvent({
    eventId: makeId("evt_character_selected"),
    type: "CHARACTER_SELECTED",
    userId: input.userId,
    payload: {
      gameId: input.gameId,
      characterId: input.characterId,
      mode: input.mode,
      playerId: input.playerId,
    },
  });
}

export async function trackItemPurchased(input: {
  playerId: string;
  itemType: string;
  itemId: string;
  price: number;
  currency: string;
  quantity?: number;
  userId?: string;
  metadata?: Record<string, unknown>;
}) {
  return trackEvent({
    eventId: makeId("evt_item_purchased"),
    type: "ITEM_PURCHASED",
    userId: input.userId,
    payload: {
      playerId: input.playerId,
      itemType: input.itemType,
      itemId: input.itemId,
      price: input.price,
      currency: input.currency,
      quantity: input.quantity ?? 1,
      ...(input.metadata ? { metadata: input.metadata } : {}),
    },
  });
}

export async function trackPlayerSessionStarted(input: {
  userId?: string;
  source?: string;
  step?: string;
  mode?: GameMode;
  language?: string;
  playersCount?: number;
  metadata?: Record<string, unknown>;
}) {
  return trackEvent({
    eventId: makeId("evt_player_session_started"),
    type: "PLAYER_SESSION_STARTED",
    userId: input.userId,
    payload: {
      source: input.source ?? "APP",
      step: input.step ?? "unknown",
      ...(input.mode ? { mode: input.mode } : {}),
      ...(input.language ? { language: input.language } : {}),
      ...(typeof input.playersCount === "number"
        ? { playersCount: input.playersCount }
        : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
    },
  });
}
