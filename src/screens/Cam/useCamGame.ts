// src/screens/Cam/useCamGame.ts
import { RefObject, useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AppState } from "react-native";
import type { CameraView } from "expo-camera";
import { useTranslation } from "react-i18next";

import {
  trackGameFinished,
  trackGameStarted,
  trackRoundEnded,
  trackRoundStarted,
} from "../../api/analytics";
import { fetchQuestions } from "../../api/questions";
import { pickRoundQuestions } from "../../game/pickRoundQuestions";
import { normalizeLanguage } from "../../i18n";
import { useGameStore } from "../../store/useGameStore";
import { useAuthStore } from "../../store/useUserStore";
import type { IQuestion, QuestionTypeApi } from "../../types/question";
import { formatQuestionWithName } from "../../utils/formatQuestionText";
import {
  CAM_CAPTURE_TIMEOUT_MS,
  CAM_DEFAULT_PACKS,
  CAM_KEEPSAKE_QUALITY,
  CAM_MAX_PACKS,
  CAM_MIN_PICK_POOL,
  CAM_SELFIE_QUALITY,
} from "./cam.constants";
import { deleteCamFiles } from "./camFiles";
import { saveCamMediaToGallery } from "./camGallerySave";
import {
  camGameReducer,
  getAlivePlayers,
  initialCamGameState,
  isCamGameFinished,
} from "./camGameReducer";

export type CamLoadStatus = "idle" | "loading" | "error";
export type CamSaveStatus = "idle" | "saving" | "saved" | "denied" | "failed";
export type CamGame = ReturnType<typeof useCamGame>;

function track(promise: Promise<unknown>) {
  promise.catch((e) => console.warn("cam: analytics failed", e));
}

/**
 * Cam Mode game driver: owns the phase reducer and everything impure around it
 * (question loading, random round picks, camera captures, gallery save, analytics).
 * Nothing here is written to the shared game store.
 */
