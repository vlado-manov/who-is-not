import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  ImageBackground,
  useWindowDimensions,
} from "react-native";
import React from "react";
import { IBundle } from "../../types/bundle";
import CustomText from "../common/CustomText";
import CustomButton from "../common/CustomButton";

type Props = {
  item: IBundle;
};
const BundleComponent = ({ item }: Props) => {
  const width = useWindowDimensions().width - 56;
  let a = item.isFeatured ? 1 : 0.75;
  const cardWidth = width * a;
  const toSrc = (img: string | ImageSourcePropType): ImageSourcePropType =>
    typeof img === "string" ? { uri: img } : (img as ImageSourcePropType);

  return (
    <View className="pb-8">
      <View className="relative w-full flex-1">
        <ImageBackground
          source={toSrc(item.background)}
          resizeMode="cover"
          style={{ borderRadius: 16, overflow: "hidden" }}
          className="pt-12 pb-[80px] flex flex-row relative"
        >
          <View className="px-8 z-10">
            <CustomText variant="h4-headline" className="w-[63%]">
              {item.title}
            </CustomText>
            <CustomText variant="p" className="w-[63%]">
              {item.summary}
            </CustomText>
          </View>
          <Image
            source={toSrc(item.image)}
            resizeMode="contain"
            className="w-[220px] h-[250px] absolute bottom-0 right-0 z-1"
          />
          {item.isBestOffer && (
            <View className="absolute top-8 -right-12 bg-primary-900 rotate-45 w-[200px] text-right py-2">
              <CustomText
                variant="p"
                className="uppercase text-center font-opensans-bold"
              >
                Best offer
              </CustomText>
            </View>
          )}
        </ImageBackground>
      </View>
      <View className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <CustomButton title={`$ ${item.discountPrice}`} textClassName="px-12" />
        {item.priceNote && (
          <View className="bg-primary-400 py-2 px-4 rounded-full absolute -top-1/2 translate-y-6 z-20 left-1/2 -translate-x-1/2">
            <CustomText variant="p-small">{item.priceNote}</CustomText>
          </View>
        )}
      </View>
    </View>
  );
};

export default BundleComponent;
