// src/components/menu/MenuModeReveal.tsx
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CamText from "../cam/CamText";
import AudioManager from "../../utils/audioManager";

export type MenuModeOption = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  /** The mode's colour, used for the option squares' borders. */
  accent: string;
  options: ReadonlyArray<MenuModeOption>;
  closeLabel: string;
  onClose: () => void;
};

const BLUR_INTENSITY = 22;
/** Far enough below the screen for any sheet height. */
const SHEET_SLIDE_FROM = 420;
const SHEET_HIDE_MS = 200;
const OPTION_STAGGER_MS = 110;
const OPTION_MAX = 132;
const OPTION_GAP = 18;
/** Room for a two-line name (two `body` lines). */
const OPTION_TITLE_HEIGHT = 46;
const SIDE = 24;

/**
 * The two ways to play a mode picked on the main menu. A bottom sheet slides
 * up — only as tall as its content — and the menu behind it blurs. Each option
 * is an icon in a square with its name above and a line below.
 */
export default function MenuModeReveal({
  visible,
  accent,
  options,
  closeLabel,
  onClose,
}: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sheet = useRef(new Animated.Value(0)).current;
  const closingRef = useRef(false);
  const openAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const optionAnims = useRef(
    [0, 1, 2, 3].map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    if (!visible) return;
    closingRef.current = false;
    sheet.setValue(0);
    optionAnims.forEach((a) => a.setValue(0));
    // The options start arriving while the sheet is still settling.
    const anim = Animated.parallel([
      Animated.spring(sheet, {
        toValue: 1,
        speed: 12,
        bounciness: 5,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(140),
        Animated.stagger(
          OPTION_STAGGER_MS,
          options.map((_, i) =>
            Animated.spring(optionAnims[i], {
              toValue: 1,
              speed: 12,
              bounciness: 9,
              useNativeDriver: true,
            }),
          ),
        ),
      ]),
    ]);
    openAnimRef.current = anim;
    anim.start();
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  /**
   * The sheet goes down and the blur clears first; only then does `then` run
   * (close, or the chosen option), so nothing is left open behind it.
   */
  const hideSheet = (then: () => void) => {
    if (closingRef.current) return;
    closingRef.current = true;
    openAnimRef.current?.stop();
    Animated.parallel([
      Animated.timing(sheet, {
        toValue: 0,
        duration: SHEET_HIDE_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      ...optionAnims.map((a) =>
        Animated.timing(a, {
          toValue: 0,
          duration: SHEET_HIDE_MS,
          useNativeDriver: true,
        }),
      ),
    ]).start(then);
  };

  const close = () => hideSheet(onClose);

  const optionSize = Math.min(
    OPTION_MAX,
    Math.floor((width - SIDE * 2 - OPTION_GAP) / 2),
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      {/* The menu behind blurs in with the sheet; tapping it closes. */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: sheet }]}>
        <BlurView
          intensity={BLUR_INTENSITY}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          style={[StyleSheet.absoluteFill, styles.dim]}
          onPress={close}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: insets.bottom + 20,
            transform: [
              {
                translateY: sheet.interpolate({
                  inputRange: [0, 1],
                  outputRange: [SHEET_SLIDE_FROM, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.handle} />
        <View style={styles.options}>
          {options.map((option, i) => {
            const anim = optionAnims[i];
            return (
              <Animated.View
                key={option.id}
                style={{
                  width: optionSize,
                  opacity: anim,
                  transform: [
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [24, 0],
                      }),
                    },
                    {
                      scale: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.88, 1],
                      }),
                    },
                  ],
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={option.title}
                  onPress={() => {
                    AudioManager.playButtonClick();
                    hideSheet(option.onPress);
                  }}
                  style={styles.option}
                >
                  {/* Fixed height, text at the bottom: the squares line up
                      whether a name takes one line or two. */}
                  <View style={styles.optionTitle}>
                    <CamText variant="body" center numberOfLines={2}>
                      {option.title}
                    </CamText>
                  </View>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        width: optionSize,
                        height: optionSize,
                        borderColor: accent,
                      },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={optionSize * 0.42}
                      color="#FFFFFF"
                    />
                  </View>
                  <CamText variant="subtitle" center>
                    {option.subtitle}
                  </CamText>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: {
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  // TikTok-style bottom sheet: dark panel, rounded top, grab handle.
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#121212",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 10,
    paddingHorizontal: SIDE,
    gap: 16,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  options: {
    flexDirection: "row",
    justifyContent: "center",
    // Top-aligned, so a longer description only grows downwards.
    alignItems: "flex-start",
    gap: OPTION_GAP,
  },
  option: {
    alignItems: "center",
    gap: 10,
  },
  optionTitle: {
    height: OPTION_TITLE_HEIGHT,
    justifyContent: "flex-end",
  },
  iconBox: {
    borderRadius: 28,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});
