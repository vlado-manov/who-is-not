import React from "react";
import LoadingScreen from "../../components/LoadingScreen";

/** Loading overlay показван вътре в HeroPickerScreen докато не са заредени heroes, hero images и PassDevice assets. */
export default function HeroPickerLoadingOverlay() {
  return <LoadingScreen skipIntroAnimation />;
}
