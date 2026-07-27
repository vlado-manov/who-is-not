import { ImageSourcePropType } from "react-native";
import { backgrounds } from "../../assets/backgrounds";

export type HeroButtonStyle = {
  backgroundImage?: ImageSourcePropType;
  overlayColors?: string[];
  overlayStart?: { x: number; y: number };
  overlayEnd?: { x: number; y: number };
  gradientColors?: string[];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
  borderColor?: string;
  borderWidth?: number;
  glowColor: string;
  shadowColor: string;
  showGloss?: boolean;
  glossOpacity?: number;
  titleColor?: string;
  circlePatternColor?: string;
};

const DEFAULT: HeroButtonStyle = {
  backgroundImage: backgrounds.bg018,
  glowColor: "rgba(255,204,0,1)",
  shadowColor: "#834400",
};

// Keys are API slugs (hyphens, no separators). Single-word heroes match as-is.
const STYLES: Record<string, HeroButtonStyle> = {

  // #be5456 salmon-rose range
  "silent-vanessa": {
    gradientColors: ["#7a2025", "#be5456", "#d07880"],
    gradientStart: { x: 0, y: 0 },
    gradientEnd: { x: 1, y: 1 },
    glowColor: "rgba(190,84,86,0.9)",
    shadowColor: "#3a0a10",
  },

  // EXPERIMENTAL › "CRIMSON BLADE" — lighter bg
  "sir-simpalot": {
    gradientColors: ["#7a0010", "#cc1a2a"],
    borderColor: "rgba(255,80,80,0.55)",
    borderWidth: 1,
    glowColor: "rgba(220,30,60,0.9)",
    shadowColor: "#200000",
  },

  // EXPERIMENTAL › "ULTRA VIOLET"
  retrograda: {
    gradientColors: ["#1a0040", "#4a0080", "#6600cc"],
    gradientStart: { x: 0, y: 0 },
    gradientEnd: { x: 1, y: 1 },
    borderColor: "rgba(180,100,255,0.6)",
    borderWidth: 1,
    glowColor: "rgba(120,0,255,0.9)",
    shadowColor: "#0d0020",
  },

  // PHOTO BG › "BG026 · RAW GREEN"
  brochain: {
    backgroundImage: backgrounds.bg026,
    borderColor: "rgba(41,255,25,0.5)",
    borderWidth: 2,
    glowColor: "rgba(50,210,50,0.9)",
    shadowColor: "#001200",
    showGloss: false,
  },

  // EXPERIMENTAL › "ARCTIC ICE" — pink-tinted background
  "dubai-princess": {
    gradientColors: ["#3a0830", "#c0186a", "#ff80c0"],
    gradientStart: { x: 0, y: 1 },
    gradientEnd: { x: 1, y: 0 },
    borderColor: "rgba(100,210,255,0.65)",
    borderWidth: 1,
    glowColor: "rgba(100,225,255,0.9)",
    shadowColor: "#001524",
  },

  // EXPERIMENTAL › "OBSIDIAN"
  "uncle-vape": {
    gradientColors: ["#1c1c1e", "#2c2c2e"],
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    glowColor: "rgba(90,90,110,0.85)",
    shadowColor: "#000",
    glossOpacity: 0.07,
  },

  // EXPERIMENTAL › "AURORA BURST"
  virala: {
    gradientColors: ["#00c9ff", "#7b2ff7", "#ff6ec7"],
    gradientStart: { x: 0, y: 0.5 },
    gradientEnd: { x: 1, y: 0.5 },
    glowColor: "rgba(50,255,180,0.9)",
    shadowColor: "#3d0080",
  },

  // EXPERIMENTAL › "NEON GHOST"
  "plugged-in-pete": {
    gradientColors: ["#0c1a0c", "#111f11"],
    borderColor: "rgba(41,255,25,0.85)",
    borderWidth: 2,
    glowColor: "rgba(180,255,230,0.82)",
    shadowColor: "#001200",
    showGloss: false,
  },

  // SUNSET FADE — more orange
  "remote-susie": {
    gradientColors: ["#ff5500", "#ff8800", "#ffaa00"],
    gradientStart: { x: 0, y: 0.5 },
    gradientEnd: { x: 1, y: 0.5 },
    glowColor: "rgba(255,130,0,0.9)",
    shadowColor: "#7a2800",
  },

  // EXPERIMENTAL › "BRONZE CHROME"
  "dad-gpt": {
    gradientColors: ["#2e1800", "#c87a30", "#f0aa60", "#c87a30", "#2e1800"],
    gradientStart: { x: 0, y: 0.5 },
    gradientEnd: { x: 1, y: 0.5 },
    borderColor: "rgba(200,140,80,0.7)",
    borderWidth: 1,
    glowColor: "rgba(200,120,50,0.9)",
    shadowColor: "#1a0800",
  },

  // PHOTO BG › "BG016 · GHOST FRAME" — light blue-green backlight
  screena: {
    backgroundImage: backgrounds.bg016,
    borderColor: "rgba(255,255,255,0.4)",
    borderWidth: 1,
    glowColor: "rgba(80,220,200,0.88)",
    shadowColor: "#003322",
    glossOpacity: 0.08,
  },

  // EXPERIMENTAL › "INFERNO"
  "chef-franco": {
    gradientColors: ["#ff4e00", "#ff8c00", "#ffd700"],
    gradientStart: { x: 0, y: 1 },
    gradientEnd: { x: 1, y: 0 },
    glowColor: "rgba(255,75,0,0.9)",
    shadowColor: "#6b1900",
    glossOpacity: 0.22,
  },

  // LIGHT BLUE + dark blue circle pattern, yellow border, black outline
  booena: {
    gradientColors: ["#a8d4ff", "#d0eaff"],
    gradientStart: { x: 0, y: 0 },
    gradientEnd: { x: 1, y: 1 },
    circlePatternColor: "rgba(0,50,160,0.13)",
    borderColor: "#ffd700",
    borderWidth: 2,
    glowColor: "rgba(255,210,0,0.85)",
    shadowColor: "#000000",
    showGloss: false,
  },

  // WHITE & LIGHT BLUE — dark brown text, white border, dark blue shadow outline
  mrgoodtime: {
    gradientColors: ["#e8f4ff", "#ffffff", "#c8deff"],
    gradientStart: { x: 0, y: 0 },
    gradientEnd: { x: 1, y: 1 },
    borderColor: "rgba(255,255,255,0.95)",
    borderWidth: 2,
    glowColor: "rgba(100,160,255,0.65)",
    shadowColor: "#001a4d",
    titleColor: "#3d1800",
    showGloss: false,
  },

  // PHOTO BG › "BG019 · ROSE DUSK" — dark red border
  "wine-bender": {
    backgroundImage: backgrounds.bg019,
    overlayColors: ["rgba(60,0,40,0.4)", "rgba(120,20,80,0.2)"],
    borderColor: "rgba(160,0,20,0.92)",
    borderWidth: 1,
    glowColor: "rgba(220,95,150,0.9)",
    shadowColor: "#2a0020",
  },

  // PHOTO BG › "BG015 · CRIMSON EDGE" — cyan small border
  tedimechov: {
    backgroundImage: backgrounds.bg015,
    borderColor: "rgba(0,220,220,0.65)",
    borderWidth: 1,
    glowColor: "rgba(185,0,30,0.9)",
    shadowColor: "#1a0000",
    showGloss: false,
  },

  // DEEP EMERALD — white border, blue glow
  hangreta: {
    gradientColors: ["#003320", "#006640"],
    gradientStart: { x: 0, y: 0 },
    gradientEnd: { x: 1, y: 1 },
    borderColor: "rgba(255,255,255,0.75)",
    borderWidth: 1,
    glowColor: "rgba(60,140,255,0.88)",
    shadowColor: "#001a10",
  },

  // gradient #cc1f3c → #bdffbd, orange-white border, black shadow outline
  drwrong: {
    gradientColors: ["#cc1f3c", "#7a8f60", "#bdffbd"],
    gradientStart: { x: 0, y: 0 },
    gradientEnd: { x: 1, y: 1 },
    borderColor: "rgba(255,210,140,0.92)",
    borderWidth: 1,
    glowColor: "rgba(180,255,180,0.7)",
    shadowColor: "#000000",
  },
};

export function getHeroButtonStyle(slug?: string | null): HeroButtonStyle {
  return (slug && STYLES[slug]) || DEFAULT;
}
