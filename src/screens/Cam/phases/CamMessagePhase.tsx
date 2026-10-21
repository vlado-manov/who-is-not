import React from "react";
import { StyleSheet, View } from "react-native";

import CamButton from "../../../components/cam/CamButton";
import CamText from "../../../components/cam/CamText";

type Props = {
  title: string;
  body?: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Over a player-colour tint the main button is white instead of red. */
  onTint?: boolean;
  /** The title is a question: larger text, and the body reads as a note. */
  isQuestion?: boolean;
};

/** Centred text over the tinted camera with one or two buttons underneath. */
export default function CamMessagePhase({
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  onTint = false,
  isQuestion = false,
}: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.texts}>
        <CamText variant={isQuestion ? "question" : "title"} center shadow>
          {title}
        </CamText>
        {!!body && (
          <CamText variant={isQuestion ? "body" : "subtitle"} center shadow>
            {body}
          </CamText>
        )}
      </View>
      <View style={styles.buttons}>
        <CamButton
          title={primaryLabel}
          variant={onTint ? "light" : "primary"}
          onPress={onPrimary}
        />
        {!!secondaryLabel && (
          <CamButton
            title={secondaryLabel}
            variant="secondary"
            onPress={onSecondary}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  texts: {
    flex: 1,
    justifyContent: "center",
    gap: 14,
  },
  buttons: {
    gap: 12,
  },
});
