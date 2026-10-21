// src/constants/tiktokTheme.ts

/**
 * Colours and radii of the TikTok look outside Cam Mode (Store, Profile cards,
 * Help & Support): dark surfaces, white text, grey secondary text, one red accent.
 */
export const TT = {
  bg: "#121212",
  /** Cards over an image or animated background. */
  surface: "rgba(22,24,35,0.92)",
  /** Fields, chips and tiles inside a card. */
  surface2: "rgba(255,255,255,0.10)",
  text: "#FFFFFF",
  text2: "rgba(255,255,255,0.6)",
  line: "rgba(255,255,255,0.12)",
  /** Chips on the flat dark background: one step lighter, with an edge. */
  chip: "#242424",
  chipBorder: "rgba(255,255,255,0.22)",
  primary: "#FE2C55",
  primarySoft: "rgba(254,44,85,0.16)",
  /** Text on a white (selected) control. */
  onLight: "#161823",
  radius: 8,
  cardRadius: 12,
  /** Vertical space between stacked cards / sections. */
  sectionGap: 10,
} as const;

/** Light variant of the same look (online host / join): white, grey fills, dark text. */
export const TTL = {
  bg: "#FFFFFF",
  card: "#FFFFFF",
  /** Fields, chips and unselected options. */
  fill: "#F1F1F2",
  text: "#161823",
  text2: "rgba(22,24,35,0.6)",
  line: "rgba(22,24,35,0.12)",
  primary: "#FE2C55",
  primarySoft: "rgba(254,44,85,0.10)",
  radius: 8,
  cardRadius: 12,
} as const;
