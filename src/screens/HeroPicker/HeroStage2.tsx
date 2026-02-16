import React, { useRef, useState } from "react";
import {
  View,
  Image,
  Animated,
  Pressable,
  PanResponderInstance,
  Easing,
} from "react-native";
import { game_images } from "../../../assets/images";
import { Dimensions } from "react-native";
import { ICharacter } from "../../types/character";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type Props = {
  hero: ICharacter;
  opacity: Animated.Value;
  translateX: Animated.Value;
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
    // reset
    setIsUnlocking(true); // 🔒 само този герой влиза в unlock flow
    setLockFrame(0);
    sepiaOpacity.setValue(0.8);
    lockTranslate.setValue({ x: 0, y: 0 });
    lockScale.setValue(1);

    // frame-by-frame animation
    lockFrames.forEach((_, i) => {
      setTimeout(() => {
        setLockFrame(i);
      }, i * 80); // 🔥 бързо, game-feel
    });
    bounceHero();

    // след последния фрейм → излитане
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
          // onUnlockVisualComplete?.();
        });
      },
      lockFrames.length * 250 + 20
    );
  };
  React.useEffect(() => {
    onPlayLockAnim?.(playLockBreakAnimation);
  }, [hero.id]);

  return (
    <View
      style={styles.stage}
      {...(panResponder ? panResponder.panHandlers : {})}
    >
      {/* LEFT ARROW */}
      <Pressable
        style={[styles.arrowLeft, !canInteract && { opacity: 0.4 }]}
        disabled={!canInteract}
        hitSlop={16}
        onPressIn={leftArrowAnim.pressIn}
        onPressOut={leftArrowAnim.pressOut}
        onPress={onPrev}
      >
        <Animated.Image
          source={game_images.leftArrow}
          style={[{ width: 58, height: 56 }, leftArrowAnim.style]}
        />
      </Pressable>

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
        <Image
          key={`hero-main-${hero.id}`}
          source={hero.main_image}
          resizeMode="contain"
          fadeDuration={0}
          style={styles.heroImage}
        />

        {/* Static lock overlay (no animation state leakage between heroes) */}
        {isLocked && !isUnlocking && (
          <>
            <Image
              key={`hero-sepia-static-${hero.id}`}
              source={hero.main_image}
              resizeMode="contain"
              fadeDuration={0}
              style={[
                styles.heroImage,
                styles.sepiaImageOverlay,
                { opacity: 0.8 },
              ]}
            />
            <Animated.Image
              source={lockFrames[0]}
              resizeMode="contain"
              style={styles.heroLockIcon}
            />
          </>
        )}

        {/* Unlock animation overlay */}
        {isUnlocking && (
          <Animated.Image
            source={hero.main_image}
            resizeMode="contain"
            fadeDuration={0}
            style={[
              styles.heroImage,
              styles.sepiaImageOverlay,
              { opacity: sepiaOpacity },
            ]}
          />
        )}

        {isUnlocking && (
          <Animated.Image
            source={lockFrames[lockFrame]}
            resizeMode="contain"
            style={[
              styles.heroLockIcon,
              {
                transform: [
                  { translateX: lockTranslate.x },
                  { translateY: lockTranslate.y },
                  { scale: lockScale },
                ],
              },
            ]}
          />
        )}
      </Animated.View>

      {/* RIGHT ARROW */}
      <Pressable
        style={[styles.arrowRight, !canInteract && { opacity: 0.4 }]}
        disabled={!canInteract}
        hitSlop={16}
        onPressIn={rightArrowAnim.pressIn}
        onPressOut={rightArrowAnim.pressOut}
        onPress={onNext}
      >
        <Animated.Image
          source={game_images.rightArrow}
          style={[{ width: 58, height: 56 }, rightArrowAnim.style]}
        />
      </Pressable>
    </View>
  );
}
