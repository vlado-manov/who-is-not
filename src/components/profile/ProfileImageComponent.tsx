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
type Props = {
  setImagePickerVisible: React.Dispatch<React.SetStateAction<boolean>>;
};
const ProfileImageComponent = ({ setImagePickerVisible }: Props) => {
  const authStatus = useAuthStore((s) => s.authStatus);
  const avatarId = useAuthStore((s) => s.user.avatarId);
  const toSrc = (img: string | ImageSourcePropType): ImageSourcePropType =>
    typeof img === "string" ? { uri: img } : (img as ImageSourcePropType);
  return (
    <View className="items-center pt-8 relative">
      <View className="relative">
        <Image
          source={toSrc(character_avatars[avatarId])}
          resizeMode="contain"
          className="w-[190px] h-[195px]"
        />

        {authStatus != "guest" && (
          <TouchableOpacity
            className="rounded-full bg-white p-3 shadow-customBlack-500 absolute top-2 right-6"
            onPress={() => setImagePickerVisible(true)}
          >
            <FontAwesome5 name="pen" size={20} color="#FA3A00" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default ProfileImageComponent;
