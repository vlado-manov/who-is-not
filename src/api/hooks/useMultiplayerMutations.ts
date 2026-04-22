import { useMutation } from "@tanstack/react-query";
import {
  createMultiplayerRoom,
  hostRejoinMultiplayerRoom,
  joinMultiplayerRoom,
  type CreateMultiplayerRoomInput,
  type HostRejoinMultiplayerRoomInput,
  type JoinMultiplayerRoomInput,
} from "../multiplayer";

export function useCreateMultiplayerRoomMutation() {
  return useMutation({
    mutationFn: (input: CreateMultiplayerRoomInput) => createMultiplayerRoom(input),
    retry: false,
  });
}

export function useJoinMultiplayerRoomMutation() {
  return useMutation({
    mutationFn: ({
      joinCode,
      input,
    }: {
      joinCode: string;
      input: JoinMultiplayerRoomInput;
    }) => joinMultiplayerRoom(joinCode, input),
    retry: false,
  });
}

export function useHostRejoinMultiplayerRoomMutation() {
  return useMutation({
    mutationFn: ({
      joinCode,
      input,
    }: {
      joinCode: string;
      input: HostRejoinMultiplayerRoomInput;
    }) => hostRejoinMultiplayerRoom(joinCode, input),
    retry: false,
  });
}
