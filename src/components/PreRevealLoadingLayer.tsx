// src/components/PreRevealLoadingLayer.tsx
// Full-screen splash + bottom strip loader matching CurtainOverlay (welcome) style,
// with the same “we’re not really loading” copy as the previous PreReveal flow.

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import AppImage from "./AppImage";
import CustomText from "./common/CustomText";
import { prefetchExpoImageUri } from "../utils/prefetchExpoImage";
import AudioManager from "../utils/audioManager";

/** Most phones / tablets: standard composition */
const PRE_REVEAL_BG_DEFAULT =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/1610859b-0622-44bb-b82d-e022668a6c08-IMG_4089.webp";
/** Taller / large format (e.g. 1320×2868 class) */
const PRE_REVEAL_BG_TALL =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/d54269d6-7963-4249-a9e0-56d64daa6ec6-IMG_4090.webp";
/** Tablet (width >= 768) */
const PRE_REVEAL_BG_TABLET =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/6fb679b7-e1c8-482e-a1d0-3a3624b430e0-tabletLoadingReveal.webp";

/** Same texture strip as CurtainOverlay welcomeInitial loader */
const WELCOME_LOADER_FILL_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/b6612c06-2e0e-45ee-8557-483d229c70a7-loader.webp";

const LOADER_SEGMENT_WIDTH = 88;
const LOADER_PATTERN_COUNT = 14;
/** Minimum time on this screen before navigating to Reveal (ms). */
export const PRE_REVEAL_MIN_MS = 2500;

function usePreRevealBackgroundUri(): string {
  const { width, height } = useWindowDimensions();
  const w = Math.min(width, height);
  const h = Math.max(width, height);
  const isPortrait = height >= width;
  if (width >= 768 && width > height) {
    return PRE_REVEAL_BG_TABLET;
  }
  if (isPortrait && h / Math.max(1, w) >= 2) {
    return PRE_REVEAL_BG_TALL;
  }
  return PRE_REVEAL_BG_DEFAULT;
}

type Props = {
  onDone: () => void;
};

