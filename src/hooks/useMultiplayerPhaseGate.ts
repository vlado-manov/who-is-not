import { useEffect, useRef } from "react";
import { subscribeMpPhaseAllReady } from "../api/multiplayerSync";

/**
 * When `enabled` and server broadcasts `mp_phase_all_ready` for `phase`, runs `onReady` once per event.
 */
export function useMultiplayerPhaseGate(opts: {
  enabled: boolean;
  phase: string | null;
  onReady: () => void;
}): void {
  const { enabled, phase, onReady } = opts;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    if (!enabled || !phase) return;
    const unsub = subscribeMpPhaseAllReady((p) => {
      if (p === phase) onReadyRef.current();
    });
    return unsub;
  }, [enabled, phase]);
}
