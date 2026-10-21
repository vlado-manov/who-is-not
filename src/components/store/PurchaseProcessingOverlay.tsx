import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import CamText from "../cam/CamText";
import { TT } from "../../constants/tiktokTheme";

/** Shown between tapping Unlock and the purchase confirmation. */
export default function PurchaseProcessingOverlay() {
  const { t } = useTranslation();

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={TT.text} />
        <CamText variant="body" center>
          {t("store_processing")}
        </CamText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9998,
    elevation: 9998,
  },
  card: {
    minWidth: 200,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 16,
    backgroundColor: TT.surface,
    gap: 14,
  },
});
