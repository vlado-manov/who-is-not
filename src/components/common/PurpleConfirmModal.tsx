import React, { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import CustomText from "./CustomText";

type Props = {
  visible: boolean;
  onClose: () => void;
  emoji: string;
  title: string;
  body: string;
  cancelLabel?: string;
  confirmLabel: string;
  confirmColors: [string, string];
  onConfirm: () => void;
};

export default function PurpleConfirmModal({
  visible,
  onClose,
  emoji,
  title,
  body,
  cancelLabel,
  confirmLabel,
  confirmColors,
  onConfirm,
}: Props) {
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.cardWrap,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Pressable onPress={() => {}}>
            <LinearGradient
              colors={["#1a0533", "#2d0b5a", "#1a1a2e"]}
              style={styles.card}
            >
              <CustomText style={styles.icon}>{emoji}</CustomText>
              <CustomText variant="h3-headline" style={styles.title}>
                {title}
              </CustomText>
              <CustomText style={styles.body}>{body}</CustomText>
              <View style={styles.btnRow}>
                <Pressable style={styles.cancelBtn} onPress={onClose}>
                  <CustomText style={styles.cancelText}>
                    {cancelLabel ?? "Cancel"}
                  </CustomText>
                </Pressable>
                <Pressable style={styles.confirmBtnWrap} onPress={onConfirm}>
                  <LinearGradient
                    colors={confirmColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.confirmGrad}
                  >
                    <CustomText style={styles.confirmText}>
                      {confirmLabel}
                    </CustomText>
                  </LinearGradient>
                </Pressable>
              </View>
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
  card: { padding: 32, alignItems: "center", gap: 14 },
  icon: { fontSize: 52 },
  title: { color: "#fff", textAlign: "center" },
  body: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 8, alignSelf: "stretch" },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  cancelText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  confirmBtnWrap: { flex: 1, borderRadius: 16, overflow: "hidden" },
  confirmGrad: { paddingVertical: 16, alignItems: "center", borderRadius: 16 },
  confirmText: { color: "#fff", fontSize: 17, fontWeight: "900" },
});
