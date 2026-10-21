import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import CamButton from "../cam/CamButton";
import CamSheet from "../cam/CamSheet";
import SingleProfileImagePickerComponent from "./SingleProfileImagePickerComponent";
import { useHeroesStore } from "../../store/useHeroesStore";
import { useAuthStore } from "../../store/useUserStore";

const SEPARATOR = 12;

type Props = {
  setImagePickerVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

/**
 * Profile picture picker as a TikTok-style bottom sheet: swipe through the
 * heroes, tap one to use it (locked heroes stay greyed out with a lock).
 */
export default function ProfileImagePickerComponent({
  setImagePickerVisible,
}: Props) {
  const { t } = useTranslation();
  const heroes = useHeroesStore((s) => s.heroes);
  const userAvatarId = useAuthStore((s) => s.user.avatarId);
  const close = () => setImagePickerVisible(false);

  if (heroes.length === 0) return null;

  return (
    <CamSheet
      visible
      onClose={close}
      title={t("pick_profile_image")}
      closeLabel={t("close")}
    >
      <FlatList
        data={heroes}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        // Bleeds to the sheet edges so the row can scroll under them.
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: SEPARATOR }} />}
        renderItem={({ item }) => (
          <SingleProfileImagePickerComponent
            item={item}
            selected={item.slug === userAvatarId}
          />
        )}
      />
      <CamButton title={t("close")} onPress={close} />
    </CamSheet>
  );
}

const styles = StyleSheet.create({
  list: {
    marginHorizontal: -20,
  },
  listContent: {
    paddingHorizontal: 20,
  },
});
