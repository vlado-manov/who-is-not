import { useMutation } from "@tanstack/react-query";
import {
  trackCharacterSelected,
  trackGameFinished,
  trackGameStarted,
  trackRoundEnded,
  trackRoundStarted,
} from "../analytics";

export function useTrackGameStartedMutation() {
  return useMutation({
    mutationFn: trackGameStarted,
    retry: false,
  });
}

export function useTrackRoundStartedMutation() {
  return useMutation({
    mutationFn: trackRoundStarted,
    retry: false,
  });
}

export function useTrackRoundEndedMutation() {
  return useMutation({
    mutationFn: trackRoundEnded,
    retry: false,
  });
}

export function useTrackGameFinishedMutation() {
  return useMutation({
    mutationFn: trackGameFinished,
    retry: false,
  });
}

export function useTrackCharacterSelectedMutation() {
  return useMutation({
    mutationFn: trackCharacterSelected,
    retry: false,
  });
}

