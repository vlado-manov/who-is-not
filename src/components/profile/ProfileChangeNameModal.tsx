import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";

import CustomText from "../common/CustomText";
import CustomInput from "../common/CustomInput";
import AudioManager from "../../utils/audioManager";
import { useAuthStore } from "../../store/useUserStore";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ProfileChangeNameModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const name = useAuthStore((s) => s.user.name);
  const updateName = useAuthStore((s) => s.updateName);
  const [draft, setDraft] = useState(name ?? "");

  useEffect(() => {
    if (visible) {
      setDraft(name ?? "");
    }
  }, [visible, name]);

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

  const canSave = useMemo(() => {
    const trimmed = draft.trim();
    return trimmed.length > 0 && trimmed !== (name ?? "");
  }, [draft, name]);

  const close = () => {
    AudioManager.playButtonClick();
    onClose();
  };

  const onSave = () => {
    if (!canSave) return;
    AudioManager.playButtonClick();
    updateName(draft.trim());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      <Pressable style={styles.overlay} onPress={close}>
        <Animated.View
          style={[
            styles.cardWrap,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Pressable onPress={() => {}} style={styles.innerPress}>
            <LinearGradient
              colors={["#1a0533", "#2d0b5a", "#1a1a2e"]}
              style={styles.card}
            >
              <CustomText style={styles.emoji}>✏️</CustomText>
              <CustomText variant="h3-headline" style={styles.title}>
                {t("profile_change_name_title")}
              </CustomText>
              <CustomText style={styles.body}>
                {t("profile_change_name_body")}
              </CustomText>

              <KeyboardAvoidingView
                behavior={Platform.select({
                  ios: "padding",
                  android: undefined,
                })}
                style={styles.fields}
              >
                <CustomInput
                  value={draft}
                  onChangeText={setDraft}
                  returnKeyType="done"
                  maxLength={12}
                />
                <View style={styles.btnRow}>
                  <Pressable style={styles.cancelBtn} onPress={close}>
                    <CustomText style={styles.cancelText}>
                      {t("settings_cancel")}
                    </CustomText>
                  </Pressable>
                  <Pressable
                    style={styles.saveBtnWrap}
                    onPress={onSave}
                    disabled={!canSave}
                  >
                    <LinearGradient
                      colors={["#9333ea", "#6d28d9"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.saveGrad, !canSave && styles.saveGradDisabled]}
                    >
                      <CustomText style={styles.saveText}>{t("change_name")}</CustomText>
                    </LinearGradient>
                  </Pressable>
                </View>
              </KeyboardAvoidingView>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  innerPress: { alignSelf: "stretch" },
  card: {
    padding: 28,
    alignItems: "stretch",
    gap: 14,
  },
  emoji: { fontSize: 52, textAlign: "center" },
  title: {
    color: "#fff",
    textAlign: "center",
    fontSize: 22,
    lineHeight: 28,
    paddingHorizontal: 4,
  },
  body: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  fields: { width: "100%", gap: 14 },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 2,
    alignSelf: "stretch",
  },
  cancelBtn: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  cancelText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  saveBtnWrap: { flex: 1, borderRadius: 16, overflow: "hidden" },
  saveGrad: { paddingVertical: 16, alignItems: "center", borderRadius: 16 },
  saveGradDisabled: { opacity: 0.45 },
  saveText: { color: "#fff", fontSize: 17, fontWeight: "900" },
});
