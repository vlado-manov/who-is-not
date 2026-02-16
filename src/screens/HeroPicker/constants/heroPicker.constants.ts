// heroPicker.constants.ts
import { Dimensions } from "react-native";

const { height: H, width: W } = Dimensions.get("window");

export const HERO_STAGE_HEIGHT = Math.min(Math.round(H * 0.6), 520);
export const CAROUSEL_OUT_DUR = 420;
export const CAROUSEL_IN_DUR = 420;
export const CAROUSEL_DIST = 70;
export const SLIDE_DISTANCE = W * 1.2;

export const QUOTE_ENTER_DUR = 520;
export const TYPE_INTERVAL_MS = 28;
export const READ_HOLD_MS = 1000;
export const QUOTE_EXIT_DUR = 560;

export const SWIPE_THRESHOLD = 40;
