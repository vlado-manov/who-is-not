// src/screens/Cam/phases/CamQuestionRevealPhase.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import CamButton from "../../../components/cam/CamButton";
import CamText from "../../../components/cam/CamText";
import { CAM_FONT, CAM_UI } from "../cam.constants";

type Props = {
  /** Whose question it is — shown on the cover, just in case. */
  playerName: string;
  playerColor: string;
  question: string;
  /** Short note under the question ("don't show anything yet…"). */
  note: string;
  continueLabel: string;
  onDone: () => void;
};

/** Pulled this far (as a share of the card's size), the question counts as read. */
const REVEAL_SHARE = 0.32;
const CARD_RADIUS = 20;
const TIKTOK_DARK = "#161823";

/**
 * The player's question, private: a white card with dark text, covered by a
 * TikTok-style panel. The question shows only while the player holds the
 * panel pulled aside — in any direction, up, down or to a side. Let go and the
 * panel slides back over it. "Continue" appears once it has been pulled far
 * enough to read.
 */
export default function CamQuestionRevealPhase({
  playerName,
  playerColor,
  question,
  note,
  continueLabel,
  onDone,
}: Props) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const drag = useRef(new Animated.ValueXY()).current;
  const [revealed, setRevealed] = useState(false);
  const cardWidth = width - 40;
  const cardHeight = Math.min(height * 0.42, 340);

  const coverBack = () =>
    Animated.spring(drag, {
      toValue: { x: 0, y: 0 },
      speed: 20,
      bounciness: 6,
      useNativeDriver: false,
    }).start();

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: Animated.event([null, { dx: drag.x, dy: drag.y }], {
          useNativeDriver: false,
        }),
        // Let go and the cover always comes back over the question. Pulling it
        // far enough once counts as having read it (Continue appears).
        onPanResponderRelease: (_, g) => {
          const far =
            Math.abs(g.dx) > cardWidth * REVEAL_SHARE ||
            Math.abs(g.dy) > cardHeight * REVEAL_SHARE;
          if (far) setRevealed(true);
          coverBack();
        },
        onPanResponderTerminate: () => coverBack(),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cardHeight, cardWidth, drag],
  );

  return (
    <View style={styles.root}>
      <View style={styles.center}>
        <View
          style={[styles.card, { width: cardWidth, minHeight: cardHeight }]}
        >
          <CamText
            variant="question"
            center
            color={TIKTOK_DARK}
            style={styles.question}
          >
            {question}
          </CamText>
          <CamText variant="subtitle" center color={TIKTOK_DARK}>
            {note}
          </CamText>
        </View>

        {/* The cover: drag it anywhere to uncover the question. */}
        <Animated.View
          {...pan.panHandlers}
          style={[
            styles.cover,
            {
              width: cardWidth,
              height: cardHeight,
              transform: [
                ...drag.getTranslateTransform(),
                {
                  rotate: drag.x.interpolate({
                    inputRange: [-cardWidth, 0, cardWidth],
                    outputRange: ["-12deg", "0deg", "12deg"],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Whose turn it is, so nobody reads the wrong question. */}
          <View style={styles.owner}>
            <View style={[styles.ownerDot, { backgroundColor: playerColor }]} />
            <CamText variant="body" numberOfLines={1}>
              {t("cam_peek_for", { name: playerName })}
            </CamText>
          </View>
          <View style={styles.coverIcon}>
            <Ionicons name="hand-left" size={30} color="#FFFFFF" />
          </View>
          <CamText variant="title" center>
            {t("cam_peek_drag")}
          </CamText>
          <CamText variant="subtitle" center>
            {t("cam_peek_drag_sub")}
          </CamText>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        {revealed ? (
          <CamButton title={continueLabel} variant="light" onPress={onDone} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingBottom: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: CARD_RADIUS,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingVertical: 26,
    justifyContent: "center",
    gap: 14,
  },
  question: {
    fontFamily: CAM_FONT.extraBold,
  },
  cover: {
    position: "absolute",
    borderRadius: CARD_RADIUS,
    backgroundColor: TIKTOK_DARK,
    borderWidth: 2,
    borderColor: CAM_UI.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
    boxShadow: "-4px 0px 0px #25F4EE, 4px 0px 0px #FE2C55",
  },
  owner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "100%",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  ownerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  coverIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CAM_UI.primary,
  },
  footer: {
    minHeight: 56,
    paddingHorizontal: 24,
    justifyContent: "flex-end",
  },
});
