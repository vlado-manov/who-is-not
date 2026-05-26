import { Animated } from "react-native";

export function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pct(rng: () => number, min: number, max: number) {
  return min + rng() * (max - min);
}

export function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

export function startAnim(animation: Animated.CompositeAnimation) {
  return new Promise<void>((resolve) => animation.start(() => resolve()));
}
