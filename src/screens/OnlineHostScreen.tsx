import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  Share,
  Pressable,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as Clipboard from "expo-clipboard";
import { SafeAreaView } from "react-native-safe-area-context";
import FullBleedStack from "../components/FullBleedStack";
import ImageBackgroundWithLoadGate from "../components/ImageBackgroundWithLoadGate";
import WarmBubblesOverlay from "../components/WarmBubblesOverlay";
import CustomText from "../components/common/CustomText";
import CustomButton from "../components/common/CustomButton";
import { backgrounds } from "../../assets/backgrounds";
import { useTranslation } from "react-i18next";
import i18n, { normalizeLanguage } from "../i18n";
import AudioManager from "../utils/audioManager";
import { CreateGameStackParamList } from "../navigation/types";
import {
  createMultiplayerRoom,
  getMultiplayerRoomMetadata,
  hostCloseMultiplayerRoom,
} from "../api/multiplayer";
import {
  connectMultiplayerRelay,
  disconnectMultiplayerRelay,
  sendMultiplayerRelay,
  subscribeMultiplayerConnection,
} from "../api/multiplayerRelay";
import { useGameStore } from "../store/useGameStore";
import { createOpaquePlayerId } from "../utils/opaquePlayerId";
import {
  LOBBY_START_MESSAGE_TYPE,
  MIN_ONLINE_PLAYERS,
} from "../constants/onlineLobby";
import ScreenTopBar from "../components/common/ScreenTopBar";
import { useUserSettingsSheet } from "../context/UserSettingsModalContext";
import { useResponsive } from "../utils/responsive";
import { goBackFromCreateGameToMenu } from "../navigation/goBackFromCreateGameToMenu";
import {
  MaterialCommunityIcons,
  Feather,
  FontAwesome,
} from "@expo/vector-icons";
import { fetchQuestionPacks, type QuestionPackDto } from "../api/questions";
import AnimatedLogoHero from "../components/AnimatedLogoHero";
import Round1TransitionOverlay from "../components/Round1TransitionOverlay";
import { game_images } from "../../assets/images";
import { useAuthStore } from "../store/useUserStore";
import { usePlateModalCardWidth } from "../components/modals/usePlateModalCardWidth";

type Nav = StackNavigationProp<CreateGameStackParamList, "OnlineHost">;

type ConnState = "idle" | "connecting" | "open" | "closed" | "error";
const REQUIRED_START_PLAYERS = Math.max(MIN_ONLINE_PLAYERS, 3);
const LIVES_OPTIONS = [3, 5] as const;
const TIME_OPTIONS = [30, 60, 90, 120, 180, 240, 480, 960] as const;

const isMainPack = (slug: string) => slug === "main" || slug === "main-pack";

