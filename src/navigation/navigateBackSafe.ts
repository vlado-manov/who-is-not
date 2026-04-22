import {
  NavigationProp,
  ParamListBase,
  StackActions,
} from "@react-navigation/native";

/**
 * Pops one screen, but fixes stacks where `navigate` duplicated a route:
 * - Consecutive same route name: pop twice (…, A, A) → back lands before both A's.
 * - Sandwich same name (…, A, B, A): pop twice so back from the top A skips B
 *   and returns to the earlier A (e.g. HeroPicker → PassDevice → HeroPicker).
 */
export function navigateBackSafe(
  navigation: NavigationProp<ParamListBase>,
): void {
  const state = navigation.getState();
  const routes = state?.routes;
  const index = state?.index;
  if (!routes || index == null || index < 1) {
    if (navigation.canGoBack()) navigation.goBack();
    return;
  }

  const cur = routes[index];
  const prev = routes[index - 1];

  if (prev && cur?.name === prev?.name) {
    navigation.dispatch(StackActions.pop(2));
    return;
  }

  const prev2 = index >= 2 ? routes[index - 2] : undefined;
  if (
    prev2 &&
    cur?.name === prev2?.name &&
    cur?.name !== prev?.name
  ) {
    navigation.dispatch(StackActions.pop(2));
    return;
  }

  navigation.goBack();
}
