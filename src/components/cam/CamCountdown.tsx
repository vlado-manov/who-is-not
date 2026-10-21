import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet } from "react-native";

import CamText from "./CamText";
import { CAM_CAPTION_BG } from "../../screens/Cam/cam.constants";

type Props = {
  /** Shown one after another, e.g. ["3", "2", "1", "NOW"]. */
  steps: string[];
  stepMs: number;
  /** How long the last step stays before `onDone`. */
  holdMs?: number;
  /** `boxed` draws the black caption box for use over the live camera. */
  boxed?: boolean;
  onDone: () => void;
};

/** Silent countdown — Cam Mode plays no count sound. */
export default function CamCountdown({
  steps,
  stepMs,
  holdMs = 0,
  boxed = false,
  onDone,
}: Props) {
  const [index, setIndex] = useState(0);
  const pop = useRef(new Animated.Value(1)).current;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const lastIndex = steps.length - 1;

  useEffect(() => {
    pop.setValue(1.6);
    const anim = Animated.spring(pop, {
      toValue: 1,
      speed: 20,
      bounciness: 10,
      useNativeDriver: true,
    });
    anim.start();

    const isLast = index >= lastIndex;
    const timer = setTimeout(
      () => (isLast ? onDoneRef.current() : setIndex(index + 1)),
      isLast ? holdMs : stepMs,
    );
    return () => {
      clearTimeout(timer);
      anim.stop();
    };
  }, [index, lastIndex, stepMs, holdMs, pop]);

  return (
    <Animated.View
      style={[boxed && styles.box, { transform: [{ scale: pop }] }]}
    >
      <CamText
        variant="digit"
        center
        shadow={!boxed}
        style={boxed && styles.boxedText}
      >
        {steps[index]}
      </CamText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: "center",
    backgroundColor: CAM_CAPTION_BG,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 2,
  },
  boxedText: {
    fontSize: 46,
    lineHeight: 56,
  },
});
