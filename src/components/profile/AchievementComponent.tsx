import { View, Text } from "react-native";
import AppImage from "../AppImage";
import React from "react";
import { IAchievement } from "../../types/achievement";

type Props = {
  item: IAchievement;
};

const AchievementComponent = ({ item }: Props) => {
  const progressText = `${item.count}/${item.target}`;

  return (
    <View className="items-center mb-4">
      <View className="overflow-hidden">
        <AppImage
          source={item.image}
          contentFit="cover"
          className="w-[100px] h-[100px]"
          style={{
            width: 100,
            height: 100,
            borderRadius: 16,
            opacity: item.isDone ? 1 : 0.6,
          }}
        />
      </View>

      <Text className="mt-2 text-sm font-bold">{progressText}</Text>
    </View>
  );
};

export default AchievementComponent;
