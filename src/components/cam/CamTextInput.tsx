import React from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

import CamText from "./CamText";
import { CAM_FONT, CAM_TEXT, CAM_UI } from "../../screens/Cam/cam.constants";

type Props = Omit<TextInputProps, "style" | "value" | "onChangeText"> & {
  value: string;
  onChangeText: (text: string) => void;
  maxLength: number;
};

/**
 * TikTok-style field: translucent rounded box, white text, red caret and a
 * character counter on the right. Deliberately not `CustomInput`.
 */
export default function CamTextInput({
  value,
  onChangeText,
  maxLength,
  ...rest
}: Props) {
  // `multiline` turns the field into a text area: taller, text from the top.
  const area = rest.multiline === true;
  return (
    <View style={[styles.field, area && styles.fieldArea]}>
      <TextInput
        autoCorrect={false}
        maxFontSizeMultiplier={1.2}
        {...rest}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        placeholderTextColor={CAM_UI.placeholder}
        selectionColor={CAM_UI.primary}
        cursorColor={CAM_UI.primary}
        keyboardAppearance="dark"
        style={[styles.input, area && styles.inputArea]}
      />
      <CamText
        variant="subtitle"
        style={[styles.counter, area && styles.counterArea]}
      >
        {`${value.length}/${maxLength}`}
      </CamText>
    </View>
  );
}

/** Height of the multi-line version. */
const AREA_HEIGHT = 150;

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderRadius: CAM_UI.radius,
    backgroundColor: CAM_UI.inputBg,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    fontFamily: CAM_FONT.semiBold,
    fontSize: 17,
    color: CAM_TEXT,
    padding: 0,
  },
  counter: {
    fontSize: 13,
  },
  fieldArea: {
    height: AREA_HEIGHT,
    alignItems: "flex-start",
    paddingTop: 12,
    paddingBottom: 26,
  },
  inputArea: {
    // Text and placeholder start at the top-left, under the same padding.
    textAlignVertical: "top",
    lineHeight: 22,
  },
  counterArea: {
    position: "absolute",
    right: 14,
    bottom: 6,
  },
});
