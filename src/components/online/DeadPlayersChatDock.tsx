import React, { useEffect, useState } from "react";
import {
  sendMultiplayerRelay,
  subscribeMultiplayerRelay,
} from "../../api/multiplayerRelay";
import { DEAD_CHAT_MESSAGE_TYPE } from "../../constants/onlineLobby";
import { useGameStore } from "../../store/useGameStore";
import FloatingChatDock, {
  type ChatLine,
} from "../discussion/FloatingChatDock";

/**
 * Shadow-realm chat for eliminated players (spectating). Ephemeral; not persisted.
 */
export default function DeadPlayersChatDock() {
  const [messages, setMessages] = useState<ChatLine[]>([]);

  useEffect(() => {
    const unsub = subscribeMultiplayerRelay((raw) => {
      const d = raw as {
        type?: string;
        fromPlayerId?: string;
        text?: string;
        ts?: number;
      };
      if (d.type !== DEAD_CHAT_MESSAGE_TYPE) return;
      const fromId = d.fromPlayerId;
      const bodyText = d.text;
      if (typeof fromId !== "string" || typeof bodyText !== "string") {
        return;
      }
      const st = useGameStore.getState();
      const senderLives = st.lives[fromId] ?? 0;
      if (senderLives > 0) return;
      const name = st.players.find((p) => p.id === fromId)?.name ?? "?";
      const mine = fromId === st.onlinePlayerId;
      const id = `${d.ts ?? Date.now()}-${fromId}-${Math.random().toString(36).slice(2, 8)}`;
      setMessages((prev) => [
        ...prev,
        {
          id,
          playerId: fromId,
          name,
          text: bodyText,
          ts: typeof d.ts === "number" ? d.ts : Date.now(),
          mine,
        },
      ]);
    });
    return () => unsub();
  }, []);

  const onSend = (text: string) => {
    const st = useGameStore.getState();
    const pid = st.onlinePlayerId;
    if (!pid || (st.lives[pid] ?? 0) > 0) return;
    sendMultiplayerRelay({
      type: DEAD_CHAT_MESSAGE_TYPE,
      text: text.slice(0, 500),
    });
  };

  return (
    <FloatingChatDock
      messages={messages}
      onSend={onSend}
      translationKeyTitle="dead_chat_title"
      translationKeyPlaceholder="dead_chat_placeholder"
      translationKeyEmpty="dead_chat_empty"
      dark
    />
  );
}
