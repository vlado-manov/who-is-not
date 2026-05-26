import React, { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Canvas, Picture, Skia } from "@shopify/react-native-skia";
import {
  useSharedValue,
  useFrameCallback,
  useDerivedValue,
} from "react-native-reanimated";
import { mulberry32 } from "./revealAmbience.shared";

const rng = mulberry32(29029);
const R = () => rng();

// Safe particle counts — total draw-call budget must stay under ~1000/frame
// to avoid flooding Skia's GC on mobile (same budget as the hell file)
const COUNT_FINE = 160;
const COUNT_MID = 38;
const COUNT_GLINTS = 18;

type P = {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number; colorIdx: number; phase: number;
  arms: number; layer: number;
};

const C_FINE: [number, number, number][] = [
  [255, 255, 255], [255, 253, 248], [255, 250, 238],
  [255, 246, 222], [255, 242, 205], [252, 248, 255],
];

const C_MID: [number, number, number][] = [
  [255, 248, 220], [255, 238, 180], [255, 225, 140],
  [253, 215, 100], [255, 253, 245],
];

const C_GLINT: [number, number, number][] = [
  [255, 255, 255], [255, 252, 230], [252, 235, 160],
];

function makeFine(): P[] {
  return Array.from({ length: COUNT_FINE }, () => {
    const maxLife = 90 + R() * 340;
    const layer = R();
    return {
      x: R(),
      y: -0.05 + R() * 1.1,
      vx: (R() - 0.5) * 0.0008,
      vy: 0.00025 + R() * 0.001 + layer * 0.0003,
      life: R() * maxLife,
      maxLife,
      size: 0.6 + R() * 1.9,
      colorIdx: Math.floor(R() * C_FINE.length),
      phase: R() * Math.PI * 2,
      arms: 0, layer,
    };
  });
}

function makeMid(): P[] {
  return Array.from({ length: COUNT_MID }, () => {
    const maxLife = 140 + R() * 420;
    const layer = R();
    return {
      x: -0.05 + R() * 1.1,
      y: -0.15 + R() * 1.1,
      vx: (R() - 0.5) * 0.0006,
      vy: 0.0002 + R() * 0.0007 + layer * 0.0002,
      life: R() * maxLife,
      maxLife,
      size: 2 + R() * 3.5,
      colorIdx: Math.floor(R() * C_MID.length),
      phase: R() * Math.PI * 2,
      arms: 0, layer,
    };
  });
}

function makeGlints(): P[] {
  return Array.from({ length: COUNT_GLINTS }, () => {
    const maxLife = 160 + R() * 300;
    return {
      x: 0.02 + R() * 0.96,
      y: -0.1 + R() * 0.95,
      vx: (R() - 0.5) * 0.0007,
      vy: 0.0002 + R() * 0.0008,
      life: R() * maxLife,
      maxLife,
      size: 4 + R() * 10,
      colorIdx: Math.floor(R() * C_GLINT.length),
      phase: R() * Math.PI * 2,
      arms: 2 + Math.floor(R() * 2),
      layer: 0.5 + R() * 0.5,
    };
  });
}

