import { apiGet, apiPost } from "./client";
import { ApiError } from "./types";

export type OnlineRoomStatus = "LOBBY" | "PLAYING" | "PAUSED" | "ENDED";

export type CreateMultiplayerRoomInput = {
  hostPlayerId: string;
  settings?: Record<string, unknown>;
  /** Places before perks, from the host's membership (6 free, 10 Premium). */
  capacityBase?: number;
  /** The host owns a bought hero or Expert (one more place). */
  hostHasPerk?: boolean;
};

export type CreateMultiplayerRoomResult = {
  roomId: string;
  joinCode: string;
  hostPlayerId: string;
  hostSecret: string;
  wsToken: string;
  /** Places in the room (older backends leave it out). */
  capacity?: number;
};

export type JoinMultiplayerRoomInput = {
  playerId: string;
  nickname?: string;
  /** Owns a bought hero or Expert: brings one more place. */
  hasPerk?: boolean;
};

export type JoinMultiplayerRoomResult = {
  roomId: string;
  joinCode: string;
  wsToken: string;
  capacity?: number;
};

/** The room has no place left (backend 409 ROOM_FULL). */
export function roomFullCapacity(e: unknown): number | null {
  if (!(e instanceof ApiError) || e.code !== "ROOM_FULL") return null;
  const details = e.details as { capacity?: number } | undefined;
  return typeof details?.capacity === "number" ? details.capacity : 0;
}

export type HostRejoinMultiplayerRoomInput = {
  hostPlayerId: string;
  hostSecret: string;
};

export type JoinMultiplayerRoomMetadata = {
  roomId: string;
  joinCode: string;
  status: OnlineRoomStatus;
  /** Players who hold a place (left / removed / long-gone not counted). */
  participantCount: number;
  capacity?: number;
  maxPlayers?: number;
};

export async function createMultiplayerRoom(input: CreateMultiplayerRoomInput) {
  return apiPost<CreateMultiplayerRoomResult>("/multiplayer/rooms", input);
}

export async function joinMultiplayerRoom(
  joinCode: string,
  input: JoinMultiplayerRoomInput
) {
  const code = encodeURIComponent(joinCode.trim());
  return apiPost<JoinMultiplayerRoomResult>(
    `/multiplayer/rooms/${code}/join`,
    input
  );
}

export async function hostRejoinMultiplayerRoom(
  joinCode: string,
  input: HostRejoinMultiplayerRoomInput
) {
  const code = encodeURIComponent(joinCode.trim());
  return apiPost<JoinMultiplayerRoomResult>(
    `/multiplayer/rooms/${code}/host-rejoin`,
    input
  );
}

export async function getMultiplayerRoomMetadata(joinCode: string) {
  const code = encodeURIComponent(joinCode.trim());
  return apiGet<JoinMultiplayerRoomMetadata>(`/multiplayer/rooms/${code}`);
}

/** The host's membership or perk changed: tell the backend the room's base. */
export async function hostSetMultiplayerCapacity(
  joinCode: string,
  input: HostRejoinMultiplayerRoomInput & { capacityBase: number; hostHasPerk: boolean },
) {
  const code = encodeURIComponent(joinCode.trim());
  return apiPost<{ ok: true; capacity: number }>(
    `/multiplayer/rooms/${code}/host-capacity`,
    input,
  );
}

/** A player leaves the lobby, freeing their place. */
export async function leaveMultiplayerRoom(joinCode: string, wsToken: string) {
  const code = encodeURIComponent(joinCode.trim());
  return apiPost<{ ok: true }>(`/multiplayer/rooms/${code}/leave`, { wsToken });
}

export async function hostCloseMultiplayerRoom(
  joinCode: string,
  input: HostRejoinMultiplayerRoomInput,
) {
  const code = encodeURIComponent(joinCode.trim());
  return apiPost<{ ok: true }>(
    `/multiplayer/rooms/${code}/host-close`,
    input,
  );
}
