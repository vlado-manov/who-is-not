import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  ImageBackground,
  ScrollView,
  ImageSourcePropType,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import AppImage from "../../components/AppImage";
import FullBleedStack from "../../components/FullBleedStack";
import ImageBackgroundWithLoadGate from "../../components/ImageBackgroundWithLoadGate";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { backgrounds } from "../../../assets/backgrounds";

import CustomText from "../../components/common/CustomText";
import CustomButton from "../../components/common/CustomButton";

import { useQueryClient } from "@tanstack/react-query";
import { useGameStore, Player } from "../../store/useGameStore";
import { IQuestion } from "../../types/question";
import { GameStackParamList } from "../../navigation/types";
import { queryKeys } from "../../api/queryKeys";
import { useSyncHeroesStore } from "../../api/hooks/useSyncHeroesStore";
import { game_images } from "../../../assets/images";
import AudioManager from "../../utils/audioManager";
import { useHeroesStore } from "../../store/useHeroesStore";
import { useTranslation } from "react-i18next";
import { usePreventBack } from "../../hooks/usePreventBack";
import { useMultiplayerPhaseGate } from "../../hooks/useMultiplayerPhaseGate";
import { GameMode } from "../../api/analytics";
import { sendPlayerReady } from "../../api/multiplayerSync";
import {
  sendMultiplayerRelay,
  subscribeMultiplayerRelay,
} from "../../api/multiplayerRelay";
import {
  DISCUSSION_CHAT_MESSAGE_TYPE,
  DISCUSSION_SKIP_VOTE_MESSAGE_TYPE,
  mpPhasePreVote,
} from "../../constants/onlineLobby";
import OnlineWaitPlayersOverlay from "../../components/online/OnlineWaitPlayersOverlay";
import FloatingChatDock, {
  type ChatLine,
} from "../../components/discussion/FloatingChatDock";
import { getOnlinePlayerIndex } from "../../utils/onlinePlayerIndex";

type Nav = StackNavigationProp<GameStackParamList, "Results">;

type Character = {
  id: string;
  slug?: string;
  profileImage: ImageSourcePropType;
  rateImage?: ImageSourcePropType | null;
};

type ScreenPhase = "answers" | "title" | "timer_intro" | "running";

/** Max animated answer slots — enough for any game configuration. */
const MAX_ANS = 14;

const DISCUSSION_COUNTDOWN_FRAME_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/3db0af2c-1a13-4110-96e2-b79348d66976-border1.webp";

