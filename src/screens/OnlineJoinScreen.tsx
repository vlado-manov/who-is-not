import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  Share,
  Pressable,
  ImageBackground,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import FullBleedStack from "../components/FullBleedStack";
import ImageBackgroundWithLoadGate from "../components/ImageBackgroundWithLoadGate";
import WarmBubblesOverlay from "../components/WarmBubblesOverlay";
import CustomText from "../components/common/CustomText";
import { backgrounds } from "../../assets/backgrounds";
import { useTranslation } from "react-i18next";
import i18n, { normalizeLanguage } from "../i18n";
import AudioManager from "../utils/audioManager";
import { CreateGameStackParamList } from "../navigation/types";
import { getMultiplayerRoomMetadata } from "../api/multiplayer";
import {
  connectMultiplayerRelay,
  disconnectMultiplayerRelay,
  subscribeMultiplayerConnection,
  subscribeMultiplayerRelay,
} from "../api/multiplayerRelay";
import { useGameStore } from "../store/useGameStore";
import {
  LOBBY_START_MESSAGE_TYPE,
  MIN_ONLINE_PLAYERS,
} from "../constants/onlineLobby";
import ScreenTopBar from "../components/common/ScreenTopBar";
import { useUserSettingsSheet } from "../context/UserSettingsModalContext";
import { useResponsive } from "../utils/responsive";
import { goBackFromCreateGameToMenu } from "../navigation/goBackFromCreateGameToMenu";
import { ApiError } from "../api/types";
import { usePlateModalCardWidth } from "../components/modals/usePlateModalCardWidth";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import AnimatedLogoHero from "../components/AnimatedLogoHero";
import { game_images } from "../../assets/images";
import { useAuthStore } from "../store/useUserStore";

type Nav = StackNavigationProp<CreateGameStackParamList, "OnlineJoin">;

type ConnState = "idle" | "connecting" | "open" | "closed" | "error";

const SLOT_MAX = 12;

