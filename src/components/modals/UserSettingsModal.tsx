import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
  Animated,
  Modal,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import CustomText from "../common/CustomText";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/useUserStore";
import AudioManager from "../../utils/audioManager";
import PurpleConfirmModal from "../common/PurpleConfirmModal";

export type Props = {
  visible: boolean;
  onClose: () => void;
  fromHeroPicker?: boolean;
  onHeroSetupExit?: () => void;
};

type SwitchVariant = "notifications" | "music" | "sfx";

const SWITCH_CONFIG: Record<
  SwitchVariant,
  {
    trackOn: readonly [string, string];
    trackOff: readonly [string, string];
    glow: string;
    accentOn: string;
    thumbOn: string;
    thumbOff: string;
    rowBgOn: string;
    rowBorder: string;
  }
> = {
  notifications: {
    trackOn: ["#7c3aed", "#9333ea"],
    trackOff: ["#1e1e2e", "#27272a"],
    glow: "#9333ea",
    accentOn: "rgba(147,51,234,0.18)",
    thumbOn: "🔔",
    thumbOff: "🔕",
    rowBgOn: "rgba(147,51,234,0.14)",
    rowBorder: "rgba(147,51,234,0.45)",
  },
  music: {
    trackOn: ["#ec4899", "#f97316"],
    trackOff: ["#1e1e2e", "#27272a"],
    glow: "#ec4899",
    accentOn: "rgba(236,72,153,0.14)",
    thumbOn: "🎵",
    thumbOff: "🎵",
    rowBgOn: "rgba(236,72,153,0.1)",
    rowBorder: "rgba(236,72,153,0.4)",
  },
  sfx: {
    trackOn: ["#0891b2", "#06b6d4"],
    trackOff: ["#1e1e2e", "#27272a"],
    glow: "#06b6d4",
    accentOn: "rgba(6,182,212,0.14)",
    thumbOn: "🔊",
    thumbOff: "🔇",
    rowBgOn: "rgba(6,182,212,0.1)",
    rowBorder: "rgba(6,182,212,0.4)",
  },
};

const TRACK_W = 72;
const THUMB_SIZE = 34;
const THUMB_TRAVEL = TRACK_W - THUMB_SIZE - 4;

function SlideSwitch({
  active,
  variant,
}: {
  active: boolean;
  variant: SwitchVariant;
}) {
  const cfg = SWITCH_CONFIG[variant];
  const pos = useRef(new Animated.Value(active ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(pos, {
        toValue: active ? 1 : 0,
        speed: 22,
        bounciness: 14,
        useNativeDriver: true,
      } as Animated.SpringAnimationConfig),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.82,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          speed: 18,
          bounciness: 10,
          useNativeDriver: true,
        } as Animated.SpringAnimationConfig),
      ]),
    ]).start();
  }, [active, pos, scaleAnim]);

  const thumbX = pos.interpolate({
    inputRange: [0, 1],
    outputRange: [2, THUMB_TRAVEL],
  });
  const trackOpacity = pos.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const glowOpacity = pos.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.7],
  });

  return (
    <View style={[switchStyles.track, { shadowColor: cfg.glow }]}>
      <LinearGradient
        colors={cfg.trackOff as [string, string]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: trackOpacity }]}
      >
        <LinearGradient
          colors={cfg.trackOn as [string, string]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>
      <Animated.View
        style={[
          switchStyles.glow,
          { backgroundColor: cfg.glow, opacity: glowOpacity },
        ]}
      />
      <Animated.View
        style={[
          switchStyles.thumb,
          { transform: [{ translateX: thumbX }, { scale: scaleAnim }] },
        ]}
      >
        <CustomText style={switchStyles.thumbEmoji}>
          {active ? cfg.thumbOn : cfg.thumbOff}
        </CustomText>
      </Animated.View>
    </View>
  );
}

