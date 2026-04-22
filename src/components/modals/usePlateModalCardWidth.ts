import { useWindowDimensions } from "react-native";

const PAD_H = 20;
const MAX_W = 380;

/** Width of GameSettings-style plate modals (full width minus padding, capped). */
export function usePlateModalCardWidth() {
  const { width } = useWindowDimensions();
  return Math.min(width - PAD_H * 2, MAX_W);
}
