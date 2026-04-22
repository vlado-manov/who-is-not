import { subscribeMultiplayerRelay } from "./multiplayerRelay";
import { useGameStore } from "../store/useGameStore";
import { ANSWER_CAST_MESSAGE_TYPE } from "../constants/onlineLobby";

let attached = false;

/** Merges every player's answer into the store so Results shows all answers in ONLINE. */
export function attachAnswerCastListener() {
  if (attached) return;
  attached = true;
  subscribeMultiplayerRelay((raw) => {
    const d = raw as {
      type?: string;
      answer?: string;
      fromPlayerId?: string;
    };
    if (d.type !== ANSWER_CAST_MESSAGE_TYPE) return;
    if (typeof d.answer !== "string" || typeof d.fromPlayerId !== "string") {
      return;
    }
    const st = useGameStore.getState();
    if (st.mode !== "ONLINE") return;
    useGameStore.getState().setAnswer(d.fromPlayerId, d.answer);
  });
}
