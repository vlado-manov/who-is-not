import { View, FlatList } from "react-native";
import React from "react";
import { ACHIEVEMENTS } from "../../data/achievements";
import AchievementComponent from "./AchievementComponent";

const AchievementsSliderComponent = () => {
  return (
    <View className="py-12">
      <FlatList
        data={ACHIEVEMENTS}
        horizontal
        showsHorizontalScrollIndicator={true}
        scrollIndicatorInsets={{ left: 40, right: 40 }}
        decelerationRate="fast"
        snapToAlignment="start"
        contentContainerStyle={{
          paddingHorizontal: 32,
          paddingVertical: 8,
        }}
        ItemSeparatorComponent={() => <View style={{ width: 48 }} />}
        renderItem={({ item }) => <AchievementComponent item={item} />}
        scrollEventThrottle={16}
      />
    </View>
  );
};

export default AchievementsSliderComponent;