export function useCamGame(
  cameraRef: RefObject<CameraView | null>,
  /** Adds a caption to a photo and resolves with the new file (null on failure). */
  composeRef: RefObject<
    ((uri: string, caption: string) => Promise<string | null>) | null
  >,
) {
  const { t, i18n } = useTranslation();
  const userId = useAuthStore((s) => s.user.id);
  const isPremium = useAuthStore((s) => s.user.isPremium);
  const [state, dispatch] = useReducer(camGameReducer, initialCamGameState);
  const [loadStatus, setLoadStatus] = useState<CamLoadStatus>("idle");
  const [saveStatus, setSaveStatus] = useState<CamSaveStatus>("idle");
  const [capturing, setCapturing] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;
  const mountedRef = useRef(true);
  const capturingRef = useRef(false);
  const questionsRef = useRef<IQuestion[]>([]);
  const allowedTypesRef = useRef<QuestionTypeApi[]>(["pick"]);
  const usedQuestionIdsRef = useRef<string[]>([]);
  const packsRef = useRef<string[]>([]);
  const gameIdRef = useRef<string | null>(null);
  const capturedUrisRef = useRef<string[]>([]);
  /** `seq` of the phase whose button was already handled — drops double taps. */
  const handledSeqRef = useRef(-1);
  const savedUrisRef = useRef(new Set<string>());

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      deleteCamFiles(capturedUrisRef.current);
    };
  }, []);

  const chooseCount = useCallback(
    async (count: number) => {
      const {
        selectedPacks,
        livesPerPlayer,
        camNumberQuestions,
        camInputQuestions,
      } = useGameStore.getState().gameSettings;
      // Number and written-answer questions are premium options, each switched on separately.
      const allowedTypes: QuestionTypeApi[] = ["pick"];
      if (isPremium && camNumberQuestions) allowedTypes.push("number");
      if (isPremium && camInputQuestions) allowedTypes.push("input");
      const packs = (selectedPacks ?? CAM_DEFAULT_PACKS).slice(0, CAM_MAX_PACKS);
      setLoadStatus("loading");
      try {
        const all = await fetchQuestions({
          packs,
          lang: normalizeLanguage(i18n.language) ?? "en",
          userId,
        });
        const usable = all.filter(
          (q) => q.isActive && allowedTypes.includes(q.type),
        );
        // A round needs two questions of the same type.
        const playableTypes = allowedTypes.filter(
          (type) =>
            usable.filter((q) => q.type === type).length >= CAM_MIN_PICK_POOL,
        );
        if (playableTypes.length === 0) {
          throw new Error("Not enough questions in the selected packs");
        }
        if (!mountedRef.current) return;
        questionsRef.current = usable;
        allowedTypesRef.current = playableTypes;
        usedQuestionIdsRef.current = [];
        packsRef.current = packs;
        setLoadStatus("idle");
        dispatch({ type: "SETUP_READY", count, livesPerPlayer });
      } catch (e) {
        console.warn("cam: failed to load questions", e);
        if (mountedRef.current) setLoadStatus("error");
      }
    },
    [i18n.language, isPremium, userId],
  );

  const capture = useCallback(
    async (quality: number): Promise<string | null> => {
      if (capturingRef.current || AppState.currentState !== "active") return null;
      capturingRef.current = true;
      setCapturing(true);
      try {
        const shot = cameraRef.current?.takePictureAsync({
          quality,
          shutterSound: false,
        });
        // A photo that arrives after the timeout or after exit is still cleaned up.
        const tracked = shot?.then((picture) => {
          if (!picture?.uri) return null;
          if (mountedRef.current) capturedUrisRef.current.push(picture.uri);
          else deleteCamFiles([picture.uri]);
          return picture.uri;
        });
        // The camera can hang if the app is backgrounded mid-capture.
        const timeout = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), CAM_CAPTURE_TIMEOUT_MS),
        );
        return (await Promise.race([tracked, timeout])) ?? null;
      } catch (e) {
        console.warn("cam: capture failed", e);
        return null;
      } finally {
        capturingRef.current = false;
        if (mountedRef.current) setCapturing(false);
      }
    },
    [cameraRef],
  );

  const takeSelfie = useCallback(async () => {
    const uri = await capture(CAM_SELFIE_QUALITY);
    if (uri && mountedRef.current) dispatch({ type: "SELFIE_TAKEN", uri });
  }, [capture]);

  /** Round photo with its caption burned in; falls back to the plain photo. */
  const takeKeepsake = useCallback(
    async (caption: string) => {
      const raw = await capture(CAM_KEEPSAKE_QUALITY);
      const composed =
        raw && composeRef.current ? await composeRef.current(raw, caption) : null;
      if (composed) capturedUrisRef.current.push(composed);
      if (mountedRef.current) {
        dispatch({ type: "KEEPSAKE_TAKEN", uri: composed ?? raw });
      }
    },
    [capture, composeRef],
  );

  /** Starts the next round, or ends the game when too few players are alive. */
  const startRound = useCallback(() => {
    const s = stateRef.current;
    if (handledSeqRef.current === s.seq) return;
    handledSeqRef.current = s.seq;
    if (s.phase.kind === "livesUpdate" && isCamGameFinished(s)) {
      if (gameIdRef.current) {
        track(
          trackGameFinished({ gameId: gameIdRef.current, mode: "LOCAL", userId }),
        );
      }
      dispatch({ type: "GAME_OVER" });
      return;
    }

    // Eliminated players stay in the roster, so only alive ones are eligible.
    const alive = getAlivePlayers(s);
    const pick = pickRoundQuestions({
      questions: questionsRef.current,
      eligiblePlayers: alive,
      usedQuestionIds: usedQuestionIdsRef.current,
      // With several types allowed, each round gets a random one.
      allowedTypes: allowedTypesRef.current,
    });
    const base = questionsRef.current.find((q) => q.id === pick?.baseId);
    const odd = questionsRef.current.find((q) => q.id === pick?.oddId);
    if (!pick || !base || !odd) {
      console.warn("cam: no pick question pair available");
      return;
    }
    usedQuestionIdsRef.current = pick.usedQuestionIds;

    const yourLabel = pick.questionNameTarget ?? t("question_name_your");
    const index = s.roundsPlayed + 1;
    if (index === 1) {
      gameIdRef.current = `cam_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      track(
        trackGameStarted({
          gameId: gameIdRef.current,
          mode: "LOCAL",
          variant: "CAM",
          playersCount: s.players.length,
          language: i18n.language,
          userId,
          packs: packsRef.current,
        }),
      );
    }
    if (gameIdRef.current) {
      track(
        trackRoundStarted({
          gameId: gameIdRef.current,
          roundId: `${gameIdRef.current}_r${index}`,
          mode: "LOCAL",
          roundIndex: index,
          userId,
        }),
      );
    }

    dispatch({
      type: "ROUND_PREPARED",
      round: {
        index,
        questionType: pick.questionType,
        impostorId: pick.oddOneId,
        baseText: formatQuestionWithName(base.text, {
          isImpostor: false,
          yourLabel,
        }),
        oddText: formatQuestionWithName(odd.text, {
          isImpostor: true,
          substituteName: pick.impostorNameSubstitute,
          yourLabel,
        }),
        order: alive.map((p) => p.id),
      },
    });
  }, [i18n.language, t, userId]);

  const answerCaught = useCallback(
    (caught: boolean) => {
      const s = stateRef.current;
      if (s.phase.kind !== "caughtPrompt" || !s.round) return;
      if (handledSeqRef.current === s.seq) return;
      handledSeqRef.current = s.seq;
      if (gameIdRef.current) {
        track(
          trackRoundEnded({
            gameId: gameIdRef.current,
            roundId: `${gameIdRef.current}_r${s.round.index}`,
            mode: "LOCAL",
            roundIndex: s.round.index,
            userId,
          }),
        );
      }
      dispatch({ type: "OUTCOME", caught });
    },
    [userId],
  );

  /** A finished round video: kept for the galleries and saved to the device gallery. */
  const addVideo = useCallback((uri: string) => {
    if (!mountedRef.current) {
      deleteCamFiles([uri]);
      return;
    }
    capturedUrisRef.current.push(uri);
    const round = stateRef.current.round?.index ?? stateRef.current.roundsPlayed;
    dispatch({ type: "VIDEO_RECORDED", uri, round: Math.max(1, round) });
    void saveCamMediaToGallery([uri]).then((result) => {
      if (result === "saved") savedUrisRef.current.add(uri);
    });
  }, []);

  const playAgain = useCallback(() => {
    deleteCamFiles(stateRef.current.media.map((m) => m.uri));
    savedUrisRef.current.clear();
    setSaveStatus("idle");
    dispatch({ type: "PLAY_AGAIN" });
  }, []);

  /** Saves every photo and video not saved yet; the only place photos ask for gallery access. */
  const saveMedia = useCallback(async () => {
    const uris = stateRef.current.media
      .map((m) => m.uri)
      .filter((uri) => !savedUrisRef.current.has(uri));
    setSaveStatus("saving");
    const result = await saveCamMediaToGallery(uris);
    if (result === "saved") uris.forEach((uri) => savedUrisRef.current.add(uri));
    if (mountedRef.current) setSaveStatus(result);
  }, []);

  return {
    state,
    dispatch,
    loadStatus,
    saveStatus,
    capturing,
    chooseCount,
    takeSelfie,
    takeKeepsake,
    startRound,
    answerCaught,
    playAgain,
    saveMedia,
    addVideo,
  };
}
