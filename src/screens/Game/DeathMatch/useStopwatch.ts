// src/screens/Game/DeathMatch/useStopwatch.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { DM_TIMING } from "./dm.constants";

/** Monotonic clock in ms (React Native provides `performance.now`). */
const clock = globalThis as { performance?: { now(): number } };
function nowMs(): number {
  return clock.performance ? clock.performance.now() : Date.now();
}

export type StopwatchStatus = "idle" | "running" | "stopped";

/**
 * One Start → Stop run. The time is the difference of two monotonic clock
 * readings taken as the first thing in the touch-down handlers, so it does not
 * depend on how often the screen redraws. `onStopped` is called once.
 */
export function useStopwatch(
  onStopped: (elapsedMs: number, auto: boolean) => void,
) {
  const [status, setStatus] = useState<StopwatchStatus>("idle");
  const startedAtRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onStoppedRef = useRef(onStopped);
  onStoppedRef.current = onStopped;

  const finish = useCallback((now: number, auto: boolean) => {
    const startedAt = startedAtRef.current;
    if (startedAt === null || stoppedRef.current) return;
    stoppedRef.current = true;
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    setStatus("stopped");
    const elapsed = Math.min(DM_TIMING.maxRunMs, Math.round(now - startedAt));
    onStoppedRef.current(elapsed, auto);
  }, []);

  const start = useCallback(() => {
    const now = nowMs();
    if (startedAtRef.current !== null) return;
    startedAtRef.current = now;
    setStatus("running");
    autoTimerRef.current = setTimeout(
      () => finish(now + DM_TIMING.maxRunMs, true),
      DM_TIMING.maxRunMs,
    );
  }, [finish]);

  const stop = useCallback(() => {
    const now = nowMs();
    const startedAt = startedAtRef.current;
    if (startedAt === null) return;
    // Start turns into Stop under the same finger: ignore the double tap.
    if (now - startedAt < DM_TIMING.minRunMs) return;
    finish(now, false);
  }, [finish]);

  /** Time since Start, for the display only. */
  const getElapsedMs = useCallback(() => {
    const startedAt = startedAtRef.current;
    return startedAt === null ? 0 : nowMs() - startedAt;
  }, []);

  // Leaving the app mid-run ends the attempt there; pausing would be a cheat.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "background") finish(nowMs(), true);
    });
    return () => {
      sub.remove();
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [finish]);

  return { status, start, stop, getElapsedMs };
}
