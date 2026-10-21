// src/screens/Cam/CamGameScreen.web.tsx
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";

/** Cam Mode is native-only. This stub keeps the camera modules out of the web bundle. */
export default function CamGameScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  return null;
}
