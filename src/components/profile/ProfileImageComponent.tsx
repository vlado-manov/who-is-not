import {
  View,
  ImageSourcePropType,
  TouchableOpacity,
} from "react-native";
import AppImage from "../AppImage";
import React from "react";
import { useAuthStore } from "../../store/useUserStore";
import { FontAwesome5 } from "@expo/vector-icons";
import AudioManager from "../../utils/audioManager";
import { useHeroesStore } from "../../store/useHeroesStore";

const SILENT_VANESSA_ID = "cmlt8yz96000etbesm149mii8";

type Props = {
  setImagePickerVisible: React.Dispatch<React.SetStateAction<boolean>>;
};
const ProfileImageComponent = ({ setImagePickerVisible }: Props) => {
  const authStatus = useAuthStore((s) => s.authStatus);
  const avatarId = useAuthStore((s) => s.user.avatarId);
  const heroes = useHeroesStore((s) => s.heroes);
  const toSrc = (img: string | ImageSourcePropType): ImageSourcePropType =>
    typeof img === "string" ? { uri: img } : (img as ImageSourcePropType);
  const selectedHeroAvatar = heroes.find((h) => h.slug === avatarId)?.profileImage;
  const silentVanessaAvatar =
    heroes.find((h) => h.id === SILENT_VANESSA_ID)?.profileImage ??
    heroes.find((h) => h.name === "Silent Vanessa")?.profileImage;
  const avatarSource = selectedHeroAvatar ?? silentVanessaAvatar;
  return (
    <View className="items-center pt-8 relative">
      <View className="relative">
        {avatarSource && (
          <AppImage
            source={toSrc(avatarSource)}
            contentFit="contain"
            className="w-[190px] h-[195px]"
            style={{ width: 190, height: 195 }}
          />
        )}

        {authStatus != "guest" && (
          <TouchableOpacity
            className="rounded-full bg-white p-3 shadow-customBlack-500 absolute top-2 right-6"
            onPress={() => {
              AudioManager.playButtonClick();
              setImagePickerVisible(true);
            }}
          >
            <FontAwesome5 name="pen" size={20} color="#FA3A00" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default ProfileImageComponent;
