import React, { useEffect, useRef } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CamIconButton from "./CamIconButton";
import CamText from "./CamText";
import { CAM_UI } from "../../screens/Cam/cam.constants";

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: React.ReactNode;
  /**
   * Picture standing on top of the sheet, sliding up with it. The sheet is
   * drawn over its lower edge (use a negative bottom margin on the picture).
   */
  topArt?: React.ReactNode;
  /** Panel colour, for a sheet that should stand out from the dark default. */
  backgroundColor?: string;
  /** Also blurs what is behind the sheet, not only dims it. */
  blurBackdrop?: boolean;
};

const SLIDE_FROM = 400;
const BACKDROP_BLUR = 24;

/**
 * TikTok-style bottom sheet: dimmed backdrop, dark panel with rounded top
 * corners, a grab handle, a centred title and a close button.
 */
export default function CamSheet({
  visible,
  onClose,
  title,
  closeLabel,
  children,
  topArt,
  backgroundColor,
  blurBackdrop = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(SLIDE_FROM)).current;

  useEffect(() => {
    if (!visible) {
      slide.setValue(SLIDE_FROM);
      return;
    }
    const anim = Animated.timing(slide, {
      toValue: 0,
      duration: 240,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [visible, slide]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {blurBackdrop ? (
        <BlurView
          intensity={BACKDROP_BLUR}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <Pressable style={styles.backdrop} onPress={onClose} />
      {/* Keeps the sheet above the keyboard when it has a text field. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        pointerEvents="box-none"
        style={styles.anchor}
      >
        <Animated.View
          pointerEvents="box-none"
          style={{ transform: [{ translateY: slide }] }}
        >
          {topArt ? (
            <View pointerEvents="none" style={styles.topArt}>
              {topArt}
            </View>
          ) : null}
          <View
            style={[
              styles.sheet,
              { paddingBottom: insets.bottom + 16 },
              backgroundColor ? { backgroundColor } : null,
            ]}
          >
            <View style={styles.handle} />
            <View style={styles.header}>
              <CamText variant="body" center style={styles.title}>
                {title}
              </CamText>
              <View style={styles.close}>
                <CamIconButton
                  icon="close"
                  size={30}
                  accessibilityLabel={closeLabel}
                  onPress={onClose}
                />
              </View>
            </View>
            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: CAM_UI.backdrop,
  },
  anchor: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: CAM_UI.sheet,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  topArt: {
    alignItems: "center",
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: CAM_UI.secondaryBorder,
  },
  header: {
    justifyContent: "center",
    minHeight: 32,
  },
  title: {
    paddingHorizontal: 40,
  },
  close: {
    position: "absolute",
    right: 0,
  },
});
