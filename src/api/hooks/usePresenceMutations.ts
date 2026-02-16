import { useMutation } from "@tanstack/react-query";
import { endPresence, heartbeatPresence, startPresence } from "../presence";

export function useStartPresenceMutation() {
  return useMutation({
    mutationFn: ({ userId, source }: { userId: string; source?: string }) =>
      startPresence(userId, source),
    retry: false,
  });
}

export function useHeartbeatPresenceMutation() {
  return useMutation({
    mutationFn: ({ userId, sessionId }: { userId: string; sessionId: string }) =>
      heartbeatPresence(userId, sessionId),
    retry: false,
  });
}

export function useEndPresenceMutation() {
  return useMutation({
    mutationFn: ({ userId, sessionId }: { userId: string; sessionId: string }) =>
      endPresence(userId, sessionId),
    retry: false,
  });
}

