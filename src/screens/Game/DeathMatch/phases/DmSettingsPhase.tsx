// src/screens/Game/DeathMatch/phases/DmSettingsPhase.tsx
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import CamButton from "../../../../components/cam/CamButton";
import CamText from "../../../../components/cam/CamText";
import { DM_UI } from "../dm.constants";
import type { DmFormat, DmSettings, DmVisibility } from "../dm.types";

type Props = {
  /** False online for the finalist who is not setting the duel up. */
  canChoose: boolean;
  /** Who is choosing, for the waiting note. */
  chooserName: string;
  onConfirm: (settings: DmSettings) => void;
};

type ChoiceProps<T extends string> = {
  label: string;
  hint: string;
  value: T;
  options: ReadonlyArray<{ value: T; title: string }>;
  onChange: (value: T) => void;
};

/** One setting: a label, two options (the chosen one red) and what it means. */
function Choice<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: ChoiceProps<T>) {
  return (
    <View style={styles.section}>
      <CamText variant="body" color={DM_UI.sheetText}>
        {label}
      </CamText>
      <View style={styles.options}>
        {options.map((option) => (
          <CamButton
            key={option.value}
            title={option.title}
            size="md"
            variant={option.value === value ? "primary" : "secondary"}
            style={styles.option}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
      <CamText variant="subtitle" color={DM_UI.sheetText}>
        {hint}
      </CamText>
    </View>
  );
}

/**
 * The only two things the finalists choose: blind or not, and how many rounds.
 * A full-screen sheet in the same flat TikTok look as the game's settings.
 */
export default function DmSettingsPhase({
  canChoose,
  chooserName,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [visibility, setVisibility] = useState<DmVisibility>("visible");
  const [format, setFormat] = useState<DmFormat>("single");

  return (
    <View
      style={[
        styles.sheet,
        { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 20 },
      ]}
    >
      <View style={styles.header}>
        <CamText variant="title" color={DM_UI.sheetText}>
          {t("deathmatch_settings_title")}
        </CamText>
        <CamText variant="subtitle" color={DM_UI.sheetText}>
          {canChoose
            ? t("deathmatch_settings_sub")
            : t("deathmatch_settings_waiting", { name: chooserName })}
        </CamText>
      </View>

      {canChoose ? (
        <>
          <View style={styles.sections}>
            <Choice
              label={t("deathmatch_settings_timer_label")}
              hint={
                visibility === "blind"
                  ? t("deathmatch_settings_blind_hint")
                  : t("deathmatch_settings_visible_hint")
              }
              value={visibility}
              onChange={setVisibility}
              options={[
                { value: "visible", title: t("deathmatch_settings_visible") },
                { value: "blind", title: t("deathmatch_settings_blind") },
              ]}
            />
            <View style={styles.rule} />
            <Choice
              label={t("deathmatch_settings_rounds_label")}
              hint={
                format === "bestOf3"
                  ? t("deathmatch_settings_best_of_3_hint")
                  : t("deathmatch_settings_single_hint")
              }
              value={format}
              onChange={setFormat}
              options={[
                { value: "single", title: t("deathmatch_settings_single") },
                { value: "bestOf3", title: t("deathmatch_settings_best_of_3") },
              ]}
            />
          </View>
          <CamButton
            title={t("deathmatch_settings_confirm")}
            onPress={() => onConfirm({ visibility, format })}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: DM_UI.sheet,
    paddingHorizontal: 20,
    gap: 28,
  },
  header: {
    gap: 6,
  },
  sections: {
    flex: 1,
    gap: 22,
  },
  section: {
    gap: 12,
  },
  options: {
    flexDirection: "row",
    gap: 10,
  },
  option: {
    flex: 1,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: DM_UI.sheetRule,
  },
});
