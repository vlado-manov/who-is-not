import React from "react";
import { StyleSheet, View } from "react-native";

import CamButton from "./CamButton";
import CamSheet from "./CamSheet";
import CamText from "./CamText";

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  body?: string;
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
};

/** TikTok-style confirmation: a bottom sheet with a note and Cancel / Confirm. */
export default function CamConfirmSheet({
  visible,
  onClose,
  title,
  body,
  cancelLabel,
  confirmLabel,
  onConfirm,
}: Props) {
  return (
    <CamSheet
      visible={visible}
      onClose={onClose}
      title={title}
      closeLabel={cancelLabel}
    >
      {!!body && (
        <CamText variant="subtitle" center>
          {body}
        </CamText>
      )}
      <View style={styles.row}>
        <CamButton
          title={cancelLabel}
          variant="secondary"
          style={styles.button}
          onPress={onClose}
        />
        <CamButton title={confirmLabel} style={styles.button} onPress={onConfirm} />
      </View>
    </CamSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
