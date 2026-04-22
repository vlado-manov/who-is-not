import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import ImageBackgroundWithLoadGate from "../components/ImageBackgroundWithLoadGate";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { navigateBackSafe } from "../navigation/navigateBackSafe";
import { StackNavigationProp } from "@react-navigation/stack";
import { OnboardingStackParamList } from "../navigation/types";
import { useAuthStore } from "../store/useUserStore";
import AudioManager from "../utils/audioManager";
import CustomText from "../components/common/CustomText";
import CustomInput from "../components/common/CustomInput";
import CustomButton from "../components/common/CustomButton";
import { backgrounds } from "../../assets/backgrounds";
import { useTranslation } from "react-i18next";
import ScreenTopBar from "../components/common/ScreenTopBar";
import { useResponsive } from "../utils/responsive";

type Nav = StackNavigationProp<OnboardingStackParamList, "Settings">;

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { horizontalPadding, topIconSize } = useResponsive();

  const { isGuest, name, email } = useAuthStore((s) => s.user);
  const updateName = useAuthStore((s) => s.updateName);
  const { settings, updateSettings } = useAuthStore();

  const [newName, setNewName] = useState(name ?? "");

  const canSubmitName = useMemo(() => {
    const trimmed = newName.trim();
    return trimmed.length > 0 && trimmed !== (name ?? "");
  }, [newName, name]);

  const submitName = () => {
    if (!canSubmitName) return;
    updateName(newName.trim());
  };

  const toggleNotifications = () => {
    updateSettings({ notificationsEnabled: !settings.notificationsEnabled });
  };

  const musicOn = settings.musicLevel > 0;
  const sfxOn = settings.sfxLevel > 0;

  const applyAudioSettings = (nextMusicOn: boolean, nextSfxOn: boolean) => {
    const nextMusicLevel = nextMusicOn ? 0.7 : 0;
    const nextSfxLevel = nextSfxOn ? 0.8 : 0;
    const nextEnabled = nextMusicOn || nextSfxOn;

    updateSettings({
      soundEnabled: nextEnabled,
      musicLevel: nextMusicLevel,
      sfxLevel: nextSfxLevel,
    });

    AudioManager.setSoundEnabled(nextEnabled);
    AudioManager.setMusicEnabled(nextMusicOn, nextMusicLevel);
    AudioManager.setSfxEnabled(nextSfxOn, nextSfxLevel);
  };

  const toggleMusic = () => applyAudioSettings(!musicOn, sfxOn);
  const toggleSfx = () => applyAudioSettings(musicOn, !sfxOn);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
        <ImageBackgroundWithLoadGate
          source={backgrounds.bg023}
          showChildrenWhileLoading
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          <ScreenTopBar
            variant="soloBackFromCenter"
            horizontalPadding={horizontalPadding}
            topIconSize={topIconSize}
            showBack
            onSettings={() => {}}
            onProfile={() => {}}
            onBack={() => navigateBackSafe(navigation)}
            backAccessibilityLabel={t("back_btn")}
          />
          <KeyboardAvoidingView
            behavior={Platform.select({ ios: "padding", android: undefined })}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                paddingBottom: 56,
                paddingTop: 72,
              }}
              keyboardShouldPersistTaps="handled"
            >
            <View className="items-center w-full justify-center px-4 mt-2 mb-2">
              <CustomText variant="h3-headline" className="text-center w-full" shadow>
                {t("settings_title_1")}
              </CustomText>
              <CustomText variant="h3" className="-rotate-3 text-center w-full" shadow>
                {t("settings_title_2")}
              </CustomText>
            </View>

            <View style={{ flex: 1, justifyContent: "center" }}>
              <View className="w-full items-center gap-6">
                {!isGuest && (
                  <View className="w-[80%]">
                    {!!email && (
                      <CustomText variant="p" className="text-center mb-2">
                        {email}
                      </CustomText>
                    )}
                    <CustomInput
                      value={newName}
                      onChangeText={setNewName}
                      returnKeyType="done"
                      maxLength={12}
                    />
                    <View className="mt-6">
                      <CustomButton
                        title={t("change_name")}
                        btnSize="sm"
                        fullWidth
                        buttonClassName="w-full m-auto"
                        onPress={submitName}
                        disabled={!canSubmitName}
                        backgroundImage={backgrounds.bg026}
                        shadowColor="#005f07"
                      />
                    </View>
                  </View>
                )}

                <View className="w-[80%]">
                  <CustomButton
                    title={
                      settings.notificationsEnabled
                        ? t("notifications_on")
                        : t("notifications_off")
                    }
                    btnSize="sm"
                    fullWidth
                    buttonClassName="w-[80%] -rotate-1 m-auto"
                    onPress={toggleNotifications}
                    appearance={settings.notificationsEnabled ? "secondary" : "danger"}
                  />
                </View>

                <View className="w-[80%]">
                  <CustomButton
                    title={musicOn ? t("music_on") : t("music_off")}
                    btnSize="sm"
                    fullWidth
                    buttonClassName="w-[80%] m-auto"
                    onPress={toggleMusic}
                    appearance={musicOn ? "primary" : "danger"}
                  />
                </View>

                <View className="w-[80%]">
                  <CustomButton
                    title={sfxOn ? t("sfx_on") : t("sfx_off")}
                    btnSize="sm"
                    fullWidth
                    buttonClassName="w-[80%] m-auto"
                    onPress={toggleSfx}
                    appearance={sfxOn ? "tertiary" : "danger"}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackgroundWithLoadGate>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  safe: { flex: 1, backgroundColor: "transparent" },
});