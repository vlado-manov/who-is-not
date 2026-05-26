import { trackPlayerSessionStarted } from "../api/analytics";

type MultiplayerDiagnosticPayload = Record<string, unknown>;

const lastSentAt = new Map<string, number>();
const THROTTLE_MS = 5000;

/**
 * Fire-and-forget multiplayer diagnostics.
 * Stored through existing events pipeline so we can inspect failures by player/phase.
 */
export function reportMultiplayerDiagnostic(
  step: string,
  metadata: MultiplayerDiagnosticPayload = {}
): void {
  const now = Date.now();
  const key = `${step}:${JSON.stringify(metadata)}`;
  const prev = lastSentAt.get(key) ?? 0;
  if (now - prev < THROTTLE_MS) return;
  lastSentAt.set(key, now);

  void trackPlayerSessionStarted({
    source: "MULTIPLAYER",
    step,
    metadata: {
      ts: now,
      ...metadata,
    },
  }).catch(() => {
    // Diagnostics should never break gameplay flow.
  });
}
