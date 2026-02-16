import React from "react";
import { View, Animated } from "react-native";
import CustomText from "../../components/common/CustomText";

type Props = {
  visible: boolean;
  text: string;
  opacity: Animated.Value;
  translateY: Animated.Value;
  scale: Animated.Value;
  styles: any;
};

export function QuoteBubble({
  visible,
  text,
  opacity,
  translateY,
  scale,
  styles,
}: Props) {
  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.quoteOverlay,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <View style={[styles.quoteBubble, styles.quoteBubbleShadow]}>
        <CustomText
          variant="quote"
          className="text-center"
          textColor="text-customBlack-500"
        >
          {text}
        </CustomText>

        <View style={styles.quoteBubbleTailWrap}>
          <View style={styles.quoteBubbleTail} />
        </View>
      </View>
    </Animated.View>
  );
}
