import React from "react";
import RevealHeavenAmbience from "./RevealHeavenAmbience";
import RevealHellAmbience from "./RevealHellAmbience";

export default function RevealAmbienceOverlay({
  variant,
}: {
  variant: "win" | "lose";
}) {
  return variant === "win" ? <RevealHeavenAmbience /> : <RevealHellAmbience />;
}
