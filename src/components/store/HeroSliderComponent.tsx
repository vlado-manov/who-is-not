import React, { useMemo, useRef, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Dimensions,
  Animated,
} from "react-native";
import HeroComponent from "./HeroComponent";
import { ICharacter } from "../../types/character";

type Props = {
  data: ICharacter[];
  onSelect?: (c: ICharacter) => void;
  itemSize?: number;
  gap?: number;
  sidePadding?: number;
};

export default function HeroSliderComponent({
  data,
  onSelect,
  itemSize = 118,
  gap = 22,
  sidePadding = 20,
}: Props) {
  const [index, setIndex] = useState(0);

  const slotWidth = itemSize + gap;

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / slotWidth);
    setIndex(i);
  };

  return (
    <View className="w-full mt-[40px]">
      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={slotWidth}
        snapToAlignment="start"
        contentContainerStyle={{
          paddingHorizontal: sidePadding,
          paddingVertical: 8,
        }}
        ItemSeparatorComponent={() => <View style={{ width: gap }} />}
        renderItem={({ item }) => (
          <HeroComponent item={item} size={itemSize} onPress={onSelect} />
        )}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
      />
    </View>
  );
}
