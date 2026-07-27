import React, { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Canvas, Picture, Skia } from "@shopify/react-native-skia";
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";
import { mulberry32 } from "./revealAmbience.shared";

const rng = mulberry32(88147);
const R = () => rng();

const COUNT_FINE = 180;
const COUNT_MID = 44;
const COUNT_GLINTS = 22;
const COUNT_FOG = 11;

type P = {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number; colorIdx: number; phase: number;
  arms: number; layer: number;
};

type FogBlob = {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  phase: number; rotPhase: number;
  layer: number;
};

const C_FINE: [number, number, number][] = [
  [255, 255, 255], [255, 253, 242], [255, 249, 228],
  [255, 244, 210], [255, 238, 192], [250, 250, 255],
];

const C_MID: [number, number, number][] = [
  [255, 248, 200], [255, 233, 140], [255, 212, 88],
  [255, 198, 68],  [255, 226, 118],
];

const C_GLINT: [number, number, number][] = [
  [255, 255, 255], [255, 250, 205], [255, 212, 78],
];

function makeFine(): P[] {
  return Array.from({ length: COUNT_FINE }, () => {
    const maxLife = 80 + R() * 320;
    const layer = R();
    return {
      x: R(), y: -0.05 + R() * 1.1,
      vx: (R() - 0.5) * 0.0009,
      vy: 0.0003 + R() * 0.0012 + layer * 0.0004,
      life: R() * maxLife, maxLife,
      size: 0.7 + R() * 2.1,
      colorIdx: Math.floor(R() * C_FINE.length),
      phase: R() * Math.PI * 2,
      arms: 0, layer,
    };
  });
}

function makeMid(): P[] {
  return Array.from({ length: COUNT_MID }, () => {
    const maxLife = 120 + R() * 400;
    const layer = R();
    return {
      x: -0.05 + R() * 1.1, y: -0.15 + R() * 1.1,
      vx: (R() - 0.5) * 0.0007,
      vy: 0.00025 + R() * 0.0008 + layer * 0.00025,
      life: R() * maxLife, maxLife,
      size: 2 + R() * 4,
      colorIdx: Math.floor(R() * C_MID.length),
      phase: R() * Math.PI * 2,
      arms: 0, layer,
    };
  });
}

function makeGlints(): P[] {
  return Array.from({ length: COUNT_GLINTS }, () => {
    const maxLife = 140 + R() * 280;
    return {
      x: 0.02 + R() * 0.96, y: -0.1 + R() * 0.95,
      vx: (R() - 0.5) * 0.0008,
      vy: 0.00025 + R() * 0.0009,
      life: R() * maxLife, maxLife,
      size: 4 + R() * 12,
      colorIdx: Math.floor(R() * C_GLINT.length),
      phase: R() * Math.PI * 2,
      arms: 2 + Math.floor(R() * 2),
      layer: 0.5 + R() * 0.5,
    };
  });
}

function makeFog(): FogBlob[] {
  return Array.from({ length: COUNT_FOG }, () => {
    const maxLife = 280 + R() * 480;
    const layer = 0.2 + R() * 0.8;
    return {
      x: -0.1 + R() * 1.2,
      y: 0.72 + R() * 0.42,
      vx: (R() - 0.5) * 0.00035,
      vy: -(0.00008 + R() * 0.00035 + layer * 0.00012),
      life: R() * maxLife,
      maxLife,
      size: 55 + R() * 90,
      phase: R() * Math.PI * 2,
      rotPhase: R() * Math.PI * 2,
      layer,
    };
  });
}

