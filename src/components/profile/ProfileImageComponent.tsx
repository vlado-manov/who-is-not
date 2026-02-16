import {
  View,
  Image,
  ImageSourcePropType,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { useAuthStore } from "../../store/useUserStore";
import { character_avatars } from "../../../assets/characters";
import { FontAwesome5 } from "@expo/vector-icons";
import AudioManager from "../../utils/audioManager";
import { useHeroesStore } from "../../store/useHeroesStore";
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
  const avatarSource = selectedHeroAvatar ?? character_avatars[avatarId];
  return (
    <View className="items-center pt-8 relative">
      <View className="relative">
        <Image
          source={toSrc(avatarSource)}
          resizeMode="contain"
          fadeDuration={0}
          className="w-[190px] h-[195px]"
        />

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
