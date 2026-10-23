import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import CamButton from "./CamButton";
import CamSheet from "./CamSheet";
import CamText from "./CamText";
import { fetchQuestionPacks, type QuestionPackDto } from "../../api/questions";
import {
  CAM_MAX_PACKS,
  CAM_TEXT,
  CAM_UI,
} from "../../screens/Cam/cam.constants";
import { useGameStore } from "../../store/useGameStore";
import { useAuthStore } from "../../store/useUserStore";
import { useEntitlements } from "../../store/useEntitlements";

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Party mode has a discussion timer; Cam Mode does not. */
  showDiscussionTime?: boolean;
  /** Cam Mode: the two premium options — number questions and written-answer questions. */
  showWriteQuestions?: boolean;
};

const TIME_OPTIONS = [
  { label: "0:30", seconds: 30 },
  { label: "1:00", seconds: 60 },
  { label: "1:30", seconds: 90 },
  { label: "2:00", seconds: 120 },
  { label: "3:00", seconds: 180 },
  { label: "4:00", seconds: 240 },
  { label: "8:00", seconds: 480 },
  { label: "16:00", seconds: 960 },
];

const LIVES_OPTIONS = [3, 5] as const;

const isMainPack = (slug: string) => slug === "main" || slug === "main-pack";

/**
 * Game settings sheet for party mode and Cam Mode: lives per player, question
 * packs and (party mode only) the discussion time. Same pack rules as before —
 * free, main or premium-unlocked packs; at least one, at most five.
 */
