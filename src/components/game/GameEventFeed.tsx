import React, { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { type FeedEvent } from "../../hooks/useGameEventFeed";

type Props = {
  events: FeedEvent[];
  bottomOffset?: number;
};

export default function GameEventFeed({ events, bottomOffset = 0 }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (events.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [events.length]);

  if (events.length === 0) return null;

  return (
    <View
      style={[styles.wrap, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        pointerEvents="auto"
      >
        {events.map((e) => (
          <Text key={e.id} style={styles.line}>
            {e.text}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    maxHeight: "30%",
    paddingHorizontal: 20,
    zIndex: 200,
    elevation: 200,
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  line: {
    color: "rgba(255, 255, 255, 0.82)",
    fontSize: 13,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
});
