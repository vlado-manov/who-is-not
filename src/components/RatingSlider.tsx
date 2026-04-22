// src/components/RatingSlider.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  StyleSheet,
  Text,
  ImageBackground,
  LayoutChangeEvent,
  useWindowDimensions,
  Animated,
  Easing,
} from "react-native";
import AppImage from "./AppImage";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const MIN = 1;
const MAX = 10;

const BASE_URL =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery";

const THUMB_BACKGROUND =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/3db0af2c-1a13-4110-96e2-b79348d66976-border1.webp";

/** Ring frame overlay for the rail. Set to your image URL when ready. Image: square, transparent center + outside, ring/frame visible. */
const RAIL_FRAME_IMAGE: string | null = null;

const BTN_IMAGES: Record<number, { uri: string }> = {
  1: { uri: `${BASE_URL}/7d65e802-5be7-48ca-b85e-5019c980da34-btntest01.webp` },
  2: { uri: `${BASE_URL}/10817853-e3c5-46d3-aa4c-b9cfde3df758-btntest02.webp` },
  3: { uri: `${BASE_URL}/72a41c99-dd0f-4006-97f3-fd626ab75203-btntest03.webp` },
  4: { uri: `${BASE_URL}/e442e88f-769f-4590-9866-912c57eeeb83-btntest04.webp` },
  5: { uri: `${BASE_URL}/7af0211b-e8fd-4313-baeb-8379d4f179f6-btntest05.webp` },
  6: { uri: `${BASE_URL}/71903ea7-8f66-4a17-9b3c-49728f916027-btntest06.webp` },
  7: { uri: `${BASE_URL}/33c1be1e-ea32-4655-9b60-60ebf8989431-btntest07.webp` },
  8: { uri: `${BASE_URL}/337fd83b-f5ca-41d3-b84d-50296322ae70-btntest08.webp` },
  9: { uri: `${BASE_URL}/0157745f-93e8-4c1e-b54c-3c874a491654-btntest09.webp` },
  10: {
    uri: `${BASE_URL}/d0fbbd5e-e69c-4d77-a0df-2e236da08b50-btntest10.webp`,
  },
};

type RatingSliderProps = {
  value: number;
  onValueChange: (value: number) => void;
  gestureRef?: React.RefObject<unknown>;
  /** Optional: URL for rail frame image (ring with transparent center & outside) */
  railFrameImage?: string | null;
};

