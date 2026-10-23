// src/screens/Cam/cam.constants.ts

/** Player colours — existing palette tokens (see docs/DESIGN_CONTEXT.md). */
export const CAM_PLAYER_COLORS = [
  "#FA3A00",
  "#374EE2",
  "#02BA1D",
  "#C44CD7",
  "#49D0B5",
  "#FA8900",
  // 7–9 players (palette: primary-800, primary-300, secondary pressed).
  "#CACA23",
  "#205E46",
  "#E878BE",
] as const;

export const CAM_OVERLAY_ALPHA = 0.75;
export const CAM_OVERLAY_BLACK = `rgba(0,0,0,${CAM_OVERLAY_ALPHA})`;
export const CAM_CAPTION_BG = "#000000";
export const CAM_TEXT = "#FFFFFF";
/** Dim over an eliminated player's photo. */
export const CAM_OUT_DIM = "rgba(0,0,0,0.7)";
/**
 * Cam Mode is styled after TikTok rather than the game: TikTok Sans, its
 * red primary button, grey translucent secondary controls and boxed captions.
 */
export const CAM_FONT = {
  regular: "TikTokSans-Regular",
  medium: "TikTokSans-Medium",
  semiBold: "TikTokSans-SemiBold",
  bold: "TikTokSans-Bold",
  extraBold: "TikTokSans-ExtraBold",
} as const;

export const CAM_UI = {
  primary: "#FE2C55",
  secondary: "rgba(120,120,128,0.36)",
  secondaryBorder: "rgba(255,255,255,0.28)",
  lightText: "#161823",
  inputBg: "rgba(255,255,255,0.16)",
  placeholder: "rgba(255,255,255,0.55)",
  heartGlow: "rgba(255,60,20,0.55)",
  /** Bottom sheets (intro, settings). */
  sheet: "#121212",
  backdrop: "rgba(0,0,0,0.6)",
  blurIntensity: 40,
  pressedScale: 0.96,
  radius: 8,
} as const;

/** iOS only — Android draws the tint without blur. */
export const CAM_BLUR_INTENSITY = 30;

/** Same pack defaults and cap as the classic flow (HeroPickerScreen). */
export const CAM_DEFAULT_PACKS = ["main"];
export const CAM_MAX_PACKS = 5;

export const CAM_LAYOUT = {
  /** Player colour frame around each roster photo. */
  cellBorderWidth: 4,
  ribbonHeight: 48,
  /** Captions start below the exit button row. */
  captionTop: 48,
  exitTop: 6,
  exitLeft: 12,
  keepsakeThumbWidth: 92,
  keepsakeRight: 16,
  /** Lifts the keepsake above the bottom buttons and caption. */
  keepsakeBottom: 150,
  heartSize: 28,
  /** Hearts on the full-screen lives card. */
  heartSizeCard: 46,
  /** Bottom bar under the roster grid: the grid ends at its top edge. */
  barPaddingTop: 12,
  barPaddingBottom: 8,
  barButtonHeight: 50,
  barRowGap: 10,
  barHeadlineHeight: 34,
  recordButtonSize: 40,
  /** Smaller hearts when players have 5 lives. */
  heartSizeSmall: 20,
  /** Flight progress (0 = full screen, 1 = landed) at which the name ribbon starts fading in. */
  ribbonFadeStart: 0.5,
} as const;

export const CAM_MIN_PLAYERS = 3;
export const CAM_MAX_PLAYERS = 9;
/** Free play goes up to this many; more need Premium (see game/playerLimits). */
export const CAM_FREE_PLAYERS = 4;
export const CAM_NAME_MAX = 12;
/** A round needs a base and an odd question. */
export const CAM_MIN_PICK_POOL = 2;
/** The game ends when this many players (or fewer) are still alive. */
export const CAM_END_ALIVE_COUNT = 2;

export const CAM_SELFIE_QUALITY = 0.6;
export const CAM_KEEPSAKE_QUALITY = 0.85;
export const CAM_CAPTURE_TIMEOUT_MS = 5000;

/**
 * The roster grid is two columns side by side, each splitting the full height
 * between its photos (a "mosaic"): the numbers are how many photos each column
 * holds. With an odd count the columns simply hold different numbers — 3 is a
 * tall photo next to two stacked ones, 5 is two next to three — so no player
 * is ever stretched across a whole row on their own.
 */
export const CAM_GRID_COLUMNS: Record<number, [number, number]> = {
  3: [1, 2],
  4: [2, 2],
  5: [2, 3],
  6: [3, 3],
  7: [3, 4],
  8: [4, 4],
  9: [4, 5],
};

/** Below this cell height the name pill, hearts and VS badge get smaller. */
export const CAM_COMPACT_CELL_HEIGHT = 170;

export const CAM_TIMING = {
  selfieToSlotMs: 550,
  selfieLandedHoldMs: 900,
  peekCountStepMs: 700,
  slowCountStepMs: 1200,
  /** After NOW in the vote countdown, before the question and the first photo. */
  voteNowHoldMs: 1500,
  /** After the question slams in, before "Who is the impostor?" and Continue. */
  impostorPromptDelayMs: 1500,
  /** After NOW in the accuse countdown, before the second photo. */
  keepsakeDelayMs: 500,
  keepsakeFlyMs: 600,
  keepsakeHoldMs: 900,
  /** Heart-loss animation: wait, pulse up, pulse down (as in LivesReveal). */
  heartLossDelayMs: 500,
  heartPulseUpMs: 200,
  heartPulseDownMs: 220,
  /** How long each player stays full screen while lives are revealed. */
  livesCardMs: 2400,
  cellShakeStepMs: 60,
  photoZoomMs: 260,
  /** Adding the caption to a round photo: wait for layout, and give up after. */
  composeSettleMs: 150,
  composeTimeoutMs: 4000,
  /** Android: time the system needs to finish writing the screen recording. */
  recordSettleMs: 1000,
} as const;

export function camTint(hex: string, alpha: number = CAM_OVERLAY_ALPHA): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Height of the bottom bar for a number of button rows, with an optional headline. */
export function getCamBarHeight(
  rows: number,
  hasHeadline: boolean,
  bottomInset: number,
): number {
  return (
    bottomInset +
    CAM_LAYOUT.barPaddingTop +
    CAM_LAYOUT.barPaddingBottom +
    rows * CAM_LAYOUT.barButtonHeight +
    (rows - 1) * CAM_LAYOUT.barRowGap +
    (hasHeadline ? CAM_LAYOUT.barHeadlineHeight + CAM_LAYOUT.barRowGap : 0)
  );
}
