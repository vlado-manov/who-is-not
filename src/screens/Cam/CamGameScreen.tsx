// src/screens/Cam/CamGameScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  Pressable,
  StyleSheet,
  Vibration,
  View,
} from "react-native";
import { CameraView } from "expo-camera";
import { useKeepAwake } from "expo-keep-awake";
import { useIsFocused } from "@react-navigation/native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import CamCoachMark from "../../components/cam/CamCoachMark";
import CamDimOverlay from "../../components/cam/CamDimOverlay";
import CamExitButton from "../../components/cam/CamExitButton";
import CamFlyingPhoto from "../../components/cam/CamFlyingPhoto";
import CamGallery from "../../components/cam/CamGallery";
import CamLivesReveal from "../../components/cam/CamLivesReveal";
import CamPhotoComposer, {
  type CamComposeJob,
} from "../../components/cam/CamPhotoComposer";
import CamPhotoZoom from "../../components/cam/CamPhotoZoom";
import CamRecordButton from "../../components/cam/CamRecordButton";
import CamRosterGrid from "../../components/cam/CamRosterGrid";
import CamSettingsSheet from "../../components/cam/CamSettingsSheet";
import FullBleedStack from "../../components/FullBleedStack";
import { usePreventBack } from "../../hooks/usePreventBack";
import AudioManager from "../../utils/audioManager";
import {
  CAM_LAYOUT,
  CAM_OVERLAY_BLACK,
  CAM_PLAYER_COLORS,
  CAM_TEXT,
  CAM_TIMING,
  camTint,
  getCamBarHeight,
} from "./cam.constants";
import type {
  CamGameState,
  CamMedia,
  CamPhase,
  CamPlayer,
  CamRect,
} from "./cam.types";
import { computeCamGridLayout } from "./camGridLayout";
import { buildCamLivesCards } from "./camLivesCards";
import { getCamPhotoRects } from "./camPhotoRects";
import { useCamGame } from "./useCamGame";
import { useCamLifecycle } from "./useCamLifecycle";
import { useCamRecorder } from "./useCamRecorder";
import CamPlayerCountPhase from "./phases/CamPlayerCountPhase";
import CamResultPhaseView from "./views/CamResultPhaseView";
import CamRoundPhaseView from "./views/CamRoundPhaseView";
import CamSetupPhaseView from "./views/CamSetupPhaseView";

type PhaseKind = CamPhase["kind"];

/**
 * Phases driven by timers: they restart from the beginning when the app returns
 * from the background. Other phases keep their local state (e.g. a typed name).
 */
const CAM_TIMED_PHASES: ReadonlySet<PhaseKind> = new Set([
  "peekCountdown",
  "voteCountdown",
  "accuseCountdown",
  "keepsake",
]);

/** Phases in which the roster grid covers the camera. */
const CAM_GRID_PHASES: ReadonlySet<PhaseKind> = new Set([
  "selfieFly",
  "roster",
  "livesUpdate",
  "gameOver",
]);

/** The phone is on the table and everyone is in frame: the round can be recorded. */
const CAM_RECORD_PHASES: ReadonlySet<PhaseKind> = new Set([
  "placePhone",
  "voteIntro",
  "voteCountdown",
  "questionSlam",
  "accuseIntro",
  "accuseCountdown",
  "keepsake",
  "caughtPrompt",
]);

const CAM_KEEPSAKE_BORDER = { color: CAM_TEXT, width: 2, radius: 8 };

/** Player holding the phone during handoff / peek phases. */
function getTurnPlayer(state: CamGameState): CamPlayer | null {
  const { phase, round } = state;
  if (
    !round ||
    (phase.kind !== "handoff" &&
      phase.kind !== "peekCountdown" &&
      phase.kind !== "peekQuestion")
  ) {
    return null;
  }
  return state.players.find((p) => p.id === round.order[phase.turn]) ?? null;
}

/** Tint over the camera for the current phase; null leaves the camera clear. */
function getOverlayColor(
  state: CamGameState,
  nameColor: string,
  turnPlayer: CamPlayer | null,
): string | null {
  switch (state.phase.kind) {
    case "permission":
    case "playerCount":
    case "roster":
    case "placePhone":
    case "livesUpdate":
    case "gameOver":
      return CAM_OVERLAY_BLACK;
    case "nameColor":
      return camTint(nameColor);
    case "handoff":
    case "peekCountdown":
    case "peekQuestion":
      return turnPlayer ? camTint(turnPlayer.color) : CAM_OVERLAY_BLACK;
    default:
      return null;
  }
}

