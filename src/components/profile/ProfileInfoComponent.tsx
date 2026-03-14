import { View, TouchableOpacity, Animated } from "react-native";
import React, { useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";
import ProfileImageComponent from "./ProfileImageComponent";
import { useAuthStore } from "../../store/useUserStore";
import CustomText from "../common/CustomText";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

type Props = {
  setImagePickerVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

const ProfileInfoComponent = ({ setImagePickerVisible }: Props) => {
  const { t } = useTranslation();
  const authStatus = useAuthStore((s) => s.authStatus);
  const userName = useAuthStore((s) => s.user.name);
  const userId = useAuthStore((s) => s.user.id);

  const [copied, setCopied] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleCopy = async () => {
    if (!userId) return;
    await Clipboard.setStringAsync(String(userId));
    setCopied(true);

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setCopied(false));
  };

  return (
    <View className="items-center">
      <ProfileImageComponent setImagePickerVisible={setImagePickerVisible} />
      <View className="flex-row gap-2 items-center">
        <CustomText
          variant="h4-headline"
          className="text-center font-opensans-bold"
        >
          {userName}
        </CustomText>
      </View>

      {authStatus === "guest" ? (
        <CustomText variant="p">{t("guest_playing")}</CustomText>
      ) : (
        <View className="flex-row items-center gap-2 mt-2">
          <CustomText>ID: {userId}</CustomText>
          <TouchableOpacity onPress={handleCopy}>
            <Ionicons name="copy" size={18} color="white" />
          </TouchableOpacity>
        </View>
      )}

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [4, 0],
              }),
            },
          ],
        }}
      >
        {copied && (
          <CustomText className="text-xs text-white/80 mt-1">
            {t("copied_to_clipboard")}
          </CustomText>
        )}
      </Animated.View>
    </View>
  );
};

export default ProfileInfoComponent;
