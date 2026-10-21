// src/screens/Cam/camGallerySave.ts
import { Platform } from "react-native";
import { requestPermissionsAsync } from "expo-media-library";
import { saveToLibraryAsync } from "expo-media-library/legacy";

export type CamGallerySaveResult = "saved" | "denied" | "failed";

/** Saves photos and videos to the device gallery (add-only access). */
export async function saveCamMediaToGallery(
  uris: ReadonlyArray<string>,
): Promise<CamGallerySaveResult> {
  try {
    const permission = await requestPermissionsAsync(true);
    // Android 13+ needs no permission to add media; iOS needs add-only access.
    if (Platform.OS === "ios" && !permission.granted) return "denied";
    for (const uri of uris) {
      await saveToLibraryAsync(uri);
    }
    return "saved";
  } catch (e) {
    console.warn("cam: failed to save to gallery", e);
    return "failed";
  }
}
