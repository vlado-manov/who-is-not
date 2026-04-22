// src/components/VoteScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import AppImage from "../../components/AppImage";
import ImageBackgroundWithLoadGate from "../../components/ImageBackgroundWithLoadGate";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { GameStackParamList } from "../../navigation/types";
import { useGameStore, Player } from "../../store/useGameStore";
import { backgrounds } from "../../../assets/backgrounds";
import CustomText from "../../components/common/CustomText";
import CustomButton from "../../components/common/CustomButton";
import { useHeroesStore } from "../../store/useHeroesStore";
import { usePreventBack } from "../../hooks/usePreventBack";
import { useMultiplayerPhaseGate } from "../../hooks/useMultiplayerPhaseGate";
import { useTranslation } from "react-i18next";
import { GameMode } from "../../api/analytics";
import { sendPlayerReady } from "../../api/multiplayerSync";
import { sendMultiplayerRelay } from "../../api/multiplayerRelay";
import { mpPhaseVotes, VOTE_CAST_MESSAGE_TYPE } from "../../constants/onlineLobby";
import OnlineWaitPlayersOverlay from "../../components/online/OnlineWaitPlayersOverlay";

type R = RouteProp<GameStackParamList, "Vote">;
type Nav = StackNavigationProp<GameStackParamList, "Vote">;

