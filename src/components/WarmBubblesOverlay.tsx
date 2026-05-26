import React, { memo, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";

export type WarmBubblesVariant =
  | "normal"
  | "intense"
  | "urgent"
  /** Results discussion finale: denser, larger, faster than `urgent`. */
  | "resultsUrgent";

/** WelcomeScreen palette + extra bright red / orange / yellow / light creams */
const NORMAL_BUBBLES = [
  { left: "4%", size: 18, dur: 6200, delay: 0, opacity: 0.22, color: "#ef4444" },
  { left: "14%", size: 34, dur: 9600, delay: 1600, opacity: 0.12, color: "#f97316" },
  { left: "26%", size: 12, dur: 5000, delay: 900, opacity: 0.28, color: "#fbbf24" },
  { left: "38%", size: 26, dur: 8000, delay: 3400, opacity: 0.15, color: "#ef4444" },
  { left: "52%", size: 42, dur: 11500, delay: 4600, opacity: 0.09, color: "#f97316" },
  { left: "63%", size: 16, dur: 5600, delay: 300, opacity: 0.26, color: "#fde047" },
  { left: "74%", size: 28, dur: 8800, delay: 2400, opacity: 0.16, color: "#fca5a5" },
  { left: "84%", size: 22, dur: 7200, delay: 5400, opacity: 0.19, color: "#fbbf24" },
  { left: "91%", size: 10, dur: 4200, delay: 1100, opacity: 0.32, color: "#fff7ed" },
  { left: "7%", size: 46, dur: 13500, delay: 6800, opacity: 0.07, color: "#dc2626" },
  { left: "44%", size: 8, dur: 3400, delay: 2900, opacity: 0.38, color: "#fde68a" },
  { left: "55%", size: 20, dur: 6600, delay: 800, opacity: 0.21, color: "#f97316" },
  { left: "22%", size: 6, dur: 3000, delay: 4200, opacity: 0.36, color: "#fca5a5" },
  { left: "69%", size: 38, dur: 10500, delay: 7200, opacity: 0.09, color: "#fdba74" },
  { left: "40%", size: 14, dur: 5900, delay: 1700, opacity: 0.23, color: "#fbbf24" },
  { left: "80%", size: 8, dur: 3200, delay: 3800, opacity: 0.34, color: "#fff7ed" },
  { left: "2%", size: 24, dur: 7100, delay: 500, opacity: 0.2, color: "#dc2626" },
  { left: "11%", size: 16, dur: 5400, delay: 2100, opacity: 0.24, color: "#b91c1c" },
  { left: "19%", size: 22, dur: 8800, delay: 900, opacity: 0.18, color: "#f87171" },
  { left: "31%", size: 14, dur: 6100, delay: 1200, opacity: 0.26, color: "#fecaca" },
  { left: "48%", size: 30, dur: 10200, delay: 4000, opacity: 0.11, color: "#ea580c" },
  { left: "59%", size: 20, dur: 6700, delay: 600, opacity: 0.19, color: "#fb923c" },
  { left: "71%", size: 11, dur: 4800, delay: 3300, opacity: 0.3, color: "#ffedd5" },
  { left: "78%", size: 26, dur: 9100, delay: 1800, opacity: 0.14, color: "#facc15" },
  { left: "88%", size: 19, dur: 7500, delay: 2500, opacity: 0.17, color: "#fef08a" },
  { left: "95%", size: 15, dur: 6400, delay: 400, opacity: 0.21, color: "#fffbeb" },
  { left: "6%", size: 12, dur: 5200, delay: 4500, opacity: 0.28, color: "#fed7aa" },
  { left: "33%", size: 36, dur: 11000, delay: 5500, opacity: 0.1, color: "#fdba74" },
  { left: "66%", size: 17, dur: 6900, delay: 2800, opacity: 0.23, color: "#fde047" },
  { left: "17%", size: 32, dur: 8900, delay: 3100, opacity: 0.13, color: "#fef9c3" },
  { left: "96%", size: 28, dur: 7800, delay: 6200, opacity: 0.12, color: "#ea580c" },
] as const;

/** Heavier: many bubbles, larger max size, shorter durations (faster rise) */
const INTENSE_BUBBLES = [
  { left: "0%", size: 56, dur: 2800, delay: 0, opacity: 0.18, color: "#ef4444" },
  { left: "4%", size: 22, dur: 3200, delay: 120, opacity: 0.32, color: "#dc2626" },
  { left: "8%", size: 72, dur: 3600, delay: 400, opacity: 0.12, color: "#b91c1c" },
  { left: "12%", size: 16, dur: 2600, delay: 80, opacity: 0.38, color: "#f87171" },
  { left: "16%", size: 48, dur: 3000, delay: 600, opacity: 0.16, color: "#fecaca" },
  { left: "20%", size: 28, dur: 3400, delay: 220, opacity: 0.26, color: "#ea580c" },
  { left: "24%", size: 64, dur: 3800, delay: 900, opacity: 0.11, color: "#f97316" },
  { left: "28%", size: 14, dur: 2400, delay: 40, opacity: 0.4, color: "#fb923c" },
  { left: "32%", size: 38, dur: 3100, delay: 500, opacity: 0.22, color: "#fdba74" },
  { left: "36%", size: 78, dur: 4000, delay: 200, opacity: 0.09, color: "#ffedd5" },
  { left: "40%", size: 20, dur: 2900, delay: 340, opacity: 0.3, color: "#fed7aa" },
  { left: "44%", size: 52, dur: 3500, delay: 700, opacity: 0.14, color: "#fbbf24" },
  { left: "48%", size: 11, dur: 2200, delay: 0, opacity: 0.42, color: "#facc15" },
  { left: "52%", size: 44, dur: 3300, delay: 450, opacity: 0.19, color: "#fde047" },
  { left: "56%", size: 68, dur: 3700, delay: 1000, opacity: 0.1, color: "#fef08a" },
  { left: "60%", size: 18, dur: 2700, delay: 180, opacity: 0.35, color: "#fef9c3" },
  { left: "64%", size: 34, dur: 3000, delay: 620, opacity: 0.24, color: "#fffbeb" },
  { left: "68%", size: 58, dur: 3600, delay: 300, opacity: 0.13, color: "#fff7ed" },
  { left: "72%", size: 26, dur: 3100, delay: 520, opacity: 0.27, color: "#fca5a5" },
  { left: "76%", size: 82, dur: 4200, delay: 150, opacity: 0.08, color: "#ef4444" },
  { left: "80%", size: 15, dur: 2500, delay: 260, opacity: 0.39, color: "#f97316" },
  { left: "84%", size: 46, dur: 3400, delay: 840, opacity: 0.17, color: "#fde68a" },
  { left: "88%", size: 30, dur: 2800, delay: 110, opacity: 0.29, color: "#ea580c" },
  { left: "92%", size: 62, dur: 3900, delay: 550, opacity: 0.11, color: "#fbbf24" },
  { left: "96%", size: 19, dur: 2700, delay: 380, opacity: 0.33, color: "#fecaca" },
  { left: "1%", size: 36, dur: 3200, delay: 1500, opacity: 0.2, color: "#dc2626" },
  { left: "5%", size: 10, dur: 2100, delay: 2000, opacity: 0.45, color: "#fef08a" },
  { left: "9%", size: 54, dur: 3500, delay: 1200, opacity: 0.15, color: "#fb923c" },
  { left: "15%", size: 24, dur: 3000, delay: 1800, opacity: 0.25, color: "#facc15" },
  { left: "23%", size: 70, dur: 4100, delay: 400, opacity: 0.1, color: "#fed7aa" },
  { left: "29%", size: 17, dur: 2600, delay: 700, opacity: 0.36, color: "#b91c1c" },
  { left: "35%", size: 41, dur: 3300, delay: 950, opacity: 0.21, color: "#f87171" },
  { left: "43%", size: 13, dur: 2300, delay: 1600, opacity: 0.4, color: "#fde047" },
  { left: "51%", size: 59, dur: 3800, delay: 200, opacity: 0.12, color: "#fff7ed" },
  { left: "57%", size: 25, dur: 2900, delay: 1300, opacity: 0.28, color: "#ea580c" },
  { left: "61%", size: 76, dur: 4300, delay: 750, opacity: 0.09, color: "#fef9c3" },
  { left: "67%", size: 21, dur: 2700, delay: 900, opacity: 0.31, color: "#ffedd5" },
  { left: "73%", size: 49, dur: 3400, delay: 1700, opacity: 0.18, color: "#f97316" },
  { left: "79%", size: 31, dur: 3000, delay: 240, opacity: 0.26, color: "#fbbf24" },
  { left: "85%", size: 55, dur: 3600, delay: 1100, opacity: 0.14, color: "#fecaca" },
  { left: "91%", size: 8, dur: 2000, delay: 1900, opacity: 0.44, color: "#fffbeb" },
  { left: "3%", size: 40, dur: 3200, delay: 2200, opacity: 0.23, color: "#fb923c" },
  { left: "47%", size: 66, dur: 4000, delay: 1300, opacity: 0.1, color: "#dc2626" },
  { left: "93%", size: 23, dur: 2800, delay: 600, opacity: 0.3, color: "#fdba74" },
  { left: "98%", size: 50, dur: 3500, delay: 1400, opacity: 0.16, color: "#facc15" },
  { left: "14%", size: 60, dur: 3700, delay: 2100, opacity: 0.11, color: "#fef08a" },
  { left: "38%", size: 12, dur: 2200, delay: 2800, opacity: 0.41, color: "#fed7aa" },
  { left: "54%", size: 74, dur: 4100, delay: 500, opacity: 0.08, color: "#b91c1c" },
  { left: "70%", size: 9, dur: 2100, delay: 3200, opacity: 0.43, color: "#fde68a" },
] as const;

/** Extra layer on top of intense — last-minute “urgency” density */
const URGENCY_EXTRA_BUBBLES = [
  { left: "2%", size: 62, dur: 2400, delay: 0, opacity: 0.14, color: "#ef4444" },
  { left: "6%", size: 14, dur: 1900, delay: 100, opacity: 0.4, color: "#dc2626" },
  { left: "10%", size: 48, dur: 2600, delay: 350, opacity: 0.18, color: "#f97316" },
  { left: "18%", size: 22, dur: 2100, delay: 200, opacity: 0.32, color: "#fb923c" },
  { left: "26%", size: 70, dur: 3000, delay: 80, opacity: 0.1, color: "#fde047" },
  { left: "34%", size: 11, dur: 1800, delay: 450, opacity: 0.44, color: "#facc15" },
  { left: "42%", size: 55, dur: 2700, delay: 150, opacity: 0.16, color: "#fca5a5" },
  { left: "50%", size: 27, dur: 2200, delay: 600, opacity: 0.28, color: "#ea580c" },
  { left: "58%", size: 66, dur: 2900, delay: 40, opacity: 0.12, color: "#fdba74" },
  { left: "66%", size: 16, dur: 2000, delay: 700, opacity: 0.38, color: "#fecaca" },
  { left: "74%", size: 44, dur: 2500, delay: 300, opacity: 0.2, color: "#fbbf24" },
  { left: "82%", size: 74, dur: 3200, delay: 120, opacity: 0.09, color: "#fff7ed" },
  { left: "90%", size: 19, dur: 2300, delay: 500, opacity: 0.34, color: "#fed7aa" },
  { left: "97%", size: 33, dur: 2600, delay: 900, opacity: 0.22, color: "#ef4444" },
  { left: "13%", size: 8, dur: 1700, delay: 1100, opacity: 0.46, color: "#fde68a" },
  { left: "37%", size: 58, dur: 2800, delay: 800, opacity: 0.13, color: "#fb923c" },
  { left: "61%", size: 21, dur: 2100, delay: 400, opacity: 0.3, color: "#ffedd5" },
  { left: "77%", size: 51, dur: 2700, delay: 650, opacity: 0.15, color: "#f87171" },
  { left: "93%", size: 13, dur: 1900, delay: 1400, opacity: 0.41, color: "#fef08a" },
  { left: "4%", size: 39, dur: 2500, delay: 550, opacity: 0.24, color: "#b91c1c" },
  { left: "46%", size: 17, dur: 2000, delay: 950, opacity: 0.36, color: "#f97316" },
  { left: "88%", size: 63, dur: 3100, delay: 250, opacity: 0.11, color: "#fde047" },
] as const;

/** Extra burst for ResultsScreen last ~20s (discussion countdown): bigger, quicker rise. */
const RESULTS_FINALE_EXTRA_BUBBLES = [
  { left: "1%", size: 92, dur: 1400, delay: 0, opacity: 0.2, color: "#ef4444" },
  { left: "9%", size: 24, dur: 1250, delay: 80, opacity: 0.38, color: "#dc2626" },
  { left: "18%", size: 78, dur: 1550, delay: 200, opacity: 0.16, color: "#f97316" },
  { left: "28%", size: 34, dur: 1300, delay: 320, opacity: 0.28, color: "#fb923c" },
  { left: "38%", size: 105, dur: 1750, delay: 40, opacity: 0.12, color: "#fde047" },
  { left: "48%", size: 18, dur: 1150, delay: 500, opacity: 0.42, color: "#facc15" },
  { left: "58%", size: 68, dur: 1600, delay: 150, opacity: 0.19, color: "#fca5a5" },
  { left: "68%", size: 42, dur: 1350, delay: 420, opacity: 0.26, color: "#ea580c" },
  { left: "78%", size: 88, dur: 1700, delay: 90, opacity: 0.14, color: "#fdba74" },
  { left: "88%", size: 28, dur: 1280, delay: 280, opacity: 0.32, color: "#fecaca" },
  { left: "96%", size: 72, dur: 1650, delay: 600, opacity: 0.17, color: "#fbbf24" },
  { left: "5%", size: 15, dur: 1100, delay: 700, opacity: 0.44, color: "#fff7ed" },
  { left: "22%", size: 56, dur: 1450, delay: 900, opacity: 0.22, color: "#fed7aa" },
  { left: "44%", size: 98, dur: 1800, delay: 350, opacity: 0.11, color: "#b91c1c" },
  { left: "65%", size: 20, dur: 1200, delay: 550, opacity: 0.4, color: "#fde68a" },
  { left: "82%", size: 62, dur: 1500, delay: 750, opacity: 0.2, color: "#fb923c" },
  { left: "14%", size: 48, dur: 1380, delay: 200, opacity: 0.24, color: "#fef08a" },
  { left: "52%", size: 36, dur: 1320, delay: 480, opacity: 0.27, color: "#f87171" },
] as const;

type BubbleDef = {
  left: string;
  size: number;
  dur: number;
  delay: number;
  opacity: number;
  color: string;
};

const INTENSE_BUBBLE_LIMIT = 20;
const URGENT_EXTRA_LIMIT = 10;
const RESULTS_EXTRA_LIMIT = 8;

const LIGHT_INTENSE_BUBBLES = INTENSE_BUBBLES.slice(0, INTENSE_BUBBLE_LIMIT);
const LIGHT_URGENCY_EXTRA_BUBBLES = URGENCY_EXTRA_BUBBLES.slice(
  0,
  URGENT_EXTRA_LIMIT,
);
const LIGHT_RESULTS_FINALE_EXTRA_BUBBLES = RESULTS_FINALE_EXTRA_BUBBLES.slice(
  0,
  RESULTS_EXTRA_LIMIT,
);

const WarmBubbleRow = memo(function WarmBubbleRow({
  left,
  size,
  dur,
  delay,
  opacity,
  color,
}: BubbleDef) {
  const { height } = useWindowDimensions();
  const posY = useRef(new Animated.Value(0)).current;
  const alpha = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = () => {
      if (!mounted) return;
      posY.setValue(0);
      alpha.setValue(0);
      const animation = Animated.parallel([
        Animated.timing(posY, {
          toValue: -(height + size * 2),
          duration: dur,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(alpha, {
            toValue: opacity,
            duration: dur * 0.12,
            useNativeDriver: true,
          }),
          Animated.timing(alpha, {
            toValue: opacity * 0.7,
            duration: dur * 0.68,
            useNativeDriver: true,
          }),
          Animated.timing(alpha, {
            toValue: 0,
            duration: dur * 0.2,
            useNativeDriver: true,
          }),
        ]),
      ]);
      animationRef.current = animation;
      animation.start(({ finished }) => {
        animationRef.current = null;
        if (finished) run();
      });
    };
    timerRef.current = setTimeout(run, delay);
    return () => {
      mounted = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      animationRef.current?.stop();
      animationRef.current = null;
      posY.stopAnimation();
      alpha.stopAnimation();
    };
  }, [height, size, dur, delay, opacity, posY, alpha]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        bottom: -size,
        left: left as ViewStyle["left"],
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: alpha,
        transform: [{ translateY: posY }],
      }}
    />
  );
});

function bubblesForVariant(variant: WarmBubblesVariant): readonly BubbleDef[] {
  if (variant === "normal") return NORMAL_BUBBLES;
  if (variant === "intense") return LIGHT_INTENSE_BUBBLES;
  if (variant === "urgent")
    return [...LIGHT_INTENSE_BUBBLES, ...LIGHT_URGENCY_EXTRA_BUBBLES];
  return [
    ...LIGHT_INTENSE_BUBBLES,
    ...LIGHT_URGENCY_EXTRA_BUBBLES,
    ...LIGHT_RESULTS_FINALE_EXTRA_BUBBLES,
  ];
}

type Props = {
  variant?: WarmBubblesVariant;
};

export default function WarmBubblesOverlay({ variant = "normal" }: Props) {
  const bubbles = useMemo(() => bubblesForVariant(variant), [variant]);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {bubbles.map((b, i) => (
        <WarmBubbleRow key={`${variant}-${i}`} {...b} />
      ))}
    </View>
  );
}