export default function PreRevealLoadingLayer({ onDone }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: windowW, height: windowH } = useWindowDimensions();
  const bgUri = usePreRevealBackgroundUri();
  const safeW = windowW > 0 ? windowW : 360;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const progress = useRef(new Animated.Value(0)).current;
  const rootOpacity = useRef(new Animated.Value(0)).current;
  const bgScale = useRef(new Animated.Value(1.1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(34)).current;
  const contentScale = useRef(new Animated.Value(0.94)).current;
  const suspensePulse = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const scanShift = useRef(new Animated.Value(-safeW)).current;
  const loaderPatternShift = useRef(new Animated.Value(0)).current;
  const [bgReady, setBgReady] = useState(false);

  const loaderBarMaxWidth = Math.max(0, safeW - 64);
  const loaderFillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, loaderBarMaxWidth],
  });

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await Promise.all([
          prefetchExpoImageUri(bgUri),
          prefetchExpoImageUri(WELCOME_LOADER_FILL_URI),
        ]);
      } catch {
        // still show; images may load inline
      }
      if (active) setBgReady(true);
    })();
    return () => {
      active = false;
    };
  }, [bgUri]);

  const finish = useCallback(() => {
    Animated.sequence([
      Animated.timing(flashOpacity, {
        toValue: 0.85,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rootOpacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bgScale, {
          toValue: 1.04,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) onDoneRef.current();
    });
  }, [bgScale, flashOpacity, rootOpacity]);

  useEffect(() => {
    if (!bgReady) return;
    // Suspense background loop starts as soon as the screen is ready
    void AudioManager.playPreRevealBg();
    void AudioManager.playHeroPickerEnd();

    let cancelled = false;
    rootOpacity.setValue(0);
    bgScale.setValue(1.1);
    contentOpacity.setValue(0);
    contentTranslateY.setValue(34);
    contentScale.setValue(0.94);
    flashOpacity.setValue(0);
    scanShift.setValue(-safeW);

    Animated.parallel([
      Animated.timing(rootOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(bgScale, {
        toValue: 1,
        duration: PRE_REVEAL_MIN_MS + 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(contentTranslateY, {
        toValue: 0,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.spring(contentScale, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 340,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scanShift, {
        toValue: safeW,
        duration: PRE_REVEAL_MIN_MS - 250,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progress, {
      toValue: 1,
      duration: PRE_REVEAL_MIN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished || cancelled) return;
      finish();
    });

    return () => {
      cancelled = true;
    };
  }, [
    bgReady,
    bgScale,
    contentOpacity,
    contentScale,
    contentTranslateY,
    finish,
    flashOpacity,
    progress,
    rootOpacity,
    safeW,
    scanShift,
  ]);

  useEffect(() => {
    if (!bgReady) return;
    const loop = Animated.loop(
      Animated.timing(loaderPatternShift, {
        toValue: -LOADER_SEGMENT_WIDTH,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => {
      loop.stop();
      loaderPatternShift.setValue(0);
    };
  }, [bgReady, loaderPatternShift]);

  useEffect(() => {
    if (!bgReady) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(suspensePulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(suspensePulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
      suspensePulse.setValue(0);
    };
  }, [bgReady, suspensePulse]);

  if (!bgReady) {
    return <View style={[styles.root, { backgroundColor: "#000" }]} />;
  }

  return (
    <Animated.View
      style={[styles.root, { opacity: rootOpacity }]}
      pointerEvents="auto"
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { transform: [{ scale: bgScale }] },
        ]}
      >
        <Image
          source={bgUri}
          contentFit="cover"
          style={StyleSheet.absoluteFillObject}
          cachePolicy="memory-disk"
          transition={200}
          priority="high"
        />
      </Animated.View>
      <View style={styles.vignette} pointerEvents="none" />
      <Animated.View
        style={[
          styles.scanBeam,
          {
            height: Math.max(640, windowH),
            transform: [{ translateX: scanShift }, { rotate: "16deg" }],
          },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.bottomBlock,
          {
            paddingBottom: Math.max(insets.bottom, 20) + 8,
            paddingTop: 12,
            paddingHorizontal: 24,
            opacity: contentOpacity,
            transform: [
              { translateY: contentTranslateY },
              { scale: contentScale },
            ],
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.textBlock}>
          <CustomText
            variant="h5-headline"
            className="text-center"
            textColor="#fff8ec"
            shadow
          >
            {t("pre_reveal_loading")}
          </CustomText>
          <CustomText
            variant="p-small"
            className="mt-2 px-1 text-center"
            textColor="rgba(255,247,236,0.92)"
          >
            {t("pre_reveal_suspense")}
          </CustomText>
          <CustomText
            variant="p-small"
            className="mt-1 px-1 text-center"
            textColor="rgba(255,247,236,0.88)"
          >
            {t("pre_reveal_dont_you")}
          </CustomText>
        </View>
        <Animated.View
          style={{
            transform: [
              {
                scale: suspensePulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.025],
                }),
              },
            ],
          }}
        >
          <View style={styles.loaderShell}>
            <View style={styles.loaderTrack}>
              <View style={styles.loaderTrackSecond}>
                <Animated.View
                  style={[
                    styles.loaderFillClip,
                    { width: loaderFillWidth },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.loaderPatternRow,
                      { transform: [{ translateX: loaderPatternShift }] },
                    ]}
                  >
                    {Array.from({ length: LOADER_PATTERN_COUNT }).map(
                      (_, idx) => (
                        <AppImage
                          key={`pr-loader-${idx}`}
                          source={{ uri: WELCOME_LOADER_FILL_URI }}
                          contentFit="cover"
                          style={styles.loaderPatternSegment}
                        />
                      )
                    )}
                  </Animated.View>
                </Animated.View>
              </View>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
      <Animated.View
        style={[styles.flash, { opacity: flashOpacity }]}
        pointerEvents="none"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  scanBeam: {
    position: "absolute",
    top: -80,
    left: -90,
    width: 90,
    backgroundColor: "rgba(255,246,210,0.18)",
    borderRadius: 999,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff4cf",
  },
  bottomBlock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  textBlock: {
    marginBottom: 16,
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  loaderShell: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 520,
  },
  loaderTrack: {
    width: "100%",
    height: 36,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: "#532135",
    backgroundColor: "#532135",
    overflow: "hidden",
  },
  loaderTrackSecond: {
    width: "100%",
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#ffd029",
  },
  loaderFillClip: {
    height: "100%",
    overflow: "hidden",
    borderRadius: 8,
  },
  loaderPatternRow: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    flexDirection: "row",
    alignItems: "stretch",
  },
  loaderPatternSegment: {
    width: LOADER_SEGMENT_WIDTH,
    height: "100%",
  },
});
