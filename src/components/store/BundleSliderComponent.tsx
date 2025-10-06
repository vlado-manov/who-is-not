import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
} from "react-native";
import { IBundle } from "../../types/bundle";
import CustomText from "../common/CustomText";
import BundleComponent from "./BundleComponent";
import {
  CarouselLayout,
  computeBundleWidths,
  computeCarouselFromWidths,
} from "../../utils/computeCarousel";

type Props = {
  title: string;
  data: IBundle[];
  onSelect?: (bundle: IBundle) => void;
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

const BundleSliderComponent = ({ title, data, onSelect }: Props) => {
  const { width: screenWidth } = useWindowDimensions();
  const listRef = useRef<FlatList<IBundle>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const layout: CarouselLayout = useMemo(() => {
    const widths = computeBundleWidths(screenWidth, data, 0.8);
    return computeCarouselFromWidths(screenWidth, widths, 24);
  }, [screenWidth, data]);

  useEffect(() => {
    if (!layout.offsets.length) return;
    const target =
      layout.offsets[Math.min(activeIndex, layout.offsets.length - 1)];
    listRef.current?.scrollToOffset({ offset: target, animated: false });
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
    <View className="w-full my-4">
      <CustomText variant="h3-small" className="px-8 my-4">
        {title}
      </CustomText>

      <FlatList<IBundle>
        ref={listRef}
        data={data}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
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
        renderItem={({ item, index }) => (
          <View style={{ width: layout.widths[index] }}>
            <BundleComponent item={item} />
          </View>
        )}
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
                listRef.current?.scrollToOffset({
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

export default BundleSliderComponent;
