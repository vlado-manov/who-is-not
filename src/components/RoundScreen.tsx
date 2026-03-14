// src/components/RoundScreen.tsx
import React, { useState } from "react";
import { View, ImageBackground, Dimensions } from "react-native";
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
    <View className="absolute inset-0 z-[99] items-center justify-center px-6">
      <View className="inset-0 absolute bg-[rgba(0,0,0,0.88)] w-full h-full" />
      <View className="bg-white rounded-2xl p-6 max-w-md z-[100]">
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
  const firstPlayerName = players?.[0]?.name;
  const userId = useAuthStore((s) => s.user.id);
  const trackRoundStartedMutation = useTrackRoundStartedMutation();

  const startRound = useGameStore((s) => s.startRound);

  const displayRound = (round || 0) + 1;
  const isBonusRound = displayRound === 5;

  // RoundScreen е само за Round 2+; Round 1 е в HeroPicker
  const [showTutorial, setShowTutorial] = useState(false);
  const [showBonusTutorial, setShowBonusTutorial] = useState(isBonusRound);

  const onContinue = async () => {
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
    // вече сме в GameStack, навигираме директно
    navigation.navigate("PassDeviceGameplay", {
      playerIndex: 0,
    } as never);
  };

  const bonusTutorialVisible = isBonusRound && showBonusTutorial;
  const tutorialSteps = React.useMemo(() => getTutorialSteps(t), [t]);

  return (
    <SafeAreaView className="flex-1 bg-primary-700" edges={["right", "left"]}>
      <TutorialOverlay
        visible={showTutorial}
        onSkipAll={() => setShowTutorial(false)}
        onDoneAll={() => setShowTutorial(false)}
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
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default RoundScreen;
