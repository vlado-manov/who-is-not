import { subscribeMultiplayerRelay } from "./multiplayerRelay";
import { useGameStore } from "../store/useGameStore";
import { VOTE_CAST_MESSAGE_TYPE } from "../constants/onlineLobby";

let attached = false;

/** Merges all players’ votes so LivesReveal / applyRoundLives match on every device. */
export function attachVoteCastListener() {
  if (attached) return;
  attached = true;
  subscribeMultiplayerRelay((raw) => {
    const d = raw as {
      type?: string;
      targetId?: string;
      fromPlayerId?: string;
    };
    if (d.type !== VOTE_CAST_MESSAGE_TYPE) return;
    if (typeof d.targetId !== "string" || typeof d.fromPlayerId !== "string") {
      return;
    }
    const st = useGameStore.getState();
    if (st.mode !== "ONLINE") return;
    useGameStore.getState().setVote(d.fromPlayerId, d.targetId);
  });
}
