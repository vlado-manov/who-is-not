import React from "react";
import {
  View,
  Pressable,
  StyleSheet,
  ImageSourcePropType,
} from "react-native";
import AppImage from "../AppImage";
import CustomText from "../common/CustomText";
import { ICharacter } from "../../types/character";
import CustomButton from "../common/CustomButton";
import { useTranslation } from "react-i18next";

type Props = {
  item: ICharacter;
  size?: number;
  onPress?: (c: ICharacter) => void;
  disabled?: boolean;
};

const toSrc = (img: string | ImageSourcePropType): ImageSourcePropType =>
  typeof img === "string" ? { uri: img } : (img as ImageSourcePropType);

export default function HeroComponent({
  item,
  size = 118,
  onPress,
  disabled,
}: Props) {
  const { t } = useTranslation();
  const price = item.discountPrice > 0 ? item.discountPrice : item.price;
  const hasDiscount = item.discountPrice > 0 && item.discountPrice < item.price;

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      disabled={disabled}
      style={styles.wrap}
    >
      <CustomText
        variant="h3-headline"
        className="text-center mb-2"
        textColor="text-white"
      >
        {item.name}
      </CustomText>

      <View style={[{ width: size, height: size, borderRadius: size / 2 }]}>
        <AppImage
          source={toSrc(item.profileImage || item.main_image)}
          contentFit="cover"
          style={{ width: "100%", height: "100%" }}
        />
      </View>
      <View className="relative">
        {/* Price pill */}
        {/* <View className="absolute -bottom-8 left-0 z-50 justify-center items-center flex text-center">
          {item.adFree && (
            <View style={styles.adsPill}>
              <CustomText
                variant="footnote"
                className="text-center"
                textColor="text-white"
              >
                watch 3 ads
              </CustomText>
            </View>
          )}
        </View> */}
        <View className="-mt-8">
          {!item.adFree ? (
            <CustomButton
              title={`$ ${price.toFixed(2)}`}
              btnSize="sm"
              onPress={() => onPress?.(item)}
            />
          ) : (
            <CustomButton
              title={t("free")}
              btnSize="sm"
              onPress={() => onPress?.(item)}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "flex-start",
    marginHorizontal: 12,
  },
  priceWrap: {
    alignItems: "center",
  },
  adsPill: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  pricePill: {
    backgroundColor: "#F0522C",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  rowCenter: { flexDirection: "row", alignItems: "center" },
});
