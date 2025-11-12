import {
  View,
  Text,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { IPack } from "../../types/pack";
import CustomText from "../common/CustomText";
import PackComponent from "./PackComponent";
import {
  CarouselLayout,
  computeCarouselFromWidths,
  computePackWidths,
} from "../../utils/computeCarousel";

type Props = {
  title: string;
  data: IPack[];
  onSelect?: (pack: IPack) => void;
};

const Dot = ({ active, onPress }: { active: boolean; onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      width: 16,
      height: 16,
      borderRadius: 55,
      marginHorizontal: 6,
      opacity: active ? 1 : 0.6,
      backgroundColor: "#fff",
    }}
  />
);

const PackSliderComponent = ({ title, data, onSelect }: Props) => {
  const { width: screenWidth } = useWindowDimensions();
  const sliderRef = useRef<FlatList<IPack>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const layout: CarouselLayout = useMemo(() => {
    const widths = computePackWidths(screenWidth, data, 0.9);
    return computeCarouselFromWidths(screenWidth, widths, 24);
  }, [screenWidth, data]);

  useEffect(() => {
    if (!layout.offsets.length) return;
    const target =
      layout.offsets[Math.min(activeIndex, layout.offsets.length - 1)];
    sliderRef.current?.scrollToOffset({ offset: target, animated: false });
  }, [screenWidth, layout.offsets.join(",")]);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    let nearest = 0;
    let best = Number.POSITIVE_INFINITY;
    for (let i = 0; i < layout.offsets.length; i++) {
      const d = Math.abs(x - layout.offsets[i]);
      if (d < best) {
        best = d;
        nearest = i;
      }
    }
    setActiveIndex(nearest);
  };

  return (
    <View className="w-full mt-[40px]">
      <CustomText variant="h3-small" className="px-8 my-4" shadow>
        {title}
      </CustomText>
      <FlatList
        ref={sliderRef}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ width: layout.widths[0] }}>
            <PackComponent pack={item} />
          </View>
        )}
        horizontal
        decelerationRate="fast"
        disableIntervalMomentum
        snapToOffsets={layout.offsets}
        onMomentumScrollEnd={handleMomentumEnd}
        onMomentumScrollBegin={handleMomentumEnd}
        contentContainerStyle={{
          paddingLeft: layout.padLeft,
          paddingRight: layout.padRight,
        }}
        ItemSeparatorComponent={() => <View className="w-[24px]" />}
        showsHorizontalScrollIndicator={false}
        extraData={[
          layout.padLeft,
          layout.padRight,
          ...layout.offsets,
          ...layout.widths,
        ]}
      />
      {data.length > 1 && (
        <View
          style={{
            flexDirection: "row",
            alignSelf: "center",
            marginTop: 24,
          }}
        >
          {data.map((_, i) => (
            <Dot
              key={i}
              active={i === activeIndex}
              onPress={() =>
                sliderRef.current?.scrollToOffset({
                  offset: layout.offsets[i],
                  animated: true,
                })
              }
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default PackSliderComponent;
