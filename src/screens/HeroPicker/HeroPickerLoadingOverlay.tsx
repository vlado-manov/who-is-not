import React from "react";
import { StyleSheet, View } from "react-native";
import LoadingScreen from "../../components/LoadingScreen";
import { backgrounds } from "../../../assets/backgrounds";

/** Пълен екран с фон под статус лентата; съдържанието е inset-нато така, че лентата да остане видима. */
export default function HeroPickerLoadingOverlay() {
  return (
    <View style={styles.root}>
      <LoadingScreen
        skipIntroAnimation
        fullScreenWithStatusBar
        backgroundSource={backgrounds.bg024}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
});
