import {
  View,
  Text,
  ImageSourcePropType,
  Image,
  ImageBackground,
  useWindowDimensions,
} from "react-native";
import React from "react";
import { IPack } from "../../types/pack";
import CustomText from "../common/CustomText";
import CustomButton from "../common/CustomButton";

type Props = {
  pack: IPack;
  onSelect?: (pack: IPack) => void;
};
const PackComponent = ({ pack, onSelect }: Props) => {
  const width = useWindowDimensions().width;
  const toSrc = (img: string | ImageSourcePropType): ImageSourcePropType =>
    typeof img === "string" ? { uri: img } : (img as ImageSourcePropType);

  return (
    <View className="pb-8">
      <View className="relative w-full flex-1">
        <ImageBackground
          source={toSrc(pack.background)}
          resizeMode="cover"
          style={{ borderRadius: 16, overflow: "hidden" }}
          className="pt-12 pb-[80px] flex flex-row relative"
        >
          <View className="px-8 z-10">
            <CustomText variant="h4-headline" className="w-[63%]">
              {pack.title}
            </CustomText>
            <CustomText variant="p" className="w-[63%]">
              {pack.summary}
            </CustomText>
          </View>
          <Image
            source={toSrc(pack.image)}
            resizeMode="contain"
            className="w-[220px] h-[225px] absolute bottom-0 right-0 z-1"
          />
        </ImageBackground>
      </View>
      <View className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <CustomButton title={`$${pack.price}`} textClassName="px-12" />
        {pack.priceNote && (
          <View className="bg-primary-400 py-2 px-4 rounded-full absolute -top-1/2 translate-y-6 z-20 left-1/2 -translate-x-1/2">
            <CustomText variant="p-small">{pack.priceNote}</CustomText>
          </View>
        )}
      </View>
    </View>
  );
};

export default PackComponent;
