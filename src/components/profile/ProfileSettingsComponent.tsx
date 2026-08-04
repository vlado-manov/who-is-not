// src/components/profile/ProfileSettingsComponent.tsx
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useMemo, useState } from "react";
import CustomText from "../common/CustomText";
import { Entypo, FontAwesome5 } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import CustomButton from "../common/CustomButton";
import { useAuthStore } from "../../store/useUserStore";
import AudioManager from "../../utils/audioManager";
import CustomInput from "../common/CustomInput";

type Props = {
  setSettingsVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

const ProfileSettingsComponent = ({ setSettingsVisible }: Props) => {
  const { t } = useTranslation();
  const { isGuest, name, email } = useAuthStore((s) => s.user);
  const updateName = useAuthStore((s) => s.updateName);
  const { settings, updateSettings } = useAuthStore();

  const [newName, setNewName] = useState(name ?? "");

  const toggleSound = () => {
    const newVal = !settings.soundEnabled;
    updateSettings({ soundEnabled: newVal });
    AudioManager.setSoundEnabled(newVal);
  };

  const toggleNotifications = () => {
    const newVal = !settings.notificationsEnabled;
    updateSettings({ notificationsEnabled: newVal });
  };

  const canSubmitName = useMemo(() => {
    const trimmed = newName.trim();
    return trimmed.length > 0 && trimmed !== (name ?? "");
  }, [newName, name]);

  const submitName = () => {
    if (!canSubmitName) return;
    updateName(newName.trim());
  };

  return (
    <View className="bg-[rgba(0,0,0,0.9)] absolute inset-0">
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 56,
            paddingTop: 64,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-8">
            <TouchableOpacity
              onPress={() => {
                AudioManager.playButtonClick();
                setSettingsVisible(false);
              }}
              className="flex flex-row gap-2 items-center"
            >
              <Entypo name="arrow-with-circle-left" size={48} color="white" />
            </TouchableOpacity>
          </View>

          <View className="items-center w-full justify-center px-4 mt-6 mb-2">
            <CustomText
              variant="h3-headline"
              className="text-center w-full"
              shadow
            >
              Profile
            </CustomText>
            <CustomText
              variant="h3"
              className="-rotate-3 text-center w-full"
              shadow
            >
              Settings
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
                      title="Change name"
                      color="bg-primary-700"
                      btnSize="md"
                      fontSize="md"
                      fullWidth
                      buttonClassName="w-full m-auto"
                      onPress={submitName}
                      disabled={!canSubmitName}
                    />
                  </View>
                </View>
              )}

              <View className="w-[80%]">
                <CustomButton
                  title={
                    settings.notificationsEnabled
                      ? "Notifications: ON"
                      : "Notifications: OFF"
                  }
                  color={
                    settings.notificationsEnabled
                      ? "bg-primary-100"
                      : "bg-customBlack-500"
                  }
                  btnSize="sm"
                  fullWidth
                  buttonClassName="w-[80%] -rotate-1 m-auto"
                  onPress={toggleNotifications}
                />
              </View>

              <View className="w-[80%]">
                <CustomButton
                  title={settings.soundEnabled ? "Sound: ON" : "Sound: OFF"}
                  color={
                    settings.soundEnabled ? "bg-primary-400" : "bg-primary-500"
                  }
                  btnSize="sm"
                  fullWidth
                  buttonClassName="w-[80%] m-auto"
                  onPress={toggleSound}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ProfileSettingsComponent;
