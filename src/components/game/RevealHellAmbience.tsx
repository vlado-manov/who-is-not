import React, { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Canvas, Picture, Skia } from "@shopify/react-native-skia";
import {
  useSharedValue,
  useFrameCallback,
  useDerivedValue,
} from "react-native-reanimated";
import { mulberry32 } from "./revealAmbience.shared";

const rng = mulberry32(80030);
const R = () => rng();

const COUNT_SMOKE = 110;
const COUNT_EMBERS = 320;

// ─── types ────────────────────────────────────────────────────────────────────
type Smoke = {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;       // grows each frame
  birthSize: number;
  colorIdx: number; phase: number;
};

type Ember = {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  colorIdx: number; phase: number;
  // physics params
  turbFreq: number;   // turbulence frequency
  turbAmp: number;    // turbulence amplitude
};

// ── smoke colours: very dark charcoal, near-black with subtle warm/cool tint ──
const C_SMOKE: [number, number, number][] = [
  [18, 12, 10],   // almost black warm
  [22, 16, 14],
  [30, 20, 15],   // dark reddish charcoal
  [15, 14, 18],   // dark cool
  [25, 18, 12],
  [12, 10, 10],
];

// ── ember colours: full spectrum from deep red → hot yellow-white ─────────────
const C_EMBER: [number, number, number][] = [
  [180, 15, 5],    // deep red
  [220, 35, 8],    // bright red
  [255, 60, 0],    // orange-red
  [255, 110, 10],  // orange
  [255, 160, 20],  // amber
  [255, 210, 60],  // golden yellow
  [255, 240, 130], // hot yellow
  [255, 255, 200], // near-white hot
  [140, 8, 2],     // very deep red
  [255, 80, 5],    // vivid orange
];

function makeSmoke(): Smoke[] {
  return Array.from({ length: COUNT_SMOKE }, () => {
    const yFrac = 0.45 + R() * 0.55;
    const maxLife = 140 + R() * 300;
    const birthSize = 20 + R() * 60;
    return {
      x: -0.15 + R() * 1.3,
      y: yFrac,
      vx: (R() - 0.5) * 0.0015,
      vy: -(0.001 + R() * 0.003),
      life: R() * maxLife,
      maxLife,
      birthSize,
      size: birthSize + R() * 35,
      colorIdx: Math.floor(R() * C_SMOKE.length),
      phase: R() * Math.PI * 2,
    };
  });
}

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

