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

  const centerBounceX = useRef(new Animated.Value(0)).current;
  const centerBounceY = useRef(new Animated.Value(0)).current;
  const centerScale = useRef(new Animated.Value(1)).current;
  const centerRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spring = { tension: 140, friction: 11, useNativeDriver: true };
    const d = (ms: number) => Animated.delay(ms);

    const to = (x: number, y: number) =>
      Animated.parallel([
        Animated.spring(centerBounceX, { ...spring, toValue: x }),
        Animated.spring(centerBounceY, { ...spring, toValue: y }),
      ]);

    const scale = (s: number) =>
      Animated.spring(centerScale, { ...spring, toValue: s });

    const tilt = (deg: number) =>
      Animated.spring(centerRotate, { ...spring, toValue: deg });

    const centerAttention = Animated.loop(
      Animated.sequence([
        Animated.sequence([to(0, -22), to(0, 0)]),
        d(600),
        Animated.parallel([scale(1.07), to(0, -8)]),
        Animated.parallel([scale(1), to(0, 0)]),
        d(500),
        Animated.sequence([to(-16, -20), to(0, 0)]),
        d(800),
        Animated.sequence([tilt(-4), tilt(4), tilt(0)]),
        d(400),
        Animated.sequence([to(16, -20), to(0, 0)]),
        d(700),
        Animated.sequence([scale(0.96), scale(1.05), scale(1)]),
        d(500),
        Animated.sequence([to(0, -16), to(0, 0), to(0, -16), to(0, 0)]),
        d(1200),
      ]),
    );
    centerAttention.start();
    return () => centerAttention.stop();
  }, [centerBounceX, centerBounceY, centerScale, centerRotate]);

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
                  { translateX: centerBounceX },
                  { translateY: centerBounceY },
                  { scale: centerScale },
                  {
                    rotate: centerRotate.interpolate({
                      inputRange: [-4, 0, 4],
                      outputRange: ["-4deg", "0deg", "4deg"],
                    }),
                  },
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

          <View
            style={[
              styles.thumb,
              styles.thumbGlow,
              {
                left: thumbPos.x - thumbSize / 2,
                top: thumbPos.y - thumbSize / 2,
                width: thumbSize,
                height: thumbSize,
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
          </View>
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
