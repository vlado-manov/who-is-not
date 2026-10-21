// src/screens/Cam/useCamLifecycle.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useCameraPermissions } from "expo-camera";
import {
  CommonActions,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { RootStackParamList } from "../../navigation/types";

type Nav = StackNavigationProp<RootStackParamList, "CamGame">;

/**
 * Everything around the Cam screen that is not game logic: camera permission,
 * leaving the screen, and pausing while the app is in the background.
 */
export function useCamLifecycle(onPermissionGranted: () => void) {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const exitingRef = useRef(false);
  const permissionAskedRef = useRef(false);
  const onGrantedRef = useRef(onPermissionGranted);
  onGrantedRef.current = onPermissionGranted;

  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [permissionSettled, setPermissionSettled] = useState(false);
  const [appInBackground, setAppInBackground] = useState(false);
  /** Bumped when the app returns from the background: restarts the timed phase. */
  const [resumeKey, setResumeKey] = useState(0);

  const exit = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  // Something else was pushed on top (e.g. a game invite): drop this screen so
  // no camera or timers keep running underneath.
  useEffect(() => {
    return navigation.addListener("blur", () => {
      if (exitingRef.current) return;
      exitingRef.current = true;
      navigation.dispatch((navState) => {
        const routes = navState.routes.filter((r) => r.key !== route.key);
        return CommonActions.reset({
          ...navState,
          routes,
          index: routes.length - 1,
        });
      });
    });
  }, [navigation, route.key]);

  // Only a real background counts: iOS permission dialogs report `inactive`.
  useEffect(() => {
    let wasInBackground = false;
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "background") {
        wasInBackground = true;
        setAppInBackground(true);
        return;
      }
      if (next !== "active" || !wasInBackground) return;
      wasInBackground = false;
      // The user may be coming back from the system Settings app.
      void getPermission();
      setAppInBackground(false);
      setResumeKey((k) => k + 1);
    });
    return () => sub.remove();
  }, [getPermission]);

  // The system prompt is requested once per visit; after a denial the screen
  // offers a retry (or Settings) instead of prompting again by itself.
  useEffect(() => {
    if (!permission) return;
    if (permission.granted) {
      onGrantedRef.current();
      return;
    }
    if (permissionAskedRef.current) return;
    permissionAskedRef.current = true;
    if (!permission.canAskAgain) {
      setPermissionSettled(true);
      return;
    }
    const settle = () => setPermissionSettled(true);
    requestPermission().then(settle, settle);
  }, [permission, requestPermission]);

  return {
    cameraGranted: !!permission?.granted,
    /** Set once the camera permission was asked for and not granted. */
    permissionDenied:
      permissionSettled && permission && !permission.granted
        ? { canAskAgain: permission.canAskAgain }
        : null,
    retryPermission: () => void requestPermission(),
    appInBackground,
    resumeKey,
    exit,
  };
}