export default function RevealHellAmbience() {
  const { width: W, height: H } = useWindowDimensions();

  const smoke = useSharedValue<Smoke[]>([]);
  const embers = useSharedValue<Ember[]>([]);
  const clock = useSharedValue(0);

  useEffect(() => {
    smoke.value = makeSmoke();
    embers.value = makeEmbers();
  }, [W, H]);

  useFrameCallback((info) => {
    "worklet";
    const dt = info.timeSincePreviousFrame ?? 16;
    clock.value += dt;
    const t = clock.value / 1000;

    smoke.modify((arr) => {
      for (const p of arr) {
        p.life += 1;
        // slow horizontal drift + subtle turbulence
        p.x += p.vx + Math.sin(t * 0.4 + p.phase) * 0.0004;
        p.y += p.vy;
        // smoke expands as it rises (less dense = more spread)
        p.size *= 1.005;
        if (p.life > p.maxLife || p.y < -0.3) {
          p.x = -0.15 + Math.random() * 1.3;
          p.y = 0.65 + Math.random() * 0.38;
          p.life = 0;
          p.maxLife = 140 + Math.random() * 300;
          p.birthSize = 20 + Math.random() * 60;
          p.size = p.birthSize;
          p.vy = -(0.001 + Math.random() * 0.003);
          p.vx = (Math.random() - 0.5) * 0.0015;
        }
      }
      return arr;
    });

    embers.modify((arr) => {
      for (const p of arr) {
        p.life += 1;
        // turbulence — each ember has its own frequency/amplitude
        p.x += p.vx + Math.sin(t * p.turbFreq + p.phase) * p.turbAmp;
        p.y += p.vy;
        // very slight gravity (convection heat means almost none)
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

    // ONE paint object reused throughout — avoids ~1000 allocations/frame
    const paint = Skia.Paint();

    // ── smoke columns — drawn first (behind embers) ───────────────────────────
    for (const p of smoke.value) {
      const prog = p.life / p.maxLife;
      let alpha: number;
      if (prog < 0.12) {
        alpha = prog / 0.12;
      } else if (prog < 0.65) {
        alpha = 1;
      } else {
        alpha = (1 - prog) / 0.35;
      }
      alpha *= 0.22;
      if (alpha < 0.005) continue;

      const c = C_SMOKE[p.colorIdx % C_SMOKE.length]!;
      paint.setColor(Skia.Color(`rgba(${c[0]},${c[1]},${c[2]},${alpha.toFixed(3)})`));
      paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, p.size * 0.58, false));
      canvas.drawCircle(p.x * W, p.y * H, p.size * 0.72, paint);
    }

    // ── lava crack glows at ground ────────────────────────────────────────────
    const crack = 0.42 + 0.36 * Math.sin(t * 1.3);
    paint.setColor(Skia.Color(`rgba(255,130,15,${(crack * 0.48).toFixed(3)})`));
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, 28, false));
    canvas.drawOval(Skia.XYWHRect(W * 0.06, H * 0.72, W * 0.5, 22), paint);
    canvas.drawOval(Skia.XYWHRect(W * 0.44, H * 0.76, W * 0.42, 18), paint);
    canvas.drawOval(Skia.XYWHRect(W * 0.18, H * 0.81, W * 0.32, 13), paint);
    canvas.drawOval(Skia.XYWHRect(W * 0.28, H * 0.68, W * 0.2, 10), paint);

    // ── central fire / lava glow at bottom ───────────────────────────────────
    const fp = 0.55 + 0.28 * Math.sin(t * 1.9 + 0.3);
    paint.setColor(Skia.Color(`rgba(200,35,5,${(fp * 0.38).toFixed(3)})`));
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, W * 0.26, false));
    canvas.drawCircle(W * 0.5, H * 0.78, W * 0.32, paint);

    paint.setColor(Skia.Color(`rgba(255,115,15,${(fp * 0.45).toFixed(3)})`));
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, W * 0.14, false));
    canvas.drawCircle(W * 0.5, H * 0.8, W * 0.16, paint);

    paint.setColor(Skia.Color(`rgba(255,210,30,${(fp * 0.35).toFixed(3)})`));
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, W * 0.06, false));
    canvas.drawCircle(W * 0.5, H * 0.81, W * 0.07, paint);

    // ── embers ────────────────────────────────────────────────────────────────
    for (const p of embers.value) {
      const prog = p.life / p.maxLife;
      const flicker = 0.35 + 0.65 * Math.abs(Math.sin(t * (12 + p.turbFreq * 2) + p.phase));
      let alpha: number;
      if (prog < 0.08) {
        alpha = (prog / 0.08) * flicker;
      } else {
        alpha = Math.sin(prog * Math.PI) * flicker;
      }
      if (alpha < 0.03) continue;

      const c = C_EMBER[p.colorIdx % C_EMBER.length]!;
      // glow halo
      paint.setColor(Skia.Color(`rgba(${c[0]},${c[1]},${c[2]},${(alpha * 0.55).toFixed(3)})`));
      paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, p.size * 2.0, false));
      canvas.drawCircle(p.x * W, p.y * H, p.size, paint);
      // bright core — no blur
      paint.setColor(Skia.Color(`rgba(255,242,200,${(alpha * 0.88).toFixed(3)})`));
      paint.setMaskFilter(null);
      canvas.drawCircle(p.x * W, p.y * H, p.size * 0.35, paint);
    }

    // ── heat veil — pulsing red fog over mid-section ──────────────────────────
    const hv = 0.12 + 0.09 * Math.sin(t * 0.9);
    {
      paint.setColor(Skia.Color(`rgba(200,20,5,${hv.toFixed(3)})`));
      paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, H * 0.16, false));
      canvas.drawOval(Skia.XYWHRect(0, H * 0.45, W, H * 0.38), paint);
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
