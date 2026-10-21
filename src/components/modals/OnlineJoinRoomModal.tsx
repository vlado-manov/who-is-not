import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { useTranslation } from "react-i18next";
import CustomText from "../common/CustomText";
import LightPlate from "../cam/LightPlate";
import { UiStyleProvider } from "../../context/UiStyleContext";
import { TTL } from "../../constants/tiktokTheme";
import { backgrounds } from "../../../assets/backgrounds";
import AudioManager from "../../utils/audioManager";
import {
  joinMultiplayerRoom,
  getMultiplayerRoomMetadata,
} from "../../api/multiplayer";
import { useGameStore } from "../../store/useGameStore";
import { createOpaquePlayerId } from "../../utils/opaquePlayerId";
import { usePlateModalCardWidth } from "./usePlateModalCardWidth";

const CODE_LEN = 6;

type Props = {
  visible: boolean;
  onDismiss: () => void;
  /** Called after join succeeds and session is applied to the store. */
  onJoined: () => void;
};

export default function OnlineJoinRoomModal({
  visible,
  onDismiss,
  onJoined,
}: Props) {
  const { t } = useTranslation();
  const plateWidth = usePlateModalCardWidth();
  const applyOnlinePartySession = useGameStore(
    (s) => s.applyOnlinePartySession,
  );

  const guestPlayerId = useMemo(() => createOpaquePlayerId("guest"), []);

  const [codeInput, setCodeInput] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    setJoinError(null);
    setCodeInput("");
    scaleAnim.setValue(0.3);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacityAnim, scaleAnim]);

  const normalizedCode = codeInput
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  const handleJoin = useCallback(async () => {
    if (normalizedCode.length !== CODE_LEN) {
      setJoinError(t("online_join_code_invalid"));
      return;
    }
    setJoinError(null);
    setJoining(true);
    try {
      const res = await joinMultiplayerRoom(normalizedCode, {
        playerId: guestPlayerId,
      });
      const meta = await getMultiplayerRoomMetadata(res.joinCode);
      if (meta.status === "ENDED") {
        setJoinError(t("online_room_ended_message"));
        return;
      }
      applyOnlinePartySession({
        roomId: res.roomId,
        joinCode: res.joinCode,
        hostSecret: null,
        wsToken: res.wsToken,
        playerId: guestPlayerId,
        isHost: false,
      });
      AudioManager.playButtonClick();
      onJoined();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : t("online_error_generic");
      setJoinError(msg);
    } finally {
      setJoining(false);
    }
  }, [applyOnlinePartySession, guestPlayerId, normalizedCode, onJoined, t]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <UiStyleProvider value="tiktokLight">
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          style={styles.kb}
        >
          <Pressable
            style={styles.plateModalBackdrop}
            onPress={() => {
              AudioManager.playButtonClick();
              onDismiss();
            }}
          >
            <Pressable
              style={[styles.plateModalCenter, { width: plateWidth }]}
              onPress={() => {}}
            >
              <Animated.View
                style={{
                  width: "100%",
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                }}
              >
                <LightPlate
                  source={backgrounds.bg005}
                  resizeMode="stretch"
                  imageStyle={{ borderRadius: 18 }}
                  style={[styles.plateModalCard, { width: plateWidth }]}
                >
                  <CustomText
                    variant="p"
                    className="text-center"
                    textColor={TTL.text2}
                    style={styles.title}
                  >
                    {t("online_join_title")}
                  </CustomText>
                  <View style={styles.nameDivider} />
                  <CustomText
                    variant="h6"
                    className="text-center mb-2"
                    textColor={TTL.text}
                    allowWrap
                    style={styles.subtitle}
                  >
                    {t("online_join_subtitle")}
                  </CustomText>
                  <CustomText
                    variant="p-small"
                    className="text-center mb-2"
                    textColor={TTL.text2}
                    style={styles.label}
                  >
                    {t("online_join_field_label")}
                  </CustomText>
                  <View style={styles.joinInputWrap}>
                    <TextInput
                      value={codeInput}
                      onChangeText={(txt) => setCodeInput(txt.toUpperCase())}
                      placeholder={t("online_join_input_placeholder")}
                      placeholderTextColor={TTL.text2}
                      maxLength={CODE_LEN}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      style={styles.joinCodeInput}
                    />
                  </View>
                  {joinError ? (
                    <CustomText
                      variant="p-small"
                      className="text-center mt-2"
                      textColor={TTL.primary}
                      allowWrap
                      style={styles.label}
                    >
                      {joinError}
                    </CustomText>
                  ) : null}
                  <View style={styles.modalBtnRow}>
                    <Pressable
                      style={styles.modalSecondaryBtn}
                      onPress={() => {
                        AudioManager.playButtonClick();
                        onDismiss();
                      }}
                    >
                      <CustomText
                        variant="p-small"
                        textColor={TTL.text}
                        style={styles.buttonText}
                      >
                        {t("cancel")}
                      </CustomText>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.modalPrimaryBtn,
                        (joining || normalizedCode.length !== CODE_LEN) &&
                          styles.modalPrimaryBtnDisabled,
                      ]}
                      disabled={joining || normalizedCode.length !== CODE_LEN}
                      onPress={() => {
                        AudioManager.playButtonClick();
                        void handleJoin();
                      }}
                    >
                      <CustomText
                        variant="p-small"
                        textColor="#fff"
                        style={styles.buttonText}
                      >
                        {t("online_join_btn")}
                      </CustomText>
                    </Pressable>
                  </View>
                  {joining ? (
                    <ActivityIndicator
                      style={{ marginTop: 12 }}
                      color={TTL.text2}
                      size="large"
                    />
                  ) : null}
                </LightPlate>
              </Animated.View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </UiStyleProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  kb: { flex: 1 },
  plateModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "stretch",
    paddingHorizontal: 20,
  },
  plateModalCenter: {
    alignSelf: "center",
    alignItems: "stretch",
    maxWidth: "100%",
  },
  plateModalCard: {
    alignSelf: "stretch",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 18,
    overflow: "hidden",
  },
  joinInputWrap: {
    width: "100%",
    alignSelf: "stretch",
    maxWidth: "100%",
    minWidth: 0,
  },
  nameDivider: {
    alignSelf: "center",
    width: "88%",
    maxWidth: "100%",
    height: 1,
    marginVertical: 10,
    backgroundColor: TTL.line,
  },
  joinCodeInput: {
    width: "100%",
    minWidth: 0,
    backgroundColor: TTL.fill,
    borderRadius: 8,
    borderWidth: 0,
    borderColor: TTL.line,
    paddingVertical: 18,
    paddingHorizontal: 10,
    // Large and widely spaced: the code is typed letter by letter.
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 8,
    textAlign: "center",
    color: TTL.text,
  },
  modalBtnRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
    justifyContent: "center",
  },
  modalSecondaryBtn: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: TTL.fill,
    borderWidth: 0,
    borderColor: TTL.line,
  },
  modalPrimaryBtn: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: TTL.primary,
    borderWidth: 0,
    borderColor: TTL.text2,
  },
  // Larger than the usual popup text: this one is read while typing a code.
  title: { fontSize: 19, lineHeight: 25 },
  subtitle: { fontSize: 22, lineHeight: 29 },
  label: { fontSize: 18, lineHeight: 24 },
  buttonText: { fontSize: 19, lineHeight: 25 },
  modalPrimaryBtnDisabled: {
    opacity: 0.45,
  },
});
