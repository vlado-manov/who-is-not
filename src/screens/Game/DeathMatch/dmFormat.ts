// src/screens/Game/DeathMatch/dmFormat.ts

/**
 * Milliseconds as seconds with a fixed number of decimals ("4.737"), using
 * whole-number maths so the running readout never shows float noise.
 * `separator` is the decimal mark of the app language.
 */
export function formatSeconds(
  ms: number,
  decimals: 1 | 3,
  separator: string,
): string {
  const whole = Math.max(0, Math.round(ms));
  const seconds = Math.floor(whole / 1000);
  const rest = whole % 1000;
  const fraction =
    decimals === 3
      ? String(rest).padStart(3, "0")
      : String(Math.floor(rest / 100));
  return `${seconds}${separator}${fraction}`;
}
