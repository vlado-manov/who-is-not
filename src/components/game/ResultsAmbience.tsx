import React, { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Canvas, Picture, Skia } from "@shopify/react-native-skia";
import {
  useSharedValue,
  useFrameCallback,
  useDerivedValue,
} from "react-native-reanimated";
import { mulberry32 } from "./revealAmbience.shared";

const rng = mulberry32(0xdeadbeef);
const R = () => rng();

const COUNT_EMBERS = 320;

type Ember = {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  colorIdx: number; phase: number;
  turbFreq: number; turbAmp: number;
};

const C_EMBER: [number, number, number][] = [
  [180, 15, 5],
  [220, 35, 8],
  [255, 60, 0],
  [255, 110, 10],
  [255, 160, 20],
  [255, 210, 60],
  [255, 240, 130],
  [255, 255, 200],
  [140, 8, 2],
  [255, 80, 5],
  [200, 0, 0],
  [255, 30, 30],
];

function makeEmbers(): Ember[] {
  return Array.from({ length: COUNT_EMBERS }, () => {
    const spawnX = 0.05 + R() * 0.9;
    const spawnY = 0.5 + R() * 0.5;
    const maxLife = 35 + R() * 130;
    return {
      x: spawnX,
      y: spawnY,
      vx: (R() - 0.5) * 0.01,
      vy: -(0.003 + R() * 0.011),
      life: R() * maxLife,
      maxLife,
      size: 0.8 + R() * 6.5,
      colorIdx: Math.floor(R() * C_EMBER.length),
      phase: R() * Math.PI * 2,
      turbFreq: 1.5 + R() * 4.5,
      turbAmp: 0.0005 + R() * 0.002,
    };
  });
}

export default function ResultsAmbience() {
  const { width: W, height: H } = useWindowDimensions();

  const embers = useSharedValue<Ember[]>([]);
  const clock = useSharedValue(0);

  useEffect(() => {
    embers.value = makeEmbers();
  }, [W, H]);

  useFrameCallback((info) => {
    "worklet";
    const dt = info.timeSincePreviousFrame ?? 16;
    clock.value += dt;
    const t = clock.value / 1000;

    embers.modify((arr) => {
      for (const p of arr) {
        p.life += 1;
        p.x += p.vx + Math.sin(t * p.turbFreq + p.phase) * p.turbAmp;
        p.y += p.vy;
        p.vy += 0.00005;
        if (p.life > p.maxLife || p.y < -0.08 || p.x < -0.1 || p.x > 1.1) {
          p.x = 0.05 + Math.random() * 0.9;
          p.y = 0.55 + Math.random() * 0.45;
          p.life = 0;
          p.maxLife = 35 + Math.random() * 130;
          p.vy = -(0.003 + Math.random() * 0.011);
          p.vx = (Math.random() - 0.5) * 0.01;
          p.size = 0.8 + Math.random() * 6.5;
          p.colorIdx = Math.floor(Math.random() * C_EMBER.length);
        }
      }
      return arr;
    });
  });

  const picture = useDerivedValue(() => {
    "worklet";
    const t = clock.value / 1000;
    const rec = Skia.PictureRecorder();
    const canvas = rec.beginRecording(Skia.XYWHRect(0, 0, W, H));
    const paint = Skia.Paint();

    // ── lava cracks at ground ─────────────────────────────────────────────────
    const cr1 = 0.4 + 0.38 * Math.sin(t * 1.6);
    const cr2 = 0.38 + 0.32 * Math.sin(t * 2.1 + 1.1);
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, 30, false));
    paint.setColor(Skia.Color(`rgba(255,110,10,${(cr1 * 0.52).toFixed(3)})`));
    canvas.drawOval(Skia.XYWHRect(W * 0.04, H * 0.70, W * 0.52, 24), paint);
    canvas.drawOval(Skia.XYWHRect(W * 0.42, H * 0.75, W * 0.46, 20), paint);
    paint.setColor(Skia.Color(`rgba(255,80,5,${(cr2 * 0.44).toFixed(3)})`));
    canvas.drawOval(Skia.XYWHRect(W * 0.14, H * 0.80, W * 0.36, 15), paint);
    canvas.drawOval(Skia.XYWHRect(W * 0.26, H * 0.66, W * 0.24, 12), paint);
    canvas.drawOval(Skia.XYWHRect(W * 0.60, H * 0.84, W * 0.28, 10), paint);

    // ── wide crimson base glow ────────────────────────────────────────────────
    const bg = 0.5 + 0.32 * Math.sin(t * 1.1);
    paint.setColor(Skia.Color(`rgba(180,10,5,${(bg * 0.42).toFixed(3)})`));
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, W * 0.30, false));
    canvas.drawCircle(W * 0.5, H * 0.82, W * 0.38, paint);

    const fp = 0.55 + 0.3 * Math.sin(t * 2.2 + 0.4);
    paint.setColor(Skia.Color(`rgba(255,120,15,${(fp * 0.48).toFixed(3)})`));
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, W * 0.16, false));
    canvas.drawCircle(W * 0.5, H * 0.84, W * 0.20, paint);

    paint.setColor(Skia.Color(`rgba(255,220,40,${(fp * 0.36).toFixed(3)})`));
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, W * 0.07, false));
    canvas.drawCircle(W * 0.5, H * 0.85, W * 0.09, paint);

    const sg = 0.3 + 0.28 * Math.sin(t * 1.7 + 2.0);
    paint.setColor(Skia.Color(`rgba(200,20,5,${(sg * 0.32).toFixed(3)})`));
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, W * 0.22, false));
    canvas.drawCircle(W * 0.22, H * 0.88, W * 0.24, paint);
    canvas.drawCircle(W * 0.78, H * 0.86, W * 0.22, paint);

    // ── embers ────────────────────────────────────────────────────────────────
    for (const p of embers.value) {
      const prog = p.life / p.maxLife;
      const flicker = 0.3 + 0.7 * Math.abs(Math.sin(t * (14 + p.turbFreq * 2.5) + p.phase));
      let alpha: number;
      if (prog < 0.08) {
        alpha = (prog / 0.08) * flicker;
      } else {
        alpha = Math.sin(prog * Math.PI) * flicker;
      }
      if (alpha < 0.03) continue;

      const c = C_EMBER[p.colorIdx % C_EMBER.length]!;
      paint.setColor(Skia.Color(`rgba(${c[0]},${c[1]},${c[2]},${(alpha * 0.6).toFixed(3)})`));
      paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, p.size * 2.2, false));
      canvas.drawCircle(p.x * W, p.y * H, p.size, paint);
      paint.setColor(Skia.Color(`rgba(255,245,210,${(alpha * 0.9).toFixed(3)})`));
      paint.setMaskFilter(null);
      canvas.drawCircle(p.x * W, p.y * H, p.size * 0.32, paint);
    }

    // ── pulsing crimson heat veil ─────────────────────────────────────────────
    const hv = 0.14 + 0.10 * Math.sin(t * 1.0);
    paint.setColor(Skia.Color(`rgba(200,20,5,${hv.toFixed(3)})`));
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, H * 0.18, false));
    canvas.drawOval(Skia.XYWHRect(0, H * 0.42, W, H * 0.42), paint);

    return rec.finishRecordingAsPicture();
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Picture picture={picture} />
      </Canvas>
    </View>
  );
}
