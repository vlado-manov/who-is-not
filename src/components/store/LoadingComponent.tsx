import React from "react";
import LoadingScreen from "../LoadingScreen";

/** Loading overlay със същия вид като HeroPicker – loader frames, logo, анимация. */
export default function LoadingComponent() {
  return (
    <LoadingScreen
      skipIntroAnimation
      overlay
      titleKey="please_wait"
      hint1Key="loading_hint"
      hint2Key="loading_hint_2"
    />
  );
}
