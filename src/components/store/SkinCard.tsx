// src/components/store/SkinCard.tsx
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";

import AppImage from "../AppImage";
import { formatPrice, unlockOf } from "../../game/unlocks";
import type { ICharacter } from "../../types/character";
import AudioManager from "../../utils/audioManager";

export const SKIN_CARD_WIDTH = 168;
const CARD_HEIGHT = 236;
/** €1.49 when the backend sends no price. */
const SKIN_FALLBACK_PRICE = 149;

type Props = {
  skin: ICharacter;
  hero: ICharacter;
  onBuy: (skin: ICharacter, hero: ICharacter) => void;
};

/**
 * An outfit for sale, like an item-shop card: a purple-to-pink "rare" gradient,
 * the hero in the outfit standing in it, an OUTFIT tag, the outfit's and the
 * hero's names and a gold price button.
 */
export default function SkinCard({ skin, hero, onBuy }: Props) {
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(1)).current;
  const unlock = unlockOf(skin);
  const price = unlock.discountPrice ?? unlock.price ?? SKIN_FALLBACK_PRICE;
  const to = (v: number) =>
    Animated.spring(scale, { toValue: v, speed: 30, bounciness: 8, useNativeDriver: true }).start();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${skin.name}, ${hero.name}, ${formatPrice(price)}`}
      onPressIn={() => to(0.95)}
      onPressOut={() => to(1)}
      onPress={() => {
        AudioManager.playButtonClick();
        onBuy(skin, hero);
      }}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <LinearGradient
          colors={["#5B2BD9", "#C44CD7", "#FF6FB5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <AppImage
          source={skin.main_image}
          contentFit="contain"
          contentPosition="bottom"
          style={styles.image}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(20,8,40,0.92)"]}
          style={styles.shade}
        />
        <View style={styles.tag}>
          <Text style={styles.tagText}>{t("store_skin_tag")}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.name} numberOfLines={1}>
            {skin.name}
          </Text>
          <Text style={styles.hero} numberOfLines={1}>
            {hero.name}
          </Text>
          <View style={styles.price}>
            <Text style={styles.priceText}>{formatPrice(price)}</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SKIN_CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
  },
  image: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 18,
    bottom: 54,
  },
  shade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
  },
  tag: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  tagText: {
    color: "#FFFFFF",
    fontFamily: "Onest-ExtraBold",
    fontSize: 10,
    letterSpacing: 0.8,
  },
  footer: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    gap: 2,
  },
  name: {
    color: "#FFFFFF",
    fontFamily: "Onest-ExtraBold",
    fontSize: 17,
  },
  hero: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Onest-SemiBold",
    fontSize: 12,
    marginBottom: 6,
  },
  price: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "#FFD966",
    boxShadow: "0px 3px 0px #B8860B",
  },
  priceText: {
    color: "#3A2400",
    fontFamily: "Onest-ExtraBold",
    fontSize: 15,
  },
});
