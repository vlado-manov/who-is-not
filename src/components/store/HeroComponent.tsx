import React from "react";
import {
  View,
  Pressable,
  StyleSheet,
  ImageSourcePropType,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AppImage from "../AppImage";
import CustomText from "../common/CustomText";
import { ICharacter } from "../../types/character";

type Props = {
  item: ICharacter;
  size?: number;
  onPress?: (c: ICharacter) => void;
  disabled?: boolean;
};

const toSrc = (img: string | ImageSourcePropType): ImageSourcePropType =>
  typeof img === "string" ? { uri: img } : (img as ImageSourcePropType);

export default function HeroComponent({ item, size = 120, onPress, disabled }: Props) {
  const price = item.discountPrice > 0 ? item.discountPrice : item.price;

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      disabled={disabled}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={["#1e1033", "#2d1555"]}
        style={[styles.card, { width: size + 32 }]}
      >
        {/* Premium crown */}
        <View style={styles.crownBadge}>
          <CustomText style={styles.crownText}>★ HERO</CustomText>
        </View>

        {/* Hero image */}
        <View style={[styles.imageRing, { width: size, height: size, borderRadius: size / 2 }]}>
          <AppImage
            source={toSrc(item.profileImage || item.main_image)}
            contentFit="cover"
            style={{ width: "100%", height: "100%" }}
          />
        </View>

        {/* Name */}
        <CustomText
          variant="h3-headline"
          style={styles.name}
          numberOfLines={1}
        >
          {item.name}
        </CustomText>

        {/* Price + unlock button */}
        <Pressable
          onPress={() => onPress?.(item)}
          disabled={disabled}
          style={styles.unlockBtn}
        >
          <LinearGradient
            colors={["#FFD43B", "#F76B1C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.unlockGradient}
          >
            <CustomText style={styles.unlockText}>
              ${price.toFixed(2)} UNLOCK
            </CustomText>
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 6,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  card: {
    borderRadius: 20,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,212,59,0.2)",
  },
  crownBadge: {
    backgroundColor: "rgba(255,212,59,0.15)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255,212,59,0.3)",
  },
  crownText: {
    color: "#FFD43B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  imageRing: {
    borderWidth: 2.5,
    borderColor: "#FFD43B",
    overflow: "hidden",
    shadowColor: "#FFD43B",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  name: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
  unlockBtn: {
    alignSelf: "stretch",
    borderRadius: 10,
    overflow: "hidden",
  },
  unlockGradient: {
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  unlockText: {
    color: "#1a0533",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});