export default function RevealHeavenAmbience() {
  const { width: W, height: H } = useWindowDimensions();

  const fine = useSharedValue<P[]>([]);
  const mid = useSharedValue<P[]>([]);
  const glints = useSharedValue<P[]>([]);
  const clock = useSharedValue(0);

  useEffect(() => {
    fine.value = makeFine();
    mid.value = makeMid();
    glints.value = makeGlints();
  }, [W, H]);

  useFrameCallback((info) => {
    "worklet";
    const dt = info.timeSincePreviousFrame ?? 16;
    clock.value += dt;
    const t = clock.value / 1000;

    const baseWind = Math.sin(t * 0.11) * 0.00055 + Math.sin(t * 0.27 + 0.8) * 0.00022;
    const gustWind = Math.max(0, Math.sin(t * 0.08)) * 0.0005 * Math.sin(t * 0.6);

    fine.modify((arr) => {
      for (const p of arr) {
        p.life += 1;
        const wind = (baseWind + gustWind) * (0.4 + p.layer * 0.6);
        p.x += p.vx + wind + Math.sin(t * 0.9 + p.phase) * 0.00015;
        p.y += p.vy;
        if (p.life > p.maxLife || p.y > 1.06) {
          p.x = Math.random();
          p.y = -0.04;
          p.life = 0;
          p.maxLife = 90 + Math.random() * 340;
          p.vy = 0.00025 + Math.random() * 0.001 + p.layer * 0.0003;
          p.vx = (Math.random() - 0.5) * 0.0008;
        }
      }
      return arr;
    });

    mid.modify((arr) => {
      for (const p of arr) {
        p.life += 1;
        const wind = (baseWind + gustWind) * (0.3 + p.layer * 0.7);
        p.x += p.vx + wind + Math.sin(t * 0.55 + p.phase) * 0.0001;
        p.y += p.vy;
        if (p.life > p.maxLife || p.y > 1.1) {
          p.x = -0.05 + Math.random() * 1.1;
          p.y = -0.12;
          p.life = 0;
          p.maxLife = 140 + Math.random() * 420;
          p.vy = 0.0002 + Math.random() * 0.0007 + p.layer * 0.0002;
          p.vx = (Math.random() - 0.5) * 0.0006;
          p.size = 2 + Math.random() * 3.5;
        }
      }
      return arr;
    });

    glints.modify((arr) => {
      for (const p of arr) {
        p.life += 1;
        const wind = (baseWind + gustWind) * 0.5;
        p.x += p.vx + wind;
        p.y += p.vy;
        if (p.life > p.maxLife || p.y > 1.08) {
          p.x = 0.02 + Math.random() * 0.96;
          p.y = -0.08;
          p.life = 0;
          p.maxLife = 160 + Math.random() * 300;
          p.vy = 0.0002 + Math.random() * 0.0008;
          p.vx = (Math.random() - 0.5) * 0.0007;
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

    // ONE paint object reused throughout — Skia copies state at each draw call,
    // so mutating between calls is safe and avoids ~1900 allocations/frame.
    const paint = Skia.Paint();

    // ── radiant top glow ─────────────────────────────────────────────────────
    const gp = 0.5 + 0.18 * Math.sin(t * 0.72);
    paint.setColor(Skia.Color(`rgba(255,248,210,${(gp * 0.28).toFixed(3)})`));
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, W * 0.42, false));
    canvas.drawCircle(W * 0.5, H * 0.03, W * 0.52, paint);

    paint.setColor(Skia.Color(`rgba(255,230,130,${(gp * 0.18).toFixed(3)})`));
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, W * 0.18, false));
    canvas.drawCircle(W * 0.5, H * 0.01, W * 0.22, paint);

    // ── mid golden motes ─────────────────────────────────────────────────────
    for (const p of mid.value) {
      const prog = p.life / p.maxLife;
      const alpha = Math.sin(prog * Math.PI) * (0.55 + 0.45 * Math.abs(Math.sin(t * 1.8 + p.phase)));
      if (alpha < 0.03) continue;
      const c = C_MID[p.colorIdx % C_MID.length]!;
      // halo
      paint.setColor(Skia.Color(`rgba(${c[0]},${c[1]},${c[2]},${(alpha * 0.7).toFixed(3)})`));
      paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, p.size * 2.2, false));
      canvas.drawCircle(p.x * W, p.y * H, p.size, paint);
      // solid core — clear mask filter
      paint.setColor(Skia.Color(`rgba(${c[0]},${c[1]},${c[2]},${alpha.toFixed(3)})`));
      paint.setMaskFilter(null);
      canvas.drawCircle(p.x * W, p.y * H, p.size * 0.38, paint);
    }

    // ── fine stardust ────────────────────────────────────────────────────────
    for (const p of fine.value) {
      const prog = p.life / p.maxLife;
      const twinkle = 0.55 + 0.45 * Math.abs(Math.sin(t * 2.6 + p.phase));
      const alpha = Math.sin(prog * Math.PI) * twinkle;
      if (alpha < 0.06) continue;
      const c = C_FINE[p.colorIdx % C_FINE.length]!;
      // soft glow halo
      paint.setColor(Skia.Color(`rgba(${c[0]},${c[1]},${c[2]},${(alpha * 0.4).toFixed(3)})`));
      paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, p.size * 3.5, false));
      canvas.drawCircle(p.x * W, p.y * H, p.size, paint);
      // sharp core dot
      paint.setColor(Skia.Color(`rgba(${c[0]},${c[1]},${c[2]},${alpha.toFixed(3)})`));
      paint.setMaskFilter(null);
      canvas.drawCircle(p.x * W, p.y * H, p.size * 0.45, paint);
    }

    // ── glint cross-stars ────────────────────────────────────────────────────
    for (const p of glints.value) {
      const prog = p.life / p.maxLife;
      const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(t * 3.8 + p.phase));
      const alpha = Math.sin(prog * Math.PI) * twinkle;
      if (alpha < 0.07) continue;
      const c = C_GLINT[p.colorIdx % C_GLINT.length]!;
      const cx = p.x * W;
      const cy = p.y * H;
      const L = p.size;
      const th = Math.max(1.2, p.size / 7);

      // glow
      paint.setColor(Skia.Color(`rgba(${c[0]},${c[1]},${c[2]},${(alpha * 0.45).toFixed(3)})`));
      paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, p.size * 0.9, false));
      canvas.drawCircle(cx, cy, p.size * 0.7, paint);

      // cross arms (horizontal + vertical thin ovals)
      paint.setColor(Skia.Color(`rgba(${c[0]},${c[1]},${c[2]},${alpha.toFixed(3)})`));
      paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, th, false));
      canvas.drawOval(Skia.XYWHRect(cx - L, cy - th, L * 2, th * 2), paint);
      canvas.drawOval(Skia.XYWHRect(cx - th, cy - L, th * 2, L * 2), paint);
      if (p.arms >= 3) {
        const d = L * 0.55;
        canvas.drawOval(Skia.XYWHRect(cx - d, cy - th * 0.7, d * 2, th * 1.4), paint);
        canvas.drawOval(Skia.XYWHRect(cx - th * 0.7, cy - d, th * 1.4, d * 2), paint);
      }
      // bright center
      paint.setColor(Skia.Color(`rgba(255,255,255,${alpha.toFixed(3)})`));
      paint.setMaskFilter(null);
      canvas.drawCircle(cx, cy, p.size * 0.22, paint);
    }

    // ── wind sheen ───────────────────────────────────────────────────────────
    const wc = (t * 0.135) % 1.0;
    if (wc < 0.24) {
      const sa = Math.sin((wc / 0.24) * Math.PI) * 0.07;
      if (sa > 0.008) {
        paint.setColor(Skia.Color(`rgba(255,255,230,${sa.toFixed(3)})`));
        paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, W * 0.14, false));
        const sx = (wc / 0.24) * W * 1.35 - W * 0.18;
        canvas.drawOval(Skia.XYWHRect(sx - W * 0.15, 0, W * 0.26, H), paint);
      }
    }

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
