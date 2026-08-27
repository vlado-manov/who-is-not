import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

export type FriendItem = {
  friendshipId: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  since: string;
};

export type PendingRequest = {
  friendshipId: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  sentAt: string;
};

export type FriendSearchResult = {
  userId: string;
  name: string;
  avatarUrl: string | null;
};

export async function fetchFriends(userId: string) {
  return apiGet<{ items: FriendItem[] }>(`/users/${userId}/friends`);
}

export async function fetchFriendRequests(userId: string) {
  return apiGet<{ received: PendingRequest[]; sent: PendingRequest[] }>(
    `/users/${userId}/friends/requests`
  );
}

export async function searchFriends(userId: string, q: string) {
  return apiGet<{ items: FriendSearchResult[] }>(
    `/users/${userId}/friends/search?q=${encodeURIComponent(q)}`
  );
}

export async function sendFriendRequest(userId: string, addresseeId: string) {
  return apiPost<{ friendshipId: string; status: string }>(
    `/users/${userId}/friends`,
    { addresseeId }
  );
}

export async function respondToFriendRequest(
  userId: string,
  friendshipId: string,
  status: "ACCEPTED" | "REJECTED"
) {
  return apiPatch<{ id: string; status: string }>(
    `/users/${userId}/friends/${friendshipId}`,
    { status }
  );
}

export async function removeFriend(userId: string, friendshipId: string) {
  return apiDelete<{ success: boolean }>(
    `/users/${userId}/friends/${friendshipId}`
  );
}

export async function inviteFriendToGame(
  userId: string,
  friendshipId: string,
  joinCode?: string,
) {
  return apiPost<{ ok: boolean; sent: number }>(
    `/users/${userId}/friends/${friendshipId}/invite`,
    { joinCode },
  );
}
