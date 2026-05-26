import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Image,
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { IBundle } from "../../types/bundle";
import CustomText from "../common/CustomText";
import { useTranslation } from "react-i18next";

type Props = {
  item: IBundle;
  onSelect?: (item: IBundle) => void;
  delay?: number;
  scrollY?: Animated.Value;
};

const toUri = (
  img: string | { uri: string } | ImageSourcePropType | undefined,
): string | undefined => {
  if (!img) return undefined;
  if (typeof img === "string") return img.length > 0 ? img : undefined;
  if (typeof img === "object" && "uri" in (img as object))
    return (img as { uri: string }).uri;
  return undefined;
};

const toSrc = (
  img: string | { uri: string } | ImageSourcePropType,
): ImageSourcePropType => {
  if (typeof img === "string") return { uri: img };
  return img as ImageSourcePropType;
};

// ── Chest-reveal layout (All Heroes Pack) ────────────────────────────────────
function ChestBundle({
  item,
  onSelect,
  delay,
  scrollY,
  entrance,
}: {
  item: IBundle;
  onSelect?: (b: IBundle) => void;
  delay: number;
  scrollY?: Animated.Value;
  entrance: {
    opacity: Animated.Value;
    slide: Animated.Value;
    scale: Animated.Value;
  };
}) {
  const { t } = useTranslation();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const cardW = screenW - 32;
  const imgH = cardW * 0.75;

  const shakeRot = useRef(new Animated.Value(0)).current;
  const shakeScale = useRef(new Animated.Value(1)).current;
  const reveal = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const triggered = useRef(false);
  const [layoutY, setLayoutY] = useState(-1);

  // Float animation for closed chest while waiting
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -8,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floatY]);

  // Scroll trigger
  useEffect(() => {
    if (!scrollY || layoutY < 0 || triggered.current) return;
    const sub = scrollY.addListener(({ value }) => {
      if (!triggered.current && layoutY - value < screenH * 0.82) {
        triggered.current = true;
        sub && scrollY.removeListener(sub);
        runShake();
      }
    });
    return () => scrollY.removeListener(sub);
  }, [scrollY, layoutY, screenH]);

  const runShake = () => {
    Animated.sequence([
      // Shake 1
      Animated.timing(shakeRot, {
        toValue: -14,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(shakeRot, {
        toValue: 14,
        duration: 80,
        useNativeDriver: true,
      }),
      // Shake 2 — bigger
      Animated.timing(shakeRot, {
        toValue: -22,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(shakeRot, {
        toValue: 22,
        duration: 90,
        useNativeDriver: true,
      }),
      // Shake 3 — biggest
      Animated.timing(shakeRot, {
        toValue: -30,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(shakeRot, {
          toValue: 30,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeScale, {
          toValue: 1.18,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      // Settle with bounce
      Animated.parallel([
        Animated.spring(shakeRot, {
          toValue: 0,
          speed: 22,
          bounciness: 18,
          useNativeDriver: true,
        } as any),
        Animated.spring(shakeScale, {
          toValue: 1,
          speed: 18,
          bounciness: 12,
          useNativeDriver: true,
        } as any),
      ]),
    ]).start(() => {
      setTimeout(() => {
        Animated.spring(reveal, {
          toValue: 1,
          speed: 7,
          bounciness: 10,
          useNativeDriver: true,
        } as any).start();
      }, 350);
    });
  };

  const badgeLabel =
    item.priceNote ?? `Save $${(item.price - item.discountPrice).toFixed(0)}`;
  const closedUri = toUri(item.closedImage);
  const openUri = toUri(item.image);

  const closedOpacity = reveal.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.3, 0],
  });
  const closedScale2 = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.8],
  });
  const openOpacity = reveal.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0, 1],
  });
  const openScale2 = reveal.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.5, 0.7, 1],
  });
  const openRotate = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: ["-8deg", "0deg"],
  });

  return (
    <Animated.View
      onLayout={(e) => setLayoutY(e.nativeEvent.layout.y)}
      style={[
        chestStyles.wrap,
        {
          opacity: entrance.opacity,
          transform: [
            { translateY: entrance.slide },
            { scale: entrance.scale },
          ],
        },
      ]}
    >
      <Pressable
        style={({ pressed }) => [pressed && { opacity: 0.93 }]}
        onPress={() => onSelect?.(item)}
      >
        <LinearGradient
          colors={["#1a0533", "#2d0b5a", "#0a0020"]}
          style={chestStyles.card}
        >
          {/* Best offer ribbon */}
          {item.isBestOffer && (
            <View style={chestStyles.ribbon}>
              <CustomText style={chestStyles.ribbonText}>
                🏆 BEST VALUE
              </CustomText>
            </View>
          )}

          {/* Image area */}
          <View style={[chestStyles.imgArea, { height: imgH }]}>
            {/* Closed chest */}
            {closedUri && (
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    opacity: closedOpacity,
                    transform: [
                      { translateY: floatY },
                      {
                        rotate: shakeRot.interpolate({
                          inputRange: [-30, 30],
                          outputRange: ["-30deg", "30deg"],
                        }),
                      },
                      { scale: Animated.multiply(shakeScale, closedScale2) },
                    ],
                  },
                ]}
              >
                <Image
                  source={{ uri: closedUri }}
                  style={chestStyles.img}
                  resizeMode="contain"
                />
              </Animated.View>
            )}
            {/* Open / revealed image */}
            {openUri && (
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    opacity: openOpacity,
                    transform: [{ scale: openScale2 }, { rotate: openRotate }],
                  },
                ]}
              >
                <Image
                  source={{ uri: openUri }}
                  style={chestStyles.img}
                  resizeMode="contain"
                />
              </Animated.View>
            )}
          </View>

          {/* Text */}
          <View style={chestStyles.info}>
            <CustomText style={chestStyles.title}>{item.title}</CustomText>
            <CustomText style={chestStyles.summary}>{item.summary}</CustomText>
            <View style={chestStyles.priceRow}>
              <CustomText style={chestStyles.original}>
                ${item.price.toFixed(2)}
              </CustomText>
              <CustomText style={chestStyles.discounted}>
                ${item.discountPrice.toFixed(2)}
              </CustomText>
              <View style={chestStyles.badge}>
                <CustomText style={chestStyles.badgeText}>
                  {badgeLabel}
                </CustomText>
              </View>
            </View>
          </View>

          {/* CTA */}
          <View style={chestStyles.btnWrap}>
            <LinearGradient
              colors={["#9333ea", "#6d28d9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={chestStyles.btn}
            >
              <CustomText style={chestStyles.btnText}>
                {t("store_get_for", { price: item.discountPrice.toFixed(2) })}
              </CustomText>
            </LinearGradient>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const chestStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#9333ea",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 12,
    borderWidth: 1.5,
    borderColor: "rgba(147,51,234,0.35)",
  },
  card: { borderRadius: 22, overflow: "hidden", paddingBottom: 0 },
  ribbon: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FFD43B",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomLeftRadius: 14,
    zIndex: 2,
  },
  ribbonText: {
    color: "#1a0533",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  imgArea: { alignItems: "center", justifyContent: "center", marginTop: 12 },
  img: { width: "100%", height: "100%" },
  info: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 4 },
  title: { color: "#fff", fontSize: 21, fontWeight: "900" },
  summary: { color: "rgba(255,255,255,0.65)", fontSize: 13 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    flexWrap: "wrap",
  },
  original: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 14,
    textDecorationLine: "line-through",
  },
  discounted: { color: "#FFD43B", fontSize: 26, fontWeight: "900" },
  badge: {
    backgroundColor: "rgba(147,51,234,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(147,51,234,0.5)",
  },
  badgeText: { color: "#e9d5ff", fontSize: 11, fontWeight: "800" },
  btnWrap: { overflow: "hidden" },
  btn: { paddingVertical: 15, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "900" },
});

