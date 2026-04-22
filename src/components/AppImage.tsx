/**
 * AppImage – wraps expo-image with consistent defaults:
 * - cachePolicy="memory-disk"
 * - transition={200} (0 on Android for remote URLs — avoids blank/fade before decode)
 * - priority="high" for remote https URIs (Android scheduling)
 * Maps resizeMode (RN) to contentFit (expo-image).
 */
import React, { useMemo } from "react";
import { Platform } from "react-native";
import { Image, ImageProps } from "expo-image";

type AppImageProps = ImageProps & {
  resizeMode?: "contain" | "cover" | "stretch" | "center" | "repeat";
};

function sourceHasRemoteUri(source: ImageProps["source"]): boolean {
  if (source == null) return false;
  if (typeof source === "number") return false;
  if (Array.isArray(source)) {
    return source.some(
      (s) =>
        typeof s === "object" &&
        s != null &&
        "uri" in s &&
        typeof (s as { uri?: string }).uri === "string",
    );
  }
  if (typeof source === "object" && "uri" in source) {
    return typeof (source as { uri?: string }).uri === "string";
  }
  return false;
}

export default function AppImage({
  cachePolicy = "memory-disk",
  transition,
  contentFit = "cover",
  resizeMode,
  priority,
  recyclingKey,
  ...props
}: AppImageProps) {
  const remote = useMemo(
    () => sourceHasRemoteUri(props.source),
    [props.source],
  );

  const recyclingKeyResolved = useMemo(() => {
    if (recyclingKey != null) return recyclingKey;
    if (!remote) return undefined;
    const s = props.source;
    if (
      typeof s === "object" &&
      s != null &&
      !Array.isArray(s) &&
      "uri" in s &&
      typeof (s as { uri?: string }).uri === "string"
    ) {
      return (s as { uri: string }).uri;
    }
    return undefined;
  }, [recyclingKey, remote, props.source]);

  const resolvedPriority = priority ?? (remote ? "high" : undefined);

  /** Short fade on Android helps some devices decode WebP before first paint (0 ms can stay blank). */
  const resolvedTransition =
    transition !== undefined
      ? transition
      : Platform.OS === "android" && remote
        ? 90
        : 200;

  const resolvedContentFit =
    contentFit === "cover" && resizeMode
      ? resizeMode === "contain"
        ? "contain"
        : resizeMode === "stretch"
          ? "fill"
          : resizeMode === "center"
            ? "none"
            : contentFit
      : contentFit;

  return (
    <Image
      cachePolicy={cachePolicy}
      transition={resolvedTransition}
      contentFit={resolvedContentFit}
      priority={resolvedPriority}
      recyclingKey={recyclingKeyResolved}
      {...props}
    />
  );
}
