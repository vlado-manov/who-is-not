import { apiPost } from "./client";

type PresenceStartResponse = {
  sessionId: string;
  startedAt: string;
};

export async function startPresence(userId: string, source = "GAME") {
  return apiPost<PresenceStartResponse>(`/users/${userId}/presence/start`, {
    source,
    meta: {
      platform: "expo",
    },
  });
}

export async function heartbeatPresence(userId: string, sessionId: string) {
  return apiPost<{ ok?: boolean }>(`/users/${userId}/presence/heartbeat`, {
    sessionId,
  });
}

export async function endPresence(userId: string, sessionId: string) {
  return apiPost<{ ok?: boolean }>(`/users/${userId}/presence/end`, { sessionId });
}
