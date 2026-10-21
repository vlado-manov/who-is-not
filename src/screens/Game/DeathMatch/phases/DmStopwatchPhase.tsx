// src/screens/Game/DeathMatch/phases/DmStopwatchPhase.tsx
import React, { useEffect, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useKeepAwake } from "expo-keep-awake";
import { useTranslation } from "react-i18next";

import { backgrounds } from "../../../../../assets/backgrounds";
import CustomButton from "../../../../components/common/CustomButton";
import CustomText from "../../../../components/common/CustomText";
import AudioManager from "../../../../utils/audioManager";
import DmDial from "../components/DmDial";
import DmFrame from "../components/DmFrame";
import DmTargetCard from "../components/DmTargetCard";
import { DM_TIMING, DM_UI, getDmDialSize } from "../dm.constants";
import { formatSeconds } from "../dmFormat";
import { useStopwatch } from "../useStopwatch";

type Props = {
  playerName: string;
  targetMs: number;
  blind: boolean;
  /**
   * Pass & play: after Stop the player sees their time and presses a button to
   * hand the phone on. Online the time is reported at once, so the other
   * finalist's turn starts without waiting for this player.
   */
  confirmToContinue: boolean;
  onStopped: (elapsedMs: number) => void;
};

const noElapsed = () => 0;

/**
 * One finalist's attempt: Start, then Stop as close to the target as possible.
 * The dial is the centre of the screen; after Stop it shows the time reached
 * and how far it was from the target.
 */
export default function DmStopwatchPhase({
  playerName,
  targetMs,
  blind,
  confirmToContinue,
  onStopped,
}: Props) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  useKeepAwake();

  const [result, setResult] = useState<{ ms: number; auto: boolean } | null>(
    null,
  );
  const watch = useStopwatch((ms, auto) => {
    setResult({ ms, auto });
    if (!confirmToContinue) onStopped(ms);
  });

  // Loaded when the turn opens, so it starts with the watch and not after it.
  useEffect(() => AudioManager.prepareStopwatchLoop(), []);

  // A ticking clock for exactly as long as the watch is running.
  const running = watch.status === "running";
  useEffect(() => {
    if (!running) return;
    AudioManager.startStopwatchLoop();
    return () => AudioManager.stopStopwatchLoop();
  }, [running]);

  const separator = t("deathmatch_decimal_separator");
  const offBy =
    result === null
      ? undefined
      : t("deathmatch_result_off_by", {
          value: formatSeconds(Math.abs(result.ms - targetMs), 3, separator),
        });

  return (
    <DmFrame
      chip={t("deathmatch_your_turn")}
      title={playerName}
      footer={
        // Start and Stop act on touch-down: the moment of the touch is the result.
        watch.status === "idle" ? (
          <CustomButton
            key="start"
            title={t("deathmatch_start")}
            fullWidth
            btnSize="lg"
            fontSize="lg"
            backgroundImage={backgrounds.bg026}
            glow
            glowColor={DM_UI.startGlow}
            shadowColor={DM_UI.startShadow}
            onPressIn={watch.start}
          />
        ) : watch.status === "running" ? (
          <CustomButton
            key="stop"
            title={t("deathmatch_stop")}
            fullWidth
            btnSize="lg"
            fontSize="lg"
            appearance="danger"
            onPressIn={watch.stop}
          />
        ) : confirmToContinue && result ? (
          <CustomButton
            key="continue"
            title={t("deathmatch_continue")}
            fullWidth
            btnSize="md"
            fontSize="md"
            backgroundImage={backgrounds.bg026}
            shadowColor={DM_UI.startShadow}
            onPress={() => onStopped(result.ms)}
          />
        ) : (
          <CustomText
            variant="p-small"
            textColor={DM_UI.textMuted}
            className="text-center"
          >
            {t("deathmatch_waiting_result")}
          </CustomText>
        )
      }
    >
      <DmTargetCard
        targetMs={targetMs}
        size="compact"
        badge={blind ? t("deathmatch_blind_badge") : undefined}
      />
      <View style={styles.dialArea}>
        <DmDial
          size={getDmDialSize(width, height)}
          separator={separator}
          getElapsedMs={watch.getElapsedMs}
          running={watch.status === "running"}
          hideAfterMs={blind ? DM_TIMING.blindVisibleMs : undefined}
          staticText={formatSeconds(result?.ms ?? 0, 3, separator)}
          caption={
            result?.auto ? `${t("deathmatch_auto_stopped")}\n${offBy}` : offBy
          }
          glow={
            watch.status === "running"
              ? "running"
              : watch.status === "stopped"
                ? "stopped"
                : "none"
          }
        />
      </View>
    </DmFrame>
  );
}

type WatchingProps = {
  opponentName: string;
  targetMs: number;
  blind: boolean;
  /** This player's own time this round, when they went first. */
  myStopMs: number | null;
};

/**
 * Online: what a finalist sees while the other one is on the clock. If they
 * have already played, the dial keeps showing their own time and difference.
 */
export function DmWatchingPhase({
  opponentName,
  targetMs,
  blind,
  myStopMs,
}: WatchingProps) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const separator = t("deathmatch_decimal_separator");
  return (
    <DmFrame
      chip={opponentName}
      title={t("deathmatch_opponent_turn", { name: opponentName })}
      subtitle={
        myStopMs !== null
          ? t("deathmatch_you_stopped_at", {
              value: formatSeconds(myStopMs, 3, separator),
            })
          : undefined
      }
    >
      <DmTargetCard
        targetMs={targetMs}
        size="compact"
        badge={blind ? t("deathmatch_blind_badge") : undefined}
      />
      <View style={styles.dialArea}>
        <DmDial
          size={getDmDialSize(width, height)}
          separator={separator}
          getElapsedMs={noElapsed}
          running={false}
          staticText={
            myStopMs !== null
              ? formatSeconds(myStopMs, 3, separator)
              : `?${separator}???`
          }
          caption={
            myStopMs !== null
              ? t("deathmatch_result_off_by", {
                  value: formatSeconds(
                    Math.abs(myStopMs - targetMs),
                    3,
                    separator,
                  ),
                })
              : undefined
          }
          glow={myStopMs !== null ? "stopped" : "running"}
        />
      </View>
    </DmFrame>
  );
}

const styles = StyleSheet.create({
  dialArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
