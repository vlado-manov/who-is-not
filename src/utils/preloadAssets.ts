// src/utils/preloadAssets.ts
import { Asset } from "expo-asset";
import { Image } from "expo-image";

export async function preloadAssets(
  modules: any[],
  urls: string[] = []
): Promise<void> {
  const local = modules.map((m) => Asset.fromModule(m).downloadAsync());
  const remote = urls.map((u) => Image.prefetch(u));
  await Promise.all([...local, ...remote]);
}