export default function CamSettingsSheet({
  visible,
  onClose,
  showDiscussionTime = false,
  showWriteQuestions = false,
}: Props) {
  const { t } = useTranslation();
  const gameSettings = useGameStore((s) => s.gameSettings);
  const setGameSettings = useGameStore((s) => s.setGameSettings);
  const userId = useAuthStore((s) => s.user.id);
  // Merged with a demo purchase this session (see useEntitlements).
  const { isPremium } = useEntitlements();

  const [lives, setLives] = useState<3 | 5>(gameSettings.livesPerPlayer ?? 3);
  const [slugs, setSlugs] = useState<string[]>(gameSettings.selectedPacks ?? []);
  const [seconds, setSeconds] = useState(gameSettings.discussionSeconds ?? 120);
  const [numberQuestions, setNumberQuestions] = useState(
    !!isPremium && !!gameSettings.camNumberQuestions,
  );
  const [inputQuestions, setInputQuestions] = useState(
    !!isPremium && !!gameSettings.camInputQuestions,
  );
  const [packs, setPacks] = useState<QuestionPackDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    fetchQuestionPacks({ userId })
      .then((list) => {
        if (cancelled) return;
        const accessible = list.filter(
          (p) => isMainPack(p.slug) || p.isFree === true || isPremium,
        );
        setPacks(accessible);
        setSlugs((prev) => {
          if (accessible.length === 0) return prev;
          const valid = prev.filter((s) => accessible.some((p) => p.slug === s));
          return valid.length > 0 ? valid : [accessible[0].slug];
        });
      })
      .catch(() => {
        if (!cancelled) setPacks([]);
      })
      .then(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, userId, isPremium]);

  const togglePack = (slug: string) => {
    const has = slugs.includes(slug);
    if (has && slugs.length === 1) {
      Alert.alert(t("required_alert_title"), t("required_alert_message"));
      return;
    }
    if (has) {
      setSlugs(slugs.filter((s) => s !== slug));
      return;
    }
    if (slugs.length >= CAM_MAX_PACKS) {
      Alert.alert(t("limit_alert_title"), t("limit_alert_message"));
      return;
    }
    setSlugs([...slugs, slug]);
  };

  // Off by default and premium-only; turning one on explains what is needed.
  const toggleWriteOption = (
    title: string,
    isOn: boolean,
    setOn: (next: boolean) => void,
  ) => {
    if (!isPremium) {
      Alert.alert(title, t("cam_write_premium_body"));
      return;
    }
    if (isOn) {
      setOn(false);
      return;
    }
    Alert.alert(title, t("cam_write_notice"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("cam_write_enable"), onPress: () => setOn(true) },
    ]);
  };
  const writeOptions = [
    {
      title: t("cam_number_title"),
      sub: t("cam_number_sub"),
      isOn: numberQuestions,
      setOn: setNumberQuestions,
    },
    {
      title: t("cam_input_title"),
      sub: t("cam_input_sub"),
      isOn: inputQuestions,
      setOn: setInputQuestions,
    },
  ];

  const save = () => {
    setGameSettings({
      camNumberQuestions: !!isPremium && numberQuestions,
      camInputQuestions: !!isPremium && inputQuestions,
      discussionSeconds: seconds,
      livesPerPlayer: lives,
      selectedPacks: slugs.length > 0 ? slugs : [packs[0]?.slug ?? "main"],
    });
    onClose();
  };

  return (
    <CamSheet
      visible={visible}
      onClose={onClose}
      title={t("game_settings")}
      closeLabel={t("cancel")}
    >
      <View style={styles.section}>
        <CamText variant="subtitle">{t("lives_per_player")}</CamText>
        <View style={styles.segment}>
          {LIVES_OPTIONS.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: lives === option }}
              style={[
                styles.segmentItem,
                lives === option && styles.segmentItemActive,
              ]}
              onPress={() => setLives(option)}
            >
              <CamText
                variant="body"
                color={lives === option ? CAM_UI.lightText : CAM_TEXT}
              >
                {String(option)}
              </CamText>
            </Pressable>
          ))}
        </View>
      </View>

      {showDiscussionTime && (
        <View style={styles.section}>
          <CamText variant="subtitle">{t("time_for_discussion")}</CamText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {TIME_OPTIONS.map((option) => {
              const selected = option.seconds === seconds;
              return (
                <Pressable
                  key={option.seconds}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[styles.chip, selected && styles.segmentItemActive]}
                  onPress={() => setSeconds(option.seconds)}
                >
                  <CamText
                    variant="body"
                    color={selected ? CAM_UI.lightText : CAM_TEXT}
                  >
                    {option.label}
                  </CamText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={styles.section}>
        <CamText variant="subtitle">{t("packages_included")}</CamText>
        {loading ? (
          <ActivityIndicator color={CAM_TEXT} style={styles.loading} />
        ) : packs.length === 0 ? (
          <CamText variant="subtitle">{t("no_packs_available")}</CamText>
        ) : (
          <ScrollView style={styles.packs} showsVerticalScrollIndicator={false}>
            {packs.map((pack) => {
              const checked = slugs.includes(pack.slug);
              return (
                <Pressable
                  key={pack.slug}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  style={styles.packRow}
                  onPress={() => togglePack(pack.slug)}
                >
                  <CamText variant="body" style={styles.packTitle}>
                    {`${pack.title} (${pack.questionsCount})`}
                  </CamText>
                  <View style={[styles.check, checked && styles.checkOn]}>
                    {checked && (
                      <Ionicons name="checkmark" size={16} color={CAM_TEXT} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {showWriteQuestions && (
        <View style={styles.options}>
          {writeOptions.map((option) => (
            <Pressable
              key={option.title}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: option.isOn, disabled: !isPremium }}
              onPress={() =>
                toggleWriteOption(option.title, option.isOn, option.setOn)
              }
            >
              <View style={styles.optionRow}>
                <View style={styles.optionText}>
                  <CamText variant="body">{option.title}</CamText>
                  <CamText variant="subtitle" style={styles.optionSub}>
                    {isPremium ? option.sub : t("cam_write_premium")}
                  </CamText>
                </View>
                {isPremium ? (
                  <View style={[styles.check, option.isOn && styles.checkOn]}>
                    {option.isOn && (
                      <Ionicons name="checkmark" size={16} color={CAM_TEXT} />
                    )}
                  </View>
                ) : (
                  <Ionicons
                    name="lock-closed"
                    size={20}
                    color={CAM_UI.placeholder}
                  />
                )}
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <CamButton title={t("save")} onPress={save} />
    </CamSheet>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: CAM_UI.inputBg,
    borderRadius: CAM_UI.radius,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: CAM_UI.radius - 2,
  },
  segmentItemActive: {
    backgroundColor: CAM_TEXT,
  },
  chips: {
    gap: 8,
  },
  chip: {
    height: 38,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: CAM_UI.radius,
    backgroundColor: CAM_UI.inputBg,
  },
  loading: {
    paddingVertical: 16,
  },
  options: {
    gap: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: CAM_UI.radius,
    backgroundColor: CAM_UI.inputBg,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  packs: {
    maxHeight: 240,
  },
  packRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CAM_UI.secondaryBorder,
  },
  packTitle: {
    flex: 1,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: CAM_UI.placeholder,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: {
    backgroundColor: CAM_UI.primary,
    borderColor: CAM_UI.primary,
  },
});
