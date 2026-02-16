import React, { useEffect, useRef, useState } from "react";
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Animated,
} from "react-native";
import CustomText from "../common/CustomText";
import { EvilIcons } from "@expo/vector-icons";
import CustomButton from "../common/CustomButton";
import SingleProfileImagePickerComponent from "./SingleProfileImagePickerComponent";
import { useHeroesStore } from "../../store/useHeroesStore";

type Props = {
  setImagePickerVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function ProfileImagePickerComponent({
  setImagePickerVisible,
}: Props) {
  const heroes = useHeroesStore((s) => s.heroes);
  const backdrop = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(0)).current;
  const [sheetH, setSheetH] = useState(0);

  const open = () => {
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const close = (after?: () => void) => {
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setImagePickerVisible(false);
      after?.();
    });
  };

  useEffect(() => {
    if (sheetH > 0) open();
  }, [sheetH]);

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetH || 300, 0],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.3)",
        opacity: backdrop,
      }}
    >
      <Animated.View
        onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}
        style={{
          transform: [{ translateY }],
        }}
        className="absolute bottom-0 left-0 right-0 bg-black rounded-t-3xl pb-8"
      >
        <TouchableOpacity
          className="absolute top-4 right-4 z-10"
          onPress={() => close()}
        >
          <EvilIcons name="close" size={32} color="white" />
        </TouchableOpacity>

        <CustomText variant="h3-headline" className="text-center my-8">
          Pick your profile image
        </CustomText>

        <FlatList
          data={heroes}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            alignItems: "center",
          }}
          ItemSeparatorComponent={() => <View style={{ width: 24 }} />}
          renderItem={({ item }) => {
            return <SingleProfileImagePickerComponent item={item} />;
          }}
        />

        <View className="items-center mt-8 mb-4">
          <CustomButton
            title="Close"
            onPress={() => close()}
            btnSize="xs"
            buttonClassName="max-w-[50%] w-auto"
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}