const switchStyles = StyleSheet.create({
  track: {
    width: TRACK_W,
    height: THUMB_SIZE + 4,
    borderRadius: (THUMB_SIZE + 4) / 2,
    overflow: "hidden",
    justifyContent: "center",
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    opacity: 0,
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  thumbEmoji: { fontSize: 18, lineHeight: 22 },
});

function SettingRow({
  label,
  sublabel,
  active,
  onToggle,
  variant,
  delay,
  animKey,
}: {
  label: string;
  sublabel?: string;
  active: boolean;
  onToggle: () => void;
  variant: SwitchVariant;
  delay?: number;
  animKey: number;
}) {
  const cfg = SWITCH_CONFIG[variant];
  const slideAnim = useRef(new Animated.Value(24)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    slideAnim.setValue(24);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 360,
        delay: delay ?? 0,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        speed: 16,
        bounciness: 7,
        delay: delay ?? 0,
        useNativeDriver: true,
      } as Animated.SpringAnimationConfig),
    ]).start();
  }, [fadeAnim, slideAnim, delay, animKey]);

  const handlePressIn = () =>
    Animated.spring(pressScale, {
      toValue: 0.97,
      speed: 30,
      bounciness: 0,
      useNativeDriver: true,
    } as Animated.SpringAnimationConfig).start();
  const handlePressOut = () =>
    Animated.spring(pressScale, {
      toValue: 1,
      speed: 20,
      bounciness: 8,
      useNativeDriver: true,
    } as Animated.SpringAnimationConfig).start();

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: pressScale }],
      }}
    >
      <Pressable
        onPress={onToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          rowStyles.card,
          active
            ? { backgroundColor: cfg.rowBgOn, borderColor: cfg.rowBorder }
            : {
                backgroundColor: "rgba(255,255,255,0.05)",
                borderColor: "rgba(255,255,255,0.08)",
              },
        ]}
      >
        <View style={rowStyles.textWrap}>
          <CustomText style={[rowStyles.label, !active && rowStyles.labelOff]}>
            {label}
          </CustomText>
          {sublabel && (
            <CustomText style={rowStyles.sublabel}>{sublabel}</CustomText>
          )}
        </View>
        <SlideSwitch active={active} variant={variant} />
      </Pressable>
    </Animated.View>
  );
}

const rowStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 10,
  },
  textWrap: { flex: 1 },
  label: { color: "#fff", fontSize: 16, fontWeight: "700" },
  labelOff: { color: "rgba(255,255,255,0.38)" },
  sublabel: { color: "rgba(255,255,255,0.38)", fontSize: 12, marginTop: 2 },
});

