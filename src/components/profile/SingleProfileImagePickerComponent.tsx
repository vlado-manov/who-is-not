import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { ICharacter } from "../../types/character";
import { AvatarId } from "../../../assets/characters";
import { useAuthStore } from "../../store/useUserStore";
import { FontAwesome } from "@expo/vector-icons";
import AudioManager from "../../utils/audioManager";

type Props = {
  item: ICharacter;
};
const SingleProfileImagePickerComponent = ({ item }: Props) => {
  const updateAvatar = useAuthStore((s) => s.updateAvatar);
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        AudioManager.playButtonClick();
        item.unlocked ? updateAvatar(item.slug as AvatarId) : null;
      }}
      className="items-center relative focus:scale-100 active_scale-100"
    >
      <Image
        key={`profile-picker-${item.id}`}
        source={item.profileImage}
        resizeMode="contain"
        fadeDuration={0}
        className="w-[132px] h-[132px]"
        blurRadius={item.unlocked ? 0 : 4}
      />
      {!item.unlocked && (
        <View className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <FontAwesome name="lock" size={64} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default SingleProfileImagePickerComponent;