export default function RatingSlider({
  value,
  onValueChange,
  gestureRef,
  railFrameImage = RAIL_FRAME_IMAGE,
}: RatingSliderProps) {
  const { width, height: screenHeight } = useWindowDimensions();
  const size = Math.min(width - 24, 400, screenHeight * 0.5);
  const [layout, setLayout] = useState({ width: size, height: size });
  const thumbSize = 100;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setLayout({ width: w, height: h });
  }, []);

  // Circle path: center (cx,cy), radius r. Start at top (-90°), go clockwise.
  const pathData = useMemo(() => {
    const w = layout.width;
    const h = layout.height;
    if (w <= 0 || h <= 0) return null;

    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - thumbSize / 2 - 8;

    return { cx, cy, r };
  }, [layout.width, layout.height]);

  const pathToValue = useCallback(
    (pathT: number): number => {
      if (!pathData) return MIN;
      const raw = pathT * 10 + 1;
      return Math.round(Math.max(MIN, Math.min(MAX, raw)));
    },
    [pathData],
  );

  const valueToPathT = useCallback((v: number): number => {
    return (v - 1) * 0.1;
  }, []);

  const pathTToXY = useCallback(
    (pathT: number): { x: number; y: number } => {
      if (!pathData) return { x: 0, y: 0 };
      const { cx, cy, r } = pathData;
      const angle = -Math.PI / 2 + pathT * 2 * Math.PI;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    },
    [pathData],
  );

  const xyToPathT = useCallback(
    (px: number, py: number): number => {
      if (!pathData) return 0;
      const { cx, cy } = pathData;
      const angle = Math.atan2(py - cy, px - cx);
      let pathT = (angle + Math.PI / 2) / (2 * Math.PI);
      if (pathT < 0) pathT += 1;
      return Math.max(0, Math.min(1, pathT));
    },
    [pathData],
  );

  /** Light continuous bob on the selected thumb (outer circle) — keep as is. */
  const thumbBobY = useRef(new Animated.Value(0)).current;
  const thumbBobScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const ease = Easing.inOut(Easing.sin);
    const out = Easing.out(Easing.quad);
    const bob = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(thumbBobY, {
            toValue: -5,
            duration: 520,
            easing: ease,
            useNativeDriver: true,
          }),
          Animated.timing(thumbBobScale, {
            toValue: 1.035,
            duration: 520,
            easing: ease,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(thumbBobY, {
            toValue: 0,
            duration: 520,
            easing: ease,
            useNativeDriver: true,
          }),
          Animated.timing(thumbBobScale, {
            toValue: 1,
            duration: 520,
            easing: ease,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.parallel([
            Animated.timing(thumbBobY, {
              toValue: -3,
              duration: 140,
              easing: out,
              useNativeDriver: true,
            }),
            Animated.timing(thumbBobScale, {
              toValue: 1.022,
              duration: 140,
              easing: out,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(thumbBobY, {
              toValue: 0,
              duration: 160,
              easing: ease,
              useNativeDriver: true,
            }),
            Animated.timing(thumbBobScale, {
              toValue: 1,
              duration: 160,
              easing: ease,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.delay(160),
      ]),
      { iterations: -1 },
    );
    bob.start();
    return () => bob.stop();
  }, [thumbBobY, thumbBobScale]);

  /** Center score graphic — seamless loop: big float, soft landing, playful double-bob. */
  const centerFloatY = useRef(new Animated.Value(0)).current;
  const centerPulse = useRef(new Animated.Value(1)).current;
  const centerWobble = useRef(new Animated.Value(0)).current;
  const centerSwayX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const smooth = Easing.inOut(Easing.sin);
    const snap = Easing.out(Easing.back(1.12));

    const centerLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(centerFloatY, {
            toValue: -10,
            duration: 780,
            easing: smooth,
            useNativeDriver: true,
          }),
          Animated.timing(centerPulse, {
            toValue: 1.1,
            duration: 780,
            easing: smooth,
            useNativeDriver: true,
          }),
          Animated.timing(centerWobble, {
            toValue: 1,
            duration: 780,
            easing: smooth,
            useNativeDriver: true,
          }),
          Animated.timing(centerSwayX, {
            toValue: 4,
            duration: 780,
            easing: smooth,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(100),
        Animated.parallel([
          Animated.timing(centerFloatY, {
            toValue: 2,
            duration: 340,
            easing: snap,
            useNativeDriver: true,
          }),
          Animated.timing(centerPulse, {
            toValue: 0.96,
            duration: 340,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(centerWobble, {
            toValue: -0.9,
            duration: 340,
            easing: smooth,
            useNativeDriver: true,
          }),
          Animated.timing(centerSwayX, {
            toValue: -3,
            duration: 340,
            easing: smooth,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(centerFloatY, {
            toValue: 0,
            duration: 480,
            easing: smooth,
            useNativeDriver: true,
          }),
          Animated.timing(centerPulse, {
            toValue: 1,
            duration: 480,
            easing: smooth,
            useNativeDriver: true,
          }),
          Animated.timing(centerWobble, {
            toValue: 0,
            duration: 480,
            easing: smooth,
            useNativeDriver: true,
          }),
          Animated.timing(centerSwayX, {
            toValue: 0,
            duration: 480,
            easing: smooth,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.parallel([
            Animated.timing(centerFloatY, {
              toValue: -5,
              duration: 160,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(centerPulse, {
              toValue: 1.06,
              duration: 160,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(centerFloatY, {
              toValue: 0,
              duration: 180,
              easing: smooth,
              useNativeDriver: true,
            }),
            Animated.timing(centerPulse, {
              toValue: 1,
              duration: 180,
              easing: smooth,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(centerFloatY, {
              toValue: -3,
              duration: 130,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(centerPulse, {
              toValue: 1.035,
              duration: 130,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(centerFloatY, {
              toValue: 0,
              duration: 200,
              easing: smooth,
              useNativeDriver: true,
            }),
            Animated.timing(centerPulse, {
              toValue: 1,
              duration: 200,
              easing: smooth,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.delay(280),
      ]),
      { iterations: -1 },
    );
    centerLoop.start();
    return () => centerLoop.stop();
  }, [centerFloatY, centerPulse, centerWobble, centerSwayX]);

  const handleTouch = useCallback(
    (localX: number, localY: number) => {
      const pathT = xyToPathT(localX, localY);
      const v = pathToValue(pathT);
      onValueChange(v);
    },
    [xyToPathT, pathToValue, onValueChange],
  );

  const panGesture = useMemo(() => {
    let g = Gesture.Pan()
      .minDistance(0)
      .runOnJS(true)
      .onTouchesDown((e) => {
        const touch = e.allTouches[0];
        if (touch) handleTouch(touch.x, touch.y);
      })
      .onTouchesMove((e) => {
        const touch = e.allTouches[0];
        if (touch) handleTouch(touch.x, touch.y);
      });
    if (gestureRef) {
      g = g.withRef(gestureRef as any);
    }
    return g;
  }, [handleTouch, gestureRef]);

  const thumbPos = pathTToXY(valueToPathT(value));

  if (!pathData || pathData.r <= 0) {
    return (
      <View
        style={[styles.container, { width: size, height: size }]}
        onLayout={onLayout}
      />
    );
  }

  const { cx, cy, r } = pathData;
  const strokeW = 28;
  const centerBtnSize = Math.floor(size * 0.44);

  const circlePathD = (() => {
    const startAngle = -Math.PI / 2;
    const points: string[] = [];
    for (let i = 0; i <= 64; i++) {
      const a = startAngle + (i / 64) * 2 * Math.PI;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      points.push(`${x} ${y}`);
    }
    return `M ${points.join(" L ")} Z`;
  })();

  const labelPositions = useMemo(() => {
    return Array.from({ length: MAX - MIN + 1 }, (_, i) => {
      const v = MIN + i;
      const t = (v - 1) * 0.1;
      return { value: v, ...pathTToXY(t) };
    });
  }, [pathData]);

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      onLayout={onLayout}
    >
      <GestureDetector gesture={panGesture}>
        <View
          style={[
            styles.trackWrap,
            { width: layout.width, height: layout.height },
          ]}
          collapsable={false}
        >
          {railFrameImage && (
            <View
              style={[
                styles.railFrameOverlay,
                {
                  left: cx - (2 * r + strokeW) / 1.6,
                  top: cy - (2 * r + strokeW) / 1.8,
                  width: 2 * r + strokeW * 4,
                  height: 2 * r + strokeW * 3,
                },
              ]}
              pointerEvents="none"
            >
              <AppImage
                source={{ uri: railFrameImage }}
                style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]}
                contentFit="fill"
              />
            </View>
          )}

          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg
              width={layout.width}
              height={layout.height}
              style={StyleSheet.absoluteFill}
            >
              <Defs>
                <LinearGradient
                  id="railGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                  gradientUnits="objectBoundingBox"
                >
                  {/* <Stop offset="0%" stopColor="#ab2600" />
                  <Stop offset="0.25" stopColor="#721818" />
                  <Stop offset="0.5" stopColor="#fd3600" />
                  <Stop offset="0.75" stopColor="#a64600" />
                  <Stop offset="1" stopColor="#681700" /> */}
                  <Stop offset="0%" stopColor="#fff21b" />
                  <Stop offset="0.25" stopColor="#ffdc1b" />
                  <Stop offset="0.5" stopColor="#ffc71b" />
                  <Stop offset="0.75" stopColor="#ffdc1b" />
                  <Stop offset="1" stopColor="#fff21b" />
                </LinearGradient>
              </Defs>
              {/* Inner glow – shines toward center */}
              <Path
                d={circlePathD}
                fill="none"
                stroke="#FFD700"
                strokeWidth={strokeW + 12}
                strokeOpacity={0.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d={circlePathD}
                fill="none"
                stroke="#FFA500"
                strokeWidth={strokeW}
                strokeOpacity={0.35}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Main rail – rich gradient */}
              <Path
                d={circlePathD}
                fill="none"
                stroke="url(#railGradient)"
                strokeWidth={strokeW}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Golden border – commented out */}
              {/* <Path
                d={circlePathD}
                fill="none"
                stroke="rgba(0,0,0,0.2)"
                strokeWidth={strokeW + 4}
                strokeOpacity={0.9}
                strokeLinecap="round"
                strokeLinejoin="round"
              /> */}
            </Svg>
          </View>

          <Animated.View
            style={[
              styles.centerImageWrap,
              {
                left: cx - centerBtnSize / 2,
                top: cy - centerBtnSize / 2,
                width: centerBtnSize,
                height: centerBtnSize,
                transform: [
                  { translateX: centerSwayX },
                  { translateY: centerFloatY },
                  {
                    rotate: centerWobble.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: ["-5deg", "0deg", "5deg"],
                    }),
                  },
                  { scale: centerPulse },
                ],
              },
            ]}
            pointerEvents="none"
          >
            <AppImage
              source={BTN_IMAGES[value]}
              style={styles.centerImage}
              contentFit="contain"
            />
          </Animated.View>

          {labelPositions.map(({ value: v, x, y }) => (
            <View
              key={v}
              style={[
                styles.label,
                {
                  left: x - 18,
                  top: y - 18,
                },
              ]}
              pointerEvents="none"
            >
              <Text style={styles.labelText}>{v}</Text>
            </View>
          ))}

          <Animated.View
            style={[
              styles.thumb,
              styles.thumbGlow,
              {
                left: thumbPos.x - thumbSize / 2,
                top: thumbPos.y - thumbSize / 2,
                width: thumbSize,
                height: thumbSize,
                transform: [
                  { translateY: thumbBobY },
                  { scale: thumbBobScale },
                ],
              },
            ]}
            pointerEvents="none"
          >
            <ImageBackground
              source={{ uri: THUMB_BACKGROUND }}
              style={styles.thumbBackground}
              imageStyle={styles.thumbBackgroundImage}
              resizeMode="stretch"
            >
              <View style={styles.thumbBorder} />
              <Text style={styles.thumbText}>{value}</Text>
            </ImageBackground>
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    marginBottom: 48,
  },
  trackWrap: {
    position: "relative",
  },
  railFrameOverlay: {
    position: "absolute",
  },
  centerImageWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  centerImage: {
    width: "100%",
    height: "100%",
  },
  thumb: {
    position: "absolute",
    // borderRadius: 30,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbGlow: {
    shadowColor: "#f9e79f",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 12,
  },
  thumbBackground: {
    width: "100%",
    height: "100%",
    // borderRadius: 30,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbBackgroundImage: {
    // borderRadius: 30,
  },
  thumbBorder: {
    ...StyleSheet.absoluteFillObject,
    // borderRadius: 30,
    // borderWidth: 2,
    // borderColor: "rgba(255,255,255,0.5)",
  },
  thumbText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    paddingBottom: 6,
  },
  label: {
    position: "absolute",
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});