export default function OnlineHostScreen() {
  const { t, i18n } = useTranslation();
  const {
    horizontalPadding,
    topIconSize,
    logo,
    storeIconOverlay,
    logoBlockMarginTop,
    isTablet,
  } = useResponsive();
  const plateModalWidth = usePlateModalCardWidth();
  const { settings, updateSettings } = useAuthStore();
  const userId = useAuthStore((s) => s.user.id);
  const isPremium = useAuthStore((s) => s.user.isPremium);
  const navigation = useNavigation<Nav>();
  const { openUserSettings } = useUserSettingsSheet();
  const applyOnlinePartySession = useGameStore(
    (s) => s.applyOnlinePartySession,
  );
  const prepareOnlineGameFromLobby = useGameStore(
    (s) => s.prepareOnlineGameFromLobby,
  );
  const setOnlineSessionLanguage = useGameStore(
    (s) => s.setOnlineSessionLanguage,
  );

  const hostPlayerId = useMemo(() => createOpaquePlayerId("host"), []);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [wsToken, setWsToken] = useState<string | null>(null);
  const [hostSecret, setHostSecret] = useState<string | null>(null);
  const [conn, setConn] = useState<ConnState>("idle");
  const [participantCount, setParticipantCount] = useState(0);
  const gameSettings = useGameStore((s) => s.gameSettings);
  const setGameSettings = useGameStore((s) => s.setGameSettings);
  const [selectedLives, setSelectedLives] = useState<3 | 5>(
    gameSettings?.livesPerPlayer ?? 3,
  );
  const [selectedSec, setSelectedSec] = useState<number>(
    gameSettings?.discussionSeconds ?? 120,
  );
  const [availablePacks, setAvailablePacks] = useState<QuestionPackDto[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(
    gameSettings?.selectedPacks ?? ["main"],
  );
  const [packsLoading, setPacksLoading] = useState(true);
  const [openTimeDropdown, setOpenTimeDropdown] = useState(false);
  const settingsOpacity = useRef(new Animated.Value(1)).current;
  const settingsTranslateY = useRef(new Animated.Value(0)).current;
  const roomOpacity = useRef(new Animated.Value(0)).current;
  const roomTranslateY = useRef(new Animated.Value(22)).current;
  const playersPulse = useRef(new Animated.Value(1)).current;
  const startCtaOpacity = useRef(new Animated.Value(0)).current;
  const startCtaScale = useRef(new Animated.Value(0.8)).current;
  const prevCountRef = useRef(1);
  const [copyToastVisible, setCopyToastVisible] = useState(false);
  const copyToastOpacity = useRef(new Animated.Value(0)).current;

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

  const [showLeaveRoomModal, setShowLeaveRoomModal] = useState(false);
  const [showRoomEndedModal, setShowRoomEndedModal] = useState(false);
  const [showStartTransition, setShowStartTransition] = useState(false);
  const startGameAfterTransitionRef = useRef<(() => void) | null>(null);
  const SLOT_MAX = 12;
  const slotScale = useRef(
    Array.from({ length: SLOT_MAX }, () => new Animated.Value(1)),
  ).current;
  const slotGlow = useRef(
    Array.from({ length: SLOT_MAX }, () => new Animated.Value(0)),
  ).current;

  const goBackToMenu = useCallback(() => {
    goBackFromCreateGameToMenu(navigation, {
      beforePop: () => disconnectMultiplayerRelay(),
    });
  }, [navigation]);

  const formatDiscussionLabel = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, []);

  const selectedDiscussionLabel = useMemo(
    () => formatDiscussionLabel(selectedSec),
    [formatDiscussionLabel, selectedSec],
  );

  const logoSource = useMemo(() => {
    const sound = settings.soundEnabled ? "MusicOn" : "MusicOff";
    switch (i18n.language) {
      case "fr":
        return game_images[`logoFr${sound}`];
      case "es":
        return game_images[`logoEs${sound}`];
      case "bg":
        return game_images[`logoBg${sound}`];
      default:
        return game_images[`logo${sound}`];
    }
  }, [i18n.language, settings.soundEnabled]);

  const toggleSound = useCallback(() => {
    const next = !settings.soundEnabled;
    updateSettings({ soundEnabled: next });
    AudioManager.setSoundEnabled(next);
  }, [settings.soundEnabled, updateSettings]);

  useEffect(() => {
    let cancelled = false;
    fetchQuestionPacks({ userId })
      .then((packs) => {
        if (cancelled) return;
        const accessible = packs.filter(
          (p) => isMainPack(p.slug) || p.isFree === true || isPremium,
        );
        setAvailablePacks(accessible);
        setSelectedSlugs((prev) => {
          if (accessible.length === 0) return prev;
          const valid = prev.filter((s) => accessible.some((p) => p.slug === s));
          if (valid.length > 0) return valid;
          const main = accessible.find((p) => isMainPack(p.slug));
          return [main?.slug ?? accessible[0].slug];
        });
      })
      .catch(() => {
        if (!cancelled) setAvailablePacks([]);
      })
      .then(() => {
        if (!cancelled) setPacksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gameSettings?.selectedPacks, userId, isPremium]);

  const handleCreateRoom = useCallback(async () => {
    setCreateError(null);
    const mainSlug = availablePacks.find((p) => isMainPack(p.slug))?.slug;
    const finalPacks =
      selectedSlugs.length > 0
        ? selectedSlugs
        : [mainSlug ?? availablePacks[0]?.slug ?? "main"].filter(Boolean);
    if (finalPacks.length === 0) {
      setCreateError(t("no_packs_available") || "No question packs available.");
      return;
    }
    setCreating(true);
    try {
      setGameSettings({
        discussionSeconds: selectedSec,
        selectedPacks: finalPacks,
        livesPerPlayer: selectedLives,
      });
      const res = await createMultiplayerRoom({ hostPlayerId });
      setJoinCode(res.joinCode);
      setWsToken(res.wsToken);
      setHostSecret(res.hostSecret);
      applyOnlinePartySession({
        roomId: res.roomId,
        joinCode: res.joinCode,
        hostSecret: res.hostSecret,
        wsToken: res.wsToken,
        playerId: hostPlayerId,
        isHost: true,
      });
      setParticipantCount(1);
      Animated.parallel([
        Animated.timing(settingsOpacity, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(settingsTranslateY, {
          toValue: -18,
          duration: 240,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.parallel([
          Animated.timing(roomOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(roomTranslateY, {
            toValue: 0,
            friction: 7,
            tension: 120,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : t("online_error_generic");
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  }, [
    applyOnlinePartySession,
    hostPlayerId,
    t,
    selectedLives,
    selectedSec,
    selectedSlugs,
    setGameSettings,
    availablePacks,
    settingsOpacity,
    settingsTranslateY,
    roomOpacity,
    roomTranslateY,
  ]);

  useEffect(() => {
    if (!wsToken) return;
    connectMultiplayerRelay(wsToken);
    const unsub = subscribeMultiplayerConnection((state) => {
      if (state === "open") setConn("open");
      else if (state === "connecting") setConn("connecting");
      else if (state === "error") setConn("error");
      else setConn("closed");
    });
    return unsub;
  }, [wsToken]);

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
        .catch(() => {});
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [joinCode]);

  useEffect(() => {
    if (!joinCode) return;
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

  const canStartGame =
    !!joinCode && participantCount >= REQUIRED_START_PLAYERS && conn === "open";

  useEffect(() => {
    if (!joinCode) return;
    if (canStartGame) {
      Animated.parallel([
        Animated.timing(startCtaOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.spring(startCtaScale, {
          toValue: 1,
          friction: 5,
          tension: 130,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      startCtaOpacity.setValue(0);
      startCtaScale.setValue(0.8);
    }
  }, [canStartGame, joinCode, startCtaOpacity, startCtaScale]);

  const handleStartGame = useCallback(async () => {
    if (!joinCode) return;
    AudioManager.playButtonClick();
    let count = participantCount;
    try {
      const meta = await getMultiplayerRoomMetadata(joinCode);
      if (meta.status === "ENDED") {
        setShowRoomEndedModal(true);
        return;
      }
      count = meta.participantCount;
      setParticipantCount(count);
    } catch {
      Alert.alert(t("required_alert_title"), t("online_error_generic"));
      return;
    }
    if (count < REQUIRED_START_PLAYERS) {
      Alert.alert(
        t("required_alert_title"),
        t("online_need_more_players", { min: REQUIRED_START_PLAYERS }),
      );
      return;
    }
    const sessionLang = normalizeLanguage(i18n.language) ?? "en";
    startGameAfterTransitionRef.current = () => {
      setOnlineSessionLanguage(sessionLang);
      prepareOnlineGameFromLobby(count);
      sendMultiplayerRelay({
        type: LOBBY_START_MESSAGE_TYPE,
        playerCount: count,
        language: sessionLang,
      });
      navigation.navigate("HeroPicker", { index: 1 });
    };
    setShowStartTransition(true);
  }, [
    joinCode,
    participantCount,
    navigation,
    prepareOnlineGameFromLobby,
    setOnlineSessionLanguage,
    t,
  ]);

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
    if (joinCode && hostSecret) {
      setShowLeaveRoomModal(true);
    } else {
      goBackToMenu();
    }
  }, [joinCode, hostSecret, goBackToMenu]);

  const confirmLeaveAndCloseRoom = useCallback(async () => {
    if (!joinCode || !hostSecret) return;
    try {
      await hostCloseMultiplayerRoom(joinCode, { hostPlayerId, hostSecret });
    } catch {
      /* still leave */
    }
    setShowLeaveRoomModal(false);
    disconnectMultiplayerRelay();
    goBackFromCreateGameToMenu(navigation, { beforePop: () => {} });
  }, [joinCode, hostSecret, hostPlayerId, navigation]);

  const dismissRoomEndedAndExit = useCallback(() => {
    setShowRoomEndedModal(false);
    disconnectMultiplayerRelay();
    goBackFromCreateGameToMenu(navigation, { beforePop: () => {} });
  }, [navigation]);

  const onStartTransitionDone = useCallback(() => {
    setShowStartTransition(false);
    startGameAfterTransitionRef.current?.();
    startGameAfterTransitionRef.current = null;
  }, []);

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
            alignItems: isTablet ? "center" : undefined,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[{ width: "100%" }, isTablet && { maxWidth: 560 }]}>
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

            {!joinCode ? (
              <Animated.View
                style={{
                  opacity: settingsOpacity,
                  transform: [{ translateY: settingsTranslateY }],
                }}
                className="gap-4 w-full items-stretch"
              >
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
                          {t("game_settings")}
                        </CustomText>
                        <View style={styles.nameDivider} />
                        <View style={styles.settingsSection}>
                          <CustomText
                            variant="h6"
                            className="text-center mb-2"
                            textColor="#592410"
                          >
                            {t("lives_per_player")}
                          </CustomText>
                          <View style={styles.livesRow}>
                            {LIVES_OPTIONS.map((l) => (
                              <Pressable
                                key={l}
                                onPress={() => {
                                  AudioManager.playButtonClick();
                                  setSelectedLives(l);
                                }}
                                style={[
                                  styles.livesOption,
                                  selectedLives === l &&
                                    styles.livesOptionSelected,
                                ]}
                              >
                                <CustomText
                                  variant="p"
                                  textColor={
                                    selectedLives === l ? "#592410" : "#762a05"
                                  }
                                >
                                  {String(l)}
                                </CustomText>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                        <View style={styles.nameDivider} />
                        <View style={styles.settingsSection}>
                          <CustomText
                            variant="h6"
                            className="text-center mb-2"
                            textColor="#592410"
                          >
                            {t("time_for_discussion")}
                          </CustomText>
                          <View style={styles.dropdownWrap}>
                            <Pressable
                              style={styles.dropdownTrigger}
                              onPress={() => {
                                AudioManager.playButtonClick();
                                setOpenTimeDropdown((v) => !v);
                              }}
                            >
                              <CustomText variant="p" textColor="#592410">
                                {selectedDiscussionLabel}
                              </CustomText>
                              <FontAwesome
                                name={
                                  openTimeDropdown ? "angle-up" : "angle-down"
                                }
                                size={20}
                                color="#762a05"
                              />
                            </Pressable>
                            {openTimeDropdown ? (
                              <View style={styles.dropdownList}>
                                <ScrollView
                                  nestedScrollEnabled
                                  showsVerticalScrollIndicator={false}
                                  keyboardShouldPersistTaps="handled"
                                >
                                  {TIME_OPTIONS.map((sec) => (
                                    <Pressable
                                      key={sec}
                                      style={[
                                        styles.dropdownItem,
                                        sec === selectedSec &&
                                          styles.dropdownItemSelected,
                                      ]}
                                      onPress={() => {
                                        AudioManager.playButtonClick();
                                        setSelectedSec(sec);
                                        setOpenTimeDropdown(false);
                                      }}
                                    >
                                      <CustomText
                                        variant="p-small"
                                        textColor={
                                          sec === selectedSec
                                            ? "#762a05"
                                            : "#592410"
                                        }
                                      >
                                        {formatDiscussionLabel(sec)}
                                      </CustomText>
                                    </Pressable>
                                  ))}
                                </ScrollView>
                              </View>
                            ) : null}
                          </View>
                        </View>
                        <View style={styles.nameDivider} />
                        <View
                          style={[styles.settingsSection, styles.packsSection]}
                        >
                          <CustomText
                            variant="h6"
                            className="text-center mb-2"
                            textColor="#592410"
                          >
                            {t("packages_included")}
                          </CustomText>
                          {packsLoading ? (
                            <View style={styles.packsLoading}>
                              <ActivityIndicator size="small" color="#762a05" />
                            </View>
                          ) : (
                            <ScrollView
                              style={styles.packsScroll}
                              contentContainerStyle={styles.packsScrollContent}
                              showsVerticalScrollIndicator={false}
                              nestedScrollEnabled
                            >
                              {availablePacks.length === 0 ? (
                                <CustomText
                                  variant="p-small"
                                  className="text-center py-2"
                                  textColor="#762a05"
                                >
                                  {t("no_packs_available") ||
                                    "No question packs available."}
                                </CustomText>
                              ) : (
                                <View style={styles.packsList}>
                                  {availablePacks.map((pack) => {
                                    const checked = selectedSlugs.includes(
                                      pack.slug,
                                    );
                                    const isMain = isMainPack(pack.slug);
                                    return (
                                      <Pressable
                                        key={pack.slug}
                                        onPress={() => {
                                          AudioManager.playButtonClick();
                                          setSelectedSlugs((prev) => {
                                            if (prev.includes(pack.slug)) {
                                              if (prev.length === 1) {
                                                Alert.alert(
                                                  t("required_alert_title"),
                                                  t("required_alert_message"),
                                                );
                                                return prev;
                                              }
                                              return prev.filter(
                                                (x) => x !== pack.slug,
                                              );
                                            }
                                            if (prev.length >= 5) {
                                              Alert.alert(
                                                t("limit_alert_title"),
                                                t("limit_alert_message"),
                                              );
                                              return prev;
                                            }
                                            return [...prev, pack.slug];
                                          });
                                        }}
                                        style={[
                                          styles.packRow,
                                          checked && styles.packRowChecked,
                                        ]}
                                      >
                                        <CustomText
                                          variant="p-small"
                                          textColor={
                                            checked ? "#592410" : "#762a05"
                                          }
                                        >
                                          {pack.title} ({pack.questionsCount})
                                          {isMain ? " ★" : ""}
                                        </CustomText>
                                        <View
                                          style={[
                                            styles.checkbox,
                                            checked && styles.checkboxChecked,
                                          ]}
                                        >
                                          {checked ? (
                                            <FontAwesome
                                              name="check"
                                              size={12}
                                              color="#fff"
                                            />
                                          ) : null}
                                        </View>
                                      </Pressable>
                                    );
                                  })}
                                </View>
                              )}
                            </ScrollView>
                          )}
                        </View>
                      </View>
                    </ImageBackground>
                  </View>
                </View>
                <View
                  style={[
                    { paddingHorizontal: 24, marginTop: 8 },
                    styles.ctaBelowSettings,
                  ]}
                >
                  {createError ? (
                    <CustomText className="text-red-200 text-center">
                      {createError}
                    </CustomText>
                  ) : null}
                  <CustomButton
                    title={t("online_create_room_btn")}
                    fullWidth
                    onPress={() => {
                      AudioManager.playButtonClick();
                      void handleCreateRoom();
                    }}
                    disabled={creating}
                    backgroundImage={backgrounds.bg026}
                    shadowColor="#005f07"
                  />
                  {creating ? (
                    <ActivityIndicator color="#fff" size="large" />
                  ) : null}
                </View>
              </Animated.View>
            ) : (
              <Animated.View
                style={{
                  opacity: roomOpacity,
                  transform: [{ translateY: roomTranslateY }],
                }}
                className="gap-5 w-full items-stretch"
              >
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
                              <Feather
                                name="share-2"
                                size={18}
                                color="#592410"
                              />
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
                          {hostSecret ? (
                            <CustomText
                              variant="p-xsmall"
                              className="text-center mt-2"
                              textColor="#762a05"
                            >
                              {t("online_host_secret_hint")}
                            </CustomText>
                          ) : null}
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
                                size={24}
                                color={active ? "#12e049" : "#d8d8d8"}
                              />
                            </ImageBackground>
                          </Animated.View>
                        );
                      })}
                    </View>
                  </Animated.View>

                  <Animated.View
                    style={{
                      width: "100%",
                      opacity: startCtaOpacity,
                      transform: [{ scale: startCtaScale }],
                      marginTop: 24,
                    }}
                  >
                    <CustomButton
                      title={t("online_start_game_btn")}
                      fullWidth
                      onPress={() => void handleStartGame()}
                      disabled={!canStartGame}
                      backgroundImage={backgrounds.bg026}
                      shadowColor="#005f07"
                    />
                  </Animated.View>
                </View>
              </Animated.View>
            )}
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
        {showStartTransition ? (
          <Round1TransitionOverlay onDone={onStartTransitionDone} />
        ) : null}
        {showLeaveRoomModal ? (
          <Pressable
            style={styles.plateModalBackdrop}
            onPress={() => setShowLeaveRoomModal(false)}
          >
            <TouchableWithoutFeedback accessible={false}>
              <View
                style={[styles.plateModalCenter, { width: plateModalWidth }]}
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
                    {t("online_leave_room_title")}
                  </CustomText>
                  <View style={styles.nameDivider} />
                  <CustomText
                    variant="p-small"
                    className="text-center px-2"
                    textColor="#592410"
                  >
                    {t("online_leave_room_message")}
                  </CustomText>
                  <View style={styles.modalBtnRow}>
                    <Pressable
                      style={styles.modalSecondaryBtn}
                      onPress={() => setShowLeaveRoomModal(false)}
                    >
                      <CustomText variant="p-small" textColor="#592410">
                        {t("cancel")}
                      </CustomText>
                    </Pressable>
                    <Pressable
                      style={styles.modalPrimaryBtn}
                      onPress={() => void confirmLeaveAndCloseRoom()}
                    >
                      <CustomText variant="p-small" textColor="#fff">
                        {t("online_leave_room_confirm")}
                      </CustomText>
                    </Pressable>
                  </View>
                </ImageBackground>
              </View>
            </TouchableWithoutFeedback>
          </Pressable>
        ) : null}
        {showRoomEndedModal ? (
          <Pressable
            style={styles.plateModalBackdrop}
            onPress={dismissRoomEndedAndExit}
          >
            <TouchableWithoutFeedback accessible={false}>
              <View
                style={[styles.plateModalCenter, { width: plateModalWidth }]}
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
                    {t("online_room_ended_message")}
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
              </View>
            </TouchableWithoutFeedback>
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
    // paddingHorizontal: 24,
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
    maxWidth: "100%",
    alignSelf: "stretch",
    paddingHorizontal: 20,
  },
  settingsSection: {
    width: "100%",
    alignSelf: "stretch",
    alignItems: "center",
  },
  packsSection: {
    zIndex: 0,
  },
  nameDivider: {
    alignSelf: "center",
    width: "88%",
    maxWidth: "100%",
    height: 1,
    marginVertical: 10,
    backgroundColor: "rgba(89,36,16,0.5)",
  },
  livesRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 4,
    justifyContent: "center",
  },
  livesOption: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,247,236,0.6)",
    borderWidth: 1,
    borderColor: "rgba(160,110,60,0.3)",
  },
  livesOptionSelected: {
    backgroundColor: "rgba(251,192,32,0.25)",
    borderColor: "rgba(160,110,60,0.5)",
  },
  dropdownWrap: {
    width: "100%",
    alignSelf: "stretch",
    marginTop: 6,
    marginBottom: 4,
    position: "relative",
    zIndex: 100,
    elevation: 24,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,247,236,0.9)",
    borderWidth: 1,
    borderColor: "rgba(160,110,60,0.4)",
  },
  dropdownList: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "100%",
    marginTop: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,247,236,0.98)",
    borderWidth: 1,
    borderColor: "rgba(160,110,60,0.4)",
    overflow: "hidden",
    maxHeight: 240,
    zIndex: 30,
    elevation: 12,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemSelected: {
    backgroundColor: "rgba(251,192,32,0.25)",
  },
  packsLoading: {
    paddingVertical: 20,
    alignItems: "center",
  },
  packsScroll: {
    width: "100%",
    alignSelf: "stretch",
    maxHeight: 200,
  },
  packsScrollContent: {
    paddingVertical: 4,
    gap: 8,
  },
  packsList: {
    width: "100%",
    alignSelf: "stretch",
    gap: 8,
  },
  packRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,247,236,0.6)",
    borderWidth: 1,
    borderColor: "rgba(160,110,60,0.3)",
  },
  packRowChecked: {
    backgroundColor: "rgba(251,192,32,0.2)",
    borderColor: "rgba(160,110,60,0.5)",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(89,36,16,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#592410",
    borderColor: "#592410",
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
