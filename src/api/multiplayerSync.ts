import {
  MP_PHASE_ALL_READY_MESSAGE_TYPE,
  PLAYER_READY_MESSAGE_TYPE,
} from "../constants/onlineLobby";
import {
  sendMultiplayerRelay,
  subscribeMultiplayerRelay,
} from "./multiplayerRelay";

export function sendPlayerReady(phase: string): void {
  sendMultiplayerRelay({ type: PLAYER_READY_MESSAGE_TYPE, phase });
}

export function subscribeMpPhaseAllReady(
  fn: (phase: string) => void,
): () => void {
  return subscribeMultiplayerRelay((raw) => {
    const d = raw as { type?: string; phase?: string };
    if (
      d.type === MP_PHASE_ALL_READY_MESSAGE_TYPE &&
      typeof d.phase === "string"
    ) {
      fn(d.phase);
    }
  });
}
