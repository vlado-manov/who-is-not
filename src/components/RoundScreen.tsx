// src/components/RoundScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, ImageBackground, Dimensions, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import CustomText from "./common/CustomText";
import CustomButton from "./common/CustomButton";
import TutorialOverlay, { getTutorialSteps } from "./TutorialOverlay";
import { backgrounds } from "../../assets/backgrounds";
import { GameStackParamList } from "../navigation/types";
import { useGameStore } from "../store/useGameStore";
import AudioManager from "../utils/audioManager";
import { useAuthStore } from "../store/useUserStore";
import { useTrackRoundStartedMutation } from "../api/hooks/useAnalyticsMutations";
import { usePreventBack } from "../hooks/usePreventBack";
import { getOnlinePlayerIndex } from "../utils/onlinePlayerIndex";

type Nav = StackNavigationProp<GameStackParamList, "Round">;

const { width: W } = Dimensions.get("window");

function BonusRoundOverlay({
  visible,
  onDone,
}: {
  visible: boolean;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <View style={styles.bonusOverlayRoot} pointerEvents="box-none">
      <View style={styles.bonusOverlayBackdrop} />
      <View style={styles.bonusOverlayContentWrap}>
        <View style={styles.bonusOverlayCard}>
        <CustomText variant="h5" textColor="black" className="text-center mb-2">
          {t("bonus_round_title")}
        </CustomText>
        <CustomText textColor="black" className="text-center mb-4">
          {t("bonus_round_desc")}
        </CustomText>
        <CustomButton
          title={t("got_it")}
          onPress={() => {
            AudioManager.playButtonClick();
            onDone();
          }}
          backgroundImage={backgrounds.bg026}
          glow
          glowColor="rgba(41,255,25,0.8)"
          shadowColor="#005f07"
          horizontalPadding={48}
        />
        </View>
      </View>
    </View>
  );
}

const RoundScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  usePreventBack();

  const round = useGameStore((s) => s.round);
  const gameId = useGameStore((s) => s.gameId);
  const mode = useGameStore((s) => s.mode);
  const setCurrentRoundId = useGameStore((s) => s.setCurrentRoundId);
  const players = useGameStore((s) => s.players);
  const onlinePlayerId = useGameStore((s) => s.onlinePlayerId);
  const firstPlayerName = players?.[0]?.name;
  const userId = useAuthStore((s) => s.user.id);
  const settings = useAuthStore((s) => s.settings);
  const updateSettings = useAuthStore((s) => s.updateSettings);
  const trackRoundStartedMutation = useTrackRoundStartedMutation();

  const startRound = useGameStore((s) => s.startRound);

  const displayRound = (round || 0) + 1;
  const isBonusRound = displayRound === 5;

  /** Първи екран „Рунд X“ в играта (рунд 2); само за играчи без завършена игра преди това. */
  const shouldShowRoundTutorial =
    displayRound === 2 &&
    !settings.hasCompletedAnyGame &&
    !settings.hasSeenRoundTutorial;

  // RoundScreen е само за Round 2+; Round 1 е в HeroPicker
  const [showBonusTutorial, setShowBonusTutorial] = useState(isBonusRound);

  const runRoundStart = useCallback(async () => {
    if (!players.length) return;

    const roundIndex = (round || 0) + 1;
    const roundId = `${gameId ?? "game_local"}_round_${roundIndex}`;
    setCurrentRoundId(roundId);

    if (gameId) {
      try {
        await trackRoundStartedMutation.mutateAsync({
          gameId,
          roundId,
          mode,
          roundIndex,
          userId,
        });
      } catch (e) {
        console.warn("track ROUND_STARTED failed", e);
      }
    }

    startRound();
  }, [
    players.length,
    round,
    gameId,
    mode,
    userId,
    setCurrentRoundId,
    startRound,
    trackRoundStartedMutation,
  ]);

  const onContinue = async () => {
    await runRoundStart();
    navigation.navigate("PassDeviceGameplay", {
      playerIndex: 0,
    } as never);
  };

  const onlineRoundNavigatedRef = useRef(false);

  const onContinueOnline = useCallback(async () => {
    if (onlineRoundNavigatedRef.current) return;
    onlineRoundNavigatedRef.current = true;
    await runRoundStart();
    const idx = getOnlinePlayerIndex(players, onlinePlayerId);
    navigation.navigate("Question", { playerIndex: idx } as never);
  }, [runRoundStart, players, onlinePlayerId, navigation]);

  const bonusTutorialVisible = isBonusRound && showBonusTutorial;

  useEffect(() => {
    if (mode !== "ONLINE") return;
    if (bonusTutorialVisible) return;
    if (shouldShowRoundTutorial) return;
    const id = setTimeout(() => {
      void onContinueOnline();
    }, 600);
    return () => clearTimeout(id);
  }, [mode, bonusTutorialVisible, shouldShowRoundTutorial, onContinueOnline]);

  const tutorialSteps = React.useMemo(() => getTutorialSteps(t), [t]);

  return (
    <SafeAreaView className="flex-1 bg-primary-700" edges={["right", "left"]}>
      <TutorialOverlay
        visible={shouldShowRoundTutorial}
        onSkipAll={() =>
          updateSettings({ hasSeenRoundTutorial: true })
        }
        onDoneAll={() =>
          updateSettings({ hasSeenRoundTutorial: true })
        }
        steps={tutorialSteps}
      />
      {isBonusRound && (
        <BonusRoundOverlay
          visible={bonusTutorialVisible}
          onDone={() => setShowBonusTutorial(false)}
        />
      )}
      <ImageBackground
        source={backgrounds.bg019}
        className="flex-1 relative"
        resizeMode="cover"
      >
        <View className="flex-1 justify-center relative">
          <View>
            <CustomText variant="h2" className="text-center mb-2" shadow>
              {t("round_label")}
            </CustomText>
            <CustomText className="text-center" variant="h0" shadow>
              {displayRound}
            </CustomText>
          </View>
          {mode !== "ONLINE" ? (
            <View className="mb-16 px-16 absolute bottom-0 left-0 right-0">
              <CustomText className="text-center mb-4">
                <CustomText className="underline">{firstPlayerName}</CustomText>,
                <CustomText>
                  {" "}{t("round_start_hint")}
                </CustomText>
              </CustomText>
              <CustomButton
                title={t("start_btn")}
                backgroundImage={backgrounds.bg026}
                glow
                glowColor="rgba(41,255,25,0.8)"
                shadowColor="#005f07"
                horizontalPadding={48}
                fullWidth
                onPress={onContinue}
              />
            </View>
          ) : null}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default RoundScreen;

const styles = StyleSheet.create({
  bonusOverlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
  },
  bonusOverlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.88)",
  },
  bonusOverlayContentWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  bonusOverlayCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    maxWidth: 448,
    width: "100%",
    zIndex: 100,
  },
});
