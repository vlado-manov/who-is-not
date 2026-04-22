import React from "react";
import { View, Animated, ScrollView, useWindowDimensions } from "react-native";
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
  const { height: windowHeight } = useWindowDimensions();
  const quoteMaxHeight = Math.min(Math.round(windowHeight * 0.28), 260);

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
        <ScrollView
          style={{ maxHeight: quoteMaxHeight }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          <CustomText
            variant="quote"
            className="text-center"
            textColor="text-customBlack-500"
          >
            {text}
          </CustomText>
        </ScrollView>

        <View style={styles.quoteBubbleTailWrap}>
          <View style={styles.quoteBubbleTail} />
        </View>
      </View>
    </Animated.View>
  );
}
