// src/screens/Game/DeathMatch/phases/DmHowToPlayPhase.tsx
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { backgrounds } from "../../../../../assets/backgrounds";
import AppImage from "../../../../components/AppImage";
import CustomButton from "../../../../components/common/CustomButton";
import CustomText from "../../../../components/common/CustomText";
import AudioManager from "../../../../utils/audioManager";
import { DM_HTP_RULES, DM_HTP_TITLE_URI } from "../dm.constants";

type Props = {
  onDone: () => void;
};

function startAnim(anim: Animated.CompositeAnimation): Promise<void> {
  return new Promise((resolve) => anim.start(() => resolve()));
}

/** The rules of the stopwatch duel: title slam, then the rules one by one. */
export default function DmHowToPlayPhase({ onDone }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth >= 768;
  const hPad =
    (isTablet ? Math.max(8, Math.floor((windowWidth - 560) / 2)) : 8) + 8;

  const htpTitleScale = useRef(new Animated.Value(10)).current;
  const htpTitleRotate = useRef(new Animated.Value(0)).current;
  const htpTitleOpacity = useRef(new Animated.Value(0)).current;
  const htpFlash = useRef(new Animated.Value(0)).current;
  const htpRuleAnims = useRef(
    Array.from({ length: 4 }, () => ({
      opacity: new Animated.Value(0),
      x: new Animated.Value(-50),
    })),
  ).current;
  const htpGotItOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset
    htpTitleScale.setValue(10);
    htpTitleRotate.setValue(0);
    htpTitleOpacity.setValue(0);
    htpFlash.setValue(0);
    htpGotItOpacity.setValue(0);
    htpRuleAnims.forEach((a) => {
      a.opacity.setValue(0);
      a.x.setValue(-50);
    });

    let cancelled = false;
    const run = async () => {
      // Title slams in
      await startAnim(
        Animated.parallel([
          Animated.timing(htpTitleOpacity, {
            toValue: 1,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(htpTitleScale, {
            toValue: 1,
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(htpTitleRotate, {
            toValue: 1,
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      );
      if (cancelled) return;

      // Bounce
      await startAnim(
        Animated.sequence([
          Animated.timing(htpTitleScale, {
            toValue: 1.08,
            duration: 100,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(htpTitleScale, {
            toValue: 1.0,
            duration: 120,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      );
      if (cancelled) return;

      // Flash
      Animated.sequence([
        Animated.timing(htpFlash, {
          toValue: 0.6,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.timing(htpFlash, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      // Rules slide in sequentially
      for (let i = 0; i < htpRuleAnims.length; i++) {
        if (cancelled) return;
        // Each step slides in with a swoosh.
        AudioManager.playSwoosh();
        await startAnim(
          Animated.parallel([
            Animated.timing(htpRuleAnims[i].opacity, {
              toValue: 1,
              duration: 320,
              useNativeDriver: true,
            }),
            Animated.timing(htpRuleAnims[i].x, {
              toValue: 0,
              duration: 320,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        );
        // small pause between rules
        if (i < htpRuleAnims.length - 1) {
          await new Promise<void>((res) => setTimeout(res, 80));
        }
      }
      if (cancelled) return;

      // GOT IT button
      Animated.timing(htpGotItOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    };

    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const htpTitleW = Math.min(windowWidth * 0.94, 480);
  const btnBottom = insets.bottom + 20;

  return (
    <View style={styles.fill}>
      {/* Darker background dim */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0,0,0,0.70)" },
        ]}
      />

      {/* Blur overlay */}
      <BlurView
        intensity={28}
        tint="dark"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Impact flash */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "#fff", opacity: htpFlash, zIndex: 20 },
        ]}
      />

      {/* Scrollable content — extra bottom padding so rules don't hide under the button */}
      <ScrollView
        contentContainerStyle={[
          styles.htpScroll,
          {
            paddingTop: insets.top + 24,
            paddingBottom: btnBottom + 100,
            paddingHorizontal: hPad,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated title */}
        <Animated.View
          style={[
            styles.htpTitleWrap,
            {
              opacity: htpTitleOpacity,
              transform: [
                { scale: htpTitleScale },
                {
                  rotate: htpTitleRotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["-360deg", "0deg"],
                  }),
                },
              ],
            },
          ]}
        >
          <AppImage
            source={{ uri: DM_HTP_TITLE_URI }}
            contentFit="contain"
            style={{ width: htpTitleW, height: htpTitleW * 0.42 }}
          />
        </Animated.View>

        {/* Rules */}
        <View style={styles.htpRulesList}>
          {DM_HTP_RULES.map((rule, i) => (
            <Animated.View
              key={i}
              style={[
                styles.htpRuleRow,
                {
                  opacity: htpRuleAnims[i].opacity,
                  transform: [{ translateX: htpRuleAnims[i].x }],
                },
              ]}
            >
              <View style={styles.htpIconWrap}>
                <AppImage
                  source={{ uri: rule.uri }}
                  contentFit="contain"
                  style={{ width: 96, height: 96 }}
                />
              </View>
              <CustomText
                variant="p-small"
                sizeDelta={4}
                textColor="rgba(255,255,255,0.92)"
                allowWrap
                style={{ flex: 1, lineHeight: 22 }}
              >
                {t(rule.textKey)}
              </CustomText>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* GOT IT — pinned to bottom */}
      <Animated.View
        style={[
          styles.htpBtnFixed,
          {
            bottom: btnBottom,
            paddingHorizontal: hPad,
            opacity: htpGotItOpacity,
          },
        ]}
      >
        <CustomButton
          title={t("deathmatch_htp_got_it")}
          fullWidth
          onPress={onDone}
          backgroundImage={backgrounds.bg026}
          glow
          btnSize="md"
          fontSize="md"
          glowColor="rgba(34,197,94,0.8)"
          shadowColor="#004400"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  htpScroll: {
    flexGrow: 1,
    alignItems: "center",
    gap: 28,
  },
  htpTitleWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  htpRulesList: {
    width: "100%",
    gap: 12,
  },
  htpRuleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  htpIconWrap: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  htpBtnFixed: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});
