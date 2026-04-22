import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  View,
  type ImageSourcePropType,
} from "react-native";
import AppImage from "./AppImage";

type Props = {
  logoSource: ImageSourcePropType;
  overlaySource: ImageSourcePropType;
  logoWidth: number;
  logoHeight: number;
  overlayLayout: {
    width: number;
    height: number;
    top: number;
    left: number;
  };
  marginTop?: number;
  onPress?: () => void;
};

/**
 * Entrance motion aligned with VoteNowScreen (spring drop + scale + spin).
 */
export default function AnimatedLogoHero({
  logoSource,
  overlaySource,
  logoWidth,
  logoHeight,
  overlayLayout,
  marginTop = 0,
  onPress,
}: Props) {
  const translateY = useRef(new Animated.Value(-800)).current;
  const scale = useRef(new Animated.Value(25)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        speed: 14,
        bounciness: 8,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, scale, rotate]);

  const inner = (
    <View style={{ width: logoWidth, height: logoHeight, position: "relative" }}>
      <Animated.View
        style={{
          width: logoWidth,
          height: logoHeight,
          position: "relative",
          transform: [
            { translateY },
            { scale },
            {
              rotate: rotate.interpolate({
                inputRange: [0, 1],
                outputRange: ["-900deg", "0deg"],
              }),
            },
          ],
        }}
      >
        <AppImage
          source={overlaySource}
          style={{
            width: overlayLayout.width,
            height: overlayLayout.height,
            position: "absolute",
            top: overlayLayout.top,
            left: overlayLayout.left,
          }}
          contentFit="contain"
        />
        <AppImage
          source={logoSource}
          style={{ width: logoWidth, height: logoHeight }}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );

  return (
    <View style={{ marginTop, alignItems: "center", alignSelf: "center" }}>
      {onPress ? (
        <Pressable onPress={onPress} style={{ alignItems: "center" }}>
          {inner}
        </Pressable>
      ) : (
        inner
      )}
    </View>
  );
}
