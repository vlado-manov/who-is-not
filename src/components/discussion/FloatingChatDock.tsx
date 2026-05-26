import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import CustomText from "../common/CustomText";
import CustomInput from "../common/CustomInput";
import CustomButton from "../common/CustomButton";
import { backgrounds } from "../../../assets/backgrounds";

const { height: SCREEN_H } = Dimensions.get("window");
const PANEL_MAX_H = Math.min(860, Math.round(SCREEN_H * 0.92));

export type ChatLine = {
  id: string;
  playerId: string;
  name: string;
  text: string;
  ts: number;
  mine: boolean;
};

type Props = {
  messages: ChatLine[];
  onSend: (text: string) => void;
  translationKeyTitle: string;
  translationKeyPlaceholder: string;
  translationKeyEmpty: string;
  /** Darker theme (dead chat). */
  dark?: boolean;
};

/**
 * Minimizable bottom-right chat: FAB when collapsed, full panel when open.
 */
export default function FloatingChatDock({
  messages,
  onSend,
  translationKeyTitle,
  translationKeyPlaceholder,
  translationKeyEmpty,
  dark = false,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const open = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView | null>(null);
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const fabPulse = useRef(new Animated.Value(0)).current;
  const fabFloat = useRef(new Animated.Value(0)).current;
  const prevLenRef = useRef(messages.length);

  useEffect(() => {
    if (!expanded) return;
    open.setValue(0);
    Animated.spring(open, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 68,
    }).start();
  }, [expanded, open]);

  useEffect(() => {
    if (!expanded || messages.length === 0) return;
    const id = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(id);
  }, [messages.length, expanded]);

  useEffect(() => {
    const prev = prevLenRef.current;
    if (messages.length > prev) {
      const incoming = messages.slice(prev).filter((m) => !m.mine).length;
      if (!expanded && incoming > 0) {
        setUnreadCount((c) => c + incoming);
      }
    }
    prevLenRef.current = messages.length;
  }, [messages, expanded]);

  useEffect(() => {
    if (expanded) setUnreadCount(0);
  }, [expanded]);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(fabPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fabPulse, {
          toValue: 0,
          duration: 820,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(fabFloat, {
          toValue: 1,
          duration: 1050,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(fabFloat, {
          toValue: 0,
          duration: 1050,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    floatLoop.start();
    return () => {
      pulseLoop.stop();
      floatLoop.stop();
    };
  }, [fabFloat, fabPulse]);

  const close = () => {
    Animated.timing(open, {
      toValue: 0,
      duration: 240,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setExpanded(false);
    });
  };

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text.slice(0, 500));
    setDraft("");
  };

  const backdropOpacity = open.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const panelY = open.interpolate({
    inputRange: [0, 1],
    outputRange: [PANEL_MAX_H + 48, 0],
  });

  const panelScale = open.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });

  const panelOpacity = open.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0.85, 1],
  });

  const panelBg = dark ? "rgba(22,14,28,0.97)" : "rgba(255,247,236,0.98)";
  const borderC = dark ? "rgba(120,80,140,0.6)" : "rgba(251,192,32,0.65)";
  const titleC = dark ? "#e8d4f0" : "#592410";
  const fabBob = fabFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });
  const fabScale = fabPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const badgeText = useMemo(
    () => (unreadCount > 99 ? "99+" : String(unreadCount)),
    [unreadCount]
  );

  return (
    <>
      <Animated.View
        style={[
          styles.fabWrap,
          {
            bottom: Math.max(insets.bottom, 12) + 8,
            right: 16,
            transform: [{ translateY: fabBob }, { scale: fabScale }],
          },
        ]}
      >
        <Pressable
          onPress={() => setExpanded(true)}
          style={[styles.fab, unreadCount > 0 && styles.fabUnread]}
          accessibilityRole="button"
          accessibilityLabel={t(translationKeyTitle)}
        >
          <Ionicons name="chatbubbles" size={27} color="#fff7ec" />
          <Ionicons
            name="sparkles"
            size={14}
            color="#fff0b3"
            style={styles.fabSpark}
          />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <CustomText
                variant="p-xsmall"
                textColor="#fff"
                className="text-center"
              >
                {badgeText}
              </CustomText>
            </View>
          )}
        </Pressable>
      </Animated.View>

      {expanded && (
        <Modal
          visible
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={close}
        >
          <KeyboardAvoidingView
            style={styles.keyboardRoot}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.root} pointerEvents="box-none">
              <Animated.View
                style={[styles.backdrop, { opacity: backdropOpacity }]}
              >
                <Pressable style={StyleSheet.absoluteFill} onPress={close} />
              </Animated.View>

              <Animated.View
                style={[
                  styles.panelWrap,
                  {
                    paddingBottom: Math.max(insets.bottom, 12),
                    opacity: panelOpacity,
                    transform: [{ translateY: panelY }, { scale: panelScale }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.panel,
                    { backgroundColor: panelBg, borderColor: borderC },
                  ]}
                >
                  <View style={styles.handle} />

                  <View style={styles.header}>
                    <View style={styles.headerIconWrap}>
                      <Ionicons name="chatbubbles" size={22} color={titleC} />
                    </View>
                    <CustomText
                      variant="h5"
                      textColor={titleC}
                      className="flex-1 text-center"
                    >
                      {t(translationKeyTitle)}
                    </CustomText>
                    <Pressable
                      onPress={close}
                      hitSlop={12}
                      style={styles.minBtn}
                      accessibilityRole="button"
                    >
                      <Ionicons name="remove-circle" size={26} color={titleC} />
                    </Pressable>
                  </View>

                  <ScrollView
                    ref={scrollRef}
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {messages.length === 0 ? (
                      <CustomText
                        variant="p-small"
                        textColor={dark ? "rgba(255,220,255,0.55)" : "rgba(89,36,16,0.65)"}
                        className="text-center px-2"
                      >
                        {t(translationKeyEmpty)}
                      </CustomText>
                    ) : (
                      messages.map((m) => (
                        <View
                          key={m.id}
                          style={[
                            styles.msgRow,
                            m.mine ? styles.msgRowMine : styles.msgRowTheirs,
                          ]}
                        >
                          <View
                            style={[
                              styles.bubble,
                              m.mine ? styles.bubbleMine : styles.bubbleTheirs,
                              dark && styles.bubbleDarkTheirs,
                            ]}
                          >
                            {!m.mine && (
                              <CustomText
                                variant="p-xsmall"
                                textColor={dark ? "rgba(255,220,255,0.55)" : "rgba(89,36,16,0.75)"}
                                className="mb-1"
                              >
                                {m.name}
                              </CustomText>
                            )}
                            <CustomText
                              variant="p-small"
                              textColor={dark ? "#f5e8ff" : "#2a1810"}
                              style={{ lineHeight: 20 }}
                            >
                              {m.text}
                            </CustomText>
                          </View>
                        </View>
                      ))
                    )}
                  </ScrollView>

                  <View style={styles.composer}>
                    <CustomInput
                      value={draft}
                      onChangeText={setDraft}
                      placeholder={t(translationKeyPlaceholder)}
                      placeholderTextColor={
                        dark ? "rgba(255,220,255,0.35)" : "rgba(89,36,16,0.4)"
                      }
                      multiline
                      maxLength={500}
                      inputStyle={styles.composerInput}
                      containerStyle={styles.composerField}
                    />
                    <CustomButton
                      title={t("discussion_chat_send")}
                      onPress={submit}
                      btnSize="sm"
                      backgroundImage={backgrounds.bg026}
                      glow
                      glowColor="rgba(41,255,25,0.8)"
                      shadowColor="#005f07"
                      horizontalPadding={20}
                      disabled={!draft.trim()}
                    />
                  </View>
                </View>
              </Animated.View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: "absolute",
    zIndex: 2000,
  },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(119, 52, 24, 0.95)",
    borderWidth: 2.5,
    borderColor: "rgba(251, 192, 32, 0.85)",
    elevation: 14,
  },
  fabUnread: {
    shadowColor: "#ffcb4a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
  },
  fabSpark: {
    position: "absolute",
    top: 10,
    right: 9,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ff3b30",
    borderWidth: 1.5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  keyboardRoot: {
    flex: 1,
  },
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.52)",
  },
  panelWrap: {
    height: PANEL_MAX_H + 24,
    justifyContent: "flex-end",
  },
  panel: {
    marginHorizontal: 12,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(89,36,16,0.22)",
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(89,36,16,0.12)",
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(251,192,32,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  minBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
    minHeight: 180,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
  },
  msgRow: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  msgRowMine: {
    alignItems: "flex-end",
  },
  msgRowTheirs: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "88%",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bubbleMine: {
    backgroundColor: "rgba(251,192,32,0.55)",
    borderWidth: 1,
    borderColor: "rgba(89,36,16,0.12)",
  },
  bubbleTheirs: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(89,36,16,0.1)",
  },
  bubbleDarkTheirs: {
    backgroundColor: "rgba(40,28,52,0.95)",
    borderColor: "rgba(160,120,180,0.35)",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(89,36,16,0.1)",
  },
  composerField: {
    flex: 1,
    marginTop: 0,
    marginBottom: 0,
    paddingVertical: 0,
    minHeight: 44,
    maxHeight: 100,
  },
  composerInput: {
    fontSize: 15,
    minHeight: 40,
    maxHeight: 88,
    textAlignVertical: "top",
    paddingVertical: 8,
    color: "#2a1810",
  },
});
