import React, { useRef } from "react";
import {
  Modal,
  View,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppImage from "../../components/AppImage";
import CustomText from "../../components/common/CustomText";
import { useHeroesStore } from "../../store/useHeroesStore";
import type { ICharacter } from "../../types/character";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (heroId: string) => void;
};

const NUM_COLUMNS = 4;
const SCREEN_W = Dimensions.get("window").width;
const H_PAD = 16;
const GAP = 6;
const CELL_SIZE = Math.floor(
  (SCREEN_W - H_PAD * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS
);

export default function DevHeroPickerModal({ visible, onClose, onSelect }: Props) {
  const heroes = useHeroesStore((s) => s.heroes);

  const handleSelect = (heroId: string) => {
    onSelect(heroId);
    onClose();
  };

  const renderItem = ({ item }: { item: ICharacter }) => (
    <Pressable
      onPress={() => handleSelect(item.id)}
      style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}
    >
      <AppImage
        source={item.profileImage}
        style={styles.portrait}
        contentFit="cover"
      />
      <CustomText variant="p-small" style={styles.name} numberOfLines={1}>
        {item.name}
      </CustomText>
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container} edges={["top", "bottom", "left", "right"]}>
          <CustomText variant="h5" style={styles.title}>
            Select Hero
          </CustomText>
          <FlatList
            data={heroes}
            keyExtractor={(h) => h.id}
            numColumns={NUM_COLUMNS}
            renderItem={renderItem}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
          />
          <Pressable onPress={onClose} style={styles.cancelBtn}>
            <CustomText variant="p" style={styles.cancelText}>
              Cancel
            </CustomText>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
  },
  container: {
    flex: 1,
    paddingHorizontal: H_PAD,
  },
  title: {
    color: "#f5d76e",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  grid: {
    paddingBottom: 12,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  cell: {
    width: CELL_SIZE,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#333",
    backgroundColor: "#111",
  },
  cellPressed: {
    borderColor: "#f5d76e",
    backgroundColor: "#1a1600",
  },
  portrait: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  name: {
    color: "#ccc",
    fontSize: 9,
    textAlign: "center",
    paddingHorizontal: 2,
    paddingVertical: 3,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  cancelText: {
    color: "#888",
  },
});