export default function UserSettingsModal({
  visible,
  onClose,
  fromHeroPicker = false,
  onHeroSetupExit,
}: Props) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const cardMaxHeight = Math.min(height * 0.82, 560);

  const { settings, updateSettings } = useAuthStore();

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [animNonce, setAnimNonce] = useState(0);

  useEffect(() => {
    if (visible) {
      setShowExitConfirm(false);
      setAnimNonce((n) => n + 1);
    } else {
      setShowExitConfirm(false);
    }
  }, [visible]);

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          speed: 18,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    scaleAnim.setValue(0.85);
    opacityAnim.setValue(0);
  }, [visible, scaleAnim, opacityAnim]);

  const toggleNotifications = () =>
    updateSettings({ notificationsEnabled: !settings.notificationsEnabled });

  const musicOn = settings.musicLevel > 0;
  const sfxOn = settings.sfxLevel > 0;

  const applyAudio = (nextMusic: boolean, nextSfx: boolean) => {
    const lvlM = nextMusic ? 0.7 : 0;
    const lvlS = nextSfx ? 0.8 : 0;
    updateSettings({
      soundEnabled: nextMusic || nextSfx,
      musicLevel: lvlM,
      sfxLevel: lvlS,
    });
    AudioManager.setSoundEnabled(nextMusic || nextSfx);
    AudioManager.setMusicEnabled(nextMusic, lvlM);
    AudioManager.setSfxEnabled(nextSfx, lvlS);
  };

  const handleExitConfirm = () => {
    const exitSetup = onHeroSetupExit;
    AudioManager.playButtonClick();
    setShowExitConfirm(false);
    onClose();
    setTimeout(() => {
      exitSetup?.();
    }, 50);
  };

  const handleBackdropClose = () => {
    AudioManager.playButtonClick();
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible && !showExitConfirm}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleBackdropClose}
      >
        <Pressable style={sheetStyles.overlay} onPress={handleBackdropClose}>
          <Animated.View
            style={[
              sheetStyles.cardWrap,
              {
                maxHeight: cardMaxHeight,
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Pressable onPress={() => {}} style={sheetStyles.cardPressable}>
              <LinearGradient
                colors={["#1a0533", "#2d0b5a", "#1a1a2e"]}
                style={sheetStyles.gradient}
              >
                <CustomText style={sheetStyles.emoji}>⚙️</CustomText>
                <CustomText variant="h3-headline" style={sheetStyles.title}>
                  {t("settings_title_1")}
                </CustomText>
                <CustomText variant="h3" style={sheetStyles.subtitle}>
                  {t("settings_title_2")}
                </CustomText>

                <KeyboardAvoidingView
                  behavior={Platform.select({
                    ios: "padding",
                    android: undefined,
                  })}
                  style={sheetStyles.kavo}
                  keyboardVerticalOffset={0}
                >
                  <ScrollView
                    style={sheetStyles.scroll}
                    contentContainerStyle={sheetStyles.scrollInner}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                  >
                    <SettingRow
                      label={t("settings_notifications")}
                      sublabel={
                        settings.notificationsEnabled
                          ? t("settings_notifications_on_sub")
                          : t("settings_notifications_off_sub")
                      }
                      active={settings.notificationsEnabled}
                      onToggle={toggleNotifications}
                      variant="notifications"
                      delay={60}
                      animKey={animNonce}
                    />
                    <SettingRow
                      label={t("settings_music")}
                      sublabel={
                        musicOn
                          ? t("settings_music_on_sub")
                          : t("settings_music_off_sub")
                      }
                      active={musicOn}
                      onToggle={() => applyAudio(!musicOn, sfxOn)}
                      variant="music"
                      delay={100}
                      animKey={animNonce}
                    />
                    <SettingRow
                      label={t("settings_sfx")}
                      sublabel={
                        sfxOn
                          ? t("settings_sfx_on_sub")
                          : t("settings_sfx_off_sub")
                      }
                      active={sfxOn}
                      onToggle={() => applyAudio(musicOn, !sfxOn)}
                      variant="sfx"
                      delay={140}
                      animKey={animNonce}
                    />

                    {fromHeroPicker && (
                      <>
                        <View style={sheetStyles.divider} />
                        <Pressable
                          onPress={() => {
                            AudioManager.playButtonClick();
                            setShowExitConfirm(true);
                          }}
                          style={({ pressed }) => [
                            sheetStyles.exitBtn,
                            pressed && sheetStyles.exitBtnPressed,
                          ]}
                        >
                          <LinearGradient
                            colors={["#ef4444", "#b91c1c"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={sheetStyles.exitBtnGrad}
                          >
                            <CustomText style={sheetStyles.exitBtnText}>
                              {t("settings_exit_setup")}
                            </CustomText>
                          </LinearGradient>
                        </Pressable>
                        <CustomText style={sheetStyles.exitHint}>
                          {t("settings_exit_hint")}
                        </CustomText>
                      </>
                    )}
                  </ScrollView>
                </KeyboardAvoidingView>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      <PurpleConfirmModal
        visible={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        emoji="🚪"
        title={t("settings_exit_title")}
        body={t("settings_exit_body")}
        cancelLabel={t("settings_cancel")}
        confirmLabel={t("settings_exit_confirm")}
        confirmColors={["#e03030", "#b01010"]}
        onConfirm={handleExitConfirm}
      />
    </>
  );
}

const sheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  cardWrap: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(180,120,255,0.3)",
    shadowColor: "#9333ea",
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  cardPressable: { maxHeight: "100%" },
  gradient: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: "center",
  },
  emoji: { fontSize: 44, marginBottom: 4 },
  title: {
    color: "#fff",
    textAlign: "center",
    fontSize: 32,
    lineHeight: 32,
    paddingHorizontal: 8,
    marginVertical: 8
  },
  subtitle: {
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 48,
    transform: [{ rotate: "-3deg" }],
    fontSize: 32,
    lineHeight: 32,
  },
  kavo: { width: "100%", maxHeight: 360, flexShrink: 1 },
  scroll: { width: "100%" },
  scrollInner: { gap: 10, paddingBottom: 16 },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 8,
    alignSelf: "stretch",
  },
  exitBtn: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(254,202,202,0.72)",
    alignSelf: "stretch",
    shadowColor: "#ef4444",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  exitBtnPressed: { transform: [{ scale: 0.98 }] },
  exitBtnGrad: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 14,
  },
  exitBtnText: { color: "#ffffff", fontSize: 17, fontWeight: "900" },
  exitHint: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 4,
  },
});
