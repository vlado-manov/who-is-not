// utils/carousel.ts
import { IBundle } from "../types/bundle";
import { IPack } from "../types/pack";

export type CarouselLayout = {
  widths: number[];
  left: number[];
  right: number[];
  padLeft: number;
  padRight: number;
  offsets: number[];
};

function defaultSnapRule(i: number, count: number): "left" | "right" {
  if (i === count - 1) {
    return count >= 3 ? "right" : "left";
  }
  return "left";
}

export function computeCarouselFromWidths(
  screenWidth: number,
  widths: number[],
  gap: number,
  snapRule: (i: number, count: number) => "left" | "right" = defaultSnapRule
): CarouselLayout {
  const N = widths.length;

  const left = new Array<number>(N);
  for (let i = 0, acc = 0; i < N; i++) {
    left[i] = acc;
    acc += widths[i] + gap;
  }

  const right = widths.map((w, i) => left[i] + w);

  const padLeft = 24;
  const padRight =
    N === 2 ? Math.max(0, Math.round(screenWidth - widths[N - 1] + 24)) : 24;

  const offsets = new Array<number>(N);
  for (let i = 0; i < N; i++) {
    const snap = snapRule(i, N);
    offsets[i] =
      snap === "left"
        ? left[i] - padLeft
        : right[i] - screenWidth + padRight + 24;
  }

  return { widths, left, right, padLeft, padRight, offsets };
}

export function computeBundleWidths(
  screenWidth: number,
  items: Pick<IBundle, "isFeatured">[],
  narrowRatio: number = 0.8
): number[] {
  return items.map((b, i) =>
    Math.round(screenWidth * (b.isFeatured ? 1 : narrowRatio) - 48)
  );
}

export function computePackWidths(
  screenWidth: number,
  items: IPack[],
  ratio: number = 0.8
): number[] {
  return items.map(() => Math.round(screenWidth * ratio - 48));
}

export function computeUniformWidths(
  screenWidth: number,
  count: number,
  ratio: number
): number[] {
  return Array.from({ length: count }, () => Math.round(screenWidth * ratio));
}
