import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

/**
 * Opens the store from game setup (or Cam Mode) on top of the current screen:
 * going back returns to the setup as it was.
 */
export function openStoreOverlay(navigation: NavigationProp<ParamListBase>): void {
  // Walk up to the root navigator, which owns the store overlay.
  let nav: NavigationProp<ParamListBase> | undefined = navigation;
  while (nav?.getParent()) nav = nav.getParent();
  (nav as unknown as NavigationProp<RootStackParamList>)?.navigate("StoreOverlay");
}
