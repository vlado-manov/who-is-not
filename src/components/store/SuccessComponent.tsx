// src/components/store/SuccessComponent.tsx
import React, { useState } from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";
import {
  Confetti,
  ContinuousConfetti,
  PIConfetti,
} from "react-native-fast-confetti";
import CustomButton from "../common/CustomButton";
import CustomText from "../common/CustomText";
import { ICharacter } from "../../types/character";

const { width, height } = Dimensions.get("window");

type Props = {
  visible: boolean;
  hero: ICharacter | null;
  onContinue: () => void;
};

export default function SuccessComponent({ visible, hero, onContinue }: Props) {
  if (!visible || !hero) return null;

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
            You've unlocked
          </CustomText>
          <CustomText variant="h4" className="mb-4 text-center">
            {hero.name}
          </CustomText>
        </View>
        <Image source={src} resizeMode="contain" className="h-[60%]" />
        <CustomButton
          title="Continue"
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
