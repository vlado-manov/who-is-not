import { subscribeMultiplayerRelay } from "./multiplayerRelay";
import { useGameStore } from "../store/useGameStore";
import type { MultiplayerRoundStateSnapshot } from "../store/useGameStore";
import { ROUND_STATE_MESSAGE_TYPE } from "../constants/onlineLobby";

let attached = false;

/** Subscribes once; guests apply host round RNG so all devices see the same question/impostor. */
export function attachRoundStateListener() {
  if (attached) return;
  attached = true;
  subscribeMultiplayerRelay((raw) => {
    const d = raw as {
      type?: string;
      payload?: MultiplayerRoundStateSnapshot;
    };
    if (d.type !== ROUND_STATE_MESSAGE_TYPE || !d.payload) return;
    const st = useGameStore.getState();
    if (st.mode !== "ONLINE" || st.onlineIsHost) return;
    useGameStore.getState().applyRoundSnapshot(d.payload);
  });
}
