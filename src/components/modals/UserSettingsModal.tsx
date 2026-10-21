import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import CamButton from "../cam/CamButton";
import CamSheet from "../cam/CamSheet";
import CamSwitch from "../cam/CamSwitch";
import CamText from "../cam/CamText";
import { CAM_TEXT, CAM_UI } from "../../screens/Cam/cam.constants";
import { useAuthStore } from "../../store/useUserStore";
import AudioManager from "../../utils/audioManager";

export type Props = {
  visible: boolean;
  onClose: () => void;
  fromHeroPicker?: boolean;
  onHeroSetupExit?: () => void;
  fromGameplay?: boolean;
  onRefresh?: () => void;
};

const MUSIC_DEFAULT = 0.7;
/** The slider goes all the way down: at 0 the music is silent (and counts as off). */
const MUSIC_MIN = 0;
const MUSIC_STEP = 0.05;
const SFX_LEVEL = 0.8;

type RowProps = {
  label: string;
  sublabel: string;
  value: boolean;
  onToggle: () => void;
};

function SettingRow({ label, sublabel, value, onToggle }: RowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <CamText variant="body" numberOfLines={1}>
          {label}
        </CamText>
        <CamText variant="subtitle" numberOfLines={1} style={styles.sublabel}>
          {sublabel}
        </CamText>
      </View>
      <CamSwitch
        value={value}
        accessibilityLabel={label}
        onValueChange={() => {
          AudioManager.playButtonClick();
          onToggle();
        }}
      />
    </View>
  );
}

/**
 * The game's settings (menu gear and in-game gear) as a TikTok-style bottom
 * sheet: notifications, music with a volume slider, sound effects, and the
 * gameplay refresh / exit-setup actions where they apply.
 */
export default function UserSettingsModal({
  visible,
  onClose,
  fromHeroPicker = false,
  onHeroSetupExit,
  fromGameplay = false,
  onRefresh,
}: Props) {
  const { t } = useTranslation();
  const { settings, updateSettings } = useAuthStore();

  const musicOn = settings.musicLevel > 0;
  const sfxOn = settings.sfxLevel > 0;
  // Kept while music is off so turning it back on returns to the same volume.
  const [musicLevel, setMusicLevel] = useState(
    musicOn ? settings.musicLevel : MUSIC_DEFAULT,
  );

  const applyAudio = (nextMusic: boolean, nextSfx: boolean) => {
    // Turned back on after the slider was taken down to 0: start from the
    // default level, not from silence.
    const level = musicLevel > 0 ? musicLevel : MUSIC_DEFAULT;
    if (nextMusic && level !== musicLevel) setMusicLevel(level);
    updateSettings({
      soundEnabled: nextMusic, // tracks logo mute state; enabling music clears logo mute
      musicLevel: nextMusic ? level : 0,
      sfxLevel: nextSfx ? SFX_LEVEL : 0,
    });
    AudioManager.setMusicEnabled(nextMusic, level);
    AudioManager.setSfxEnabled(nextSfx, SFX_LEVEL);
  };

  const confirmExit = () =>
    Alert.alert(t("settings_exit_title"), t("settings_exit_body"), [
      { text: t("settings_cancel"), style: "cancel" },
      {
        text: t("settings_exit_confirm"),
        style: "destructive",
        onPress: () => {
          const exitSetup = onHeroSetupExit;
          onClose();
          setTimeout(() => exitSetup?.(), 50);
        },
      },
    ]);

  const confirmRefresh = () =>
    Alert.alert(t("gameplay_refresh_title"), t("gameplay_refresh_body"), [
      { text: t("settings_cancel"), style: "cancel" },
      {
        text: t("gameplay_refresh_confirm"),
        onPress: () => {
          onClose();
          onRefresh?.();
        },
      },
    ]);

  return (
    <CamSheet
      visible={visible}
      onClose={onClose}
      title={`${t("settings_title_1")} ${t("settings_title_2")}`}
      closeLabel={t("settings_cancel")}
    >
      <View>
        <SettingRow
          label={t("settings_notifications")}
          sublabel={
            settings.notificationsEnabled
              ? t("settings_notifications_on_sub")
              : t("settings_notifications_off_sub")
          }
          value={settings.notificationsEnabled}
          onToggle={() =>
            updateSettings({
              notificationsEnabled: !settings.notificationsEnabled,
            })
          }
        />
        <SettingRow
          label={t("settings_music")}
          sublabel={
            musicOn ? t("settings_music_on_sub") : t("settings_music_off_sub")
          }
          value={musicOn}
          onToggle={() => applyAudio(!musicOn, sfxOn)}
        />
        {musicOn && (
          <View style={styles.volume}>
            <Ionicons name="volume-low" size={20} color={CAM_TEXT} />
            <Slider
              style={styles.slider}
              accessibilityLabel={t("music_volume")}
              minimumValue={MUSIC_MIN}
              maximumValue={1}
              step={MUSIC_STEP}
              value={musicLevel}
              minimumTrackTintColor={CAM_UI.primary}
              maximumTrackTintColor={CAM_UI.secondaryBorder}
              thumbTintColor={CAM_TEXT}
              onValueChange={(level) => {
                setMusicLevel(level);
                // Heard right away, on the track that is playing.
                AudioManager.setMusicVolume(level);
              }}
              onSlidingComplete={(level) => {
                // All the way down is the same as switching the music off, so
                // it also stays off the next time the app opens.
                if (level <= 0) applyAudio(false, sfxOn);
                else updateSettings({ musicLevel: level });
              }}
            />
            <Ionicons name="volume-high" size={20} color={CAM_TEXT} />
          </View>
        )}
        <SettingRow
          label={t("settings_sfx")}
          sublabel={sfxOn ? t("settings_sfx_on_sub") : t("settings_sfx_off_sub")}
          value={sfxOn}
          onToggle={() => applyAudio(musicOn, !sfxOn)}
        />
      </View>

      {fromGameplay && onRefresh && (
        <CamButton
          title={t("gameplay_refresh")}
          variant="secondary"
          icon="refresh"
          onPress={confirmRefresh}
        />
      )}

      {fromHeroPicker && (
        <View style={styles.exit}>
          <CamButton title={t("settings_exit_setup")} onPress={confirmExit} />
          <CamText variant="subtitle" center style={styles.sublabel}>
            {t("settings_exit_hint")}
          </CamText>
        </View>
      )}
    </CamSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CAM_UI.secondaryBorder,
  },
  rowText: {
    flex: 1,
    justifyContent: "center",
    gap: 2,
  },
  sublabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  volume: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CAM_UI.secondaryBorder,
  },
  slider: {
    flex: 1,
    height: 32,
  },
  exit: {
    gap: 8,
  },
});
