import React, { useState } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import {
  CAM_CAPTION_BG,
  CAM_FONT,
  CAM_TEXT,
} from "../../screens/Cam/cam.constants";

type Props = {
  text: string;
  /** `lg` for instructions and countdown captions, `xl` for the question. */
  size?: "md" | "lg" | "xl";
  style?: StyleProp<ViewStyle>;
};

const LINE_PADDING_H = 10;
/** Neighbouring line boxes overlap slightly so they read as one shape. */
const LINE_OVERLAP = 2;

/**
 * TikTok-style caption: bold white text where every line gets its own black
 * rounded box hugging the text. The text is laid out once invisibly to learn
 * where it wraps, then each line is drawn in its own box.
 */
export default function CamCaption({ text, size = "md", style }: Props) {
  const [lines, setLines] = useState<string[]>([]);
  const textStyle =
    size === "xl" ? styles.textXl : size === "lg" ? styles.textLg : styles.textMd;

  return (
    <View style={[styles.wrap, style]}>
      <Text
        style={[textStyle, styles.measure]}
        maxFontSizeMultiplier={1.2}
        onTextLayout={(e) =>
          setLines(
            e.nativeEvent.lines
              .map((line) => line.text.trim())
              .filter((line) => line.length > 0),
          )
        }
      >
        {text}
      </Text>
      {lines.map((line, index) => (
        <View
          key={`${index}-${line}`}
          style={[styles.line, index > 0 && styles.lineOverlap]}
        >
          <Text
            style={textStyle}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.2}
          >
            {line}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "stretch",
    alignItems: "center",
    marginHorizontal: 16,
  },
  // Same width as the visible lines can use, so both wrap at the same words.
  measure: {
    position: "absolute",
    left: LINE_PADDING_H,
    right: LINE_PADDING_H,
    opacity: 0,
  },
  line: {
    backgroundColor: CAM_CAPTION_BG,
    borderRadius: 8,
    paddingHorizontal: LINE_PADDING_H,
    paddingVertical: 3,
  },
  lineOverlap: {
    marginTop: -LINE_OVERLAP,
  },
  textMd: {
    fontFamily: CAM_FONT.bold,
    fontSize: 20,
    lineHeight: 27,
    color: CAM_TEXT,
    textAlign: "center",
  },
  textXl: {
    fontFamily: CAM_FONT.extraBold,
    fontSize: 31,
    lineHeight: 40,
    color: CAM_TEXT,
    textAlign: "center",
  },
  textLg: {
    fontFamily: CAM_FONT.bold,
    fontSize: 25,
    lineHeight: 33,
    color: CAM_TEXT,
    textAlign: "center",
  },
});
