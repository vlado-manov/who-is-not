// src/components/CurtainOverlay.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { images } from "../../assets/images";
import { backgrounds } from "../../assets/backgrounds";
import AppImage from "./AppImage";
import CustomButton from "./common/CustomButton";
import AudioManager from "../utils/audioManager";
import { useWelcomeBackgroundVariant } from "../hooks/useWelcomeBackgroundVariant";

const { height: H, width: W } = Dimensions.get("window");

const PULSE_MIN_MS = 1000;
const PULSE_CYCLE_MS = 800;
const LOGO_FADE_OUT_MS = 800;
const OVERLAY_FADE_OUT_MS = 400;
const LOADER_SEGMENT_WIDTH = 88;
const LOADER_PATTERN_COUNT = 14;

const WELCOME_LOADER_FILL_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/b6612c06-2e0e-45ee-8557-483d229c70a7-loader.webp";

type Props = {
  onDone: () => void;
  delayMs?: number;
  durationMs?: number;
  edgeOffset?: number;
  overshootPx?: number;
  extraPulseMs?: number;
  skipLogo?: boolean;
  preloadBeforeAnimate?: () => Promise<void>;
  mode?: "classic" | "welcomeInitial";
  preloadWithProgress?: (
    onProgress: (progress: number) => void
  ) => Promise<void>;
};

