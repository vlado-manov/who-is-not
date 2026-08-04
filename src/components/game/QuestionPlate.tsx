// src/components/game/QuestionPlate.tsx
import React from "react";
import { View, ImageBackground, StyleSheet } from "react-native";
import CustomText from "../common/CustomText";

type Mode = "light" | "dark";

type Props = {
  title?: string;
  text: string;
  subtitle?: string;
  mode?: Mode;
  background: any;
  textVariant?: "h5" | "h5-headline" | "h6-headline";
  textColorOverride?: string;
};

const THEME = {
  light: {
    text: "#592410",
    subText: "#762a05",

    divider: "rgba(89,36,16,0.5)",

    shadowColor: "#ffffff",
    glowColor: "#ffd800",

    borderTop: "rgba(251,192,32,1)",
    borderBottom: "rgba(160,110,60,0.7)",
  },

  dark: {
    text: "#f2d6c9",
    subText: "#e2a08a",

    divider: "rgba(200,80,60,0.5)",

    shadowColor: "#3b0000",
    glowColor: "#ff3b00",

    borderTop: "rgba(255,80,40,0.9)",
    borderBottom: "rgba(120,20,10,0.9)",
  },
};

const QuestionPlate = ({
  title,
  text,
  subtitle,
  background,
  mode = "light",
  textVariant = "h5",
  textColorOverride,
}: Props) => {
  const theme = THEME[mode];

  return (
    <View
      style={[
        styles.shadow,
        {
          shadowColor: theme.shadowColor,
        },
      ]}
    >
      <ImageBackground
        source={background}
        resizeMode="stretch"
        imageStyle={{ borderRadius: 18 }}
        style={[
          styles.plate,
          {
            shadowColor: theme.glowColor,
            borderTopColor: theme.borderTop,
            borderBottomColor: theme.borderBottom,
          },
        ]}
      >
        {title && (
          <>
            <CustomText
              variant="p-small"
              className="text-center"
              textColor={theme.subText}
              sizeDelta={2}
              style={{ fontFamily: "Onest-SemiBold" }}
            >
              {title}
            </CustomText>

            <View
              style={[styles.divider, { backgroundColor: theme.divider }]}
            />
          </>
        )}

        <CustomText
          variant={textVariant}
          className="text-center"
          textColor={textColorOverride ?? theme.text}
          allowWrap
          sizeDelta={10}
          style={{ fontFamily: "SofiaSansExtraCondensed-SemiBold" }}
        >
          {text}
        </CustomText>

        {subtitle && (
          <>
            <View
              style={[styles.divider, { backgroundColor: theme.divider }]}
            />
            <CustomText
              variant="p-small"
              className="text-center"
              textColor={theme.subText}
              sizeDelta={2}
              style={{ fontFamily: "Onest-SemiBold" }}
            >
              {subtitle}
            </CustomText>
          </>
        )}
      </ImageBackground>
    </View>
  );
};

export default QuestionPlate;

const styles = StyleSheet.create({
  shadow: {
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 14,
  },

  plate: {
    borderRadius: 18,
    paddingHorizontal: 32,
    paddingVertical: 24,
    alignItems: "center",

    shadowOpacity: 0.85,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 14,

    borderTopWidth: 1,
    borderBottomWidth: 1,
  },

  divider: {
    width: "88%",
    height: 1,
    marginVertical: 8,
  },
});
