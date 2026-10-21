// src/screens/Game/DeathMatch/phases/DmIntroPhase.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { backgrounds } from "../../../../../assets/backgrounds";
import AppImage from "../../../../components/AppImage";
import CustomButton from "../../../../components/common/CustomButton";
import AudioManager from "../../../../utils/audioManager";
import { DM_SUDDEN_DEATH_URI, DM_VS_URI } from "../dm.constants";

type Props = {
  /** Online the local player is on the left. */
  leftHeroImage: ImageSourcePropType | null;
  rightHeroImage: ImageSourcePropType | null;
  /** "Let's go" was pressed and the heroes have left the screen. */
  onDone: () => void;
};

/**
 * When the slam sound starts, counted from the start of the title animation
 * (zoom 800 ms + pulses 420 ms, then the impact) — the same lead as on the
 * reveal screen.
 */
const TITLE_SLAM_SOUND_MS = 1000;

function startAnim(anim: Animated.CompositeAnimation): Promise<void> {
  return new Promise((resolve) => anim.start(() => resolve()));
}

/** Sudden Death title slam, the two heroes, VS and the "Let's go" button. */
export default function DmIntroPhase({
  leftHeroImage,
  rightHeroImage,
  onDone,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth >= 768;
  const hPad =
    (isTablet ? Math.max(8, Math.floor((windowWidth - 560) / 2)) : 8) + 8;

  const titleHeight = useMemo(
    () => Math.round(windowHeight * 0.28),
    [windowHeight],
  );
  const titleTopOffset = useMemo(
    () => Math.round(windowHeight * 0.002),
    [windowHeight],
  );
  const titleRevealTargetY = useMemo(
    () => insets.top + titleTopOffset + titleHeight / 2 - windowHeight / 2,
    [insets.top, titleTopOffset, titleHeight, windowHeight],
  );

  const heroLeftX = useRef(new Animated.Value(-windowWidth)).current;
  const heroRightX = useRef(new Animated.Value(windowWidth)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const vsScale = useRef(new Animated.Value(0.3)).current;
  const vsTranslateY = useRef(new Animated.Value(-80)).current;
  const vsOpacity = useRef(new Animated.Value(0)).current;
  const letsGoOpacity = useRef(new Animated.Value(0)).current;
  const letsGoY = useRef(new Animated.Value(40)).current;

  const animTitleScale = useRef(new Animated.Value(80)).current;
  const animTitleTranslateY = useRef(new Animated.Value(0)).current;
  const animTitleRotate = useRef(new Animated.Value(0)).current;
  const animTitleShakeX = useRef(new Animated.Value(0)).current;
  const animBlurOpacity = useRef(new Animated.Value(0)).current;
  const animShockwaveScale = useRef(new Animated.Value(0.3)).current;
  const animShockwaveOpacity = useRef(new Animated.Value(0)).current;
  const animShockwaveScale2 = useRef(new Animated.Value(0.3)).current;
  const animShockwaveOpacity2 = useRef(new Animated.Value(0)).current;
  const animImpactFlash = useRef(new Animated.Value(0)).current;
  const staticTitleOpacity = useRef(new Animated.Value(0)).current;
  const [hideAnimTitle, setHideAnimTitle] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const runIntro = async () => {
      heroLeftX.setValue(-windowWidth);
      heroRightX.setValue(windowWidth);
      heroOpacity.setValue(0);
      vsScale.setValue(1);
      vsTranslateY.setValue(0);
      vsOpacity.setValue(0);
      letsGoOpacity.setValue(0);
      letsGoY.setValue(40);
      animTitleScale.setValue(80);
      animTitleTranslateY.setValue(0);
      animTitleRotate.setValue(0);
      animTitleShakeX.setValue(0);
      animBlurOpacity.setValue(0);
      animShockwaveScale.setValue(0.3);
      animShockwaveOpacity.setValue(0);
      animShockwaveScale2.setValue(0.3);
      animShockwaveOpacity2.setValue(0);
      animImpactFlash.setValue(0);
      staticTitleOpacity.setValue(0);
      setHideAnimTitle(false);

      if (cancelled) return;

      // The same slam sound as the title on the reveal screen. Like there, it
      // starts a little before the impact so the hit lands with the picture.
      timers.push(
        setTimeout(
          () => AudioManager.playRevealTitleSplash(),
          TITLE_SLAM_SOUND_MS,
        ),
      );

      await startAnim(
        Animated.parallel([
          Animated.timing(animTitleScale, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(animTitleRotate, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(animBlurOpacity, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      );

      if (cancelled) return;

      await startAnim(
        Animated.sequence([
          Animated.timing(animTitleScale, {
            toValue: 1.15,
            duration: 110,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(animTitleScale, {
            toValue: 0.93,
            duration: 110,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(animTitleScale, {
            toValue: 1.09,
            duration: 100,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(animTitleScale, {
            toValue: 1.0,
            duration: 100,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      );

      if (cancelled) return;

      animShockwaveOpacity.setValue(1);
      animShockwaveOpacity2.setValue(1);

      startAnim(
        Animated.parallel([
          Animated.spring(animTitleTranslateY, {
            toValue: titleRevealTargetY,
            speed: 18,
            bounciness: 5,
            useNativeDriver: true,
          }),
          Animated.timing(animBlurOpacity, {
            toValue: 0,
            duration: 340,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(animShockwaveScale, {
              toValue: 2.2,
              duration: 540,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(animShockwaveOpacity, {
              toValue: 0,
              duration: 540,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(animShockwaveScale2, {
              toValue: 2.6,
              duration: 620,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(animShockwaveOpacity2, {
              toValue: 0,
              duration: 620,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(animImpactFlash, {
              toValue: 1,
              duration: 80,
              useNativeDriver: true,
            }),
            Animated.timing(animImpactFlash, {
              toValue: 0,
              duration: 400,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(animTitleShakeX, {
              toValue: -20,
              duration: 70,
              useNativeDriver: true,
            }),
            Animated.timing(animTitleShakeX, {
              toValue: 18,
              duration: 70,
              useNativeDriver: true,
            }),
            Animated.timing(animTitleShakeX, {
              toValue: -13,
              duration: 65,
              useNativeDriver: true,
            }),
            Animated.timing(animTitleShakeX, {
              toValue: 9,
              duration: 60,
              useNativeDriver: true,
            }),
            Animated.timing(animTitleShakeX, {
              toValue: 0,
              duration: 55,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ).then(() => {
        if (!cancelled) {
          staticTitleOpacity.setValue(1);
          setHideAnimTitle(true);
        }
      });

      if (cancelled) return;

      await new Promise<void>((res) => {
        timers.push(setTimeout(res, 350));
      });
      if (cancelled) return;

      await startAnim(
        Animated.parallel([
          Animated.timing(heroOpacity, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.spring(heroLeftX, {
            toValue: 0,
            speed: 9,
            bounciness: 10,
            useNativeDriver: true,
          }),
          Animated.spring(heroRightX, {
            toValue: 0,
            speed: 9,
            bounciness: 10,
            useNativeDriver: true,
          }),
        ]),
      );

      if (cancelled) return;

      await new Promise<void>((res) => {
        timers.push(setTimeout(res, 320));
      });
      if (cancelled) return;

      // The VS slams in with the same sound.
      AudioManager.playRevealTitleSplash();
      vsScale.setValue(9);
      await startAnim(
        Animated.parallel([
          Animated.timing(vsOpacity, {
            toValue: 1,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.spring(vsScale, {
            toValue: 1,
            speed: 24,
            bounciness: 3,
            useNativeDriver: true,
          }),
        ]),
      );

      if (cancelled) return;

      await new Promise<void>((res) => {
        timers.push(setTimeout(res, 180));
      });
      if (cancelled) return;

      Animated.parallel([
        Animated.timing(letsGoOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(letsGoY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    };

    void runIntro();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLetsGo = useCallback(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(heroLeftX, {
        toValue: -windowWidth,
        speed: 14,
        bounciness: 0,
        useNativeDriver: true,
      }),
      Animated.spring(heroRightX, {
        toValue: windowWidth,
        speed: 14,
        bounciness: 0,
        useNativeDriver: true,
      }),
      Animated.timing(vsOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(letsGoOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDone();
    });
  }, [
    heroLeftX,
    heroOpacity,
    heroRightX,
    letsGoOpacity,
    onDone,
    vsOpacity,
    windowWidth,
  ]);

  const heroSize = windowWidth * 0.5 * 2.25;

  return (
    <View style={styles.fill}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.persistentTitleWrap,
          {
            // Same place the animated title lands on, so nothing jumps on the swap.
            top: insets.top + titleTopOffset,
            opacity: staticTitleOpacity,
          },
        ]}
      >
        <AppImage
          source={{ uri: DM_SUDDEN_DEATH_URI }}
          contentFit="contain"
          style={{ width: "100%", height: titleHeight }}
        />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.introHeroBase,
          {
            width: heroSize,
            height: heroSize * 1.6,
            top: insets.top + titleTopOffset + titleHeight - 140,
            left: windowWidth / 2 - heroSize + 110,
            opacity: heroOpacity,
            transform: [{ translateX: heroLeftX }],
          },
        ]}
      >
        {leftHeroImage && (
          <AppImage
            source={leftHeroImage}
            contentFit="contain"
            style={StyleSheet.absoluteFill}
          />
        )}
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.introHeroBase,
          {
            width: heroSize,
            height: heroSize * 1.6,
            top: insets.top + titleTopOffset + titleHeight - 140,
            left: windowWidth / 2 - 110,
            opacity: heroOpacity,
            transform: [{ translateX: heroRightX }, { scaleX: -1 }],
          },
        ]}
      >
        {rightHeroImage && (
          <AppImage
            source={rightHeroImage}
            contentFit="contain"
            style={StyleSheet.absoluteFill}
          />
        )}
      </Animated.View>

      <View
        pointerEvents="none"
        style={[
          styles.vsWrap,
          { justifyContent: "flex-start", paddingTop: windowHeight * 0.6 },
        ]}
      >
        <Animated.View
          style={{
            width: windowWidth * 0.42,
            height: windowWidth * 0.42,
            opacity: vsOpacity,
            transform: [{ scale: vsScale }],
          }}
        >
          <AppImage
            source={{ uri: DM_VS_URI }}
            contentFit="contain"
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {!hideAnimTitle && (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: "rgba(0,0,0,0.60)",
                opacity: animBlurOpacity,
                zIndex: 50,
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shockwaveRing,
              {
                top: insets.top + titleTopOffset,
                height: titleHeight * 0.85,
                borderColor: "rgba(255,80,80,1)",
                opacity: animShockwaveOpacity,
                zIndex: 51,
                transform: [{ scale: animShockwaveScale }],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shockwaveRing,
              {
                top: insets.top + titleTopOffset,
                height: titleHeight * 0.85,
                borderColor: "rgba(255,50,50,0.8)",
                opacity: animShockwaveOpacity2,
                zIndex: 51,
                transform: [{ scale: animShockwaveScale2 }],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: "rgba(255,100,80,0.45)",
                opacity: animImpactFlash,
                zIndex: 52,
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.animTitleOverlay,
              {
                zIndex: 53,
                transform: [
                  { translateX: animTitleShakeX },
                  { translateY: animTitleTranslateY },
                  { scale: animTitleScale },
                  {
                    rotate: animTitleRotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["-900deg", "0deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            <AppImage
              source={{ uri: DM_SUDDEN_DEATH_URI }}
              contentFit="contain"
              style={{ width: "100%", height: titleHeight }}
            />
          </Animated.View>
        </>
      )}

      <Animated.View
        style={[
          styles.letsGoWrap,
          {
            bottom: insets.bottom + 40,
            paddingHorizontal: hPad,
            opacity: letsGoOpacity,
            transform: [{ translateY: letsGoY }],
            zIndex: 60,
          },
        ]}
      >
        <CustomButton
          title={t("deathmatch_lets_go")}
          fullWidth
          btnSize="md"
          fontSize="md"
          onPress={handleLetsGo}
          backgroundImage={backgrounds.bg026}
          shadowColor="#7a0000"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  introHeroBase: {
    position: "absolute",
  },
  vsWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  letsGoWrap: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  persistentTitleWrap: {
    position: "absolute",
    left: 8,
    right: 8,
    zIndex: 10,
    pointerEvents: "none",
  },
  animTitleOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  shockwaveRing: {
    position: "absolute",
    left: "5%",
    right: "5%",
    borderWidth: 3,
    borderRadius: 14,
  },
});
