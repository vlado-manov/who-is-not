// src/screens/Cam/camFiles.ts
import { File } from "expo-file-system";

/** Best-effort removal of captured photos from the cache. */
export function deleteCamFiles(uris: ReadonlyArray<string | null>): void {
  for (const uri of uris) {
    if (!uri) continue;
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch (e) {
      console.warn("cam: failed to delete photo", e);
    }
  }
}
