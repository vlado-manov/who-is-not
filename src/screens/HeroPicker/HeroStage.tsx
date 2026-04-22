import React, { useRef, useState } from "react";
import {
  View,
  Animated,
  Pressable,
  PanResponderInstance,
  Easing,
} from "react-native";
import { Image } from "expo-image";
import AppImage from "../../components/AppImage";

const AnimatedImage = Animated.createAnimatedComponent(Image);
import { game_images } from "../../../assets/images";
import { Dimensions } from "react-native";
import { ICharacter } from "../../types/character";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type Props = {
  hero: ICharacter;
  opacity: Animated.Value;
  translateX: Animated.Value | Animated.AnimatedInterpolation<number>;
  panResponder: PanResponderInstance | undefined;

  canInteract: boolean;
  previewing: boolean;

  onPrev: () => void;
  onNext: () => void;

  leftArrowAnim: {
    style: any;
    pressIn: () => void;
    pressOut: () => void;
  };
  rightArrowAnim: {
    style: any;
    pressIn: () => void;
    pressOut: () => void;
  };
  onPlayLockAnim?: (fn: () => void) => void;
  onUnlockVisualComplete?: () => void;
  styles: any;
  heroScale: Animated.Value;
  /** When false, arrows are hidden (e.g. during overlap carousel animation). */
  showArrows?: boolean;
};

export function HeroStage({
  hero,
  opacity,
  translateX,
  panResponder,
  canInteract,
  previewing,
  onPrev,
  onNext,
  leftArrowAnim,
  rightArrowAnim,
  styles,
  onPlayLockAnim,
  onUnlockVisualComplete,
  heroScale,
  showArrows = true,
}: Props) {
  const lockFrames = [
    game_images.lock,
    game_images.lock2,
    game_images.lock3,
    game_images.lock4,
    // game_images.lock5,
  ];
  const sepiaOpacity = useRef(new Animated.Value(0.8)).current;
  // const heroScale = useRef(new Animated.Value(1)).current;
  const lockTranslate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lockScale = useRef(new Animated.Value(1)).current;
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [lockFrame, setLockFrame] = useState(0);
  const isLocked = !hero.unlocked;
  const bounceHero = () => {
    Animated.sequence([
      Animated.spring(heroScale, {
        toValue: 1.15,
        friction: 5,
        tension: 420,
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        friction: 6,
        tension: 420,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const playLockBreakAnimation = () => {
    setIsUnlocking(true);
    setLockFrame(0);
    sepiaOpacity.setValue(0.8);
    lockTranslate.setValue({ x: 0, y: 0 });
    lockScale.setValue(1);

    // 1) Катинарът остава на място, scale 1 → 1.15 → 1, после започва отварянето
    Animated.sequence([
      Animated.timing(lockScale, {
        toValue: 1.15,
        duration: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(lockScale, {
        toValue: 1,
        duration: 140,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2) frame-by-frame crack
      lockFrames.forEach((_, i) => {
        setTimeout(() => setLockFrame(i), i * 80);
      });
      bounceHero();

      // 3) след последния фрейм → излитане надолу
      setTimeout(
        () => {
          onUnlockVisualComplete?.();
          Animated.parallel([
            Animated.timing(sepiaOpacity, {
              toValue: 0,
              duration: 1500,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(lockTranslate.y, {
              toValue: SCREEN_HEIGHT + 200,
              duration: 1000,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(lockScale, {
              toValue: 0.6,
              duration: 1000,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
          ]).start(() => {
            setIsUnlocking(false);
            bounceHero();
          });
        },
        lockFrames.length * 250 + 20
      );
    });
  };
  React.useEffect(() => {
    onPlayLockAnim?.(playLockBreakAnimation);
  }, [hero.id]);

  // Sync sepia opacity when hero changes so first pass (and every mount) shows correct state
  React.useEffect(() => {
    sepiaOpacity.setValue(isLocked ? 0.8 : 0);
  }, [hero.id, isLocked, sepiaOpacity]);

  return (
    <View
      style={styles.stage}
      {...(panResponder ? panResponder.panHandlers : {})}
    >
      {showArrows && (
        <Pressable
          style={[styles.arrowLeft, !canInteract && { opacity: 0.4 }]}
          disabled={!canInteract}
          hitSlop={16}
          onPressIn={leftArrowAnim.pressIn}
          onPressOut={leftArrowAnim.pressOut}
          onPress={onPrev}
        >
          <AnimatedImage
            source={game_images.leftArrow}
            style={[styles.arrowIcon, leftArrowAnim.style]}
            contentFit="contain"
          />
        </Pressable>
      )}

      {/* HERO IMAGE */}
      <Animated.View
        style={[
          styles.heroImageWrap,
          {
            opacity,
            transform: [{ translateX }, { scale: heroScale }],
          },
        ]}
      >
        {/* BASE IMAGE */}
        <AppImage
          key={`hero-main-${hero.id}`}
          source={hero.main_image}
          contentFit="contain"
          style={styles.heroImage}
        />

        {/* Static lock overlay (no animation state leakage between heroes) */}
        {isLocked && !isUnlocking && (
          <>
            <AppImage
              key={`hero-sepia-static-${hero.id}`}
              source={hero.main_image}
              contentFit="contain"
              style={[
                styles.heroImage,
                styles.sepiaImageOverlay,
                { opacity: 0.8 },
              ]}
            />
            <AnimatedImage
              source={lockFrames[0]}
              contentFit="contain"
              style={styles.heroLockIcon}
            />
          </>
        )}

        {/* Unlock animation overlay */}
        {isUnlocking && (
          <AnimatedImage
            source={hero.main_image}
            contentFit="contain"
            style={[
              styles.heroImage,
              styles.sepiaImageOverlay,
              { opacity: sepiaOpacity },
            ]}
          />
        )}

        {isUnlocking && (
          <AnimatedImage
            source={lockFrames[lockFrame]}
            contentFit="contain"
            style={[
              styles.heroLockIcon,
              {
                transform: [
                  { translateX: -66 },
                  { translateY: -66 },
                  { rotate: "15deg" },
                  { translateX: lockTranslate.x },
                  { translateY: lockTranslate.y },
                  { scale: lockScale },
                ],
              },
            ]}
          />
        )}
      </Animated.View>

      {showArrows && (
        <Pressable
          style={[styles.arrowRight, !canInteract && { opacity: 0.4 }]}
          disabled={!canInteract}
          hitSlop={16}
          onPressIn={rightArrowAnim.pressIn}
          onPressOut={rightArrowAnim.pressOut}
          onPress={onNext}
        >
          <AnimatedImage
            source={game_images.rightArrow}
            style={[styles.arrowIcon, rightArrowAnim.style]}
            contentFit="contain"
          />
        </Pressable>
      )}
    </View>
  );
}
