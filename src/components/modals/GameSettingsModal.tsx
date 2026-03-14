// src/components/modals/GameSettingsModal.tsx
import {
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
  Pressable,
} from "react-native";
import React, { useMemo, useState, useEffect, useRef } from "react";
import CustomText from "../common/CustomText";
import { EvilIcons, FontAwesome } from "@expo/vector-icons";
import CustomButton from "../common/CustomButton";
import { useGameStore } from "../../store/useGameStore";
import { useTranslation } from "react-i18next";
import { fetchQuestionPacks, type QuestionPackDto } from "../../api/questions";
import { backgrounds } from "../../../assets/backgrounds";

type Props = {
  setGameSettingsVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

const LIVES_OPTIONS = [
  { label: "3", value: 3 as const },
  { label: "5", value: 5 as const },
];

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

const isMainPack = (slug: string) => slug === "main" || slug === "main-pack";

const GameSettingsModal = ({ setGameSettingsVisible }: Props) => {
  const { t } = useTranslation();
  const gameSettings = useGameStore((s) => s.gameSettings);
  const setGameSettings = useGameStore((s) => s.setGameSettings);

  const [selectedSec, setSelectedSec] = useState<number>(
    gameSettings?.discussionSeconds ?? 120
  );
  const [selectedLives, setSelectedLives] = useState<3 | 5>(
    gameSettings?.livesPerPlayer ?? 3
  );
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(
    () => gameSettings?.selectedPacks ?? []
  );
  const [openDropdown, setOpenDropdown] = useState(false);
  const [availablePacks, setAvailablePacks] = useState<QuestionPackDto[]>([]);
  const [packsLoading, setPacksLoading] = useState(true);

  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  useEffect(() => {
    let cancelled = false;
    fetchQuestionPacks()
      .then((list) => {
        if (!cancelled) {
          setAvailablePacks(list);
          setSelectedSlugs((prev) => {
            if (list.length === 0) return prev;
            const firstSlug = list[0].slug;
            if (prev.includes(firstSlug)) return prev;
            return [firstSlug, ...prev.filter((s) => s !== firstSlug)];
          });
        }
      })
      .catch(() => {
        if (!cancelled) setAvailablePacks([]);
      })
      .then(() => {
        if (!cancelled) setPacksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedLabel = useMemo(
    () => TIME_OPTIONS.find((o) => o.seconds === selectedSec)?.label ?? "2:00",
    [selectedSec]
  );

  const togglePack = (slug: string) => {
    const has = selectedSlugs.includes(slug);
    if (has && selectedSlugs.length === 1) {
      Alert.alert(t("required_alert_title"), t("required_alert_message"));
      return;
    }
    if (has) {
      setSelectedSlugs(selectedSlugs.filter((x) => x !== slug));
      return;
    }
    if (selectedSlugs.length >= 5) {
      Alert.alert(t("limit_alert_title"), t("limit_alert_message"));
      return;
    }
    setSelectedSlugs([...selectedSlugs, slug]);
  };

  const onSave = () => {
    const finalPacks =
      selectedSlugs.length > 0
        ? selectedSlugs
        : [availablePacks[0]?.slug ?? "main"];
    setGameSettings({
      discussionSeconds: selectedSec,
      selectedPacks: finalPacks,
      livesPerPlayer: selectedLives,
    });
    setGameSettingsVisible(false);
  };

  return (
    <Pressable style={styles.backdrop} onPress={() => setGameSettingsVisible(false)}>
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => setGameSettingsVisible(false)}
        activeOpacity={0.8}
      >
        <EvilIcons name="close" size={36} color="rgba(255,255,255,0.95)" />
      </TouchableOpacity>

      <TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.modalWrap,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
        <View style={styles.namePlateShadow}>
          <ImageBackground
            source={backgrounds.bg005}
            resizeMode="stretch"
            imageStyle={{ borderRadius: 18 }}
            style={styles.namePlate}
          >
            <CustomText
              variant="p"
              className="text-center"
              textColor="#762a05"
            >
              {t("game_settings")}
            </CustomText>

            <View style={styles.nameDivider} />

            <CustomText
              variant="h6-headline"
              className="text-center"
              textColor="#592410"
            >
              {t("lives_per_player")}
            </CustomText>
            <View style={styles.livesRow}>
              {LIVES_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.livesOption,
                    selectedLives === opt.value && styles.livesOptionSelected,
                  ]}
                  onPress={() => setSelectedLives(opt.value)}
                >
                  <CustomText
                    variant="p"
                    textColor={
                      selectedLives === opt.value ? "#592410" : "#762a05"
                    }
                  >
                    {opt.label}
                  </CustomText>
                </Pressable>
              ))}
            </View>

            <View style={styles.nameDivider} />

            <CustomText
              variant="h6-headline"
              className="text-center"
              textColor="#592410"
            >
              {t("time_for_discussion")}
            </CustomText>

            <View style={styles.dropdownWrap}>
              <Pressable
                style={styles.dropdownTrigger}
                onPress={() => setOpenDropdown((v) => !v)}
              >
                <CustomText variant="p" textColor="#592410">
                  {selectedLabel}
                </CustomText>
                <FontAwesome
                  name={openDropdown ? "angle-up" : "angle-down"}
                  size={20}
                  color="#762a05"
                />
              </Pressable>

              {openDropdown ? (
                <View style={styles.dropdownList}>
                  {TIME_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.seconds}
                      style={[
                        styles.dropdownItem,
                        opt.seconds === selectedSec && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedSec(opt.seconds);
                        setOpenDropdown(false);
                      }}
                    >
                      <CustomText
                        variant="p-small"
                        textColor={
                          opt.seconds === selectedSec ? "#762a05" : "#592410"
                        }
                      >
                        {opt.label}
                      </CustomText>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.nameDivider} />

            <CustomText
              variant="h6-headline"
              className="text-center"
              textColor="#592410"
            >
              {t("packages_included")}
            </CustomText>

            {packsLoading ? (
              <View style={styles.packsLoading}>
                <ActivityIndicator size="small" color="#762a05" />
              </View>
            ) : (
              <ScrollView
                style={styles.packsScroll}
                contentContainerStyle={styles.packsScrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {availablePacks.length === 0 ? (
                  <CustomText
                    variant="p-small"
                    className="text-center py-2"
                    textColor="#762a05"
                  >
                    {t("no_packs_available") || "No question packs available."}
                  </CustomText>
                ) : (
                  <View style={styles.packsList}>
                    {availablePacks.map((pack) => {
                      const checked = selectedSlugs.includes(pack.slug);
                      const isMain = isMainPack(pack.slug);
                      return (
                        <Pressable
                          key={pack.slug}
                          style={[
                            styles.packRow,
                            checked && styles.packRowChecked,
                          ]}
                          onPress={() => togglePack(pack.slug)}
                        >
                          <CustomText
                            variant="p-small"
                            textColor={checked ? "#592410" : "#762a05"}
                          >
                            {pack.title} ({pack.questionsCount})
                            {isMain ? " ★" : ""}
                          </CustomText>
                          <View
                            style={[
                              styles.checkbox,
                              checked && styles.checkboxChecked,
                            ]}
                          >
                            {checked ? (
                              <FontAwesome
                                name="check"
                                size={12}
                                color="#fff"
                              />
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            )}
          </ImageBackground>
        </View>

        <CustomButton
          title={t("save")}
          buttonClassName="mt-5 w-full"
          onPress={onSave}
          backgroundImage={backgrounds.bg026}
          glow
          glowColor="rgba(41,255,25,0.6)"
          shadowColor="#005f07"
        />
      </Animated.View>
      </TouchableWithoutFeedback>
    </Pressable>
  );
};

export default GameSettingsModal;

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.82)",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    zIndex: 99,
    paddingHorizontal: 20,
  },
  closeBtn: {
    position: "absolute",
    top: 48,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  modalWrap: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
  },
  namePlateShadow: {
    shadowColor: "#fff",
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 14,
    width: "100%",
  },
  namePlate: {
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: "center",
    shadowColor: "#ffd800",
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(251,192,32,1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(160,110,60,0.7)",
    overflow: "hidden",
  },
  nameDivider: {
    width: "88%",
    height: 1,
    marginVertical: 10,
    backgroundColor: "rgba(89,36,16,0.5)",
  },
  dropdownWrap: {
    width: "100%",
    marginTop: 6,
    marginBottom: 4,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,247,236,0.9)",
    borderWidth: 1,
    borderColor: "rgba(160,110,60,0.4)",
  },
  dropdownList: {
    marginTop: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,247,236,0.98)",
    borderWidth: 1,
    borderColor: "rgba(160,110,60,0.4)",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemSelected: {
    backgroundColor: "rgba(251,192,32,0.25)",
  },
  packsLoading: {
    paddingVertical: 20,
    alignItems: "center",
  },
  packsScroll: {
    width: "100%",
    maxHeight: 200,
  },
  packsScrollContent: {
    paddingVertical: 4,
    gap: 8,
  },
  packsList: {
    gap: 8,
  },
  packRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,247,236,0.6)",
    borderWidth: 1,
    borderColor: "rgba(160,110,60,0.3)",
  },
  packRowChecked: {
    backgroundColor: "rgba(251,192,32,0.2)",
    borderColor: "rgba(160,110,60,0.5)",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(89,36,16,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#592410",
    borderColor: "#592410",
  },
  livesRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 4,
    justifyContent: "center",
  },
  livesOption: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,247,236,0.6)",
    borderWidth: 1,
    borderColor: "rgba(160,110,60,0.3)",
  },
  livesOptionSelected: {
    backgroundColor: "rgba(251,192,32,0.25)",
    borderColor: "rgba(160,110,60,0.5)",
  },
});