export default function OnlineJoinScreen() {
  const { t, i18n: i18nApi } = useTranslation();
  const {
    horizontalPadding,
    topIconSize,
    logo,
    storeIconOverlay,
    logoBlockMarginTop,
  } = useResponsive();
  const { settings, updateSettings } = useAuthStore();
  const navigation = useNavigation<Nav>();
  const { openUserSettings } = useUserSettingsSheet();
  const plateModalWidth = usePlateModalCardWidth();

  const joinCode = useGameStore((s) => s.roomCode);
  const wsToken = useGameStore((s) => s.onlineWsToken);
  const isHost = useGameStore((s) => s.onlineIsHost);

  const prepareOnlineGameFromLobby = useGameStore(
    (s) => s.prepareOnlineGameFromLobby,
  );
  const setOnlineSessionLanguage = useGameStore(
    (s) => s.setOnlineSessionLanguage,
  );

  const [conn, setConn] = useState<ConnState>("idle");
  const [participantCount, setParticipantCount] = useState(0);
  const [showRoomEndedModal, setShowRoomEndedModal] = useState(false);
  const [showLeaveGuestModal, setShowLeaveGuestModal] = useState(false);
  const [copyToastVisible, setCopyToastVisible] = useState(false);
  const copyToastOpacity = useRef(new Animated.Value(0)).current;

  const followedHostStartRef = useRef(false);
  const invalidSessionRedirectRef = useRef(false);
  const prevCountRef = useRef(0);
  const skipJoinAnimOnceRef = useRef(true);
  const playersPulse = useRef(new Animated.Value(1)).current;
  const slotScale = useRef(
    Array.from({ length: SLOT_MAX }, () => new Animated.Value(1)),
  ).current;
  const slotGlow = useRef(
    Array.from({ length: SLOT_MAX }, () => new Animated.Value(0)),
  ).current;

  const logoSource = useMemo(() => {
    const sound = settings.soundEnabled ? "MusicOn" : "MusicOff";
    switch (i18nApi.language) {
      case "fr":
        return game_images[`logoFr${sound}`];
      case "es":
        return game_images[`logoEs${sound}`];
      case "bg":
        return game_images[`logoBg${sound}`];
      default:
        return game_images[`logo${sound}`];
    }
  }, [i18nApi.language, settings.soundEnabled]);

  const toggleSound = useCallback(() => {
    const next = !settings.soundEnabled;
    updateSettings({ soundEnabled: next });
    AudioManager.setSoundEnabled(next);
  }, [settings.soundEnabled, updateSettings]);

  const showCopyToast = useCallback(() => {
    setCopyToastVisible(true);
    copyToastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(copyToastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(1700),
      Animated.timing(copyToastOpacity, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setCopyToastVisible(false);
    });
  }, [copyToastOpacity]);

  useEffect(() => {
    if (!joinCode || !wsToken || isHost !== false) {
      if (invalidSessionRedirectRef.current) return;
      invalidSessionRedirectRef.current = true;
      goBackFromCreateGameToMenu(navigation, { beforePop: () => {} });
    }
  }, [joinCode, wsToken, isHost, navigation]);

  useEffect(() => {
    if (!wsToken) return;
    connectMultiplayerRelay(wsToken);
    const unsubConn = subscribeMultiplayerConnection((state) => {
      if (state === "open") setConn("open");
      else if (state === "connecting") setConn("connecting");
      else if (state === "error") setConn("error");
      else setConn("closed");
    });
    const unsubMsg = subscribeMultiplayerRelay((raw) => {
      if (followedHostStartRef.current) return;
      try {
        const data = raw as {
          type?: string;
          playerCount?: number;
          language?: string;
        };
        if (
          data.type === LOBBY_START_MESSAGE_TYPE &&
          typeof data.playerCount === "number" &&
          data.playerCount >= MIN_ONLINE_PLAYERS
        ) {
          followedHostStartRef.current = true;
          const sessionLang =
            normalizeLanguage(data.language) ??
            normalizeLanguage(i18n.language) ??
            "en";
          setOnlineSessionLanguage(sessionLang);
          void i18n.changeLanguage(sessionLang);
          prepareOnlineGameFromLobby(data.playerCount);
          AudioManager.playButtonClick();
          navigation.navigate("HeroPicker", { index: 1 });
        }
      } catch {
        /* ignore */
      }
    });
    return () => {
      unsubConn();
      unsubMsg();
    };
  }, [
    wsToken,
    navigation,
    prepareOnlineGameFromLobby,
    setOnlineSessionLanguage,
  ]);

  useEffect(() => {
    if (!joinCode) return;
    const tick = () => {
      void getMultiplayerRoomMetadata(joinCode)
        .then((m) => {
          setParticipantCount(m.participantCount);
          if (m.status === "ENDED") {
            setShowRoomEndedModal(true);
          }
        })
        .catch((e: unknown) => {
          if (e instanceof ApiError && (e.status === 404 || e.status === 410)) {
            setShowRoomEndedModal(true);
          }
        });
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [joinCode]);

  useEffect(() => {
    if (!joinCode) return;
    if (skipJoinAnimOnceRef.current) {
      skipJoinAnimOnceRef.current = false;
      prevCountRef.current = participantCount;
      return;
    }
    if (participantCount > prevCountRef.current) {
      playersPulse.setValue(0.88);
      Animated.spring(playersPulse, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
      const idx = participantCount - 1;
      if (idx >= 0 && idx < SLOT_MAX) {
        slotScale[idx].setValue(0.82);
        Animated.spring(slotScale[idx], {
          toValue: 1,
          friction: 4,
          tension: 200,
          useNativeDriver: true,
        }).start();
        slotGlow[idx].setValue(0);
        Animated.sequence([
          Animated.timing(slotGlow[idx], {
            toValue: 1,
            duration: 180,
            useNativeDriver: false,
          }),
          Animated.timing(slotGlow[idx], {
            toValue: 0,
            duration: 900,
            useNativeDriver: false,
          }),
        ]).start();
      }
    }
    prevCountRef.current = participantCount;
  }, [participantCount, joinCode, playersPulse, slotGlow, slotScale]);

  const copyCode = useCallback(async () => {
    if (!joinCode) return;
    await Clipboard.setStringAsync(joinCode);
    AudioManager.playButtonClick();
    showCopyToast();
  }, [joinCode, showCopyToast]);

  const shareCode = useCallback(async () => {
    if (!joinCode) return;
    AudioManager.playButtonClick();
    const message = t("online_share_room_message", {
      defaultValue: "Join my room with code: {{code}}",
      code: joinCode,
    });
    try {
      await Share.share({ message, title: t("online_room_code_label") });
    } catch {
      await Clipboard.setStringAsync(joinCode);
      showCopyToast();
    }
  }, [joinCode, showCopyToast, t]);

  const connLabel =
    conn === "open"
      ? t("online_ws_connected")
      : conn === "connecting"
        ? t("online_ws_connecting")
        : conn === "error"
          ? t("online_ws_error")
          : t("online_ws_disconnected");

  const onBackPress = useCallback(() => {
    setShowLeaveGuestModal(true);
  }, []);

  const confirmLeaveGuest = useCallback(() => {
    setShowLeaveGuestModal(false);
    useGameStore.getState().reset();
    goBackFromCreateGameToMenu(navigation, { beforePop: () => {} });
  }, [navigation]);

  const dismissRoomEndedAndExit = useCallback(() => {
    setShowRoomEndedModal(false);
    useGameStore.getState().reset();
    goBackFromCreateGameToMenu(navigation, { beforePop: () => {} });
  }, [navigation]);

  if (!joinCode || !wsToken || isHost !== false) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]} />
      </View>
    );
  }

  return (
    <FullBleedStack
      rootStyle={styles.root}
      backdrop={
        <ImageBackgroundWithLoadGate
          source={backgrounds.bg027}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          <WarmBubblesOverlay variant="normal" />
        </ImageBackgroundWithLoadGate>
      }
    >
      <SafeAreaView style={styles.safe} edges={["left", "right"]}>
        <ScreenTopBar
          variant="soloBackFromCenter"
          horizontalPadding={horizontalPadding}
          topIconSize={topIconSize}
          showBack
          onSettings={() => openUserSettings()}
          onProfile={() => {}}
          onBack={onBackPress}
          backAccessibilityLabel={t("back_btn")}
        />
        <ScrollView
          removeClippedSubviews={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 16,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ width: "100%" }}>
            <View
              style={{
                paddingHorizontal: horizontalPadding,
                alignItems: "center",
              }}
            >
              <AnimatedLogoHero
                logoSource={logoSource}
                overlaySource={game_images.menuPlayIcon}
                logoWidth={logo.width}
                logoHeight={logo.height}
                overlayLayout={storeIconOverlay}
                marginTop={logoBlockMarginTop}
                onPress={toggleSound}
              />
            </View>

            <View className="gap-5 w-full items-stretch">
              <View style={styles.modalWrap}>
                <View style={styles.namePlateShadow}>
                  <ImageBackground
                    source={backgrounds.bg005}
                    resizeMode="stretch"
                    imageStyle={{ borderRadius: 18 }}
                    style={styles.namePlate}
                  >
                    <View style={styles.namePlateContent}>
                      <CustomText
                        variant="p"
                        className="text-center"
                        textColor="#762a05"
                      >
                        {t("online_room_code_label")}
                      </CustomText>
                      <View style={styles.nameDivider} />
                      <TouchableOpacity
                        onPress={() => void copyCode()}
                        activeOpacity={0.9}
                      >
                        <View style={styles.codeBox}>
                          <CustomText
                            variant="h4-headline"
                            className="text-center tracking-[0.2em]"
                            textColor="#592410"
                          >
                            {joinCode}
                          </CustomText>
                        </View>
                      </TouchableOpacity>
                      <View style={styles.nameDivider} />

                      <View style={styles.quickActionsRow}>
                        <Pressable
                          onPress={() => void copyCode()}
                          style={styles.quickActionItem}
                        >
                          <View className="flex-row items-center gap-2 justify-center">
                            <Feather name="copy" size={18} color="#592410" />
                            <CustomText
                              variant="p-small"
                              textColor="#592410"
                              numberOfLines={2}
                            >
                              {t("copy_link")}
                            </CustomText>
                          </View>
                        </Pressable>
                        <Pressable
                          onPress={() => void shareCode()}
                          style={styles.quickActionItem}
                        >
                          <View className="flex-row items-center gap-2 justify-center">
                            <Feather name="share-2" size={18} color="#592410" />
                            <CustomText
                              variant="p-small"
                              textColor="#592410"
                              numberOfLines={2}
                            >
                              {t("share")}
                            </CustomText>
                          </View>
                        </Pressable>
                      </View>
                      <View style={styles.nameDivider} />
                      <View style={styles.roomMetaBox}>
                        <CustomText
                          variant="p-small"
                          className="text-center"
                          textColor="#592410"
                        >
                          {t("online_waiting_players_status", {
                            defaultValue: "Waiting players: {{count}}",
                            count: participantCount,
                          })}
                        </CustomText>
                        <CustomText
                          variant="p-xsmall"
                          className="text-center mt-1"
                          textColor="#762a05"
                        >
                          {connLabel}
                        </CustomText>
                      </View>
                    </View>
                  </ImageBackground>
                </View>
              </View>

              <View
                style={[
                  { paddingHorizontal: horizontalPadding },
                  styles.ctaBelowSettings,
                ]}
              >
                <Animated.View
                  style={{
                    transform: [{ scale: playersPulse }],
                  }}
                  className="w-full"
                >
                  <View className="flex-row flex-wrap gap-2 justify-center">
                    {Array.from({
                      length: Math.max(6, participantCount),
                    }).map((_, i) => {
                      const active = i < participantCount;
                      return (
                        <Animated.View
                          key={i}
                          style={{
                            transform: [
                              {
                                scale: i < SLOT_MAX ? slotScale[i] : 1,
                              },
                            ],
                          }}
                        >
                          <ImageBackground
                            source={backgrounds.bg005}
                            resizeMode="stretch"
                            imageStyle={{ borderRadius: 10 }}
                            style={[
                              styles.playerSlotBg,
                              active
                                ? styles.playerSlotBgActive
                                : styles.playerSlotBgInactive,
                            ]}
                          >
                            {active && i < SLOT_MAX ? (
                              <Animated.View
                                pointerEvents="none"
                                style={[
                                  StyleSheet.absoluteFill,
                                  {
                                    borderRadius: 10,
                                    backgroundColor: "#ff9d00",
                                    opacity: slotGlow[i],
                                  },
                                ]}
                              />
                            ) : null}
                            <MaterialCommunityIcons
                              name={active ? "account-check" : "account"}
                              size={22}
                              color={active ? "#b5f7c2" : "#d8d8d8"}
                            />
                          </ImageBackground>
                        </Animated.View>
                      );
                    })}
                  </View>
                </Animated.View>

                <CustomText
                  variant="p-small"
                  className="text-center mt-6 px-2"
                  textColor="rgba(255,255,255,0.9)"
                >
                  {participantCount < MIN_ONLINE_PLAYERS
                    ? t("online_min_players_hint", {
                        min: MIN_ONLINE_PLAYERS,
                      })
                    : t("online_guest_wait_host")}
                </CustomText>
              </View>
            </View>
          </View>
        </ScrollView>

        {copyToastVisible ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.copyToastOuter,
              {
                opacity: copyToastOpacity,
                paddingHorizontal: horizontalPadding,
              },
            ]}
          >
            <ImageBackground
              source={backgrounds.bg005}
              resizeMode="stretch"
              imageStyle={{ borderRadius: 14 }}
              style={styles.copyToastPlate}
            >
              <CustomText
                variant="p-small"
                className="text-center"
                textColor="#592410"
              >
                {t("online_code_copied_toast")}
              </CustomText>
            </ImageBackground>
          </Animated.View>
        ) : null}

        {showLeaveGuestModal ? (
          <Pressable
            style={styles.plateModalBackdrop}
            onPress={() => setShowLeaveGuestModal(false)}
          >
            <Pressable
              style={[styles.plateModalCenter, { width: plateModalWidth }]}
              onPress={() => {}}
            >
              <ImageBackground
                source={backgrounds.bg005}
                resizeMode="stretch"
                imageStyle={{ borderRadius: 18 }}
                style={[styles.plateModalCard, { width: plateModalWidth }]}
              >
                <CustomText
                  variant="p"
                  className="text-center"
                  textColor="#762a05"
                >
                  {t("online_leave_guest_title")}
                </CustomText>
                <View style={styles.nameDivider} />
                <CustomText
                  variant="p-small"
                  className="text-center px-2"
                  textColor="#592410"
                >
                  {t("online_leave_guest_message")}
                </CustomText>
                <View style={styles.modalBtnRow}>
                  <Pressable
                    style={styles.modalSecondaryBtn}
                    onPress={() => setShowLeaveGuestModal(false)}
                  >
                    <CustomText variant="p-small" textColor="#592410">
                      {t("cancel")}
                    </CustomText>
                  </Pressable>
                  <Pressable
                    style={styles.modalPrimaryBtn}
                    onPress={confirmLeaveGuest}
                  >
                    <CustomText variant="p-small" textColor="#fff">
                      {t("online_leave_guest_confirm")}
                    </CustomText>
                  </Pressable>
                </View>
              </ImageBackground>
            </Pressable>
          </Pressable>
        ) : null}

        {showRoomEndedModal ? (
          <Pressable
            style={styles.plateModalBackdrop}
            onPress={dismissRoomEndedAndExit}
          >
            <Pressable
              style={[styles.plateModalCenter, { width: plateModalWidth }]}
              onPress={() => {}}
            >
              <ImageBackground
                source={backgrounds.bg005}
                resizeMode="stretch"
                imageStyle={{ borderRadius: 18 }}
                style={[styles.plateModalCard, { width: plateModalWidth }]}
              >
                <CustomText
                  variant="p"
                  className="text-center"
                  textColor="#762a05"
                >
                  {t("online_room_ended_title")}
                </CustomText>
                <View style={styles.nameDivider} />
                <CustomText
                  variant="p-small"
                  className="text-center px-2"
                  textColor="#592410"
                >
                  {t("online_room_ended_guest_body")}
                </CustomText>
                <Pressable
                  style={[
                    styles.modalPrimaryBtn,
                    { marginTop: 12, alignSelf: "stretch" },
                  ]}
                  onPress={dismissRoomEndedAndExit}
                >
                  <CustomText variant="p-small" textColor="#fff">
                    {t("ok")}
                  </CustomText>
                </Pressable>
              </ImageBackground>
            </Pressable>
          </Pressable>
        ) : null}
      </SafeAreaView>
    </FullBleedStack>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  safe: { flex: 1, backgroundColor: "transparent" },
  plateModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.82)",
    justifyContent: "center",
    alignItems: "stretch",
    paddingHorizontal: 20,
    zIndex: 10000,
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
  modalBtnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  modalSecondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "rgba(255,247,236,0.85)",
    borderWidth: 1,
    borderColor: "rgba(160,110,60,0.4)",
  },
  modalPrimaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#8b2b1a",
    borderWidth: 1,
    borderColor: "rgba(89,36,16,0.6)",
  },
  ctaBelowSettings: {
    zIndex: 1,
  },
  modalWrap: {
    width: "100%",
    alignSelf: "stretch",
    paddingHorizontal: 24,
    zIndex: 30,
    elevation: 12,
  },
  namePlateShadow: {
    shadowColor: "#fff",
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 14,
    width: "100%",
    alignSelf: "stretch",
  },
  namePlate: {
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
    shadowColor: "#ffd800",
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(251,192,32,1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(160,110,60,0.7)",
    overflow: "hidden",
    width: "100%",
    alignSelf: "stretch",
  },
  namePlateContent: {
    width: "100%",
    alignSelf: "stretch",
    paddingHorizontal: 20,
    maxWidth: "100%",
  },
  nameDivider: {
    alignSelf: "center",
    width: "88%",
    maxWidth: "100%",
    height: 1,
    marginVertical: 10,
    backgroundColor: "rgba(89,36,16,0.5)",
  },
  codeBox: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
    backgroundColor: "rgba(255,247,236,0.9)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(160,110,60,0.4)",
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  quickActionsRow: {
    width: "100%",
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 8,
  },
  quickActionItem: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(160,110,60,0.3)",
    backgroundColor: "rgba(255,247,236,0.6)",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  roomMetaBox: {
    width: "100%",
    alignSelf: "stretch",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(160,110,60,0.3)",
    backgroundColor: "rgba(255,247,236,0.6)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  playerSlotBg: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  playerSlotBgActive: {
    borderColor: "rgba(160,110,60,0.55)",
  },
  playerSlotBgInactive: {
    borderColor: "rgba(160,110,60,0.3)",
  },
  copyToastOuter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 28,
    alignItems: "center",
    zIndex: 50,
  },
  copyToastPlate: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(160,110,60,0.45)",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
});
