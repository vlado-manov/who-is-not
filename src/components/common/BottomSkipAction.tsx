import React from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CustomText from "./CustomText";

type Props = {
  label: string;
  onPress: () => void;
  bottomOffset?: number;
  containerStyle?: ViewStyle;
};

export default function BottomSkipAction({
  label,
  onPress,
  bottomOffset = 40,
  containerStyle,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { bottom: insets.bottom + bottomOffset },
        containerStyle,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        hitSlop={{ top: 18, right: 28, bottom: 18, left: 28 }}
        style={({ pressed }) => [
          styles.button,
          pressed ? styles.buttonPressed : null,
        ]}
      >
        <CustomText variant="p" className="text-center font-semibold">
          {label}
        </CustomText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: "center",
  },
  button: {
    minWidth: 116,
    minHeight: 44,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.36)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  buttonPressed: {
    opacity: 0.74,
    transform: [{ scale: 0.98 }],
  },
});
