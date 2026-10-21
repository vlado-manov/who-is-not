// src/screens/Cam/useCamRecorder.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, TurboModuleRegistry } from "react-native";

import { CAM_TIMING } from "./cam.constants";

export type CamRecorderStatus = "idle" | "starting" | "recording" | "paused";

type ScreenRecorderModule = typeof import("react-native-nitro-screen-recorder");

/**
 * Loaded lazily and defensively: the recorder is a native module that does not
 * exist in Expo Go or on web. Without it the record button explains why.
 */
function loadScreenRecorder(): ScreenRecorderModule | null {
  // Checked first so a build without the native part never even loads the
  // library (loading it there raises a "NitroModules could not be found" error).
  if (!TurboModuleRegistry.get("NitroModules")) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("react-native-nitro-screen-recorder") as ScreenRecorderModule;
  } catch (e) {
    console.warn("cam: screen recorder is not available in this build", e);
    return null;
  }
}

function toFileUri(path: string): string {
  return path.startsWith("file://") ? path : `file://${path}`;
}

/**
 * Optional screen recording of a round: the video shows the whole screen — the
 * camera with the captions, countdowns and questions on top — with sound from
 * the microphone when allowed. iOS records inside the app (ReplayKit); Android
 * uses the system screen capture.
 *
 * The player only has Start and Pause. Screen capture cannot really pause, so
 * a pause closes the current video and the next start opens another one: a
 * round paused once ends up as two videos. `stop` (end of the round, or the
 * gallery opening) closes whatever is running.
 */
export function useCamRecorder(
  onRecorded: (uri: string) => void,
  /** Record was tapped in a build without the native recorder (e.g. Expo Go). */
  onUnavailable: () => void,
) {
  const [status, setStatus] = useState<CamRecorderStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const moduleRef = useRef<ScreenRecorderModule | null | undefined>(undefined);
  const statusRef = useRef<CamRecorderStatus>("idle");
  const mountedRef = useRef(true);
  /** Paths already handed over — the library can report a finished file twice. */
  const deliveredRef = useRef(new Set<string>());
  const closingRef = useRef<Promise<void> | null>(null);
  const onRecordedRef = useRef(onRecorded);
  onRecordedRef.current = onRecorded;
  const onUnavailableRef = useRef(onUnavailable);
  onUnavailableRef.current = onUnavailable;

  const getModule = useCallback(() => {
    if (moduleRef.current === undefined) moduleRef.current = loadScreenRecorder();
    return moduleRef.current;
  }, []);
  const [available] = useState(() => getModule() !== null);

  const getStatus = useCallback(() => statusRef.current, []);
  const update = useCallback((next: CamRecorderStatus) => {
    statusRef.current = next;
    if (mountedRef.current) setStatus(next);
  }, []);

  const deliver = useCallback((path: string | undefined) => {
    if (!path || deliveredRef.current.has(path)) return;
    deliveredRef.current.add(path);
    onRecordedRef.current(toFileUri(path));
  }, []);

  /**
   * Closes the video being recorded and hands its file over. Concurrent calls
   * share one close; with nothing recording it resolves at once.
   */
  const closeVideo = useCallback(
    (next: "idle" | "paused"): Promise<void> => {
      if (closingRef.current) return closingRef.current;
      const recorder = getModule();
      if (!recorder || getStatus() !== "recording") {
        if (next === "idle" && getStatus() === "paused") update("idle");
        return Promise.resolve();
      }
      update(next);

      const closing = (async () => {
        try {
          const file =
            Platform.OS === "ios"
              ? await recorder.stopInAppRecording()
              : await recorder.stopGlobalRecording({
                  settledTimeMs: CAM_TIMING.recordSettleMs,
                });
          deliver(file?.path);
        } catch (e) {
          console.warn("cam: failed to close the recording", e);
        } finally {
          closingRef.current = null;
        }
      })();
      closingRef.current = closing;
      return closing;
    },
    [deliver, getModule, getStatus, update],
  );

  /** End of the round / gallery opening: close the video, back to idle. */
  const stop = useCallback(() => closeVideo("idle"), [closeVideo]);
  const pause = useCallback(() => closeVideo("paused"), [closeVideo]);

  /** Starts recording, or continues after a pause (the timer keeps its total). */
  const start = useCallback(async () => {
    const recorder = getModule();
    if (!recorder) {
      onUnavailableRef.current();
      return;
    }
    const from = getStatus();
    if (from !== "idle" && from !== "paused") return;
    if (closingRef.current) await closingRef.current;
    update("starting");
    if (from === "idle") setSeconds(0);
    try {
      // Sound is optional: without microphone access the video is silent.
      let enableMic = recorder.getMicrophonePermissionStatus() === "granted";
      if (recorder.getMicrophonePermissionStatus() === "undetermined") {
        enableMic = (await recorder.requestMicrophonePermission()).granted;
      }
      if (Platform.OS === "ios") {
        // The app already shows the camera, so the library's own overlay is off.
        await recorder.startInAppRecording({
          options: { enableMic, enableCamera: false },
          onRecordingFinished: (file) => deliver(file.path),
        });
      } else {
        recorder.startGlobalRecording({
          options: { enableMic },
          onRecordingError: (error) => {
            console.warn("cam: screen recording error", error.message);
            update(from);
          },
        });
      }
      if (getStatus() === "starting") update("recording");
    } catch (e) {
      // Includes the user declining the system "record screen" prompt.
      console.warn("cam: failed to start the recording", e);
      update(from);
    }
  }, [deliver, getModule, getStatus, update]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (statusRef.current === "recording") {
        const recorder = moduleRef.current;
        if (Platform.OS === "ios") void recorder?.cancelInAppRecording();
        else void recorder?.stopGlobalRecording();
      }
    };
  }, []);

  useEffect(() => {
    if (status !== "recording") return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  return { available, status, seconds, start, pause, stop };
}

export type CamRecorder = ReturnType<typeof useCamRecorder>;
