import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Canvas, Picture, Skia } from "@shopify/react-native-skia";
import {
  useSharedValue,
  useFrameCallback,
  useDerivedValue,
} from "react-native-reanimated";
import { mulberry32 } from "./revealAmbience.shared";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0,
  ];
}

const COUNT_MOTES = 14;
const COUNT_GLINTS = 5;

type Mote = {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number; phase: number;
};
type Glint = {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number; phase: number;
};

export default function CardAmbienceCanvas({ color }: { color: string }) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const rgb = useSharedValue<[number, number, number]>(hexToRgb(color));
  const motes = useSharedValue<Mote[]>([]);
  const glints = useSharedValue<Glint[]>([]);
  const clock = useSharedValue(0);

  useEffect(() => {
    rgb.value = hexToRgb(color);
  }, [color]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (size.w === 0) return;
    const seed = color.split("").reduce((a, c) => (a + c.charCodeAt(0)) | 0, 0);
    const rng = mulberry32(seed);
    const R = () => rng();

    motes.value = Array.from({ length: COUNT_MOTES }, () => {
      const maxLife = 80 + R() * 160;
      return {
        x: R(), y: R(),
        vx: (R() - 0.5) * 0.0008,
        vy: 0.0004 + R() * 0.0014,
        life: R() * maxLife, maxLife,
        size: 1.6 + R() * 3.0,
        phase: R() * Math.PI * 2,
      };
    });

    glints.value = Array.from({ length: COUNT_GLINTS }, () => {
      const maxLife = 120 + R() * 200;
      return {
        x: 0.05 + R() * 0.9, y: R(),
        vx: (R() - 0.5) * 0.0006,
        vy: 0.0003 + R() * 0.001,
        life: R() * maxLife, maxLife,
        size: 4 + R() * 9,
        phase: R() * Math.PI * 2,
      };
    });
  }, [size.w, size.h, color]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrameCallback((info) => {
    "worklet";
    const dt = info.timeSincePreviousFrame ?? 16;
    clock.value += dt;
    const t = clock.value / 1000;

    motes.modify((arr) => {
      for (const m of arr) {
        m.life += 1;
        m.x += m.vx + Math.sin(t * 0.75 + m.phase) * 0.00012;
        m.y += m.vy;
        if (m.life > m.maxLife || m.y > 1.06) {
          m.x = Math.random();
          m.y = -0.03;
          m.life = 0;
          m.maxLife = 80 + Math.random() * 160;
          m.vy = 0.0004 + Math.random() * 0.0014;
        }
      }
      return arr;
    });

    glints.modify((arr) => {
      for (const g of arr) {
        g.life += 1;
        g.x += g.vx;
        g.y += g.vy;
        if (g.life > g.maxLife || g.y > 1.08) {
          g.x = 0.05 + Math.random() * 0.9;
          g.y = -0.05;
          g.life = 0;
          g.maxLife = 120 + Math.random() * 200;
          g.vy = 0.0003 + Math.random() * 0.001;
        }
      }
      return arr;
    });
  });

  const W = size.w;
  const H = size.h;

  const picture = useDerivedValue(() => {
    "worklet";
    const t = clock.value / 1000;
    const [r0, g0, b0] = rgb.value;
    // Light pastel blend toward white
    const r1 = Math.round(r0 + (255 - r0) * 0.62);
    const g1 = Math.round(g0 + (255 - g0) * 0.62);
    const b1 = Math.round(b0 + (255 - b0) * 0.62);

    const rec = Skia.PictureRecorder();
    const canvas = rec.beginRecording(Skia.XYWHRect(0, 0, W, H));
    const paint = Skia.Paint();

    // Soft radial top glow in player color
    const gp = 0.5 + 0.18 * Math.sin(t * 0.62);
    paint.setColor(Skia.Color(`rgba(${r1},${g1},${b1},${(gp * 0.28).toFixed(3)})`));
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, W * 0.38, false));
    canvas.drawCircle(W * 0.5, H * 0.05, W * 0.42, paint);

    paint.setColor(Skia.Color(`rgba(${r1},${g1},${b1},${(gp * 0.16).toFixed(3)})`));
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, W * 0.15, false));
    canvas.drawCircle(W * 0.5, 0, W * 0.2, paint);

    // Floating motes
    for (const m of motes.value) {
      const prog = m.life / m.maxLife;
      const twinkle = 0.5 + 0.5 * Math.abs(Math.sin(t * 2.0 + m.phase));
      const alpha = Math.sin(prog * Math.PI) * twinkle * 0.65;
      if (alpha < 0.04) continue;

      paint.setColor(Skia.Color(`rgba(${r1},${g1},${b1},${(alpha * 0.55).toFixed(3)})`));
      paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, m.size * 2.1, false));
      canvas.drawCircle(m.x * W, m.y * H, m.size, paint);

      paint.setColor(Skia.Color(`rgba(${r0},${g0},${b0},${alpha.toFixed(3)})`));
      paint.setMaskFilter(null);
      canvas.drawCircle(m.x * W, m.y * H, m.size * 0.36, paint);
    }

    // Glint cross-stars
    for (const g of glints.value) {
      const prog = g.life / g.maxLife;
      const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(t * 3.4 + g.phase));
      const alpha = Math.sin(prog * Math.PI) * twinkle * 0.6;
      if (alpha < 0.06) continue;
      const cx = g.x * W;
      const cy = g.y * H;
      const L = g.size;
      const th = Math.max(1.0, g.size / 8);

      paint.setColor(Skia.Color(`rgba(${r1},${g1},${b1},${(alpha * 0.4).toFixed(3)})`));
      paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, g.size * 0.82, false));
      canvas.drawCircle(cx, cy, g.size * 0.62, paint);

      paint.setColor(Skia.Color(`rgba(${r1},${g1},${b1},${alpha.toFixed(3)})`));
      paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, th, false));
      canvas.drawOval(Skia.XYWHRect(cx - L, cy - th, L * 2, th * 2), paint);
      canvas.drawOval(Skia.XYWHRect(cx - th, cy - L, th * 2, L * 2), paint);

      paint.setColor(Skia.Color(`rgba(255,255,255,${alpha.toFixed(3)})`));
      paint.setMaskFilter(null);
      canvas.drawCircle(cx, cy, g.size * 0.2, paint);
    }

    // Wind sheen sweep
    const wc = (t * 0.09) % 1.0;
    if (wc < 0.22) {
      const sa = Math.sin((wc / 0.22) * Math.PI) * 0.055;
      if (sa > 0.007) {
        paint.setColor(Skia.Color(`rgba(${r1},${g1},${b1},${sa.toFixed(3)})`));
        paint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, W * 0.11, false));
        const sx = (wc / 0.22) * W * 1.3 - W * 0.14;
        canvas.drawOval(Skia.XYWHRect(sx - W * 0.11, 0, W * 0.2, H), paint);
      }
    }

    return rec.finishRecordingAsPicture();
  });

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) =>
        setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
      }
    >
      {size.w > 0 && (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <Picture picture={picture} />
        </Canvas>
      )}
    </View>
  );
}
