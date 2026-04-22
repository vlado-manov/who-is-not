import { CommonActions, NavigationProp, ParamListBase } from "@react-navigation/native";

/**
 * Pops the **Root** stack so `CreateGame` dismisses with the same animated transition
 * as when it was opened (`slideFromTop` on Root). Avoids `reset` (no animation).
 *
 * We walk to the outermost parent so we never call `goBack` on the inner CreateGame
 * stack (which would only pop e.g. HeroPicker).
 */
export function goBackFromCreateGameToMenu(
  navigation: NavigationProp<ParamListBase>,
  options?: { beforePop?: () => void }
) {
  options?.beforePop?.();

  let nav: NavigationProp<ParamListBase> | undefined = navigation.getParent();
  let topmost: NavigationProp<ParamListBase> | undefined = undefined;
  while (nav) {
    topmost = nav;
    nav = nav.getParent?.();
  }

  if (topmost?.canGoBack?.()) {
    topmost.goBack();
    return;
  }

  navigation.getParent()?.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: "Onboarding",
          state: {
            index: 0,
            routes: [{ name: "MenuPlay" }],
          },
        },
      ],
    }),
  );
}
