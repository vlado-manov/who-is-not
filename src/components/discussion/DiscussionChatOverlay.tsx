import React, { useEffect, useRef, useState } from "react";
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

import CustomText from "../common/CustomText";
import CustomInput from "../common/CustomInput";
import CustomButton from "../common/CustomButton";
import { useTranslation } from "react-i18next";
import { backgrounds } from "../../../assets/backgrounds";

const { height: SCREEN_H } = Dimensions.get("window");
const PANEL_MAX_H = Math.min(520, Math.round(SCREEN_H * 0.62));

export type DiscussionChatLine = {
  id: string;
  playerId: string;
  name: string;
  text: string;
  ts: number;
  mine: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  messages: DiscussionChatLine[];
  onSend: (text: string) => void;
};

export default function DiscussionChatOverlay({
  visible,
  onClose,
  messages,
  onSend,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const open = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!visible) return;
    open.setValue(0);
    Animated.spring(open, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 68,
    }).start();
  }, [visible, open]);

  useEffect(() => {
    if (!visible || messages.length === 0) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [messages.length, visible]);

  const close = () => {
    Animated.timing(open, {
      toValue: 0,
      duration: 240,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text.slice(0, 500));
    setDraft("");
  };

  if (!visible) return null;

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
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
            <View style={styles.panel}>
              <View style={styles.handle} />

              <View style={styles.header}>
                <View style={styles.headerIconWrap}>
                  <Ionicons name="chatbubbles" size={22} color="#592410" />
                </View>
                <CustomText
                  variant="h5"
                  textColor="#592410"
                  className="flex-1 text-center"
                >
                  {t("discussion_chat_title")}
                </CustomText>
                <Pressable
                  onPress={close}
                  hitSlop={12}
                  style={styles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel={t("discussion_chat_close")}
                >
                  <Ionicons name="close" size={26} color="#762a05" />
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
                    textColor="rgba(89,36,16,0.65)"
                    className="text-center px-2"
                  >
                    {t("discussion_chat_empty")}
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
                        ]}
                      >
                        {!m.mine && (
                          <CustomText
                            variant="p-xsmall"
                            textColor="rgba(89,36,16,0.75)"
                            className="mb-1"
                          >
                            {m.name}
                          </CustomText>
                        )}
                        <CustomText
                          variant="p-small"
                          textColor="#2a1810"
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
                  placeholder={t("discussion_chat_placeholder")}
                  placeholderTextColor="rgba(89,36,16,0.4)"
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
  );
}

const styles = StyleSheet.create({
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
    maxHeight: PANEL_MAX_H + 80,
  },
  panel: {
    marginHorizontal: 12,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(255,247,236,0.98)",
    borderWidth: 1,
    borderColor: "rgba(251,192,32,0.65)",
    shadowColor: "#592410",
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
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    maxHeight: PANEL_MAX_H - 200,
    minHeight: 120,
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
