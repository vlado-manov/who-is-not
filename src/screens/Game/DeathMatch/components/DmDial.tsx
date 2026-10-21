// src/screens/Game/DeathMatch/components/DmDial.tsx
import React, { memo, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import CustomText from "../../../../components/common/CustomText";
import { DM_UI } from "../dm.constants";
import { formatSeconds } from "../dmFormat";

const TICKS = Array.from({ length: 12 }, (_, i) => i);
/** Digit cell width as a share of the font size, so the digits do not jitter. */
const DIGIT_CELL = 0.62;
const SEPARATOR_CELL = 0.3;
/** Digit height as a share of the dial. */
const DIGIT_SIZE = 0.23;

type ReadoutProps = {
  size: number;
  separator: string;
  /** Asked every frame while running. */
  getElapsedMs: () => number;
  running: boolean;
  /** Digits are replaced by this once `hideAfterMs` has passed (blind mode). */
  hideAfterMs?: number;
  /** Shown instead of the live value when not running. */
  staticText: string;
};

/**
 * The only part of the screen that redraws every frame. Each character sits in
 * a fixed-width cell so the digits do not shift as they change. The digits use
 * TikTok Sans rather than the game's headline font: they are data, not a title.
 */
const Readout = memo(function Readout({
  size,
  separator,
  getElapsedMs,
  running,
  hideAfterMs,
  staticText,
}: ReadoutProps) {
  const [ms, setMs] = useState(0);

  useEffect(() => {
    if (!running) return;
    let frame = requestAnimationFrame(function tick() {
      setMs(getElapsedMs());
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [getElapsedMs, running]);

  const hidden = running && hideAfterMs !== undefined && ms >= hideAfterMs;
  const text = !running
    ? staticText
    : hidden
      ? `?${separator}???`
      : formatSeconds(ms, 3, separator);
  // Short texts ("LOCKED IN") are words, not digits: no cells.
  const isNumber = /^[\d?]/.test(text);
  const fontSize = isNumber ? size * DIGIT_SIZE : size * 0.1;

  if (!isNumber) {
    return (
      <CustomText
        variant="h3"
        responsive={false}
        textColor={DM_UI.text}
        className="text-center"
        allowWrap
        style={{ fontSize, lineHeight: fontSize * 1.2, maxWidth: size * 0.72 }}
      >
        {text}
      </CustomText>
    );
  }
  return (
    <View style={styles.readoutRow}>
      {text.split("").map((char, i) => (
        <View
          key={i}
          style={{
            width:
              fontSize * (char === separator ? SEPARATOR_CELL : DIGIT_CELL),
            alignItems: "center",
          }}
        >
          <Text
            maxFontSizeMultiplier={1}
            style={[styles.digit, { fontSize, lineHeight: fontSize * 1.15 }]}
          >
            {char}
          </Text>
        </View>
      ))}
    </View>
  );
});

type Props = ReadoutProps & {
  /** Ring glow: green while running, red once stopped. */
  glow: "none" | "running" | "stopped";
  /** A line under the digits ("off by…"). */
  caption?: string;
};

/** The round stopwatch face: ring, twelve tick marks and the time in the middle. */
export default function DmDial({ glow, caption, ...readout }: Props) {
  const { size } = readout;
  const tickLength = size * 0.06;
  return (
    <View
      style={[
        styles.dial,
        { width: size, height: size, borderRadius: size / 2 },
        glow === "running" && { boxShadow: DM_UI.dialGlowRunning },
        glow === "stopped" && { boxShadow: DM_UI.dialGlowStopped },
      ]}
    >
      {TICKS.map((i) => (
        <View
          key={i}
          pointerEvents="none"
          style={[
            styles.tickArm,
            { height: size - 28, transform: [{ rotate: `${i * 30}deg` }] },
          ]}
        >
          <View
            style={[
              styles.tick,
              { height: i % 3 === 0 ? tickLength * 1.4 : tickLength },
            ]}
          />
        </View>
      ))}
      <Readout {...readout} />
      {caption ? (
        <CustomText
          variant="p-small"
          textColor={DM_UI.textMuted}
          className="text-center"
          allowWrap
          style={{ maxWidth: size * 0.7 }}
        >
          {caption}
        </CustomText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dial: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: DM_UI.dialFace,
    borderWidth: 10,
    borderColor: DM_UI.dialRing,
  },
  tickArm: {
    position: "absolute",
    width: 3,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  tick: {
    width: 3,
    borderRadius: 2,
    backgroundColor: DM_UI.dialTick,
  },
  digit: {
    color: DM_UI.text,
    fontFamily: DM_UI.digitFont,
  },
  readoutRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
