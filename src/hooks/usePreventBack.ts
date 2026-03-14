import { useEffect } from "react";
import { BackHandler } from "react-native";

/**
 * Prevents Android hardware back for this screen.
 * Screen swipe-back gestures are controlled via `gestureEnabled` on navigators.
 * @param enabled - when false, back is allowed (default true)
 */
export function usePreventBack(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);

    return () => {
      sub.remove();
    };
  }, [enabled]);
}
