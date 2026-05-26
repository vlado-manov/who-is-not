import { useEffect, useRef } from "react";
import { useGameStore } from "../../store/useGameStore";
import { sendPlayerReady } from "../../api/multiplayerSync";
import { mpPhaseAnswers, mpPhaseVotes } from "../../constants/onlineLobby";

// Invisible — fires auto-ready signals so a watching dead player
// doesn't block the multiplayer phase gates.
export default function GamePhaseAutoReady() {
  const mode = useGameStore((s) => s.mode);
  const round = useGameStore((s) => s.round);
  const phase = useGameStore((s) => s.phase);
  const onlinePlayerId = useGameStore((s) => s.onlinePlayerId);

  const sentRef = useRef(new Set<string>());
  const activeRoundNumber = (round ?? 0) + 1;

  useEffect(() => {
    if (mode !== "ONLINE" || !onlinePlayerId) return;

    let phaseKey: string | null = null;
    if (phase === "answering") phaseKey = mpPhaseAnswers(activeRoundNumber);
    else if (phase === "voting") phaseKey = mpPhaseVotes(activeRoundNumber);

    if (!phaseKey || sentRef.current.has(phaseKey)) return;
    sentRef.current.add(phaseKey);
    sendPlayerReady(phaseKey);
  }, [phase, activeRoundNumber, mode, onlinePlayerId]);

  return null;
}