const ResultsScreen = () => {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  usePreventBack();
  const { t } = useTranslation();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const isTablet = screenW >= 768 && screenW > screenH;

  /* ── Store selectors ────────────────────────────────────────────────────── */
  const players = useGameStore((s) => s.players);
  const onlinePlayerId = useGameStore((s) => s.onlinePlayerId);
  const heroes = useHeroesStore((s) => s.heroes);
  const questionType = useGameStore((s) => s.questionType);
  const answers = useGameStore((s) => s.answers);
  const baseQuestionId = useGameStore((s) => s.currentBaseQuestionId);
  const gameQuestions = useGameStore((s) => s.gameQuestions);
  const isBonusRound = useGameStore((s) => s.isBonusRound);
  const round = useGameStore((s) => s.round);
  const mode = useGameStore((s) => s.mode) as GameMode;
  const activeRoundNumber = (round ?? 0) + 1;
  const preVotePhase = mpPhasePreVote(activeRoundNumber);
  const [waitingPreVoteSync, setWaitingPreVoteSync] = useState(false);
  const discussionSeconds = useGameStore(
    (s) => s.gameSettings.discussionSeconds,
  );
  useSyncHeroesStore();

  const [secondsLeft, setSecondsLeft] = useState(discussionSeconds);
  const [discussionMessages, setDiscussionMessages] = useState<ChatLine[]>([]);
  const [skipVoteByPlayer, setSkipVoteByPlayer] = useState<
    Record<string, boolean>
  >({});

  /* ── Phase & sequence control ───────────────────────────────────────────── */
  const [phase, setPhase] = useState<ScreenPhase>("answers");
  const phaseRef = useRef<ScreenPhase>("answers");
  const seqRunRef = useRef(false);
  const mountedRef = useRef(true);
  const scrollRef = useRef<ScrollView>(null);

  /* ── Timer management ───────────────────────────────────────────────────── */
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerFinishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const tensionStartedRef = useRef(false);
  const hasFinishedRef = useRef(false);
  const sentReadyRef = useRef(false);
  const timerActiveRef = useRef(false);
  const secondsLeftRef = useRef(discussionSeconds);
  const finalizeDiscussionRef = useRef<() => void>(() => {});

  /* ── Per-answer layout Y capture (for scroll-to-reveal) ─────────────────── */
  const answerLayouts = useRef<Record<number, number>>({});

  /* ── Answer pop animations ──────────────────────────────────────────────── */
  const ansOpacity = useRef(
    Array.from({ length: MAX_ANS }, () => new Animated.Value(0)),
  ).current;
  const ansScale = useRef(
    Array.from({ length: MAX_ANS }, () => new Animated.Value(0.3)),
  ).current;
  const ansSlide = useRef(
    Array.from({ length: MAX_ANS }, () => new Animated.Value(60)),
  ).current;
  const ansShake = useRef(
    Array.from({ length: MAX_ANS }, () => new Animated.Value(0)),
  ).current;

  /* ── Title animations (same as QuestionScreen: scale 40→1, shake) ────────── */
  const titleOp = useRef(new Animated.Value(0)).current;
  // Starts at 40 (like QuestionScreen's plateScale) — creates the "stamp drop" feel
  const titleSc = useRef(new Animated.Value(40)).current;
  const titleShake = useRef(new Animated.Value(0)).current;

  /* ── Timer intro overlay animations ────────────────────────────────────── */
  const timerIntroOp = useRef(new Animated.Value(0)).current;
  const timerBigScale = useRef(new Animated.Value(0.2)).current;
  const timerPulse = useRef(new Animated.Value(1)).current;
  const timerIntroTextOp = useRef(new Animated.Value(0)).current;
  const timerDropY = useRef(new Animated.Value(0)).current;

  /* ── Normal timer appear animations ────────────────────────────────────── */
  const timerNormalOp = useRef(new Animated.Value(0)).current;
  const timerNormalY = useRef(new Animated.Value(40)).current;

  /* ── Press-feedback scale for the normal timer ──────────────────────────── */
  const scaleAnim = useRef(new Animated.Value(1)).current;

  /* ── Tension pulse (last 20 s) ───────────────────────────────────────────── */
  const tensionPulse = useRef(new Animated.Value(0)).current;
  const tensionPulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  /* ── Exit transition overlay ─────────────────────────────────────────────── */
  const exitFlashOp = useRef(new Animated.Value(0)).current;
  const exitOverlayOp = useRef(new Animated.Value(0)).current;

  /* ── Timer intro size: larger to really fill the screen ─────────────────── */
  const timerIntroSize = Math.min(screenW * 0.88, 320);

  const discussionSessionKey = useMemo(
    () => `${baseQuestionId ?? ""}-${round ?? 0}`,
    [baseQuestionId, round],
  );

  /* ── Reset all animation values ─────────────────────────────────────────── */
  const resetAnims = useCallback(() => {
    for (let i = 0; i < MAX_ANS; i++) {
      ansOpacity[i].setValue(0);
      ansScale[i].setValue(0.3);
      ansSlide[i].setValue(60);
      ansShake[i].setValue(0);
    }
    titleOp.setValue(0);
    titleSc.setValue(40); // start huge — same starting value as QuestionScreen
    titleShake.setValue(0);
    timerIntroOp.setValue(0);
    timerBigScale.setValue(0.2);
    timerPulse.setValue(1);
    timerIntroTextOp.setValue(0);
    timerDropY.setValue(0);
    timerNormalOp.setValue(0);
    timerNormalY.setValue(40);
    exitFlashOp.setValue(0);
    exitOverlayOp.setValue(0);
    answerLayouts.current = {};
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── DATA HELPERS ────────────────────────────────────────────────────────── */

  const characterById = useMemo(() => {
    const map: Record<string, Character> = {};
    heroes.forEach((c) => {
      map[c.id] = c as unknown as Character;
    });
    return map;
  }, [heroes]);

  const getAvatar = (player: Player): ImageSourcePropType | undefined => {
    if (!player.characterId) return undefined;
    return characterById[player.characterId]?.profileImage;
  };

  const vanessaRateImage = useMemo(() => {
    const v = heroes.find(
      (h) =>
        h.slug?.toLowerCase().replace(/-/g, "_") === "silent_vanessa" ||
        h.slug?.toLowerCase().includes("vanessa"),
    );
    return v?.rateImage;
  }, [heroes]);

  const getRateImage = (player: Player): ImageSourcePropType | null => {
    if (!player.characterId) return vanessaRateImage ?? null;
    const char = characterById[player.characterId];
    return char?.rateImage ?? vanessaRateImage ?? null;
  };

  const baseQuestion: IQuestion | null = useMemo(() => {
    if (!baseQuestionId || !gameQuestions.length) return null;
    return gameQuestions.find((q) => q.id === baseQuestionId) ?? null;
  }, [baseQuestionId, gameQuestions]);

  const votePairs = useMemo(() => {
    if (questionType !== "pick") return [];
    return Object.entries(answers)
      .map(([voterId, targetId]) => {
        const voter = players.find((p) => p.id === voterId);
        const target = players.find((p) => p.id === targetId);
        if (!voter || !target) return null;
        return { voter, target };
      })
      .filter(Boolean) as { voter: Player; target: Player }[];
  }, [answers, players, questionType]);

  const answerEntries = useMemo(() => {
    if (
      questionType !== "rate" &&
      questionType !== "number" &&
      questionType !== "input"
    ) {
      return [];
    }
    return players
      .map((player) => {
        const answer = answers[player.id];
        if (answer == null || answer === "") return null;
        return { player, answer: answer.trim() };
      })
      .filter(Boolean) as { player: Player; answer: string }[];
  }, [answers, players, questionType]);

  const answerRows = useMemo(() => {
    const rows: { player: Player; answer: string }[][] = [];
    for (let i = 0; i < answerEntries.length; i += 2) {
      rows.push(answerEntries.slice(i, i + 2));
    }
    return rows;
  }, [answerEntries]);

  const totalAnswerItems = useMemo(() => {
    if (questionType === "pick") return votePairs.length;
    if (questionType === "rate" || questionType === "number")
      return answerEntries.length;
    if (questionType === "input") return answerEntries.length;
    return 0;
  }, [questionType, votePairs.length, answerRows.length, answerEntries.length]);

  /* ── TIMER LOGIC ─────────────────────────────────────────────────────────── */

  const runExitTransition = useCallback(
    (onDone: () => void) => {
      AudioManager.playHeroPickerEnd();
      exitFlashOp.setValue(0);
      exitOverlayOp.setValue(0);
      Animated.sequence([
        // 1. Warm flash punches in fast
        Animated.timing(exitFlashOp, {
          toValue: 0.88,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        // 2. Flash fades while black overlay sweeps in
        Animated.parallel([
          Animated.timing(exitFlashOp, {
            toValue: 0,
            duration: 320,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(exitOverlayOp, {
            toValue: 1,
            duration: 380,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start(({ finished }) => {
        if (finished) onDone();
      });
    },
    [exitFlashOp, exitOverlayOp],
  );

  const navigateToVote = useCallback(() => {
    if (mode === "ONLINE") {
      const voterIndex = getOnlinePlayerIndex(players, onlinePlayerId);
      navigation.navigate("Vote", { voterIndex });
    } else {
      // Local / party mode: always pass device to first voter before they see the vote screen
      navigation.navigate("VoteNow", { voterIndex: 0 });
    }
  }, [mode, navigation, players, onlinePlayerId]);

  const finalizeDiscussion = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    timerActiveRef.current = false;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (timerFinishTimeoutRef.current) {
      clearTimeout(timerFinishTimeoutRef.current);
      timerFinishTimeoutRef.current = null;
    }
    void AudioManager.stopBackground();
    void AudioManager.stopTensionLoop();
    setSecondsLeft(0);

    if (mode === "ONLINE") {
      runExitTransition(() => {
        if (!sentReadyRef.current) {
          sentReadyRef.current = true;
          setWaitingPreVoteSync(true);
          sendPlayerReady(preVotePhase);
        }
      });
    } else {
      runExitTransition(navigateToVote);
    }
  }, [mode, preVotePhase, navigateToVote, runExitTransition]);

  useEffect(() => {
    secondsLeftRef.current = secondsLeft;
  }, [secondsLeft]);

  useEffect(() => {
    finalizeDiscussionRef.current = finalizeDiscussion;
  }, [finalizeDiscussion]);

  useMultiplayerPhaseGate({
    enabled: mode === "ONLINE" && waitingPreVoteSync,
    phase: preVotePhase,
    onReady: () => {
      setWaitingPreVoteSync(false);
      navigateToVote();
    },
  });

  const skipPressedCount = useMemo(
    () => Object.keys(skipVoteByPlayer).length,
    [skipVoteByPlayer],
  );

  useEffect(() => {
    if (secondsLeft !== 0) return;
    if (hasFinishedRef.current) return;
    finalizeDiscussion();
  }, [secondsLeft, finalizeDiscussion]);

  useEffect(() => {
    if (mode !== "ONLINE") return;
    if (players.length === 0) return;
    if (skipPressedCount < players.length) return;
    if (hasFinishedRef.current) return;
    finalizeDiscussion();
  }, [mode, players.length, skipPressedCount, finalizeDiscussion]);

  /* Tension music when ≤20 s remain. */
  useEffect(() => {
    if (secondsLeft > 20 || secondsLeft <= 0) return;
    if (tensionStartedRef.current) return;
    tensionStartedRef.current = true;
    void AudioManager.stopBackground();
    void AudioManager.playTensionLoop();
  }, [secondsLeft]);

  /* Tension pulse animation — starts when music kicks in, stops at 0. */
  useEffect(() => {
    const shouldPulse = secondsLeft > 0 && secondsLeft <= 20;
    if (shouldPulse && !tensionPulseLoopRef.current) {
      tensionPulse.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(tensionPulse, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(tensionPulse, {
            toValue: 0,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      tensionPulseLoopRef.current = loop;
      loop.start();
    } else if (!shouldPulse && tensionPulseLoopRef.current) {
      tensionPulseLoopRef.current.stop();
      tensionPulseLoopRef.current = null;
      tensionPulse.setValue(0);
    }
  }, [secondsLeft, tensionPulse]);

  /* Invalidate character queries for answer types. */
  useEffect(() => {
    if (
      questionType === "rate" ||
      questionType === "number" ||
      questionType === "input"
    ) {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters });
    }
  }, [questionType, queryClient]);

  /* ── ONLINE RELAY ─────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (mode !== "ONLINE") return;
    const unsub = subscribeMultiplayerRelay((raw) => {
      const d = raw as {
        type?: string;
        fromPlayerId?: string;
        text?: string;
        ts?: number;
      };
      if (d.type === DISCUSSION_SKIP_VOTE_MESSAGE_TYPE) {
        const pid =
          typeof d.fromPlayerId === "string"
            ? d.fromPlayerId
            : typeof (d as { playerId?: string }).playerId === "string"
              ? (d as { playerId: string }).playerId
              : null;
        if (pid) setSkipVoteByPlayer((prev) => ({ ...prev, [pid]: true }));
        return;
      }
      if (d.type !== DISCUSSION_CHAT_MESSAGE_TYPE) return;
      if (typeof d.fromPlayerId !== "string" || typeof d.text !== "string")
        return;
      const fromId = d.fromPlayerId;
      const bodyText = d.text;
      const st = useGameStore.getState();
      const name = st.players.find((p) => p.id === fromId)?.name ?? "?";
      const mine = fromId === st.onlinePlayerId;
      const id = `${d.ts ?? Date.now()}-${fromId}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;
      setDiscussionMessages((prev) => [
        ...prev,
        {
          id,
          playerId: fromId,
          name,
          text: bodyText,
          ts: typeof d.ts === "number" ? d.ts : Date.now(),
          mine,
        },
      ]);
    });
    return () => unsub();
  }, [mode]);

  useEffect(() => {
    return () => {
      setDiscussionMessages([]);
    };
  }, []);

  /* ── FOCUS EFFECT: stop previous audio + reset everything on focus ─────────── */

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;

      // Stop any audio left over from the previous screen immediately
      void AudioManager.stopBackground();
      void AudioManager.stopTensionLoop();

      hasFinishedRef.current = false;
      sentReadyRef.current = false;
      tensionStartedRef.current = false;
      timerActiveRef.current = false;
      seqRunRef.current = false;

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (timerFinishTimeoutRef.current) {
        clearTimeout(timerFinishTimeoutRef.current);
        timerFinishTimeoutRef.current = null;
      }

      setSecondsLeft(discussionSeconds);
      secondsLeftRef.current = discussionSeconds;
      setSkipVoteByPlayer({});
      phaseRef.current = "answers";
      setPhase("answers");
      resetAnims();

      return () => {
        mountedRef.current = false;
        timerActiveRef.current = false;
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        if (timerFinishTimeoutRef.current) {
          clearTimeout(timerFinishTimeoutRef.current);
          timerFinishTimeoutRef.current = null;
        }
      };
    }, [discussionSessionKey, discussionSeconds, resetAnims]),
  );

  /* Cleanup tension on unmount */
  useEffect(() => {
    return () => {
      void AudioManager.stopTensionLoop();
    };
  }, []);

  /* ── ANIMATION SEQUENCE ───────────────────────────────────────────────────── */

  const totalRef = useRef(0);
  totalRef.current = totalAnswerItems;

  useEffect(() => {
    if (phase !== "answers") return;
    if (seqRunRef.current) return;
    seqRunRef.current = true;

    const safe = (fn: () => void) => {
      if (mountedRef.current) fn();
    };

    /* ── Phase 3: Timer intro ──────────────────────────────────────────────── */
    const runTimerIntro = () => {
      safe(() => {
        phaseRef.current = "timer_intro";
        setPhase("timer_intro");
      });

      // ── Helper: start the drop → spring-in → begin regular countdown ──────
      const startDrop = () => {
        // Start the countdown immediately when the drop begins — do NOT wait
        // for the spring animation to settle (it can take 15+ seconds with high
        // bounciness, delaying the interval and causing the backup timeout to
        // fire at the wrong time).
        timerActiveRef.current = true;
        if (timerFinishTimeoutRef.current) {
          clearTimeout(timerFinishTimeoutRef.current);
        }
        timerFinishTimeoutRef.current = setTimeout(
          () => finalizeDiscussionRef.current(),
          Math.max(1, secondsLeftRef.current) * 1000 + 300,
        );
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        timerIntervalRef.current = setInterval(() => {
          setSecondsLeft((s) => {
            if (!timerActiveRef.current) return s;
            const next = s <= 0 ? 0 : s - 1;
            secondsLeftRef.current = next;
            if (next === 0) {
              setTimeout(() => finalizeDiscussionRef.current(), 0);
            }
            return next;
          });
        }, 1000);

        Animated.parallel([
          Animated.timing(timerBigScale, {
            toValue: 0,
            duration: 340,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(timerDropY, {
            toValue: screenH * 0.38,
            duration: 340,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(timerIntroTextOp, {
            toValue: 0,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(timerIntroOp, {
            toValue: 0,
            duration: 340,
            delay: 80,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Normal timer springs into place — timer is already counting by now.
          Animated.parallel([
            Animated.timing(timerNormalOp, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(timerNormalY, {
              toValue: 0,
              speed: 22,
              bounciness: 8,
              useNativeDriver: true,
            } as Parameters<typeof Animated.spring>[1]),
          ]).start(() => {
            void AudioManager.playResultsBgMusic();
            safe(() => {
              phaseRef.current = "running";
              setPhase("running");
            });
          });
        });
      };

      // Fade in dark overlay + spring-scale the large timer in.
      // The timer displays the full initial value the entire time it's big.
      Animated.parallel([
        Animated.timing(timerIntroOp, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.spring(timerBigScale, {
          toValue: 1,
          speed: 22,
          bounciness: 8,
          useNativeDriver: true,
        } as Parameters<typeof Animated.spring>[1]),
      ]).start(() => {
        // Fade in the "about to start" banner
        Animated.timing(timerIntroTextOp, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }).start(() => {
          // 2 quick pulses — timer still shows initial value (e.g. 120)
          Animated.sequence([
            Animated.timing(timerPulse, {
              toValue: 1.14,
              duration: 110,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(timerPulse, {
              toValue: 1,
              duration: 110,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(timerPulse, {
              toValue: 1.1,
              duration: 110,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(timerPulse, {
              toValue: 1,
              duration: 110,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]).start(() => {
            setSecondsLeft((s) => {
              const next = Math.max(0, s - 1);
              secondsLeftRef.current = next;
              if (next === 0) {
                setTimeout(() => finalizeDiscussionRef.current(), 0);
              }
              return next;
            });

            setTimeout(() => safe(startDrop), 160);
          });
        });
      });
    };

    /* ── Phase 2: Title reveal (same animation as QuestionScreen) ─────────── */
    const runTitleReveal = () => {
      safe(() => {
        phaseRef.current = "title";
        setPhase("title");
      });

      scrollRef.current?.scrollTo({ y: 0, animated: true });

      setTimeout(() => {
        AudioManager.playRevealTitleSplash();

        // Identical to QuestionScreen: scale from 40 → 1 with back easing, then screen shake
        Animated.sequence([
          Animated.parallel([
            Animated.timing(titleSc, {
              toValue: 1,
              duration: 300,
              easing: Easing.out(Easing.back(3)),
              useNativeDriver: true,
            }),
            Animated.timing(titleOp, {
              toValue: 1,
              duration: 160,
              useNativeDriver: true,
            }),
          ]),
          // Screen shake on landing
          Animated.sequence([
            Animated.timing(titleShake, {
              toValue: 1,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(titleShake, {
              toValue: -1,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(titleShake, {
              toValue: 1,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(titleShake, {
              toValue: 0,
              duration: 50,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          setTimeout(() => safe(runTimerIntro), 450);
        });
      }, 350);
    };

    /* ── Phase 1: Answers pop one by one ─────────────────────────────────── */
    const total = totalRef.current;

    const showAnswer = (i: number) => {
      if (i >= total) {
        setTimeout(() => safe(runTitleReveal), 500);
        return;
      }

      AudioManager.playAnswerPop();

      // Scroll so this answer card is in view as it pops in
      const layoutY = answerLayouts.current[i];
      if (layoutY !== undefined) {
        scrollRef.current?.scrollTo({
          y: Math.max(0, layoutY - 80),
          animated: true,
        });
      }

      // Pop: scale overshoot (QuestionScreen-style stamp) + fade + slide up
      Animated.parallel([
        Animated.timing(ansOpacity[i], {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(ansScale[i], {
            toValue: 1.18,
            duration: 200,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
          Animated.timing(ansScale[i], {
            toValue: 1,
            duration: 150,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(ansSlide[i], {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Shake on landing
        Animated.sequence([
          Animated.timing(ansShake[i], {
            toValue: 9,
            duration: 55,
            useNativeDriver: true,
          }),
          Animated.timing(ansShake[i], {
            toValue: -9,
            duration: 55,
            useNativeDriver: true,
          }),
          Animated.timing(ansShake[i], {
            toValue: 6,
            duration: 55,
            useNativeDriver: true,
          }),
          Animated.timing(ansShake[i], {
            toValue: -6,
            duration: 55,
            useNativeDriver: true,
          }),
          Animated.timing(ansShake[i], {
            toValue: 3,
            duration: 55,
            useNativeDriver: true,
          }),
          Animated.timing(ansShake[i], {
            toValue: 0,
            duration: 55,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setTimeout(() => safe(() => showAnswer(i + 1)), 300);
        });
      });
    };

    if (total === 0) {
      setTimeout(() => safe(runTitleReveal), 280);
    } else {
      setTimeout(() => showAnswer(0), 200);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── TIMER PRESS HANDLERS ─────────────────────────────────────────────── */

  const formattedTime = secondsLeft.toString();

  const handleTimerPress = () => {
    if (hasFinishedRef.current) return;
    if (mode === "ONLINE") {
      if (!onlinePlayerId) return;
      if (skipVoteByPlayer[onlinePlayerId]) return;
      setSkipVoteByPlayer((p) => ({ ...p, [onlinePlayerId]: true }));
      sendMultiplayerRelay({
        type: DISCUSSION_SKIP_VOTE_MESSAGE_TYPE,
        playerId: onlinePlayerId,
      });
      return;
    }
    finalizeDiscussion();
  };

  const scaleUp = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  const scaleDown = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  const sendDiscussionChat = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || mode !== "ONLINE") return;
    sendMultiplayerRelay({
      type: DISCUSSION_CHAT_MESSAGE_TYPE,
      text: trimmed.slice(0, 500),
    });
  };

  /* ── Per-answer animated wrapper style ────────────────────────────────── */

  const answerItemStyle = (i: number) => ({
    opacity: ansOpacity[i],
    transform: [
      { scale: ansScale[i] },
      { translateY: ansSlide[i] },
      {
        rotate: ansShake[i].interpolate({
          inputRange: [-10, 10],
          outputRange: ["-10deg", "10deg"],
        }),
      },
    ],
  });

  /* ── Tension pulse interpolations ──────────────────────────────────────── */
  const tensionScale = tensionPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const tensionGlowOpacity = tensionPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.75],
  });

  /* ── RENDER ────────────────────────────────────────────────────────────── */

  return (
    <FullBleedStack
      rootStyle={{ flex: 1, backgroundColor: "#0a0a0a" }}
      backdrop={
        <ImageBackgroundWithLoadGate
          source={isTablet ? backgrounds.bg023t : backgrounds.bg023}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      }
    >
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: "transparent" }}
        edges={["right", "left"]}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            paddingVertical: 96,
            paddingBottom: 140,
            gap: 32,
            alignItems: isTablet ? "center" : undefined,
          }}
        >
          {/* ── QUESTION HEADER — animates in during "title" phase ─────────── */}
          <Animated.View
            style={[
              { paddingHorizontal: 24 },
              isTablet && { width: "100%", maxWidth: 560 },
              {
                opacity: titleOp,
                transform: [
                  { scale: titleSc },
                  {
                    translateX: titleShake.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-8, 8],
                    }),
                  },
                ],
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
                {isBonusRound ? (
                  <>
                    <CustomText
                      variant="p"
                      className="text-center"
                      textColor="#762a05"
                    >
                      {t("bonus_round_title")}
                    </CustomText>
                    <View style={styles.nameDivider} />
                    <CustomText
                      variant="h5"
                      className="text-center"
                      textColor="#592410"
                      allowWrap
                    >
                      {t("results_bonus_no_question")}
                    </CustomText>
                    <View style={styles.nameDivider} />
                    <CustomText
                      variant="p-small"
                      className="text-center max-w-[60%]"
                      textColor="#762a05"
                    >
                      {t("results_who_voted_whom")}
                    </CustomText>
                    <CustomText
                      variant="p-xsmall"
                      className="text-center max-w-[50%]"
                      textColor="#762a05"
                    >
                      {t("results_click_timer_skip")}
                    </CustomText>
                  </>
                ) : (
                  <>
                    <CustomText
                      variant="p"
                      className="text-center"
                      textColor="#762a05"
                    >
                      {t("results_the_question_is")}
                    </CustomText>
                    <View style={styles.nameDivider} />
                    <CustomText
                      variant="h5"
                      className="text-center"
                      textColor="#592410"
                      allowWrap
                    >
                      {baseQuestion?.text}
                    </CustomText>
                    <View style={styles.nameDivider} />
                    <CustomText
                      variant="p-small"
                      className="text-center max-w-[60%]"
                      textColor="#762a05"
                    >
                      {t("results_who_not_answering")}
                    </CustomText>
                    <CustomText
                      variant="p-xsmall"
                      className="text-center max-w-[50%]"
                      textColor="#762a05"
                    >
                      {t("results_click_timer_skip")}
                    </CustomText>
                  </>
                )}
              </ImageBackground>
            </View>

            {/* Normal timer — springs in after timer_intro overlay exits */}
            <Animated.View
              style={[
                styles.timerWrapper,
                {
                  opacity: timerNormalOp,
                  transform: [{ translateY: timerNormalY }],
                },
              ]}
            >
              <Pressable
                onPressIn={scaleUp}
                onPressOut={scaleDown}
                onPress={mode === "ONLINE" ? handleTimerPress : undefined}
                onLongPress={mode !== "ONLINE" ? handleTimerPress : undefined}
                delayLongPress={600}
              >
                <Animated.View
                  style={{
                    transform: [{ scale: scaleAnim }, { scale: tensionScale }],
                  }}
                >
                  <View style={styles.timerContainer}>
                    {/* Outset red glow ring */}
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.timerGlowOutset,
                        { opacity: tensionGlowOpacity },
                      ]}
                    />
                    <AppImage
                      source={{ uri: DISCUSSION_COUNTDOWN_FRAME_URI }}
                      contentFit="contain"
                      style={styles.timerImage}
                    />
                    {/* Inset red overlay */}
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.timerGlowInset,
                        { opacity: tensionGlowOpacity },
                      ]}
                    />
                    <View style={styles.timerTextLayer} pointerEvents="none">
                      <CustomText
                        variant="h3-headline"
                        textColor="#592410"
                        style={styles.timerText}
                      >
                        {formattedTime}
                      </CustomText>
                    </View>
                  </View>
                </Animated.View>
              </Pressable>
            </Animated.View>

            {mode === "ONLINE" && players.length > 0 && (
              <Animated.View style={{ opacity: timerNormalOp }}>
                <CustomText
                  variant="p-xsmall"
                  className="text-center mt-3 px-4"
                  textColor="rgba(255,247,236,0.88)"
                >
                  {t("results_skip_online_progress", {
                    pressed: Math.min(skipPressedCount, players.length),
                    total: players.length,
                    remaining: Math.max(0, players.length - skipPressedCount),
                  })}
                </CustomText>
              </Animated.View>
            )}
          </Animated.View>

          {/* ── PICK: who voted for whom ──────────────────────────────────── */}
          {questionType === "pick" && (
            <View className="px-6 gap-8" style={isTablet ? { width: "100%", maxWidth: 560 } : undefined}>
              {votePairs.map(({ voter, target }, idx) => {
                const voterImg = getAvatar(voter);
                const targetImg = getAvatar(target);
                return (
                  <Animated.View
                    key={idx}
                    style={answerItemStyle(idx)}
                    onLayout={(e) => {
                      answerLayouts.current[idx] = e.nativeEvent.layout.y;
                    }}
                  >
                    <View style={styles.voteRow}>
                      <View style={styles.voteSide}>
                        {voterImg && (
                          <AppImage
                            source={voterImg}
                            style={styles.avatar}
                            contentFit="contain"
                          />
                        )}
                        <CustomButton
                          title={voter.name}
                          appearance="tertiary"
                          btnSize="xs"
                          fontSize="xs"
                          backgroundImage={backgrounds.bg018}
                          glow
                          fullWidth
                          glowColor="rgba(255,204,0,1)"
                          shadowColor="#834400"
                          buttonClassName="-mt-4"
                        />
                      </View>
                      <AppImage
                        source={game_images.arrowRightVote}
                        style={styles.arrow}
                        contentFit="contain"
                      />
                      <View style={styles.voteSide}>
                        {targetImg && (
                          <AppImage
                            source={targetImg}
                            style={styles.avatar}
                            contentFit="contain"
                          />
                        )}
                        <CustomButton
                          title={target.name}
                          appearance="tertiary"
                          btnSize="xs"
                          fontSize="xs"
                          backgroundImage={backgrounds.bg018}
                          glow
                          fullWidth
                          glowColor="rgba(255,204,0,1)"
                          shadowColor="#834400"
                          buttonClassName="-mt-4"
                        />
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}

          {/* ── RATE / NUMBER: 2-per-row grid ─────────────────────────────── */}
          {(questionType === "rate" || questionType === "number") && (
            <View className="px-6" style={[styles.rateNumberContainer, isTablet && { width: "100%", maxWidth: 560 }]}>
              {answerRows.map((row, rowIdx) => (
                <View
                  key={`row-${rowIdx}`}
                  style={styles.rateNumberRow}
                  onLayout={(e) => {
                    const y = e.nativeEvent.layout.y;
                    answerLayouts.current[rowIdx * 2] = y;
                    if (row.length > 1) {
                      answerLayouts.current[rowIdx * 2 + 1] = y;
                    }
                  }}
                >
                  {row.map(({ player, answer }, cellIdx) => {
                    const entryIdx = rowIdx * 2 + cellIdx;
                    const rateImg = getRateImage(player);
                    const isLongText = false;
                    return (
                      <Animated.View
                        key={player.id}
                        style={[
                          styles.rateNumberCell,
                          answerItemStyle(entryIdx),
                        ]}
                      >
                        <View style={styles.rateNumberImageWrap}>
                          {rateImg && (
                            <AppImage
                              source={rateImg}
                              style={styles.rateNumberImage}
                              contentFit="contain"
                            />
                          )}
                          <View style={styles.rateNumberOverlay}>
                            <CustomText
                              variant={isLongText ? "p-small" : "h4-headline"}
                              style={[
                                styles.rateNumberValue,
                                isLongText && styles.rateNumberValueLong,
                              ]}
                            >
                              {answer}
                            </CustomText>
                          </View>
                        </View>
                        <CustomButton
                          title={player.name}
                          appearance="tertiary"
                          btnSize="xs"
                          fontSize="xs"
                          backgroundImage={backgrounds.bg018}
                          glow
                          fullWidth
                          glowColor="rgba(255,204,0,1)"
                          shadowColor="#834400"
                          buttonClassName="-mt-1"
                        />
                      </Animated.View>
                    );
                  })}
                  {row.length === 1 && <View style={styles.rateNumberCell} />}
                </View>
              ))}
            </View>
          )}

          {/* ── INPUT: player + answer plate ──────────────────────────────── */}
          {questionType === "input" && (
            <View className="px-6" style={[styles.inputAnswersContainer, isTablet && { width: "100%", maxWidth: 560 }]}>
              {answerEntries.map(({ player, answer }, idx) => {
                const avatar = getAvatar(player);
                return (
                  <Animated.View
                    key={player.id}
                    style={answerItemStyle(idx)}
                    onLayout={(e) => {
                      answerLayouts.current[idx] = e.nativeEvent.layout.y;
                    }}
                  >
                    <View style={styles.inputAnswerRow}>
                      <View style={styles.inputAnswerPlayer}>
                        {avatar && (
                          <AppImage
                            source={avatar}
                            style={styles.inputAnswerAvatar}
                            contentFit="contain"
                          />
                        )}
                        <CustomButton
                          title={player.name}
                          appearance="tertiary"
                          btnSize="xs"
                          fontSize="xs"
                          backgroundImage={backgrounds.bg018}
                          glow
                          fullWidth
                          glowColor="rgba(255,204,0,1)"
                          shadowColor="#834400"
                          buttonClassName="-mt-4"
                        />
                      </View>
                      <View style={styles.inputAnswerPlateShadow}>
                        <ImageBackground
                          source={backgrounds.bg005}
                          resizeMode="stretch"
                          imageStyle={{ borderRadius: 18 }}
                          style={styles.inputAnswerPlate}
                        >
                          <CustomText
                            variant="p"
                            textColor="#592410"
                            style={styles.inputAnswerText}
                          >
                            {answer}
                          </CustomText>
                        </ImageBackground>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* ── TIMER INTRO OVERLAY ──────────────────────────────────────────── */}
        <Animated.View
          style={[styles.timerIntroOverlay, { opacity: timerIntroOp }]}
          pointerEvents="none"
        >
          <View style={styles.timerIntroContent}>
            {/* Large pulsing timer */}
            <Animated.View style={{ transform: [{ translateY: timerDropY }] }}>
              <Animated.View style={{ transform: [{ scale: timerBigScale }] }}>
                <Animated.View style={{ transform: [{ scale: timerPulse }] }}>
                  <View
                    style={{
                      width: timerIntroSize,
                      height: timerIntroSize,
                    }}
                  >
                    <AppImage
                      source={{ uri: DISCUSSION_COUNTDOWN_FRAME_URI }}
                      contentFit="contain"
                      style={{
                        width: timerIntroSize,
                        height: timerIntroSize,
                      }}
                    />
                    <View
                      style={[
                        StyleSheet.absoluteFillObject,
                        styles.timerTextLayer,
                      ]}
                    >
                      <CustomText
                        variant="h3-headline"
                        textColor="#592410"
                        style={[
                          styles.timerText,
                          {
                            fontSize: timerIntroSize * 0.24,
                            marginTop: -(timerIntroSize * 0.06),
                          },
                        ]}
                      >
                        {formattedTime}
                      </CustomText>
                    </View>
                  </View>
                </Animated.View>
              </Animated.View>
            </Animated.View>

            {/* "Your time is about to start" — styled as a prominent banner */}
            <Animated.View
              style={[
                styles.timerIntroTextWrap,
                {
                  opacity: timerIntroTextOp,
                  transform: [{ scale: timerPulse }],
                },
              ]}
            >
              <View style={styles.timerIntroBanner}>
                <CustomText variant="h5" style={styles.timerIntroBannerLabel}>
                  ⏱
                </CustomText>
                <CustomText variant="h5" style={styles.timerIntroBannerText}>
                  Your time is about to start!
                </CustomText>
                <CustomText
                  variant="p-small"
                  style={styles.timerIntroBannerSub}
                >
                  Discuss who didn't answer the question
                </CustomText>
              </View>
            </Animated.View>
          </View>
        </Animated.View>

        {/* ── OVERLAYS ─────────────────────────────────────────────────────── */}
        <OnlineWaitPlayersOverlay
          visible={mode === "ONLINE" && waitingPreVoteSync}
        />
        {mode === "ONLINE" && (
          <FloatingChatDock
            messages={discussionMessages}
            onSend={sendDiscussionChat}
            translationKeyTitle="discussion_chat_title"
            translationKeyPlaceholder="discussion_chat_placeholder"
            translationKeyEmpty="discussion_chat_empty"
          />
        )}

        {/* ── EXIT TRANSITION OVERLAYS ─────────────────────────────────────── */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: exitFlashOp, zIndex: 200, backgroundColor: "#fff4cf" }]}
        />
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: exitOverlayOp, zIndex: 201, backgroundColor: "#000" }]}
        />
      </SafeAreaView>
    </FullBleedStack>
  );
};

/* ── STYLES ───────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
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
  timerWrapper: {
    position: "absolute",
    bottom: -64,
    right: -12,
  },
  timerContainer: {
    width: 155,
    height: 155,
    position: "relative",
  },
  timerImage: {
    width: 155,
    height: 155,
  },
  timerGlowOutset: {
    position: "absolute",
    inset: -10,
    borderRadius: 999,
    backgroundColor: "rgba(220,30,30,0.55)",
    shadowColor: "#ff1a1a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 18,
  },
  timerGlowInset: {
    position: "absolute",
    inset: 8,
    borderRadius: 999,
    backgroundColor: "rgba(200,0,0,0.22)",
  },
  timerTextLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  timerText: {
    textAlign: "center",
    fontSize: 32,
    marginTop: -8,
    fontWeight: "900",
    fontFamily: "OpenSans-Bold",
  },
  /* ── Timer intro overlay ──────────────────────────────────────────────── */
  timerIntroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 1, 16, 0.92)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  timerIntroContent: {
    alignItems: "center",
    gap: 32,
    paddingHorizontal: 24,
  },
  timerIntroTextWrap: {
    width: "100%",
    alignItems: "center",
  },
  timerIntroBanner: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 210, 60, 0.55)",
    backgroundColor: "rgba(20, 8, 50, 0.85)",
    gap: 6,
    shadowColor: "#ffd23c",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 18,
  },
  timerIntroBannerLabel: {
    fontSize: 32,
    lineHeight: 38,
  },
  timerIntroBannerText: {
    color: "#ffeea0",
    fontWeight: "900",
    textAlign: "center",
    fontSize: 22,
    textShadowColor: "rgba(255, 210, 60, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  timerIntroBannerSub: {
    color: "rgba(255, 240, 180, 0.7)",
    textAlign: "center",
    fontSize: 13,
    marginTop: 2,
  },
  /* ── Vote rows ────────────────────────────────────────────────────────── */
  voteRow: {
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    marginTop: 24,
  },
  voteSide: {
    width: "40%",
    alignItems: "center",
  },
  avatar: {
    width: 120,
    height: 120,
  },
  arrow: {
    width: 120,
    height: 120,
    position: "absolute",
    left: "50%",
    top: "50%",
    zIndex: -1,
    transform: [{ translateX: -60 }, { translateY: -60 }],
  },
  /* ── Rate / Number grid ───────────────────────────────────────────────── */
  rateNumberContainer: {
    gap: 24,
  },
  rateNumberRow: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  rateNumberCell: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  rateNumberImageWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rateNumberImage: {
    width: "100%",
    height: "100%",
  },
  rateNumberOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
  },
  rateNumberValue: {
    fontSize: 16,
    paddingLeft: 18,
    marginTop: 18,
    color: "#000",
    fontWeight: "900",
    textShadowColor: "rgba(255,255,255,0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  rateNumberValueLong: {
    paddingLeft: 8,
    paddingRight: 8,
    marginTop: 12,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  /* ── Input answers ────────────────────────────────────────────────────── */
  inputAnswersContainer: {
    gap: 16,
  },
  inputAnswerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  inputAnswerPlayer: {
    width: 140,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  inputAnswerAvatar: {
    width: 106,
    height: 106,
  },
  inputAnswerPlateShadow: {
    flex: 1,
    shadowColor: "#fff",
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 14,
  },
  inputAnswerPlate: {
    minHeight: 64,
    marginLeft: -40,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    justifyContent: "center",
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
  inputAnswerText: {
    textAlign: "left",
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "900",
    fontFamily: "OpenSans-Bold",
    color: "#592410",
  },
});

export default ResultsScreen;