// ── Character-side layout (Troublemakers) ─────────────────────────────────────
function CharacterBundle({
  item,
  onSelect,
  entrance,
}: {
  item: IBundle;
  onSelect?: (b: IBundle) => void;
  entrance: {
    opacity: Animated.Value;
    slide: Animated.Value;
    scale: Animated.Value;
  };
}) {
  const { t } = useTranslation();
  const { width: screenW } = useWindowDimensions();
  const charUri = toUri(item.characterImage);
  const charImgW = (screenW - 32) * 0.5;
  const charImgH = charImgW * 1.1;

  const floatY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -6,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floatY]);

  const badgeLabel =
    item.priceNote ?? `Save $${(item.price - item.discountPrice).toFixed(0)}`;

  return (
    <Animated.View
      style={[
        charStyles.outerWrap,
        {
          opacity: entrance.opacity,
          transform: [
            { translateY: entrance.slide },
            { scale: entrance.scale },
          ],
        },
      ]}
    >
      <Pressable onPress={() => onSelect?.(item)}>
        {/* Card */}
        <ImageBackground
          source={toSrc(item.background)}
          resizeMode="cover"
          style={charStyles.card}
          imageStyle={charStyles.cardBg}
        >
          <LinearGradient
            colors={["rgba(6,2,18,0.78)", "rgba(18,5,45,0.88)"]}
            style={StyleSheet.absoluteFill}
          />

          {/* Best-offer ribbon */}
          {item.isBestOffer && (
            <View style={chestStyles.ribbon}>
              <CustomText style={chestStyles.ribbonText}>
                🏆 BEST VALUE
              </CustomText>
            </View>
          )}

          {/* Left content */}
          <View style={charStyles.leftContent}>
            <CustomText style={charStyles.title}>{item.title}</CustomText>
            <CustomText style={charStyles.summary}>{item.summary}</CustomText>

            <View style={charStyles.priceRow}>
              <CustomText style={charStyles.original}>
                ${item.price.toFixed(2)}
              </CustomText>
              <CustomText style={charStyles.discounted}>
                ${item.discountPrice.toFixed(2)}
              </CustomText>
            </View>
            <View style={charStyles.badge}>
              <CustomText style={charStyles.badgeText}>{badgeLabel}</CustomText>
            </View>
          </View>
        </ImageBackground>

        {/* CTA full-width below card */}
        <View style={charStyles.btnWrap}>
          <LinearGradient
            colors={["#9333ea", "#6d28d9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={charStyles.btn}
          >
            <CustomText style={charStyles.btnText}>
              {t("store_get_for", { price: item.discountPrice.toFixed(2) })}
            </CustomText>
          </LinearGradient>
        </View>
      </Pressable>

      {/* Overflowing character image — sibling, absolutely positioned */}
      {charUri && (
        <Animated.Image
          source={{ uri: charUri }}
          resizeMode="contain"
          style={[
            charStyles.charImg,
            {
              width: charImgW,
              height: charImgH,
              transform: [{ translateY: floatY }, { rotate: "8deg" }],
            },
          ]}
        />
      )}
    </Animated.View>
  );
}

const charStyles = StyleSheet.create({
  outerWrap: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 22,
    shadowColor: "#7c3aed",
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    borderWidth: 1.5,
    borderColor: "rgba(147,51,234,0.3)",
    overflow: "visible",
  },
  card: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
    paddingTop: 22,
    paddingBottom: 22,
    paddingLeft: 20,
    paddingRight: 4,
    minHeight: 160,
  },
  cardBg: { borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  leftContent: { width: "56%" },
  title: { color: "#fff", fontSize: 20, fontWeight: "900", marginBottom: 6 },
  summary: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  original: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 13,
    textDecorationLine: "line-through",
  },
  discounted: { color: "#FFD43B", fontSize: 24, fontWeight: "900" },
  badge: {
    backgroundColor: "rgba(147,51,234,0.7)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(147,51,234,0.5)",
  },
  badgeText: { color: "#e9d5ff", fontSize: 11, fontWeight: "800" },
  btnWrap: {
    overflow: "hidden",
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  btn: { paddingVertical: 15, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "900" },
  charImg: {
    position: "absolute",
    right: -10,
    top: -10,
    zIndex: 10,
  },
});

