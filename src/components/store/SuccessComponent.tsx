// src/components/store/SuccessComponent.tsx
import React, { useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import AppImage from "../AppImage";
import {
  Confetti,
  ContinuousConfetti,
  PIConfetti,
} from "react-native-fast-confetti";
import CustomButton from "../common/CustomButton";
import CustomText from "../common/CustomText";
import { ICharacter } from "../../types/character";
import AudioManager from "../../utils/audioManager";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

type Props = {
  visible: boolean;
  hero: ICharacter | null;
  onContinue: () => void;
};

export default function SuccessComponent({ visible, hero, onContinue }: Props) {
  const { t } = useTranslation();
  if (!visible || !hero) return null;
  AudioManager.playHeroBuy();
  const src = (hero.main_image as any) ?? (hero.profileImage as any);
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <ContinuousConfetti
        count={33}
        colors={["#FF3B30", "#02BA1D", "#CACA23", "#FA8900", "#C44CD7"]}
        flakeSize={{ width: 8, height: 14 }}
        fallDuration={6000}
        cannonsPositions={[
          {
            x: layout.width / 2,
            y: layout.height - 5,
          },
        ]}
        containerStyle={styles.confettiFill}
      />
      <View style={styles.center}>
        <View className="text-center justify-center items-center flex">
          <CustomText variant="h3-headline" className="text-white mt-[40px]">
            {t("you_unlocked")}
          </CustomText>
          <CustomText variant="h4" className="mb-4 text-center">
            {hero.name}
          </CustomText>
        </View>
        <AppImage source={src} contentFit="contain" className="h-[60%]" style={{ width: 200, height: 300 }} />
        <CustomButton
          title={t("continue_btn")}
          color="bg-primary-500"
          onPress={onContinue}
          buttonClassName="mt-8"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  confettiFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  center: { alignItems: "center", justifyContent: "space-between" },
});
