import React, { createContext, useContext } from "react";

/**
 * Visual style of the shared text and button components for a part of the app.
 * `game` is the default game look. `tiktok` switches `CustomText` and
 * `CustomButton` to the Cam Mode look (TikTok Sans, flat red / grey buttons;
 * `tiktokLight` is the same on a white background with dark text),
 * so a whole screen and everything it renders — including modals — can change
 * style without touching each component.
 */
export type UiStyle = "game" | "tiktok" | "tiktokLight";

const UiStyleContext = createContext<UiStyle>("game");

export function UiStyleProvider({
  value,
  children,
}: {
  value: UiStyle;
  children: React.ReactNode;
}) {
  return (
    <UiStyleContext.Provider value={value}>{children}</UiStyleContext.Provider>
  );
}

export function useUiStyle(): UiStyle {
  return useContext(UiStyleContext);
}