// ── Default layout ─────────────────────────────────────────────────────────────
function DefaultBundle({
  item,
  onSelect,
  entrance,
}: {
  item: IBundle;
  onSelect?: (b: IBundle) => void;
  entrance: {
    opacity: Animated.Value;
    slide: Animated.Value;
    scale: Animated.Value;
  };
}) {
  const { t } = useTranslation();
  const badgeLabel =
    item.priceNote ?? `Save $${(item.price - item.discountPrice).toFixed(0)}`;

  return (
    <Animated.View
      style={[
        defStyles.wrap,
        {
          opacity: entrance.opacity,
          transform: [
            { translateY: entrance.slide },
            { scale: entrance.scale },
          ],
        },
      ]}
    >
      <Pressable
        style={({ pressed }) => [pressed && defStyles.pressed]}
        onPress={() => onSelect?.(item)}
      >
        <ImageBackground
          source={toSrc(item.background)}
          resizeMode="cover"
          style={defStyles.bg}
          imageStyle={defStyles.bgImg}
        >
          <LinearGradient
            colors={["rgba(8,2,20,0.72)", "rgba(20,5,50,0.88)"]}
            style={StyleSheet.absoluteFill}
          />
          {item.isBestOffer && (
            <View style={defStyles.ribbon}>
              <CustomText style={defStyles.ribbonText}>
                🏆 BEST VALUE
              </CustomText>
            </View>
          )}
          <View style={defStyles.info}>
            <CustomText style={defStyles.title}>{item.title}</CustomText>
            <CustomText style={defStyles.summary}>{item.summary}</CustomText>
            <View style={defStyles.priceRow}>
              <CustomText style={defStyles.original}>
                ${item.price.toFixed(2)}
              </CustomText>
              <CustomText style={defStyles.discounted}>
                ${item.discountPrice.toFixed(2)}
              </CustomText>
              <View style={defStyles.badge}>
                <CustomText style={defStyles.badgeText}>
                  {badgeLabel}
                </CustomText>
              </View>
            </View>
          </View>
          <View style={defStyles.btnWrap}>
            <LinearGradient
              colors={["#9333ea", "#6d28d9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={defStyles.btn}
            >
              <CustomText style={defStyles.btnText}>
                {t("store_get_for", { price: item.discountPrice.toFixed(2) })}
              </CustomText>
            </LinearGradient>
          </View>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
}

const defStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#7c3aed",
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    borderWidth: 1.5,
    borderColor: "rgba(147,51,234,0.3)",
  },
  pressed: { transform: [{ scale: 0.975 }] },
  bg: {
    borderRadius: 22,
    overflow: "hidden",
    paddingTop: 22,
    paddingBottom: 0,
    paddingHorizontal: 20,
    gap: 12,
  },
  bgImg: { borderRadius: 22 },
  ribbon: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FFD43B",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomLeftRadius: 14,
    zIndex: 1,
  },
  ribbonText: {
    color: "#1a0533",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  info: { gap: 4 },
  title: { color: "#fff", fontSize: 21, fontWeight: "900" },
  summary: { color: "rgba(255,255,255,0.72)", fontSize: 13, lineHeight: 18 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    flexWrap: "wrap",
  },
  original: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 14,
    textDecorationLine: "line-through",
  },
  discounted: { color: "#FFD43B", fontSize: 26, fontWeight: "900" },
  badge: {
    backgroundColor: "rgba(147,51,234,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(147,51,234,0.5)",
  },
  badgeText: { color: "#e9d5ff", fontSize: 11, fontWeight: "800" },
  btnWrap: { overflow: "hidden" },
  btn: { paddingVertical: 14, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "900" },
});

// ── Main export — picks the right layout ──────────────────────────────────────
const BundleComponent = ({ item, onSelect, delay = 0, scrollY }: Props) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        speed: 14,
        bounciness: 6,
        delay,
        useNativeDriver: true,
      } as any),
      Animated.spring(scaleAnim, {
        toValue: 1,
        speed: 14,
        bounciness: 4,
        delay,
        useNativeDriver: true,
      } as any),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim, delay]);

  const entrance = { opacity: fadeAnim, slide: slideAnim, scale: scaleAnim };

  if (item.closedImage) {
    return (
      <ChestBundle
        item={item}
        onSelect={onSelect}
        delay={delay}
        scrollY={scrollY}
        entrance={entrance}
      />
    );
  }
  if (item.characterImage) {
    return (
      <CharacterBundle item={item} onSelect={onSelect} entrance={entrance} />
    );
  }
  return <DefaultBundle item={item} onSelect={onSelect} entrance={entrance} />;
};

export default BundleComponent;
