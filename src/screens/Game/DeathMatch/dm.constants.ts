// src/screens/Game/DeathMatch/dm.constants.ts

const CDN =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/";

export const DM_BG_URIS = [
  `${CDN}b30773e3-19df-4706-aab1-bc6ca324bc1b-dm-bg-01.webp`,
  `${CDN}698c0470-d671-475a-80dd-34c779b02967-dm-bg-02.webp`,
  `${CDN}ba1ec846-c12e-4320-bd41-6cb619666378-dm-bg-03.webp`,
  `${CDN}9c371ad0-6dfa-404f-81d4-141f2046debb-dm-bg-04.webp`,
  `${CDN}839f2429-2933-42cf-8c3a-8fefb8d8eb8f-dm-bg-05.webp`,
] as const;

export const DM_HANDTHEPHONE_URI = `${CDN}e86bcb13-5463-487b-b64c-82c41450a8f1-handthephone.webp`;
export const DM_SUDDEN_DEATH_URI = `${CDN}a4cbe88e-1f68-468e-a674-4fb857d919c1-suddendeath.webp`;
export const DM_VS_URI = `${CDN}a9b2f7a2-cd72-4623-a06b-d674b9f24a39-vs.webp`;
export const DM_HTP_TITLE_URI = `${CDN}8cef58e9-b795-4c6e-abfd-1f0ab05fea59-htp.webp`;

/** How To Play rows: the existing icons with the stopwatch-duel rules. */
export const DM_HTP_RULES = [
  {
    uri: `${CDN}184ce12b-dbc0-41bc-8900-8e2ceba5f180-icon1.webp`,
    textKey: "deathmatch_htp_rule_1",
  },
  {
    uri: `${CDN}cfeced22-484b-4ea8-b6d6-f1a4a50c4108-icon3.webp`,
    textKey: "deathmatch_htp_rule_2",
  },
  {
    uri: `${CDN}993dcfb0-9e88-4030-be9f-389bb6ba5959-icon2.webp`,
    textKey: "deathmatch_htp_rule_3",
  },
  {
    uri: `${CDN}3281e41c-b1b6-476c-99c3-b87b2930e984-icon4.webp`,
    textKey: "deathmatch_htp_rule_4",
  },
] as const;

/** The game picks the target: 2.0 … 8.0 s in half-second steps. */
export const DM_TARGET_MIN_MS = 2000;
export const DM_TARGET_MAX_MS = 8000;
export const DM_TARGET_STEP_MS = 500;

export const DM_TIMING = {
  /** A Stop sooner than this after Start is a double tap, not an attempt. */
  minRunMs: 300,
  /** The watch stops by itself here. */
  maxRunMs: 20000,
  /** Blind mode: the digits are shown this long, then hidden. */
  blindVisibleMs: 1000,
  /**
   * The round that decides the duel: its result stays this long, then the
   * winner's celebration starts by itself — no button to press.
   */
  decidedResultMs: 2500,
  /** Online: the referee moves on by itself after these. */
  onlineTargetRevealMs: 3500,
  onlineResultMs: 5000,
  /** Online: a stop is resent this often until the referee has it. */
  stopResendMs: 2000,
  /**
   * Online: a mirror that sees a decided round but never hears the end leaves
   * by itself this long after the referee should have moved on.
   */
  onlineLostEndGraceMs: 3000,
  /** Online: with no state for this long, ask the referee for it again. */
  syncAfterMs: 6000,
  /** Dev lab: the simulated opponent stops after about this long. */
  devOpponentDelayMs: 2500,
  devOpponentSpreadMs: 600,
} as const;

/** Sent in place of a time the other finalist must not know yet. */
export const DM_HIDDEN_STOP = -1;

export const DM_UI = {
  dim: "rgba(0,0,0,0.72)",
  blurIntensity: 28,
  card: "rgba(28,26,40,0.92)",
  cardInner: "rgba(255,255,255,0.05)",
  cardEdge: "rgba(255,255,255,0.12)",
  targetEdge: "rgba(250,137,0,0.55)",
  targetGlow: "0px 0px 14px rgba(250,137,0,0.35)",
  accent: "#FFD36A",
  target: "#FA8900",
  text: "#F5F0E6",
  textMuted: "rgba(255,255,255,0.68)",
  good: "#02BA1D",
  bad: "#FF4D4D",
  dialFace: "#1B1D2A",
  dialRing: "rgba(255,255,255,0.10)",
  dialTick: "rgba(255,255,255,0.38)",
  dialGlowRunning: "0px 0px 26px rgba(2,186,29,0.55)",
  dialGlowStopped: "0px 0px 26px rgba(255,77,77,0.45)",
  startGlow: "rgba(41,255,25,0.8)",
  startShadow: "#005f07",
  radius: 22,
  /** Side padding of the duel screens: the cards and the dial need the width. */
  gutter: 24,
  /** Running time, targets and results: TikTok Sans, apart from the game font. */
  digitFont: "TikTokSans-ExtraBold",
  unitFont: "TikTokSans-Medium",
  /** Flat TikTok-style sheets and cards (settings, target). */
  sheet: "#121212",
  sheetText: "#FFFFFF",
  sheetRule: "rgba(255,255,255,0.14)",
  sheetRadius: 18,
  badgeFill: "rgba(255,255,255,0.14)",
  chipFill: "rgba(255,211,106,0.14)",
} as const;

/** The dial is the main thing on the stopwatch screen. */
export function getDmDialSize(width: number, height: number): number {
  return Math.min(width * 0.84, height * 0.42, 360);
}
