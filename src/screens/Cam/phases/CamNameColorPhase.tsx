import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import CamButton from "../../../components/cam/CamButton";
import CamColorSwatch from "../../../components/cam/CamColorSwatch";
import CamText from "../../../components/cam/CamText";
import CamTextInput from "../../../components/cam/CamTextInput";
import GameKeyboard from "../../../components/game/GameKeyboard";
import { CAM_NAME_MAX, CAM_PLAYER_COLORS } from "../cam.constants";

type Props = {
  index: number;
  color: string;
  takenColors: string[];
  onColorChange: (color: string) => void;
  onSubmit: (name: string) => void;
};

export default function CamNameColorPhase({
  index,
  color,
  takenColors,
  onColorChange,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  // Open from the start: entering the name is the first thing on this step.
  const [keyboardVisible, setKeyboardVisible] = useState(true);
  const insets = useSafeAreaInsets();
  const defaultName = t("cam_default_name", { n: index + 1 });

  const submit = () => onSubmit(name.trim() || defaultName);

  return (
    <View style={styles.root}>
      <View style={styles.texts}>
        <CamText variant="title" center shadow>
          {defaultName}
        </CamText>
        <CamText variant="subtitle" center shadow>
          {t("cam_name_hint")}
        </CamText>
      </View>

      <CamTextInput
        value={name}
        onChangeText={setName}
        placeholder={t("cam_name_placeholder")}
        maxLength={CAM_NAME_MAX}
        autoCapitalize="words"
        // The game's own keyboard (TikTok look) instead of the device one.
        showSoftInputOnFocus={false}
        onPressIn={() => setKeyboardVisible(true)}
      />

      <View style={styles.swatches}>
        {CAM_PLAYER_COLORS.map((swatch, swatchIndex) => (
          <CamColorSwatch
            key={swatch}
            color={swatch}
            selected={swatch === color}
            taken={takenColors.includes(swatch)}
            accessibilityLabel={t("cam_color", { n: swatchIndex + 1 })}
            onPress={() => onColorChange(swatch)}
          />
        ))}
      </View>

      <CamButton title={t("continue_btn")} variant="light" onPress={submit} />

      {keyboardVisible && (
        // This step sits inside the screen's safe area; the keyboard reaches
        // past it to the very bottom edge, and pads its own keys above the
        // home indicator.
        <View style={[styles.keyboard, { bottom: -insets.bottom }]}>
          <GameKeyboard
            theme="tiktok"
            value={name}
            onChangeText={setName}
            maxLength={CAM_NAME_MAX}
            capitalize="words"
            bottomInset={insets.bottom}
            onClose={() => setKeyboardVisible(false)}
          />
        </View>
      )}
    </View>
  );
}

/** Five 46 pt rings per row with the 6 pt gap, so 7–9 colours wrap evenly. */
const SWATCHES_PER_ROW = 5;
const SWATCH_SLOT = 46 + 6;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
    // Kept in the upper half so the keyboard never covers the input.
    paddingTop: 72,
    gap: 20,
  },
  texts: {
    gap: 6,
  },
  keyboard: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Up to 9 colours: wrap after five so the rings keep their size.
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignSelf: "center",
    gap: 6,
    maxWidth: SWATCHES_PER_ROW * SWATCH_SLOT - 6,
  },
});
