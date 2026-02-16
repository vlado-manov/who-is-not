import React from "react";
import { View } from "react-native";
import CustomText from "../../components/common/CustomText";

export function HeroPickerHeader() {
  return (
    <View
      className="mt-[80px] justify-center items-center max-w-[86%] w-full"
      style={{ marginBottom: 40 }}
    >
      <CustomText variant="h3-headline" className="text-center">
        <CustomText variant="h5" shadow>
          Pick
        </CustomText>{" "}
        Your{" "}
        <CustomText variant="h5" shadow>
          Hero
        </CustomText>
      </CustomText>
    </View>
  );
}