export default function WinnerAmbienceOverlay() {
  const { width: W, height: H } = useWindowDimensions();

  const fine = useSharedValue<P[]>([]);
  const mid = useSharedValue<P[]>([]);
  const glints = useSharedValue<P[]>([]);
  const fog = useSharedValue<FogBlob[]>([]);
  const clock = useSharedValue(0);

  useEffect(() => {
    fine.value = makeFine();
    mid.value = makeMid();
    glints.value = makeGlints();
    fog.value = makeFog();
  }, [W, H, fine, glints, mid, fog]);

  useFrameCallback((info) => {
    "worklet";
    const dt = info.timeSincePreviousFrame ?? 16;
    clock.value += dt;
    const t = clock.value / 1000;

    const baseWind = Math.sin(t * 0.12) * 0.0006 + Math.sin(t * 0.29 + 0.9) * 0.00024;
    const gustWind = Math.max(0, Math.sin(t * 0.09)) * 0.0006 * Math.sin(t * 0.7);

    fine.modify((arr) => {
      for (const p of arr) {
        p.life += 1;
        const wind = (baseWind + gustWind) * (0.4 + p.layer * 0.6);
        p.x += p.vx + wind + Math.sin(t * 0.95 + p.phase) * 0.00018;
        p.y += p.vy;
        if (p.life > p.maxLife || p.y > 1.06) {
          p.x = Math.random();
          p.y = -0.04;
          p.life = 0;
          p.maxLife = 80 + Math.random() * 320;
          p.vy = 0.0003 + Math.random() * 0.0012 + p.layer * 0.0004;
          p.vx = (Math.random() - 0.5) * 0.0009;
        }
      }
      return arr;
    });

    mid.modify((arr) => {
      for (const p of arr) {
        p.life += 1;
        const wind = (baseWind + gustWind) * (0.3 + p.layer * 0.7);
        p.x += p.vx + wind + Math.sin(t * 0.58 + p.phase) * 0.00012;
        p.y += p.vy;
        if (p.life > p.maxLife || p.y > 1.1) {
          p.x = -0.05 + Math.random() * 1.1;
          p.y = -0.12;
          p.life = 0;
          p.maxLife = 120 + Math.random() * 400;
          p.vy = 0.00025 + Math.random() * 0.0008 + p.layer * 0.00025;
          p.vx = (Math.random() - 0.5) * 0.0007;
          p.size = 2 + Math.random() * 4;
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
          p.maxLife = 140 + Math.random() * 280;
          p.vy = 0.00025 + Math.random() * 0.0009;
          p.vx = (Math.random() - 0.5) * 0.0008;
        }
      }
      return arr;
    });

    const fogT = clock.value / 1000;
    fog.modify((arr) => {
      for (const p of arr) {
        p.life += 1;
        p.x += p.vx + Math.sin(fogT * 0.22 + p.phase) * 0.00022;
        p.y += p.vy;
        if (p.life > p.maxLife || p.y < -0.22) {
          p.x = -0.1 + Math.random() * 1.2;
          p.y = 0.88 + Math.random() * 0.25;
          p.life = 0;
          p.maxLife = 280 + Math.random() * 480;
          p.vy = -(0.00008 + Math.random() * 0.00035 + p.layer * 0.00012);
          p.vx = (Math.random() - 0.5) * 0.00035;
          p.size = 55 + Math.random() * 90;
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

    // radiant top glow — golden
    const gp = 0.5 + 0.2 * Math.sin(t * 0.68);
    paint.setColor(Skia.Color(`rgba(255,240,180,${(gp * 0.32).toFixed(3)})`));
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, W * 0.44, false));
    canvas.drawCircle(W * 0.5, H * 0.02, W * 0.54, paint);

    paint.setColor(Skia.Color(`rgba(255,220,100,${(gp * 0.20).toFixed(3)})`));
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, W * 0.20, false));
    canvas.drawCircle(W * 0.5, 0, W * 0.24, paint);

    // --- Concert bottom fog ---
    const fogBase = 0.45 + 0.15 * Math.sin(t * 0.28);

    // Ambient source glow at very bottom
    paint.setColor(Skia.Color(`rgba(255,185,60,${(fogBase * 0.90).toFixed(3)})`));
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, H * 0.12, false));
    canvas.drawOval(Skia.XYWHRect(-W * 0.15, H * 0.80, W * 1.3, H * 0.30), paint);

    paint.setColor(Skia.Color(`rgba(255,215,90,${(fogBase * 0.65).toFixed(3)})`));
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, H * 0.07, false));
    canvas.drawOval(Skia.XYWHRect(W * 0.05, H * 0.86, W * 0.9, H * 0.20), paint);

    // Rising fog blobs that swirl
    for (const p of fog.value) {
      const prog = p.life / p.maxLife;
      const fadeIn = Math.min(prog * 3.5, 1);
      const fadeOut = Math.min((1 - prog) * 2.5, 1);
      const baseAlpha = fogBase * (0.55 + 0.45 * p.layer) * fadeIn * fadeOut;
      if (baseAlpha < 0.02) continue;

      const cx = (p.x + Math.sin(t * 0.25 + p.phase) * 0.06) * W;
      const cy = p.y * H;
      const angle = Math.sin(t * 0.18 + p.rotPhase) * 25;
      const sX = p.size * (1.7 + 0.5 * Math.sin(t * 0.13 + p.phase));
      const sY = p.size * (0.45 + 0.1 * Math.sin(t * 0.22 + p.rotPhase));

      // Outer soft haze
      paint.setColor(Skia.Color(`rgba(255,190,65,${baseAlpha.toFixed(3)})`));
      paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, p.size * 0.30, false));
      canvas.save();
      canvas.rotate(angle, cx, cy);
      canvas.drawOval(Skia.XYWHRect(cx - sX, cy - sY, sX * 2, sY * 2), paint);
      canvas.restore();

      // Inner brighter core
      paint.setColor(Skia.Color(`rgba(255,230,120,${(baseAlpha * 0.55).toFixed(3)})`));
      paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, p.size * 0.16, false));
      canvas.save();
      canvas.rotate(-angle * 0.5, cx, cy);
      canvas.drawOval(Skia.XYWHRect(cx - sX * 0.6, cy - sY * 0.7, sX * 1.2, sY * 1.4), paint);
      canvas.restore();
    }

    // mid golden motes
    for (const p of mid.value) {
      const prog = p.life / p.maxLife;
      const alpha = Math.sin(prog * Math.PI) * (0.60 + 0.40 * Math.abs(Math.sin(t * 1.9 + p.phase)));
      if (alpha < 0.03) continue;
      const c = C_MID[p.colorIdx % C_MID.length]!;
      paint.setColor(Skia.Color(`rgba(${c[0]},${c[1]},${c[2]},${(alpha * 0.72).toFixed(3)})`));
      paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, p.size * 2.4, false));
      canvas.drawCircle(p.x * W, p.y * H, p.size, paint);
      paint.setColor(Skia.Color(`rgba(${c[0]},${c[1]},${c[2]},${alpha.toFixed(3)})`));
      paint.setMaskFilter(null);
      canvas.drawCircle(p.x * W, p.y * H, p.size * 0.40, paint);
    }

    // fine stardust
    for (const p of fine.value) {
      const prog = p.life / p.maxLife;
      const twinkle = 0.55 + 0.45 * Math.abs(Math.sin(t * 2.7 + p.phase));
      const alpha = Math.sin(prog * Math.PI) * twinkle;
      if (alpha < 0.06) continue;
      const c = C_FINE[p.colorIdx % C_FINE.length]!;
      paint.setColor(Skia.Color(`rgba(${c[0]},${c[1]},${c[2]},${(alpha * 0.42).toFixed(3)})`));
      paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, p.size * 3.6, false));
      canvas.drawCircle(p.x * W, p.y * H, p.size, paint);
      paint.setColor(Skia.Color(`rgba(${c[0]},${c[1]},${c[2]},${alpha.toFixed(3)})`));
      paint.setMaskFilter(null);
      canvas.drawCircle(p.x * W, p.y * H, p.size * 0.46, paint);
    }

    // glint cross-stars
    for (const p of glints.value) {
      const prog = p.life / p.maxLife;
      const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(t * 4.0 + p.phase));
      const alpha = Math.sin(prog * Math.PI) * twinkle;
      if (alpha < 0.07) continue;
      const c = C_GLINT[p.colorIdx % C_GLINT.length]!;
      const cx = p.x * W;
      const cy = p.y * H;
      const L = p.size;
      const th = Math.max(1.2, p.size / 7);

      paint.setColor(Skia.Color(`rgba(${c[0]},${c[1]},${c[2]},${(alpha * 0.48).toFixed(3)})`));
      paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, p.size * 0.95, false));
      canvas.drawCircle(cx, cy, p.size * 0.72, paint);

      paint.setColor(Skia.Color(`rgba(${c[0]},${c[1]},${c[2]},${alpha.toFixed(3)})`));
      paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, th, false));
      canvas.drawOval(Skia.XYWHRect(cx - L, cy - th, L * 2, th * 2), paint);
      canvas.drawOval(Skia.XYWHRect(cx - th, cy - L, th * 2, L * 2), paint);
      if (p.arms >= 3) {
        const d = L * 0.55;
        canvas.drawOval(Skia.XYWHRect(cx - d, cy - th * 0.7, d * 2, th * 1.4), paint);
        canvas.drawOval(Skia.XYWHRect(cx - th * 0.7, cy - d, th * 1.4, d * 2), paint);
      }
      paint.setColor(Skia.Color(`rgba(255,255,255,${alpha.toFixed(3)})`));
      paint.setMaskFilter(null);
      canvas.drawCircle(cx, cy, p.size * 0.24, paint);
    }

    // wind sheen
    const wc = (t * 0.14) % 1.0;
    if (wc < 0.24) {
      const sa = Math.sin((wc / 0.24) * Math.PI) * 0.09;
      if (sa > 0.008) {
        paint.setColor(Skia.Color(`rgba(255,248,200,${sa.toFixed(3)})`));
        paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, W * 0.15, false));
        const sx = (wc / 0.24) * W * 1.35 - W * 0.18;
        canvas.drawOval(Skia.XYWHRect(sx - W * 0.15, 0, W * 0.28, H), paint);
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
