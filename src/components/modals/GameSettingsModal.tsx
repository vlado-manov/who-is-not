// src/components/modals/GameSettingsModal.tsx
import { View, TouchableOpacity, Alert } from "react-native";
import React, { useMemo, useState } from "react";
import CustomText from "../common/CustomText";
import { EvilIcons, FontAwesome } from "@expo/vector-icons";
import CustomButton from "../common/CustomButton";
import { useGameStore, GamePackId } from "../../store/useGameStore";

type Props = {
  setGameSettingsVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

const PACKS: { id: GamePackId; name: string }[] = [
  { id: "main", name: "Main game" },
  { id: "custom", name: "Custom questions" },
  { id: "christmas", name: "Christmas Pack" },
  { id: "halloween", name: "Halloween pack" },
  { id: "festival", name: "Festival Pack" },
  { id: "adult18", name: "18+ Pack" },
];

const TIME_OPTIONS = [
  { label: "0:30", seconds: 30 },
  { label: "1:00", seconds: 60 },
  { label: "2:00", seconds: 120 },
  { label: "4:00", seconds: 240 },
  { label: "6:00", seconds: 360 },
  { label: "8:00", seconds: 480 },
  { label: "10:00", seconds: 600 },
  { label: "12:00", seconds: 720 },
];

const GameSettingsModal = ({ setGameSettingsVisible }: Props) => {
  const gameSettings = useGameStore((s) => s.gameSettings);
  const setGameSettings = useGameStore((s) => s.setGameSettings);

  const [selectedSec, setSelectedSec] = useState<number>(
    gameSettings?.discussionSeconds ?? 120
  );
  const [packs, setPacks] = useState<GamePackId[]>(
    gameSettings?.selectedPacks?.length ? gameSettings.selectedPacks : ["main"]
  );
  const [openDropdown, setOpenDropdown] = useState(false);

  const selectedLabel = useMemo(
    () => TIME_OPTIONS.find((o) => o.seconds === selectedSec)?.label ?? "2:00",
    [selectedSec]
  );

  const togglePack = (id: GamePackId) => {
    const has = packs.includes(id);
    if (has && packs.length === 1) {
      Alert.alert("Required", "At least one pack must be selected.");
      return;
    }
    if (has) {
      setPacks(packs.filter((x) => x !== id));
      return;
    }
    if (packs.length >= 2) {
      Alert.alert("Limit", "You can select up to 2 packs.");
      return;
    }
    setPacks([...packs, id]);
  };

  const onSave = () => {
    const finalPacks = packs.length ? packs : (["main"] as GamePackId[]);
    setGameSettings({
      discussionSeconds: selectedSec,
      selectedPacks: finalPacks,
    });
    setGameSettingsVisible(false);
  };

  return (
    <View className="absolute inset-0 bg-[rgba(0,0,0,0.85)] items-center justify-center w-full h-full z-[99] px-6">
      <TouchableOpacity
        className="absolute top-16 right-4 z-10"
        onPress={() => setGameSettingsVisible(false)}
      >
        <EvilIcons name="close" size={32} color="white" />
      </TouchableOpacity>

      <View className="bg-white rounded-2xl p-8 mt-8 w-full overflow-hidden justify-center gap-6">
        <View>
          <CustomText textColor="black" className="mb-2 font-opensans-bold">
            Time for discussion:
          </CustomText>

          <View className="relative">
            <TouchableOpacity
              className="border border-gray-300 rounded-xl px-4 py-3 bg-white"
              onPress={() => setOpenDropdown((v) => !v)}
            >
              <CustomText textColor="black">{selectedLabel}</CustomText>
            </TouchableOpacity>

            {openDropdown ? (
              <View className="absolute top-[52px] left-0 right-0 bg-white rounded-xl border border-gray-300 overflow-hidden z-10">
                {TIME_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.seconds}
                    className="px-4 py-3"
                    onPress={() => {
                      setSelectedSec(opt.seconds);
                      setOpenDropdown(false);
                    }}
                  >
                    <CustomText
                      textColor={
                        opt.seconds === selectedSec ? "#FA3A00" : "black"
                      }
                    >
                      {opt.label}
                    </CustomText>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <View>
          <CustomText textColor="black" className="mb-2 font-opensans-bold">
            Packages included:
          </CustomText>

          <View className="gap-3">
            {PACKS.map((p) => {
              const checked = packs.includes(p.id);
              return (
                <TouchableOpacity
                  key={p.id}
                  className="flex-row items-center justify-between px-4 py-3 bg-[#F7F7F7] rounded-xl"
                  onPress={() => togglePack(p.id)}
                >
                  <CustomText textColor="black">{p.name}</CustomText>
                  <View
                    className={`w-6 h-6 rounded-md border ${
                      checked
                        ? "bg-primary-500 border-primary-500"
                        : "border-gray-400"
                    } items-center justify-center`}
                  >
                    {checked ? (
                      <View className="w-6 h-6 rounded-md items-center justify-center bg-primary-500">
                        <FontAwesome name="check" size={14} color="white" />
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <CustomButton title="Save" buttonClassName="mt-4" onPress={onSave} />
    </View>
  );
};

export default GameSettingsModal;
