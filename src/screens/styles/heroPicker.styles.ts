// src/screens/styles/heroPicker.styles.ts
import { StyleSheet } from "react-native";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getArrowMetrics = (windowWidth: number) => {
  const t = clamp((windowWidth - 360) / 70, 0, 1);
  const height = Math.round(48 + t * 8);
  const width = Math.round(height * 1.0357);
  const sideOffset = Math.round(14 + t * 10);
  return { width, height, sideOffset };
};

export const createHeroPickerStyles = (
  quoteOverlayTop: number,
  windowWidth: number,
) => {
  const arrow = getArrowMetrics(windowWidth);
  return StyleSheet.create({
    stage: {
      position: "relative",
      width: "100%",
      flex: 1,
      minHeight: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    heroImageContainer: {
      width: "100%",
      height: "100%",
    },

    heroImageWrap: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    heroImage: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
    },
    arrowLeft: {
      position: "absolute",
      left: arrow.sideOffset,
      top: "50%",
      transform: [{ translateY: -arrow.height / 2 }],
      zIndex: 50,
    },
    arrowRight: {
      position: "absolute",
      right: arrow.sideOffset,
      top: "50%",
      transform: [{ translateY: -arrow.height / 2 }],
      zIndex: 50,
    },
    arrowIcon: {
      width: arrow.width,
      height: arrow.height,
    },
    lockOverlay: {
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },
    backgroundOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "black",
      zIndex: 5,
    },
    contentLayer: {
      flex: 1,
      zIndex: 10,
    },
    quoteBubble: {
      backgroundColor: "#FFFFFF",
      borderRadius: 22,
      paddingVertical: 18,
      paddingHorizontal: 22,
      minWidth: "92%",
      maxWidth: "92%",
      alignSelf: "center",
      flexShrink: 1,
    },
    quoteBubbleShadow: {
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    quoteBubbleTailWrap: {
      position: "absolute",
      bottom: -14,
      left: "50%",
      transform: [{ translateX: -12 }],
    },
    quoteBubbleTail: {
      width: 0,
      height: 0,
      borderLeftWidth: 12,
      borderRightWidth: 12,
      borderTopWidth: 14,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      borderTopColor: "#FFFFFF",
    },
    heroFooterWrap: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 0,
    },
    namePlateShadow: {
      shadowColor: "#642200",
      shadowOpacity: 1,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 8 },
      elevation: 14,
    },
    quoteOverlay: {
      position: "absolute",
      top: quoteOverlayTop,
      left: 0,
      right: 0,
      alignItems: "center",
      zIndex: 40,
      paddingHorizontal: 16,
    },
    namePlate: {
      borderRadius: 18,
      paddingHorizontal: 32,
      paddingVertical: 8,
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.8,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 4 },
      elevation: 14,
      borderTopWidth: 1,
      borderTopColor: "rgba(251,192,32,1)",
      borderBottomWidth: 1,
      borderBottomColor: "rgba(160,110,60,0.7)",
    },
    nameDivider: {
      width: "88%",
      height: 1,
      marginVertical: 6,
      backgroundColor: "rgba(89,36,16,0.5)",
    },
    heroCtaWrap: {
      marginTop: 14,
      transform: [{ translateY: 6 }],
    },
    nameOverlay: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 60,
      paddingHorizontal: 20,
    },
    nameOverlayInner: {
      backgroundColor: "rgba(255,255,255,0.96)",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      paddingBottom: 28,
      paddingHorizontal: 20,
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: -6 },
      elevation: 18,
    },
    namingOverlay: {
      position: "absolute",
      top: "40%",
      left: 0,
      right: 0,
      alignItems: "center",
      zIndex: 50,
    },
    sepiaImageOverlay: {
      tintColor: "#a45525",
      opacity: 0.8,
    },

    heroLockIcon: {
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 132,
      height: 132,
      zIndex: 30,
      transform: [
        { translateX: -66 },
        { translateY: -66 },
        { rotate: "15deg" },
      ],
    },
  });
};