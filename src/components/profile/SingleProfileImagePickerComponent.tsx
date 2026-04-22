import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import AppImage from "../AppImage";
import React from "react";
import { ICharacter } from "../../types/character";
import { AvatarId } from "../../../assets/characters";
import { useAuthStore } from "../../store/useUserStore";
import { FontAwesome } from "@expo/vector-icons";
import AudioManager from "../../utils/audioManager";
import PlayerDeathGrayscaleImage from "../game/PlayerDeathGrayscaleImage";

const AVATAR_SIZE = 148;

type Props = {
  item: ICharacter;
  selected?: boolean;
};
const SingleProfileImagePickerComponent = ({ item, selected }: Props) => {
  const updateAvatar = useAuthStore((s) => s.updateAvatar);
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        AudioManager.playButtonClick();
        item.unlocked ? updateAvatar(item.slug as AvatarId) : null;
      }}
      style={[styles.wrapper, selected && styles.wrapperSelected]}
    >
      {item.unlocked ? (
        <AppImage
          key={`profile-picker-${item.id}`}
          source={item.profileImage}
          contentFit="contain"
          style={styles.avatar}
        />
      ) : (
        <PlayerDeathGrayscaleImage
          source={item.profileImage}
          size={AVATAR_SIZE}
        />
      )}
      {!item.unlocked && (
        <View style={styles.lockWrap}>
          <FontAwesome name="lock" size={64} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "transparent",
  },
  wrapperSelected: {
    borderColor: "rgba(251,192,32,0.95)",
    ...(Platform.OS === "ios"
      ? {
          shadowColor: "#ffd800",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 12,
        }
      : { elevation: 12 }),
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  lockWrap: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    marginTop: -32,
  },
});

export default SingleProfileImagePickerComponent;
