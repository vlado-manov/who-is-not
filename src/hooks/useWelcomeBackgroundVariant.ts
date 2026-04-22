import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

type Variant = {
  id: "9:16" | "9:19.5" | "9:20";
  ratio: number;
  uri: string;
};

const VARIANTS: Variant[] = [
  {
    id: "9:16",
    ratio: 9 / 16,
    uri: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/95c26246-9252-457c-87e4-0f5d001f1ed8-916.webp",
  },
  {
    id: "9:19.5",
    ratio: 9 / 19.5,
    uri: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/b34866ba-acf7-428f-aafa-b8d27e6bfc01-9195.webp",
  },
  {
    id: "9:20",
    ratio: 9 / 20,
    uri: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/eaef9d46-636c-49f2-931e-6627a9d2dc34-920.webp",
  },
];

/** All welcome curtain backgrounds — prefetch together so Android has decoded assets ready. */
export const WELCOME_BACKGROUND_URIS = VARIANTS.map((v) => v.uri);

export function useWelcomeBackgroundVariant() {
  const { width, height } = useWindowDimensions();

  const variant = useMemo(() => {
    const safeWidth = width > 0 ? width : 9;
    const safeHeight = height > 0 ? height : 16;
    const deviceRatio = safeWidth / safeHeight;

    return VARIANTS.reduce((best, current) => {
      const bestDiff = Math.abs(best.ratio - deviceRatio);
      const currentDiff = Math.abs(current.ratio - deviceRatio);
      return currentDiff < bestDiff ? current : best;
    });
  }, [height, width]);

  return {
    selectedBackgroundUri: variant.uri,
    selectedBackgroundVariant: variant.id,
  };
}

