import React, { useMemo } from "react";
import {
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";

import { backgrounds } from "../../assets/backgrounds";
import { game_images } from "../../assets/images";
import AnimatedLogoHero from "./AnimatedLogoHero";
import CamText from "./cam/CamText";
import FullBleedStack from "./FullBleedStack";
import ImageBackgroundWithLoadGate from "./ImageBackgroundWithLoadGate";
import WarmBubblesOverlay from "./WarmBubblesOverlay";
import { TTL } from "../constants/tiktokTheme";
import type { RootStackParamList, RulesMode } from "../navigation/types";
import { useAuthStore } from "../store/useUserStore";
import AudioManager from "../utils/audioManager";
import { useResponsive } from "../utils/responsive";

type Props = {
  /** Game background behind the logo (with the bubble animation on top). */
  backgroundSource?: ImageSourcePropType;
  /** Picture drawn above the logo. */
  overlaySource: ImageSourcePropType;
  /** Back button at the top left of the sheet. */
  onBack: () => void;
  backLabel: string;
  /** Optional settings button at the top right of the sheet. */
  onSettings?: () => void;
  settingsLabel?: string;
  /** Which game type the "?" rulebook explains. */
  helpMode: RulesMode;
  /** Content of the white sheet. */
  children: React.ReactNode;
};

/**
 * How far the logo block is lifted from its default position. There are no
 * floating buttons above it any more, so it can sit close to the status bar.
 */
export const LOGO_LIFT = 28;
const SHEET_BUTTON = 36;
export const SHEET_RADIUS = 18;
/** Space between the logo block and the white sheet. */
export const SHEET_GAP = 0;

type IconName = keyof typeof Ionicons.glyphMap;

function SheetButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      onPress={() => {
        AudioManager.playButtonClick();
        onPress();
      }}
    >
      {/* Styled on a plain View so the look never depends on Pressable's style. */}
      <View style={styles.sheetButton}>
        <Ionicons name={icon} size={20} color={TTL.text} />
      </View>
    </Pressable>
  );
}

/**
 * Top row of the white sheet: back on the left, an optional title in the
 * middle and settings on the right — grey round buttons with dark icons.
 */
export function SheetTopRow({
  onBack,
  backLabel,
  onSettings,
  settingsLabel,
  helpMode,
  title,
}: Pick<
  Props,
  "onBack" | "backLabel" | "onSettings" | "settingsLabel" | "helpMode"
> & {
  title?: string;
}) {
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  // The rulebook opens on top of this screen and closes back to it.
  const openRules = () =>
    navigation.navigate("Onboarding", {
      screen: "Rules",
      params: { mode: helpMode },
    });

  return (
    <View style={styles.sheetTopRow}>
      <View style={styles.sheetSide}>
        <SheetButton icon="chevron-back" label={backLabel} onPress={onBack} />
        {/* Mirrors the two buttons on the right, so the title stays centred. */}
        {onSettings ? <View style={styles.sheetButtonSlot} /> : null}
      </View>
      <View style={styles.sheetTitle}>
        {!!title && (
          <CamText variant="body" center numberOfLines={1} color={TTL.text}>
            {title}
          </CamText>
        )}
      </View>
      <View style={styles.sheetSide}>
        <SheetButton
          icon="help"
          label={t("menu_htp_btn")}
          onPress={openRules}
        />
        {onSettings ? (
          <SheetButton
            icon="settings-outline"
            label={settingsLabel ?? ""}
            onPress={onSettings}
          />
        ) : null}
      </View>
    </View>
  );
}

/**
 * Screen layout shared by online host, party mode and Cam Mode setup: the game
 * background with bubbles, the animated logo with a picture above it, and the
 * options in a white sheet below with rounded top corners.
 */
export default function LogoSheetLayout({
  backgroundSource = backgrounds.bg024,
  overlaySource,
  onBack,
  backLabel,
  onSettings,
  settingsLabel,
  helpMode,
  children,
}: Props) {
  const { i18n } = useTranslation();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768 && width > height;
  const { logo, storeIconOverlay, logoBlockMarginTop, horizontalPadding } =
    useResponsive();
  const soundEnabled = useAuthStore((s) => s.settings.soundEnabled);
  const updateSettings = useAuthStore((s) => s.updateSettings);

  const logoSource = useMemo(() => {
    const sound = soundEnabled ? "MusicOn" : "MusicOff";
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
  }, [i18n.language, soundEnabled]);

  const toggleSound = () => {
    const next = !soundEnabled;
    updateSettings({ soundEnabled: next });
    AudioManager.setSoundEnabled(next);
  };

  // FullBleedStack lays the content out first and paints the background behind
  // it. With the background first, the content collapses to zero height and
  // only the background shows.
  return (
    <FullBleedStack
      rootStyle={styles.root}
      backdrop={
        <ImageBackgroundWithLoadGate
          source={backgroundSource}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          noBlur
        >
          <WarmBubblesOverlay variant="normal" />
        </ImageBackgroundWithLoadGate>
      }
    >
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.scroll, isTablet && styles.scrollTablet]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.column, isTablet && styles.columnTablet]}>
          <View style={[styles.logo, { paddingHorizontal: horizontalPadding }]}>
            <AnimatedLogoHero
              logoSource={logoSource}
              overlaySource={overlaySource}
              logoWidth={logo.width}
              logoHeight={logo.height}
              overlayLayout={storeIconOverlay}
              marginTop={Math.max(0, logoBlockMarginTop - LOGO_LIFT)}
              onPress={toggleSound}
            />
          </View>
          <View style={styles.sheet}>
            <SheetTopRow
              onBack={onBack}
              backLabel={backLabel}
              onSettings={onSettings}
              settingsLabel={settingsLabel}
              helpMode={helpMode}
            />
            {children}
          </View>
        </View>
      </ScrollView>
    </FullBleedStack>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  fill: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  scrollTablet: {
    alignItems: "center",
  },
  column: {
    width: "100%",
    flexGrow: 1,
  },
  columnTablet: {
    maxWidth: 560,
  },
  logo: {
    alignItems: "center",
  },
  // White panel under the logo: rounded top corners, square at the bottom edge.
  sheet: {
    flexGrow: 1,
    marginTop: SHEET_GAP,
    backgroundColor: TTL.bg,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
  },
  sheetTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    // Clear space before the content under the row.
    paddingBottom: 16,
  },
  sheetButton: {
    width: SHEET_BUTTON,
    height: SHEET_BUTTON,
    borderRadius: SHEET_BUTTON / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TTL.fill,
  },
  sheetTitle: {
    flex: 1,
    paddingHorizontal: 8,
  },
  sheetSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sheetButtonSlot: {
    width: SHEET_BUTTON,
  },
});
