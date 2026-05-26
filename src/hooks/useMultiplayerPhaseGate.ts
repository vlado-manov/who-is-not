import { useEffect, useRef } from "react";
import { subscribeMpPhaseAllReady } from "../api/multiplayerSync";
import { reportMultiplayerDiagnostic } from "../utils/multiplayerDiagnostics";

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
    reportMultiplayerDiagnostic("phase_gate_waiting", { phase });
    const unsub = subscribeMpPhaseAllReady((p) => {
      if (p === phase) {
        reportMultiplayerDiagnostic("phase_gate_ready", { phase: p });
        onReadyRef.current();
      }
    });
    return unsub;
  }, [enabled, phase]);
}
