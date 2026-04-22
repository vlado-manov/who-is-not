import { useWindowDimensions } from "react-native";

/** Design reference for language logos (same aspect ratio across app). */
export const LOGO_REF = { w: 360, h: 280 } as const;

/** “How to play” / loader frame overlay on top of logo (Welcome, Loading). */
export const HTP_OVERLAY_REF = {
  w: 350,
  h: 260,
  top: -88,
  left: 12,
} as const;

/** Store icon overlay (PlayersNumber). */
export const STORE_ICON_OVERLAY_REF = {
  w: 350,
  h: 260,
  top: -88,
  left: 0,
} as const;

/** Player count container asset reference. */
export const PLAYER_COUNT_PANEL_REF = { w: 360, h: 160 } as const;

/** Settings / profile icons: distance from physical top of screen. */
export const TOP_EDGE_ICON_OFFSET = 48;

/** Extra space below top row before logo block (logo “a bit lower” + 24px nudge). */
export const LOGO_EXTRA_BELOW_TOP_ROW = 68;

/**
 * Margin from top of scroll/content to logo block (below absolute top icons).
 * Same on Welcome, MenuPlay, PlayersNumber, etc.
 */
export function getLogoBlockMarginTop(topIconSize: number) {
  return (
    TOP_EDGE_ICON_OFFSET + topIconSize + 16 + LOGO_EXTRA_BELOW_TOP_ROW
  );
}

/** Minimum 48px side padding for primary button rows (Welcome, MenuPlay, etc.). */
export function getHorizontalPadding(windowWidth: number) {
  const soft = Math.max(12, windowWidth * 0.04);
  return Math.max(48, Math.min(64, soft));
}

export function getLogoBox(windowWidth: number, paddingH?: number) {
  const pad = paddingH ?? getHorizontalPadding(windowWidth);
  const maxW = Math.min(LOGO_REF.w, windowWidth - pad * 2);
  const h = (maxW / LOGO_REF.w) * LOGO_REF.h;
  return { width: maxW, height: h };
}

export function getHtpOverlay(logoWidth: number) {
  const s = logoWidth / LOGO_REF.w;
  return {
    width: HTP_OVERLAY_REF.w * s,
    height: HTP_OVERLAY_REF.h * s,
    top: HTP_OVERLAY_REF.top * s,
    left: HTP_OVERLAY_REF.left * s,
  };
}

export function getStoreIconOverlay(logoWidth: number) {
  const s = logoWidth / LOGO_REF.w;
  return {
    width: STORE_ICON_OVERLAY_REF.w * s,
    height: STORE_ICON_OVERLAY_REF.h * s,
    top: STORE_ICON_OVERLAY_REF.top * s,
    left: STORE_ICON_OVERLAY_REF.left * s,
  };
}

/** Scale relative to 360px-wide logo (for player-count UI). */
export function getLogoScale(logoWidth: number) {
  return logoWidth / LOGO_REF.w;
}

export function getPlayerCountPanelSize(logoWidth: number) {
  const s = getLogoScale(logoWidth);
  return {
    width: PLAYER_COUNT_PANEL_REF.w * s,
    height: PLAYER_COUNT_PANEL_REF.h * s,
    scale: s,
  };
}

/** VoteNow “vote mark” graphic (ref design ~380×280). */
export function getVoteMarkBox(windowWidth: number) {
  const maxW = Math.min(380, windowWidth - 32);
  const maxH = (maxW / 380) * 280;
  return { width: maxW, height: maxH };
}

export function getVoteNowDecoration(logoWidth: number) {
  const s = logoWidth / LOGO_REF.w;
  return {
    width: 350 * s,
    height: 260 * s,
    top: -160 * s,
    left: 16 * s,
  };
}

export function useResponsive() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const horizontalPadding = getHorizontalPadding(windowWidth);
  const logo = getLogoBox(windowWidth, horizontalPadding);
  const htpOverlay = getHtpOverlay(logo.width);
  const storeIconOverlay = getStoreIconOverlay(logo.width);
  const topIconSize = Math.min(56, Math.max(40, windowWidth * 0.13));
  const isCompactHeight = windowHeight < 700;
  const isShortScreen = windowHeight < 560;
  const logoBlockMarginTop = getLogoBlockMarginTop(topIconSize);

  return {
    windowWidth,
    windowHeight,
    horizontalPadding,
    logo,
    htpOverlay,
    storeIconOverlay,
    topIconSize,
    logoBlockMarginTop,
    isCompactHeight,
    isShortScreen,
  };
}