export default function CurtainOverlay({
  onDone,
  delayMs = 0,
  durationMs = 2000,
  edgeOffset = 117,
  overshootPx = 120,
  extraPulseMs = 0,
  skipLogo = false,
  preloadBeforeAnimate,
  mode = "classic",
  preloadWithProgress,
}: Props) {
  const isWelcomeInitial = mode === "welcomeInitial";
  const { selectedBackgroundUri } = useWelcomeBackgroundVariant();

  const curtainTopSource =
    typeof images.curtainTop === "string"
      ? { uri: images.curtainTop }
      : images.curtainTop;
  const curtainBottomSource =
    typeof images.curtainBottom === "string"
      ? { uri: images.curtainBottom }
      : images.curtainBottom;

  const topY = useRef(new Animated.Value(0)).current;
  const bottomY = useRef(new Animated.Value(0)).current;
  const curtainBackdropOpacity = useRef(new Animated.Value(1)).current;
  const blackOverlayOpacity = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(1)).current;

  const welcomeLogoScale = useRef(new Animated.Value(1)).current;
  const welcomeLogoOpacity = useRef(new Animated.Value(1)).current;
  const welcomeProgress = useRef(new Animated.Value(0)).current;
  const welcomeLoadingOpacity = useRef(new Animated.Value(1)).current;
  const welcomeIrisScale = useRef(new Animated.Value(1)).current;
  const welcomeIrisRadius = useRef(new Animated.Value(0)).current;

  const loaderOpacity = useRef(new Animated.Value(1)).current;
  const loaderPatternShift = useRef(new Animated.Value(0)).current;

  const startButtonOpacity = useRef(new Animated.Value(0)).current;
  const startButtonTranslateY = useRef(new Animated.Value(28)).current;
  const startButtonScale = useRef(new Animated.Value(0.96)).current;

  const [canTouch, setCanTouch] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);
  const [preloadDone, setPreloadDone] = useState(!preloadBeforeAnimate);
  const [welcomeCanStart, setWelcomeCanStart] = useState(false);
  const [welcomeLoaderVisualReady, setWelcomeLoaderVisualReady] = useState(false);
  const [welcomePhase, setWelcomePhase] = useState<
    "boot" | "intro" | "loading"
  >(isWelcomeInitial ? "boot" : "loading");

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!isWelcomeInitial) {
      const curtainTopUrl =
        typeof images.curtainTop === "string"
          ? images.curtainTop
          : (images.curtainTop as { uri?: string })?.uri;
      const curtainBottomUrl =
        typeof images.curtainBottom === "string"
          ? images.curtainBottom
          : (images.curtainBottom as { uri?: string })?.uri;
      const urls = [
        images.webtzarLogo.uri,
        curtainTopUrl,
        curtainBottomUrl,
      ].filter((u): u is string => Boolean(u));
      Promise.all(urls.map((u) => ExpoImage.prefetch(u).catch(() => false)))
        .then(() => setImagesReady(true))
        .catch(() => setImagesReady(true));
      return;
    }

    let active = true;
    ExpoImage.prefetch(images.webtzarLogo.uri)
      .catch(() => false)
      .then(() => {
        if (!active) return;
        setImagesReady(true);
        setWelcomePhase("intro");
      });

    return () => {
      active = false;
    };
  }, [isWelcomeInitial]);

  useEffect(() => {
    if (!isWelcomeInitial) return;
    if (welcomePhase !== "intro") return;

    const pulseOne = () =>
      Animated.sequence([
        Animated.timing(welcomeLogoScale, {
          toValue: 1.045,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(welcomeLogoScale, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]);

    Animated.sequence([
      pulseOne(),
      pulseOne(),
      Animated.timing(welcomeLogoOpacity, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setWelcomePhase("loading");
    });
  }, [isWelcomeInitial, welcomeLogoOpacity, welcomeLogoScale, welcomePhase]);

  useEffect(() => {
    if (!isWelcomeInitial) return;

    let active = true;
    setWelcomeLoaderVisualReady(false);
    Promise.all([
      ExpoImage.prefetch(selectedBackgroundUri).catch(() => false),
      ExpoImage.prefetch(WELCOME_LOADER_FILL_URI).catch(() => false),
    ]).then(() => {
      if (!active) return;
      setWelcomeLoaderVisualReady(true);
    });

    return () => {
      active = false;
    };
  }, [isWelcomeInitial, selectedBackgroundUri]);

  useEffect(() => {
    if (!isWelcomeInitial) return;
    if (welcomePhase !== "loading") return;

    welcomeLoadingOpacity.setValue(1);
    welcomeIrisScale.setValue(1);
    welcomeIrisRadius.setValue(0);

    loaderOpacity.setValue(1);
    loaderPatternShift.setValue(0);

    startButtonOpacity.setValue(0);
    startButtonTranslateY.setValue(28);
    startButtonScale.setValue(0.96);
    setWelcomeCanStart(false);

    let active = true;

    const setProgress = (value: number) => {
      const clamped = Math.max(0, Math.min(1, value));
      Animated.timing(welcomeProgress, {
        toValue: clamped,
        duration: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    };

    const run = async () => {
      try {
        if (preloadWithProgress) {
          await preloadWithProgress((p) => {
            if (!active) return;
            setProgress(p);
          });
        } else if (preloadBeforeAnimate) {
          setProgress(0.1);
          await preloadBeforeAnimate();
          setProgress(1);
        } else {
          setProgress(1);
        }
      } catch {
        setProgress(1);
      }

      if (!active) return;
      setProgress(1);

      Animated.timing(loaderOpacity, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!active || !finished) return;
        setWelcomeCanStart(true);

        Animated.parallel([
          Animated.timing(startButtonOpacity, {
            toValue: 1,
            duration: 360,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.spring(startButtonTranslateY, {
              toValue: 0,
              speed: 12,
              bounciness: 6,
              useNativeDriver: true,
            }),
            Animated.spring(startButtonScale, {
              toValue: 1.03,
              speed: 10,
              bounciness: 7,
              useNativeDriver: true,
            }),
            Animated.spring(startButtonScale, {
              toValue: 1,
              speed: 12,
              bounciness: 5,
              useNativeDriver: true,
            }),
            Animated.spring(startButtonTranslateY, {
              toValue: -7,
              speed: 14,
              bounciness: 7,
              useNativeDriver: true,
            }),
            Animated.spring(startButtonTranslateY, {
              toValue: 0,
              speed: 14,
              bounciness: 6,
              useNativeDriver: true,
            }),
            Animated.spring(startButtonTranslateY, {
              toValue: -4,
              speed: 14,
              bounciness: 6,
              useNativeDriver: true,
            }),
            Animated.spring(startButtonTranslateY, {
              toValue: 0,
              speed: 14,
              bounciness: 5,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    };

    run();

    return () => {
      active = false;
    };
  }, [
    isWelcomeInitial,
    loaderOpacity,
    loaderPatternShift,
    preloadBeforeAnimate,
    preloadWithProgress,
    selectedBackgroundUri,
    startButtonOpacity,
    startButtonScale,
    startButtonTranslateY,
    welcomeIrisRadius,
    welcomeIrisScale,
    welcomeLoadingOpacity,
    welcomeProgress,
    welcomePhase,
  ]);

  useEffect(() => {
    if (!isWelcomeInitial) return;
    if (welcomePhase !== "loading") return;

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
  }, [isWelcomeInitial, loaderPatternShift, welcomePhase]);

  const handleWelcomeStart = () => {
    if (!welcomeCanStart) return;

    AudioManager.playBackground();

    Animated.parallel([
      Animated.timing(welcomeLoadingOpacity, {
        toValue: 0,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(welcomeIrisScale, {
        toValue: 0.08,
        duration: 620,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(welcomeIrisRadius, {
        toValue: Math.max(H, W),
        duration: 620,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) onDoneRef.current();
    });
  };

  useEffect(() => {
    if (isWelcomeInitial) return;
    if (!imagesReady || !preloadBeforeAnimate || preloadDone) return;
    preloadBeforeAnimate()
      .then(() => setPreloadDone(true))
      .catch(() => setPreloadDone(true));
  }, [imagesReady, isWelcomeInitial, preloadBeforeAnimate, preloadDone]);

  useEffect(() => {
    if (isWelcomeInitial) return;
    if (!imagesReady || !preloadDone) return;
    if (!skipLogo) {
      AudioManager.stopBackground();
      AudioManager.stopTensionLoop();
      AudioManager.stopKeyboardLoop();
    }

    const openCurtains = (fadeBlackOverlay = false) => {
      setTimeout(() => AudioManager.playCurtainSound(), 250);
      if (!skipLogo) {
        setTimeout(() => AudioManager.playBackground(), 1000);
      }
      const anims = [
        Animated.timing(topY, {
          toValue: -H / 2 - overshootPx,
          duration: durationMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bottomY, {
          toValue: H / 2 + overshootPx,
          duration: durationMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(curtainBackdropOpacity, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ];
      if (fadeBlackOverlay) {
        anims.push(
          Animated.timing(blackOverlayOpacity, {
            toValue: 0,
            duration: durationMs,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        );
      }
      Animated.parallel(anims).start(({ finished }) => {
        if (finished) onDoneRef.current();
      });
    };

    if (skipLogo) {
      logoOpacity.setValue(0);
      blackOverlayOpacity.setValue(1);
      setCanTouch(true);
      if (delayMs > 0) {
        const t = setTimeout(() => openCurtains(true), delayMs);
        return () => {
          clearTimeout(t);
        };
      }
      openCurtains(true);
      return;
    }

    const totalPulseMs = PULSE_MIN_MS + extraPulseMs;
    const pulseCycles = Math.max(3, Math.ceil(totalPulseMs / PULSE_CYCLE_MS));
    const pulseSequence = Array.from({ length: pulseCycles * 2 }, (_, i) =>
      i % 2 === 0
        ? Animated.timing(logoOpacity, {
            toValue: 0.8,
            duration: PULSE_CYCLE_MS / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        : Animated.timing(logoOpacity, {
            toValue: 1,
            duration: PULSE_CYCLE_MS / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
    );

    const timeUntilCurtainOpen =
      totalPulseMs + LOGO_FADE_OUT_MS + OVERLAY_FADE_OUT_MS + delayMs + 800;
    let bgAfterCurtainTimer: ReturnType<typeof setTimeout> | null = null;
    const soundTimer = setTimeout(() => {
      setTimeout(() => AudioManager.playCurtainSound(), 250);
      bgAfterCurtainTimer = setTimeout(() => {
        AudioManager.playBackground();
      }, 1000);
    }, timeUntilCurtainOpen);

    const touchDelay =
      delayMs + totalPulseMs + LOGO_FADE_OUT_MS + OVERLAY_FADE_OUT_MS;
    const touchTimer = setTimeout(() => setCanTouch(true), touchDelay);

    Animated.sequence([
      Animated.sequence(pulseSequence),
      Animated.timing(logoOpacity, {
        toValue: 0,
        duration: LOGO_FADE_OUT_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(blackOverlayOpacity, {
        toValue: 0,
        duration: OVERLAY_FADE_OUT_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(delayMs),
      Animated.parallel([
        Animated.timing(topY, {
          toValue: -H / 2 - overshootPx,
          duration: durationMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bottomY, {
          toValue: H / 2 + overshootPx,
          duration: durationMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(curtainBackdropOpacity, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) onDoneRef.current();
    });

    return () => {
      clearTimeout(touchTimer);
      clearTimeout(soundTimer);
      if (bgAfterCurtainTimer) {
        clearTimeout(bgAfterCurtainTimer);
      }
    };
  }, [
    blackOverlayOpacity,
    bottomY,
    curtainBackdropOpacity,
    delayMs,
    durationMs,
    extraPulseMs,
    imagesReady,
    isWelcomeInitial,
    logoOpacity,
    overshootPx,
    preloadDone,
    skipLogo,
    topY,
  ]);

  if (isWelcomeInitial) {
    if (!imagesReady || welcomePhase === "boot") {
      return (
        <View
          pointerEvents="auto"
          style={[styles.container, { backgroundColor: "#000" }]}
        />
      );
    }

    if (welcomePhase === "intro") {
      return (
        <View
          pointerEvents="auto"
          style={[styles.container, { backgroundColor: "#000" }]}
        >
          <Animated.View
            style={[
              styles.logoWrap,
              {
                opacity: welcomeLogoOpacity,
                transform: [{ scale: welcomeLogoScale }],
              },
            ]}
          >
            <Text style={styles.poweredBy}>powered by</Text>
            <AppImage
              source={images.webtzarLogo}
              contentFit="contain"
              style={styles.logoImage}
            />
          </Animated.View>
        </View>
      );
    }

    if (!welcomeLoaderVisualReady) {
      return (
        <View
          pointerEvents="auto"
          style={[styles.container, { backgroundColor: "#000" }]}
        />
      );
    }

    const loaderFillWidth = welcomeProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, W - 64],
    });

    return (
      <Animated.View
        pointerEvents="auto"
        style={[
          styles.container,
          {
            backgroundColor: "#000",
            opacity: welcomeLoadingOpacity,
            transform: [{ scale: welcomeIrisScale }],
            borderRadius: welcomeIrisRadius,
            overflow: "hidden",
          },
        ]}
      >
        <AppImage
          source={{ uri: selectedBackgroundUri }}
          contentFit="contain"
          style={StyleSheet.absoluteFillObject}
        />

        <Animated.View style={[styles.loaderShell, { opacity: loaderOpacity }]}>
          <View style={styles.loaderTrack}>
            <View style={styles.loaderTrackSecond}>
              <Animated.View
                style={[styles.loaderFillClip, { width: loaderFillWidth }]}
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
                        key={`loader-pattern-${idx}`}
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
        </Animated.View>

        {welcomeCanStart && (
          <Animated.View
            style={[
              styles.startButtonWrap,
              {
                opacity: startButtonOpacity,
                transform: [
                  { translateY: startButtonTranslateY },
                  { scale: startButtonScale },
                ],
              },
            ]}
          >
            <CustomButton
              title="Start"
              appearance="tertiary"
              backgroundImage={backgrounds.bg006}
              glow
              fullWidth
              onPress={handleWelcomeStart}
              glowColor="rgba(255,204,0,1)"
              shadowColor="#834400"
            />
          </Animated.View>
        )}
      </Animated.View>
    );
  }

  if (!imagesReady) {
    return (
      <View
        pointerEvents="auto"
        style={[styles.container, { backgroundColor: "#000" }]}
      />
    );
  }

  return (
    <View pointerEvents={canTouch ? "none" : "auto"} style={styles.container}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: curtainBackdropOpacity, backgroundColor: "#000" },
        ]}
      />

      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: "#000", opacity: blackOverlayOpacity, zIndex: 10 },
        ]}
      />
      <Animated.View
        style={[styles.logoWrap, { opacity: logoOpacity }]}
        pointerEvents="none"
      >
        <Text style={styles.poweredBy}>powered by</Text>
        <AppImage
          source={images.webtzarLogo}
          contentFit="contain"
          style={styles.logoImage}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.half,
          styles.topHalf,
          { transform: [{ translateY: topY }] },
        ]}
      >
        <AppImage
          source={curtainTopSource}
          contentFit="contain"
          style={[styles.curtainImage, { bottom: -edgeOffset }]}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.half,
          styles.bottomHalf,
          { transform: [{ translateY: bottomY }] },
        ]}
      >
        <AppImage
          source={curtainBottomSource}
          contentFit="contain"
          style={[styles.curtainImage, { top: -edgeOffset }]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: "transparent",
  },
  half: {
    position: "absolute",
    width: "100%",
    height: "50%",
    backgroundColor: "transparent",
    overflow: "visible",
  },
  topHalf: { top: 0, zIndex: 1 },
  bottomHalf: { bottom: 0, zIndex: 1 },
  curtainImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  logoWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  poweredBy: {
    fontFamily: "OpenSans-Light",
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 12,
    letterSpacing: 1,
  },
  logoImage: {
    width: Math.min(W * 0.4, 200),
    height: Math.min(W * 0.4, 200),
  },
  loaderShell: {
    position: "absolute",
    left: 48,
    right: 48,
    bottom: 80,
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
    // backgroundColor: "#ffd029",
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
  startButtonWrap: {
    position: "absolute",
    left: 32,
    right: 32,
    bottom: 80,
  },
});
