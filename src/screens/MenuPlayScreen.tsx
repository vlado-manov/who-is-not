import { useTranslation } from "react-i18next";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  View,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import FullBleedStack from "../components/FullBleedStack";
import ImageBackgroundWithLoadGate from "../components/ImageBackgroundWithLoadGate";
import WarmBubblesOverlay from "../components/WarmBubblesOverlay";
import {
  CompositeNavigationProp,
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  OnboardingStackParamList,
  RootStackParamList,
} from "../navigation/types";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAuthStore } from "../store/useUserStore";
import { game_images } from "../../assets/images";
import AudioManager from "../utils/audioManager";
import AppImage from "../components/AppImage";
import { trackPlayerSessionStarted } from "../api/analytics";
import { useResponsive } from "../utils/responsive";
import { useProfileAvatarSource } from "../hooks/useProfileAvatarSource";
import ScreenTopBar, {
  SCREEN_TOP_BAR_GUTTER,
  ScreenTopButton,
} from "../components/common/ScreenTopBar";
import { useUserSettingsSheet } from "../context/UserSettingsModalContext";
import CustomText from "../components/common/CustomText";
import LanguageSelector from "../components/LanguageSelector";
import OnlineJoinRoomModal from "../components/modals/OnlineJoinRoomModal";
import CamIntroSheet from "../components/cam/CamIntroSheet";
import MenuModeReveal, {
  type MenuModeOption,
} from "../components/menu/MenuModeReveal";
import MenuModeTile from "../components/menu/MenuModeTile";

type OnbNav = StackNavigationProp<OnboardingStackParamList, "MenuPlay">;
type RootNav = StackNavigationProp<RootStackParamList>;
type Nav = CompositeNavigationProp<OnbNav, RootNav>;
/** False until the menu has been shown once; see the menu music note below. */
let menuMusicHandedOver = false;

/** Bundled with the app (the other menu art comes from the CDN). */
const MENU_BACKGROUND = require("../../assets/images/bg00.png");
const MENU_LOGO_BURST = require("../../assets/images/behind-logo2.png");
/** Mode cards: finished art with its own frame and title, 1195 × 1316. */
const MENU_PARTY_CARD = require("../../assets/images/party-card3.png");
const MENU_ONLINE_CARD = require("../../assets/images/online-card3.png");
const CARD_ASPECT = 1195 / 1316;

/** Cards: side margin of the menu and the width below which the cards stack. */
const TILE_SIDE_PADDING = 0;
/**
 * Measured on the card art (share of the image width that is empty): left of
 * the Party card and right of the Online card, and the two inner margins
 * together (0.093 + 0.184).
 */
const PARTY_ART_LEFT = 0.137;
const ONLINE_ART_RIGHT = 0.056;
/**
 * How much of a card's box the next one covers. The inner empty margins add up
 * to about 0.27 of a card, so this leaves a clear gap between the drawn cards.
 */
const CARD_OVERLAP_RATIO = 0.18;
/** Size of the Party (left) card next to the Online card. */
const PARTY_CARD_SCALE = 1;
/**
 * Both cards are this share of the size that would fill the row: the Online
 * card was brought down to the Party card's size.
 */
const CARD_PAIR_SCALE = 0.97;
/** The Online (right) card sits this much further right than the layout puts it. */
const ONLINE_CARD_NUDGE = 11;
/** Space kept between the drawn cards and the screen edges. */
const CARD_SCREEN_MARGIN = 22;
const TILE_MIN_SIZE = 140;
const TILE_MAX_SINGLE = 300;
/** Accent of each mode's options sheet. */
const TILE_TITLE_FIRST = "#3D8BFF";
const TILE_TITLE_SECOND = "#FFD60A";
/** Burst art behind the logo: 1536 × 1024, drawn wider than the logo. */
const LOGO_BURST_ASPECT = 1536 / 1024;
const LOGO_BURST_SCALE = 1.3;
/** Size of the bg / fr / es logos next to the English one. */
const LOCALIZED_LOGO_SCALE = 1.15;
/** Extra width given to every language's logo on this screen. */
const LOGO_EXTRA_WIDTH = 20;
/** How far the logo jumps when it is tapped. */
const LOGO_HOP_HEIGHT = 14;
/** How much higher the logo sits here than on the other menu screens. */
const LOGO_RAISE = 44;

const MenuPlayScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { openUserSettings } = useUserSettingsSheet();
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [camIntroVisible, setCamIntroVisible] = useState(false);
  /** The mode whose options sheet is open. */
  const [reveal, setReveal] = useState<"online" | "party" | null>(null);
  const insets = useSafeAreaInsets();
  const profileImage = useProfileAvatarSource();

  // Menu music. The very first time the app opens, the start-up loader starts
  // it (the menu is already mounted behind the loader). Every later time the
  // menu comes into focus — after a game, back from the Store — it claims the
  // menu music itself, so whatever a game left playing is replaced.
  useFocusEffect(
    useCallback(() => {
      if (!menuMusicHandedOver) {
        menuMusicHandedOver = true;
        return;
      }
      void AudioManager.playBackground();
    }, []),
  );
  const { settings, updateSettings, user } = useAuthStore();
  const {
    logo,
    htpOverlay,
    horizontalPadding,
    topIconSize,
    logoBlockMarginTop,
    windowHeight,
    windowWidth,
    isShortScreen,
    isTablet,
  } = useResponsive();

  const menuLayout = useMemo(() => {
    const narrow = windowWidth < 380;
    const low = windowHeight < 640;
    if (!(low || narrow)) {
      return {
        btnSize: "md" as const,
        fontSize: "sm" as const,
        fontSizePx: undefined as number | undefined,
        gap: 24,
        sectionMarginTop: 28,
        sectionPaddingTop: 12,
        iconScale: 1,
        titleMinFontScale: undefined as number | undefined,
      };
    }
    const veryTight = isShortScreen || windowHeight < 600 || windowWidth < 340;
    return {
      btnSize: veryTight ? ("xs" as const) : ("sm" as const),
      fontSize: "xs" as const,
      fontSizePx: veryTight ? 15 : 16,
      gap: veryTight ? 12 : 16,
      sectionMarginTop: veryTight ? 14 : 20,
      sectionPaddingTop: veryTight ? 6 : 10,
      iconScale: veryTight ? 0.68 : 0.78,
      titleMinFontScale: veryTight ? 0.4 : 0.46,
    };
  }, [windowWidth, windowHeight, isShortScreen]);

  const s = menuLayout.iconScale;

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

  // The Bulgarian, French and Spanish logos read smaller than the English one.
  const logoScale =
    (i18n.language.startsWith("en") ? 1 : LOCALIZED_LOGO_SCALE) *
    // Every logo is drawn a few points wider than the shared logo box.
    ((logo.width + LOGO_EXTRA_WIDTH) / logo.width);

  // Tapping the logo turns the sound on or off, and the logo hops.
  const logoHop = useRef(new Animated.Value(0)).current;
  const toggleSound = () => {
    Animated.sequence([
      Animated.timing(logoHop, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(logoHop, {
        toValue: 0,
        speed: 14,
        bounciness: 16,
        useNativeDriver: true,
      }),
    ]).start();
    const newVal = !settings.soundEnabled;
    updateSettings({ soundEnabled: newVal });
    AudioManager.setSoundEnabled(newVal);
  };

  // Two cards side by side when they stay big enough, otherwise one per row.
  // The art has a wide transparent margin around the card, so the pair is laid
  // out by what is actually drawn: the drawn cards span the screen minus a
  // small margin, and the boxes overlap so the drawn cards nearly touch.
  const tilesWidth = Math.min(windowWidth, isTablet ? 640 : 480);
  const pairCard = Math.floor(
    (CARD_PAIR_SCALE * (tilesWidth - CARD_SCREEN_MARGIN * 2)) /
      (1 +
        PARTY_CARD_SCALE * (1 - PARTY_ART_LEFT) -
        CARD_OVERLAP_RATIO -
        ONLINE_ART_RIGHT),
  );
  const sideBySide = pairCard >= TILE_MIN_SIZE;
  const cardWidth = sideBySide
    ? pairCard
    : Math.min(tilesWidth, TILE_MAX_SINGLE);
  const cardOverlap = Math.round(cardWidth * CARD_OVERLAP_RATIO);
  // The Party card is drawn a little smaller than the Online card.
  const partyWidth = sideBySide
    ? Math.round(cardWidth * PARTY_CARD_SCALE)
    : cardWidth;
  const rowWidth = partyWidth + cardWidth - cardOverlap;
  // The empty margin is wider on the left than on the right: shift the row so
  // the drawn cards, not their boxes, are centred.
  const rowShift = Math.round(
    (cardWidth * ONLINE_ART_RIGHT - partyWidth * PARTY_ART_LEFT) / 2,
  );
  // The burst behind the logo is wider than the logo itself.
  const burstWidth = logo.width * LOGO_BURST_SCALE;
  const burstHeight = burstWidth / LOGO_BURST_ASPECT;

  const track = (step: string, online = false) => {
    void trackPlayerSessionStarted({
      userId: user.id,
      source: "MENU_PLAY",
      step,
      language: i18n.language,
      ...(online ? { mode: "ONLINE" as const } : {}),
    }).catch((e) => {
      console.warn(`track PLAYER_SESSION_STARTED(${step}) failed`, e);
    });
  };

  const startParty = () => {
    track("local_create_game_tapped");
    navigation.navigate("CreateGame");
  };

  const closeReveal = () => setReveal(null);

  const onlineOptions: MenuModeOption[] = [
    {
      id: "host",
      icon: "wifi",
      title: t("menuPlay_host_btn"),
      subtitle: t("invite_friends_label"),
      onPress: () => {
        closeReveal();
        track("host_tapped", true);
        navigation.navigate("CreateGame", { screen: "OnlineHost" });
      },
    },
    {
      id: "join",
      icon: "keypad-outline",
      title: t("menuPlay_join_btn"),
      subtitle: t("scan_qr_code"),
      onPress: () => {
        closeReveal();
        track("join_tapped", true);
        setJoinModalVisible(true);
      },
    },
  ];
  const partyOptions: MenuModeOption[] = [
    {
      id: "chaos",
      icon: "people",
      title: t("menu_party_chaos"),
      subtitle: t("play_one_device"),
      onPress: () => {
        closeReveal();
        startParty();
      },
    },
    {
      id: "tiktok",
      icon: "videocam",
      title: t("menu_party_tiktok"),
      subtitle: t("menu_party_tiktok_sub"),
      onPress: () => {
        closeReveal();
        setCamIntroVisible(true);
      },
    },
  ];

  return (
    <FullBleedStack
      rootStyle={styles.root}
      backdrop={
        <ImageBackgroundWithLoadGate
          source={MENU_BACKGROUND}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          <WarmBubblesOverlay variant="normal" />
        </ImageBackgroundWithLoadGate>
      }
    >
      <SafeAreaView style={styles.safe} edges={["left", "right"]}>
        <ScreenTopBar
          horizontalPadding={horizontalPadding}
          topIconSize={topIconSize}
          showBack={false}
          onSettings={() => openUserSettings()}
          onProfile={() => navigation.navigate("Profile")}
          onStore={() => navigation.navigate("Store")}
          storeAccessibilityLabel={t("menu_store_btn")}
          profileImage={profileImage}
          settingsOnLeft
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: TILE_SIDE_PADDING,
            paddingBottom: 16,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              alignItems: "center",
              // Higher than on the other menus: right under the top buttons.
              marginTop: Math.max(
                insets.top + 30,
                logoBlockMarginTop - LOGO_RAISE,
              ),
            }}
          >
            <Pressable onPress={toggleSound}>
              <View
                style={{
                  width: logo.width,
                  height: logo.height,
                  position: "relative",
                  alignItems: "center",
                }}
              >
                {/* <AppImage
                    source={game_images.menuPlayIcon}
                    style={{
                      position: "absolute",
                      width: htpOverlay.width,
                      height: htpOverlay.height,
                      top: htpOverlay.top - 24,
                      left: htpOverlay.left,
                    }}
                    contentFit="contain"
                  /> */}
                {/* Behind the logo, centred on it; it may spill past the logo box. */}
                <AppImage
                  source={MENU_LOGO_BURST}
                  contentFit="contain"
                  style={{
                    position: "absolute",
                    zIndex: 0,
                    width: burstWidth,
                    height: burstHeight,
                    left: (logo.width - burstWidth) / 2,
                    top: (logo.height - burstHeight) / 4,
                  }}
                />
                <Animated.View
                  style={{
                    zIndex: 1,
                    transform: [
                      {
                        translateY: logoHop.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -LOGO_HOP_HEIGHT],
                        }),
                      },
                      {
                        scale: logoHop.interpolate({
                          inputRange: [0, 1],
                          outputRange: [logoScale, logoScale * 1.06],
                        }),
                      },
                    ],
                  }}
                >
                  <AppImage
                    source={logoSource}
                    style={{ width: logo.width, height: logo.height }}
                    contentFit="contain"
                  />
                </Animated.View>
              </View>
            </Pressable>
          </View>

          <View
            style={{
              width: "100%",
              maxWidth: isTablet ? 640 : 480,
              alignSelf: "center",
              gap: menuLayout.gap,
              marginTop: menuLayout.sectionMarginTop,
              flexGrow: 1,
              paddingTop: menuLayout.sectionPaddingTop,
              paddingBottom: 8,
            }}
          >
            <View
              style={[
                styles.tiles,
                sideBySide && {
                  width: rowWidth,
                  flexWrap: "nowrap",
                  transform: [{ translateX: rowShift }],
                },
              ]}
            >
              <MenuModeTile
                image={MENU_PARTY_CARD}
                label={t("menu_party_tile")}
                width={partyWidth}
                aspectRatio={CARD_ASPECT}
                // Drawn over the edge of the Online card.
                style={styles.cardFront}
                onPress={() =>
                  // Cam ("TikTok") mode needs the camera: no choice on web.
                  Platform.OS === "web" ? startParty() : setReveal("party")
                }
              />
              <MenuModeTile
                image={MENU_ONLINE_CARD}
                label={t("menu_online_tile")}
                width={cardWidth}
                aspectRatio={CARD_ASPECT}
                style={
                  sideBySide
                    ? [
                        styles.cardBack,
                        {
                          marginLeft: -cardOverlap,
                          transform: [{ translateX: ONLINE_CARD_NUDGE }],
                        },
                      ]
                    : undefined
                }
                onPress={() => setReveal("online")}
              />
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.languageDock,
            {
              paddingBottom:
                Math.max(insets.bottom, 12) +
                (isShortScreen ? 28 : 0) +
                (Platform.OS === "android" ? 24 : 0),
              paddingHorizontal: horizontalPadding,
            },
          ]}
        >
          <CustomText className="mb-2" variant="p-small">
            {t("language_pick_btn")}
          </CustomText>
          <LanguageSelector />
        </View>

        {__DEV__ && (
          <View
            style={[
              styles.devButton,
              { bottom: Math.max(insets.bottom, 12) + 4 },
            ]}
          >
            <ScreenTopButton
              icon="bug-outline"
              label="Dev: multiplayer screen lab"
              onPress={() => navigation.navigate("DevMultiplayerLab")}
            />
          </View>
        )}
      </SafeAreaView>
      <CamIntroSheet
        visible={camIntroVisible}
        onClose={() => setCamIntroVisible(false)}
        onConfirm={() => {
          setCamIntroVisible(false);
          void trackPlayerSessionStarted({
            userId: user.id,
            source: "MENU_PLAY",
            step: "cam_mode_tapped",
            language: i18n.language,
          }).catch((e) => {
            console.warn(
              "track PLAYER_SESSION_STARTED(cam_mode_tapped) failed",
              e,
            );
          });
          navigation.navigate("CamGame");
        }}
      />
      <MenuModeReveal
        visible={reveal !== null}
        accent={reveal === "online" ? TILE_TITLE_SECOND : TILE_TITLE_FIRST}
        options={reveal === "online" ? onlineOptions : partyOptions}
        closeLabel={t("close")}
        onClose={closeReveal}
      />
      <OnlineJoinRoomModal
        visible={joinModalVisible}
        onDismiss={() => setJoinModalVisible(false)}
        onJoined={() => {
          setJoinModalVisible(false);
          navigation.navigate("CreateGame", { screen: "OnlineJoin" });
        }}
      />
    </FullBleedStack>
  );
};

export default MenuPlayScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scroll: {
    flex: 1,
  },
  // In the flow under the scroll area, so the menu never slides over it.
  languageDock: {
    alignItems: "center",
    paddingTop: 8,
  },
  // Dev builds only: the screen lab, out of the way in the bottom-left corner.
  devButton: {
    position: "absolute",
    left: SCREEN_TOP_BAR_GUTTER,
    zIndex: 16,
  },
  tiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    // Wider than the screen when side by side: centred, spilling off both edges.
    alignSelf: "center",
  },
  cardFront: {
    zIndex: 2,
  },
  cardBack: {
    zIndex: 1,
  },
});