const VoteScreen = () => {
  const { t } = useTranslation();
  const { voterIndex } = useRoute<R>().params;
  const navigation = useNavigation<Nav>();
  usePreventBack();

  const players = useGameStore((s) => s.players);
  const oddOneId = useGameStore((s) => s.oddOneId);
  const round = useGameStore((s) => s.round);
  const mode = useGameStore((s) => s.mode) as GameMode;
  const onlinePlayerId = useGameStore((s) => s.onlinePlayerId);
  const onlineSpectating = useGameStore((s) => s.onlineSpectating);
  const lives = useGameStore((s) => s.lives);
  const activeRoundNumber = (round ?? 0) + 1;
  const votesPhase = mpPhaseVotes(activeRoundNumber);
  const heroes = useHeroesStore((s) => s.heroes);
  const setVote = useGameStore((s) => s.setVote);
  const [waitingVotesSync, setWaitingVotesSync] = useState(false);

  useMultiplayerPhaseGate({
    enabled: mode === "ONLINE" && waitingVotesSync,
    phase: votesPhase,
    onReady: () => {
      setWaitingVotesSync(false);
      // Let last vote_cast reach all devices before reveal (relay order vs phase_ready).
      setTimeout(() => navigation.navigate("PreReveal"), 100);
    },
  });

  const voter = players[voterIndex];
  const isImposterVoter = Boolean(voter && oddOneId && voter.id === oddOneId);

  const otherPlayers = useMemo(
    () => (voter ? players.filter((p) => p.id !== voter.id) : []),
    [players, voter?.id]
  );

  const isEliminatedSpectator =
    mode === "ONLINE" &&
    onlinePlayerId != null &&
    (onlineSpectating || (lives[onlinePlayerId] ?? 0) <= 0);

  const specVoteReadyRef = useRef(false);
  useEffect(() => {
    specVoteReadyRef.current = false;
  }, [votesPhase]);

  useEffect(() => {
    if (!isEliminatedSpectator || !voter || specVoteReadyRef.current) return;
    specVoteReadyRef.current = true;
    const targetId =
      voter.id === oddOneId
        ? otherPlayers[0]?.id ??
          players.find((p) => p.id !== voter.id)?.id ??
          oddOneId ??
          voter.id
        : oddOneId ?? voter.id;
    setVote(voter.id, targetId);
    sendMultiplayerRelay({ type: VOTE_CAST_MESSAGE_TYPE, targetId });
    setWaitingVotesSync(true);
    sendPlayerReady(votesPhase);
  }, [
    isEliminatedSpectator,
    oddOneId,
    otherPlayers,
    players,
    setVote,
    voter,
    votesPhase,
  ]);

  const playerRows = useMemo<Player[][]>(() => {
    const rows: Player[][] = [];
    for (let i = 0; i < otherPlayers.length; i += 2) {
      rows.push(otherPlayers.slice(i, i + 2));
    }
    return rows;
  }, [otherPlayers]);

  useEffect(() => {
    if (mode === "ONLINE") return;
    if (!voter) {
      navigation.navigate("PreReveal" as never);
    }
  }, [voter, navigation, mode]);

  if (!voter) {
    return null;
  }

  if (isEliminatedSpectator) {
    return (
      <SafeAreaView className="flex-1" edges={["right", "left"]}>
        <ImageBackgroundWithLoadGate
          source={backgrounds.bg023}
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          resizeMode="cover"
        >
          <CustomText
            variant="h6-headline"
            className="text-center px-6"
            textColor="#fff7ec"
          >
            {t("spectator_waiting_phase")}
          </CustomText>
        </ImageBackgroundWithLoadGate>
        <OnlineWaitPlayersOverlay
          visible={mode === "ONLINE" && waitingVotesSync}
        />
      </SafeAreaView>
    );
  }

  const handleVote = (targetId: string) => {
    setVote(voter.id, targetId);

    if (mode === "ONLINE") {
      sendMultiplayerRelay({ type: VOTE_CAST_MESSAGE_TYPE, targetId });
      setWaitingVotesSync(true);
      sendPlayerReady(votesPhase);
      return;
    }

    const isLast = voterIndex >= players.length - 1;
    if (!isLast) {
      navigation.navigate("PassDeviceVote", {
        voterIndex: voterIndex + 1,
      });
    } else {
      navigation.navigate("PreReveal");
    }
  };

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackgroundWithLoadGate
        source={backgrounds.bg023}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: 96,
            paddingBottom: 96,
            flexGrow: 1,
            justifyContent: "space-between",
          }}
        >
          {/* QUESTION WINDOW */}
          <View style={{ paddingHorizontal: 24 }}>
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
                  textColor={isImposterVoter ? "#b91c1c" : "#762a05"}
                >
                  {isImposterVoter
                    ? t("vote_imposter_blend_cast")
                    : t("vote_cast_your_vote")}
                </CustomText>

                <View style={styles.nameDivider} />

                <CustomText
                  variant="h6-headline"
                  className="text-center"
                  textColor={isImposterVoter ? "#b91c1c" : "#592410"}
                >
                  {isImposterVoter
                    ? t("vote_imposter_blend_headline")
                    : t("vote_who_is_not")}
                </CustomText>

                <View style={styles.nameDivider} />

                <CustomText
                  variant="p-small"
                  className="text-center"
                  textColor={isImposterVoter ? "#c62828" : "#762a05"}
                >
                  {isImposterVoter
                    ? t("vote_imposter_blend_hint")
                    : t("vote_pick_imposter")}
                </CustomText>
              </ImageBackground>
            </View>
          </View>

          {/* PLAYERS GRID — SAME AS QUESTION SCREEN */}
          <View className="px-6 mt-20">
            {playerRows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.row}>
                {row.map((player) => {
                  const character = heroes.find((h) => h.id === player.characterId);

                  return (
                    <View key={player.id} style={styles.cell}>
                      <Pressable
                        onPress={() => handleVote(player.id)}
                        style={{
                          width: "100%",
                        }}
                      >
                        <View style={styles.avatarWrapper}>
                          {character?.profileImage && (
                            <AppImage
                              source={character.profileImage}
                              style={styles.avatarImage}
                              contentFit="contain"
                            />
                          )}
                        </View>

                        <CustomButton
                          title={player.name}
                          appearance="tertiary"
                          btnSize="xs"
                          fontSize="sm"
                          backgroundImage={backgrounds.bg018}
                          glow
                          fullWidth
                          buttonClassName="-mt-4"
                          glowColor="rgba(255,204,0,1)"
                          shadowColor="#834400"
                          onPress={() => handleVote(player.id)}
                        />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={{ opacity: 0 }}>
            <CustomText variant="p" className="text-center px-8 mt-10">
              {t("vote_hint_pick")}
            </CustomText>
          </View>
        </ScrollView>
      </ImageBackgroundWithLoadGate>
      <OnlineWaitPlayersOverlay
        visible={mode === "ONLINE" && waitingVotesSync}
      />
    </SafeAreaView>
  );
};

export default VoteScreen;

/* -------------------------------------------------------------------------- */
/* STYLES */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: 40,
    width: "100%",
  },
  cell: {
    width: "50%",
    paddingHorizontal: 16,
    alignItems: "center",
  },
  avatarWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: -12,
  },
  avatarImage: {
    width: 164,
    height: 164,
  },
  namePlateShadow: {
    shadowColor: "#fff",
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 14,
  },
  namePlate: {
    borderRadius: 18,
    paddingHorizontal: 32,
    paddingVertical: 24,
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
  },
  nameDivider: {
    width: "88%",
    height: 1,
    marginVertical: 8,
    backgroundColor: "rgba(89,36,16,0.5)",
  },
});
