import { apiGet, apiPost } from "./client";

export type OnlineRoomStatus = "LOBBY" | "PLAYING" | "PAUSED" | "ENDED";

export type CreateMultiplayerRoomInput = {
  hostPlayerId: string;
  settings?: Record<string, unknown>;
};

export type CreateMultiplayerRoomResult = {
  roomId: string;
  joinCode: string;
  hostPlayerId: string;
  hostSecret: string;
  wsToken: string;
};

export type JoinMultiplayerRoomInput = {
  playerId: string;
  nickname?: string;
};

export type JoinMultiplayerRoomResult = {
  roomId: string;
  joinCode: string;
  wsToken: string;
};

export type HostRejoinMultiplayerRoomInput = {
  hostPlayerId: string;
  hostSecret: string;
};

export type JoinMultiplayerRoomMetadata = {
  roomId: string;
  joinCode: string;
  status: OnlineRoomStatus;
  participantCount: number;
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
