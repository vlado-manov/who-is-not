import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { View, Animated, ScrollView, useWindowDimensions } from "react-native";
import CustomText from "../../components/common/CustomText";
import { TYPE_INTERVAL_MS } from "./constants/heroPicker.constants";

export type QuoteBubbleHandle = {
  typeText: (text: string, onDone?: () => void) => void;
  stopTyping: () => void;
};

type Props = {
  visible: boolean;
  opacity: Animated.Value;
  translateY: Animated.Value;
  scale: Animated.Value;
  styles: any;
};

export const QuoteBubble = forwardRef<QuoteBubbleHandle, Props>(
  function QuoteBubble({ visible, opacity, translateY, scale, styles }, ref) {
    const { height: windowHeight } = useWindowDimensions();
    const quoteMaxHeight = Math.min(Math.round(windowHeight * 0.28), 260);
    const [text, setText] = useState("");
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useImperativeHandle(ref, () => ({
      typeText(newText: string, onDone?: () => void) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        const safeText = newText.trim();
        setText("");
        let i = 0;
        intervalRef.current = setInterval(() => {
          i += 1;
          setText(safeText.slice(0, i));
          if (i >= safeText.length) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            onDone?.();
          }
        }, TYPE_INTERVAL_MS);
      },
      stopTyping() {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setText("");
      },
    }));

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
  },
);