/**
 * Cam Mode: one screen for the whole game so the camera never remounts.
 * LOCAL-only by construction — it sits outside GameStack and has no ONLINE branch.
 */
const CamGameScreen = () => {
  const { t } = useTranslation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  usePreventBack();
  useKeepAwake();

  // Fixed at mount so the Android keyboard resize never squeezes the preview.
  const [frame] = useState(() => Dimensions.get("window"));
  const cameraRef = useRef<CameraView>(null);
  const [draftColor, setDraftColor] = useState<string | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  /** `seq` of the lives phase whose full-screen reveal has finished. */
  const [revealDoneSeq, setRevealDoneSeq] = useState(-1);
  const [zoom, setZoom] = useState<{ uri: string; from: CamRect } | null>(null);
  const [galleryScope, setGalleryScope] = useState<"round" | "all" | null>(
    null,
  );
  const [coachVisible, setCoachVisible] = useState(false);

  const [composeJob, setComposeJob] = useState<CamComposeJob | null>(null);
  const composeRef = useRef<
    ((uri: string, caption: string) => Promise<string | null>) | null
  >(null);
  composeRef.current = (uri, caption) =>
    new Promise((resolve) =>
      setComposeJob({
        uri,
        caption,
        onDone: (result) => {
          setComposeJob(null);
          resolve(result);
        },
      }),
    );

  const game = useCamGame(cameraRef, composeRef);
  const { state, dispatch } = game;
  const { phase, players } = state;
  const recorder = useCamRecorder(game.addVideo, () =>
    Alert.alert(t("cam_record_title"), t("cam_record_unavailable")),
  );
  const lifecycle = useCamLifecycle(() =>
    dispatch({ type: "PERMISSION_GRANTED" }),
  );
  const { exit } = lifecycle;

  useEffect(() => {
    void AudioManager.playBackgroundGame();
    return () => {
      void AudioManager.playBackground();
    };
  }, []);

  const revealDone = phase.kind !== "livesUpdate" || revealDoneSeq === state.seq;
  const recordButtonVisible = CAM_RECORD_PHASES.has(phase.kind);
  // The recording runs on through the lives reveal, then ends with the round,
  // so each round gets its own video.
  const roundOnScreen =
    CAM_RECORD_PHASES.has(phase.kind) ||
    (phase.kind === "livesUpdate" && !revealDone);
  const { status: recorderStatus, stop: stopRecording } = recorder;

  useEffect(() => {
    if (!roundOnScreen && (recorderStatus === "recording" || recorderStatus === "paused")) {
      void stopRecording();
    }
  }, [roundOnScreen, recorderStatus, stopRecording]);

  // The record button is pointed out the first time it appears in a game.
  const coachShownRef = useRef(false);
  useEffect(() => {
    if (phase.kind !== "placePhone" || coachShownRef.current) return;
    coachShownRef.current = true;
    setCoachVisible(true);
  }, [phase.kind]);

  // A recording still running is stopped first, so its video is in the gallery.
  const openGallery = async (scope: "round" | "all") => {
    await stopRecording();
    setGalleryScope(scope);
  };
  const galleryItems: CamMedia[] | null =
    galleryScope === null
      ? null
      : galleryScope === "all"
        ? state.media
        : state.media.filter((m) => m.round === state.round?.index);

  const dismissCoach = () => setCoachVisible(false);

  const takenColors = useMemo(() => players.map((p) => p.color), [players]);
  const firstFreeColor =
    CAM_PLAYER_COLORS.find((c) => !takenColors.includes(c)) ??
    CAM_PLAYER_COLORS[0];
  const nameColor =
    draftColor && !takenColors.includes(draftColor) ? draftColor : firstFreeColor;

  // The grid ends at the top edge of the bottom bar, so every photo stays visible.
  const barHeight =
    phase.kind === "gameOver"
      ? getCamBarHeight(state.media.length > 0 ? 2 : 1, true, insets.bottom)
      : getCamBarHeight(1, false, insets.bottom);
  const gridLayout = useMemo(
    () =>
      computeCamGridLayout(
        state.playerCount,
        frame.width,
        frame.height - barHeight,
      ),
    [state.playerCount, frame, barHeight],
  );
  const rects = getCamPhotoRects(frame, insets.bottom);
  const gridVisible = CAM_GRID_PHASES.has(phase.kind);

  const livesCards = useMemo(
    () => buildCamLivesCards(state, t),
    // Cards only change with the phase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.seq, t],
  );
  const gridInteractive =
    phase.kind === "roster" ||
    phase.kind === "gameOver" ||
    (phase.kind === "livesUpdate" && revealDone);

  const turnPlayer = getTurnPlayer(state);
  const overlayColor = getOverlayColor(state, nameColor, turnPlayer);

  const flyingSelfie =
    phase.kind === "selfieFly" ? players[phase.index] : undefined;
  const flyingTo =
    phase.kind === "selfieFly" ? gridLayout.cells[phase.index] : undefined;
  // The round photo rests bottom-right once taken: with the question, and
  // again with the "did you get it right" prompt.
  const keepsakeUri =
    (((phase.kind === "questionSlam" || phase.kind === "keepsake") &&
      phase.captured) ||
      phase.kind === "caughtPrompt") &&
    state.roundKeepsakeUri
      ? state.roundKeepsakeUri
      : null;

  const recordButtonTop = insets.top + CAM_LAYOUT.exitTop;

  return (
    <FullBleedStack
      rootStyle={styles.root}
      backdrop={
        lifecycle.cameraGranted ? (
          <CameraView
            ref={cameraRef}
            style={{ width: frame.width, height: frame.height }}
            facing="front"
            mirror
            mode="picture"
            animateShutter={false}
            // Off while the player-count layout covers it: no need to run the
            // preview under a full-screen picture and its animation.
            active={
              isFocused &&
              !lifecycle.appInBackground &&
              phase.kind !== "playerCount"
            }
          />
        ) : null
      }
    >
      {composeJob && (
        <CamPhotoComposer
          key={composeJob.uri}
          job={composeJob}
          frame={frame}
          topInset={insets.top}
        />
      )}

      {overlayColor && <CamDimOverlay color={overlayColor} />}

      {gridVisible && (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <CamRosterGrid
            players={players}
            layout={gridLayout}
            lives={
              phase.kind === "selfieFly"
                ? undefined
                : { current: state.lives, max: state.livesPerPlayer }
            }
            shakeIds={
              phase.kind === "livesUpdate" && revealDone
                ? livesCards.map((card) => card.player.id)
                : undefined
            }
            hiddenIndex={phase.kind === "selfieFly" ? phase.index : undefined}
            topInset={insets.top}
            onPressCell={
              gridInteractive
                ? (index) => {
                    const uri = players[index]?.photoUri;
                    const from = gridLayout.cells[index];
                    if (uri && from) setZoom({ uri, from });
                  }
                : undefined
            }
          />
        </View>
      )}

      {flyingSelfie?.photoUri && flyingTo && (
        <CamFlyingPhoto
          key={`selfie-${state.seq}`}
          uri={flyingSelfie.photoUri}
          from={rects.fullFrame}
          to={flyingTo}
          durationMs={CAM_TIMING.selfieToSlotMs}
          ribbon={{
            name: flyingSelfie.name,
            color: flyingSelfie.color,
            topInset: flyingTo.y === 0 ? insets.top : 0,
          }}
          border={{
            color: flyingSelfie.color,
            width: CAM_LAYOUT.cellBorderWidth,
            radius: 0,
          }}
        />
      )}

      {keepsakeUri && (
        <CamFlyingPhoto
          key={`keepsake-${keepsakeUri}`}
          uri={keepsakeUri}
          from={rects.fullFrame}
          to={rects.keepsake}
          durationMs={CAM_TIMING.keepsakeFlyMs}
          border={CAM_KEEPSAKE_BORDER}
        />
      )}

      <SafeAreaView
        pointerEvents="box-none"
        style={styles.safe}
        edges={["top", "bottom"]}
      >
        <View
          key={
            CAM_TIMED_PHASES.has(phase.kind)
              ? `${state.seq}-${lifecycle.resumeKey}`
              : state.seq
          }
          pointerEvents="box-none"
          style={styles.phase}
        >
          <CamSetupPhaseView
            game={game}
            permissionDenied={lifecycle.permissionDenied}
            onRetryPermission={lifecycle.retryPermission}
            onOpenSystemSettings={() => void Linking.openSettings()}
            nameColor={nameColor}
            takenColors={takenColors}
            onColorChange={setDraftColor}
            onNamed={(index, name) => {
              setDraftColor(null);
              dispatch({
                type: "PLAYER_NAMED",
                id: `cam_p${index + 1}`,
                name,
                color: nameColor,
              });
            }}
            onExit={exit}
          />
          <CamRoundPhaseView game={game} turnPlayer={turnPlayer} />
          <CamResultPhaseView
            game={game}
            revealDone={revealDone}
            recording={recorderStatus !== "idle"}
            onOpenGallery={(scope) => void openGallery(scope)}
            onExit={exit}
          />
        </View>
      </SafeAreaView>

      {phase.kind === "playerCount" && (
        <CamPlayerCountPhase
          status={game.loadStatus}
          onConfirm={(count) => void game.chooseCount(count)}
          onOpenSettings={() => setSettingsVisible(true)}
          onExit={exit}
        />
      )}

      {keepsakeUri && (
        <Pressable
          accessibilityRole="imagebutton"
          accessibilityLabel={t("cam_gallery")}
          style={[
            styles.absolute,
            {
              left: rects.keepsake.x,
              top: rects.keepsake.y,
              width: rects.keepsake.width,
              height: rects.keepsake.height,
            },
          ]}
          onPress={() => setZoom({ uri: keepsakeUri, from: rects.keepsake })}
        />
      )}

      {phase.kind !== "playerCount" && (
      <View
        style={[
          styles.absolute,
          {
            // Below the name ribbons while the roster grid is on screen.
            top:
              insets.top +
              CAM_LAYOUT.exitTop +
              (gridVisible ? CAM_LAYOUT.ribbonHeight : 0),
            left: CAM_LAYOUT.exitLeft,
          },
        ]}
      >
        <CamExitButton onExit={exit} />
      </View>
      )}

      {recordButtonVisible && (
        <View
          style={[
            styles.absolute,
            { top: recordButtonTop, right: CAM_LAYOUT.exitLeft },
          ]}
        >
          <CamRecordButton recorder={recorder} />
        </View>
      )}

      {phase.kind === "livesUpdate" && !revealDone && (
        <CamLivesReveal
          key={state.seq}
          cards={livesCards}
          maxLives={state.livesPerPlayer}
          insets={insets}
          onDone={() => {
            setRevealDoneSeq(state.seq);
            Vibration.vibrate();
          }}
        />
      )}

      {coachVisible && phase.kind === "placePhone" && (
        <CamCoachMark
          target={{
            centerX:
              frame.width -
              CAM_LAYOUT.exitLeft -
              CAM_LAYOUT.recordButtonSize / 2,
            centerY: recordButtonTop + CAM_LAYOUT.recordButtonSize / 2,
            size: CAM_LAYOUT.recordButtonSize,
          }}
          title={t("cam_record_title")}
          body={t("cam_record_body")}
          buttonLabel={t("cam_record_ok")}
          onDismiss={dismissCoach}
        />
      )}

      {zoom && (
        <CamPhotoZoom
          key={`zoom-${zoom.uri}`}
          uri={zoom.uri}
          from={zoom.from}
          frame={frame}
          topInset={insets.top}
          closeLabel={t("cam_gallery_close")}
          onClose={() => setZoom(null)}
        />
      )}

      {galleryItems && (
        <CamGallery
          items={galleryItems}
          frame={frame}
          insets={insets}
          saveStatus={game.saveStatus}
          onSave={() => void game.saveMedia()}
          onClose={() => setGalleryScope(null)}
        />
      )}

      <CamSettingsSheet
        showWriteQuestions
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </FullBleedStack>
  );
};

export default CamGameScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  phase: {
    flex: 1,
  },
  absolute: {
    position: "absolute",
  },
});
