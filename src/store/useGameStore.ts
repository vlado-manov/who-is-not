// src/store/useGameStore.ts
import { create } from "zustand";
import {
  disconnectMultiplayerRelay,
  sendMultiplayerRelay,
} from "../api/multiplayerRelay";
import { ROUND_STATE_MESSAGE_TYPE } from "../constants/onlineLobby";
import type { IQuestion } from "../types/question";
import { GameMode } from "../api/analytics";

export type Phase =
  | "lobby"
  | "rules"
  | "question_assign"
  | "answering"
  | "reveal"
  | "discussion"
  | "voting"
  | "result";

export type Player = {
  id: string;
  name: string;
  characterId?: string;
  connected: boolean;
  isHost?: boolean;
};

/** Slug of a question pack (from API). Kept for backward compatibility. */
export type GamePackId =
  | "main"
  | "custom"
  | "christmas"
  | "halloween"
  | "festival"
  | "adult18";

export type GameSettings = {
  discussionSeconds: number;
  /** Pack slugs from API (only packs with questions are selectable). */
  selectedPacks: string[];
  /** Животи на играч (3 или 5). */
  livesPerPlayer: 3 | 5;
};

const defaultGameSettings = (): GameSettings => ({
  discussionSeconds: 120,
  selectedPacks: ["main"],
  livesPerPlayer: 3,
});

type QuestionType = "pick" | "rate" | "number" | "input";

/** Host-authoritative round payload for ONLINE sync (see ROUND_STATE_MESSAGE_TYPE). */
export type MultiplayerRoundStateSnapshot = {
  currentBaseQuestionId: string;
  currentOddQuestionId: string;
  oddOneId: string;
  questionType: QuestionType;
  isBonusRound: boolean;
  questionNameTarget: string | null;
  impostorNameSubstitute: string | null;
  usedQuestionIds: string[];
};

/**
 * Единна последователност за LOCAL (party) и ONLINE: `initRoundQuestions` + host snapshot.
 * Повтаря се на всеки 11 рунда. "Bonus" is a presentation flag in Results,
 * not a fake question slot: positions 3, 6, and 10 hide the question.
 */
const ROUND_SCHEDULE: QuestionType[] = [
  "pick", // 1
  "number", // 2
  "pick", // 3
  "input", // 4
  "pick", // 5
  "number", // 6
  "input", // 7
  "number", // 8
  "pick", // 9
  "pick", // 10
  "input", // 11
];

const NAME_PLACEHOLDER_RE = /\{\{name\}\}|\{name\}/;
const BONUS_ROUND_POSITIONS = new Set([3, 6, 10]);

function getCyclePositionForRound(roundIndex: number): number {
  if (roundIndex < 1) return 1;
  return ((roundIndex - 1) % ROUND_SCHEDULE.length) + 1;
}

function getScheduleTypeForRound(roundIndex: number): QuestionType {
  if (roundIndex < 1) return "pick";
  return ROUND_SCHEDULE[getCyclePositionForRound(roundIndex) - 1];
}

function isBonusRoundIndex(roundIndex: number): boolean {
  return BONUS_ROUND_POSITIONS.has(getCyclePositionForRound(roundIndex));
}

function normalizeGroupId(groupId: string): string {
  return groupId.trim().toLowerCase();
}

function getNormalizedRelatedGroups(q: IQuestion): string[] {
  return Array.from(
    new Set(
      (q.relatedGroupIds ?? [])
        .map(normalizeGroupId)
        .filter((groupId) => groupId.length > 0),
    ),
  ).sort();
}

function haveSameRelatedGroups(a: IQuestion, b: IQuestion): boolean {
  const aGroups = getNormalizedRelatedGroups(a);
  const bGroups = getNormalizedRelatedGroups(b);
  if (aGroups.length !== bGroups.length) return false;
  return aGroups.every((groupId, index) => groupId === bGroups[index]);
}

type GameState = {
  gameId?: string;
  currentRoundId?: string;
  mode: GameMode;
  roomCode?: string;
  /** Backend online room id (multiplayer). */
  onlineRoomId?: string;
  /** Host-only secret from create room (persist for rejoin). */
  onlineHostSecret?: string | null;
  /** This device’s player id in the current online session. */
  onlinePlayerId?: string;
  onlineWsToken?: string;
  onlineIsHost?: boolean;
  /** Host’s UI language for this session (question copy + i18n). Set at lobby start. */
  onlineSessionLanguage?: string;
  phase: Phase;
  players: Player[];
  round: number; // брой завършени рундове
  timerSec?: number;
  oddOneId?: string;
  answers: Record<string, string>;
  takenCharacters: string[];
  targetPlayersCount?: number;
  gameSettings: GameSettings;

  currentBaseQuestionId?: string;
  currentOddQuestionId?: string;
  /** When a question uses {{name}}, this is the base target name shown to non-impostors (e.g. "Ivan"). */
  questionNameTarget?: string | null;
  /** When impostor gets a {{name}} question, this is the name shown in their copy (e.g. "Maria"). */
  impostorNameSubstitute?: string | null;
  questionType?: QuestionType;
  /** True when current round is bonus: mass question is not shown in Results. */
  isBonusRound?: boolean;

  /** Questions for this game (from backend). Fetched before first round. */
  gameQuestions: IQuestion[];

  // voting result – voterId -> targetId
  votes: Record<string, string>;

  // ново: използвани въпроси в рамките на текущата игра
  usedQuestionIds: string[];

  /** Животи по играч (playerId -> останали живот). */
  lives: Record<string, number>;
  lastAppliedLivesRoundKey?: string;

  /**
   * Snapshot of the full player list taken the first time a dead player is removed
   * from `players` during a local game. Used by `restartWithSamePlayersAndHeroes`
   * so that dead players are restored to the restarted game.
   */
  originalPlayers?: Player[];

  /** Set by DeathMatchScreen when the guessing game concludes. WinnerScreen reads this instead of computing from lives. */
  deathMatchWinnerIds?: string[];

  set: (p: Partial<GameState>) => void;
  setDeathMatchWinners: (ids: string[]) => void;
  /** Sets online lobby session fields and starts an ONLINE game id. */
  applyOnlinePartySession: (p: {
    roomId: string;
    joinCode: string;
    hostSecret: string | null;
    wsToken: string;
    playerId: string;
    isHost: boolean;
  }) => void;
  /** After lobby: set table size and reset round state; keeps ONLINE session + gameId. */
  prepareOnlineGameFromLobby: (playerCount: number) => void;
  setOnlineSessionLanguage: (lang: string | undefined) => void;
  /** Apply host round snapshot (guests only; same questions/impostor for everyone). */
  applyRoundSnapshot: (snapshot: MultiplayerRoundStateSnapshot) => void;
  setGameQuestions: (questions: IQuestion[]) => void;
  startGameSession: (mode: GameMode) => string;
  setCurrentRoundId: (roundId?: string) => void;
  reset: () => void;
  beginLocalGame: (count: number) => void;
  addPlayer: (p: Player) => void;
  assignCharacter: (playerId: string, characterId: string) => void;
  /** Merge a server-confirmed hero pick (ONLINE). Updates players + takenCharacters. */
  applyRemoteHeroPick: (args: {
    playerId: string;
    characterId: string;
    name: string;
  }) => void;
  isCharacterTaken: (characterId: string) => boolean;
  getPlayersCount: () => number;
  setGameSettings: (patch: Partial<GameSettings>) => void;
  replaceGameSettings: (settings: GameSettings) => void;

  setAnswer: (playerId: string, answer: string) => void;

  setVote: (voterId: string, targetId: string) => void;

  initRoundQuestions: () => void;

  // стартира рунд (само подготвя въпросите, не вдига round)
  startRound: () => void;

  // вдига round след завършен рунд
  goToNextRound: () => void;
  restartWithSamePlayersAndHeroes: () => void;

  initLives: () => void;
  applyRoundLives: () => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  gameId: undefined,
  currentRoundId: undefined,
  mode: "LOCAL",
  onlineRoomId: undefined,
  onlineHostSecret: undefined,
  onlinePlayerId: undefined,
  onlineWsToken: undefined,
  onlineIsHost: undefined,
  onlineSessionLanguage: undefined,
  phase: "lobby",
  players: [],
  round: 0,
  answers: {},
  takenCharacters: [],
  gameSettings: defaultGameSettings(),
  currentBaseQuestionId: undefined,
  currentOddQuestionId: undefined,
  questionNameTarget: undefined,
  impostorNameSubstitute: undefined,
  questionType: undefined,
  isBonusRound: false,
  oddOneId: undefined,
  gameQuestions: [],

  votes: {},
  usedQuestionIds: [],
  lives: {},
  lastAppliedLivesRoundKey: undefined,
  deathMatchWinnerIds: undefined,

  set: (p) => set(p),
  setDeathMatchWinners: (ids) => set({ deathMatchWinnerIds: ids }),

  applyOnlinePartySession: (p) => {
    const gameId = `game_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set({
      gameId,
      mode: "ONLINE",
      currentRoundId: undefined,
      roomCode: p.joinCode,
      onlineRoomId: p.roomId,
      onlineHostSecret: p.hostSecret,
      onlineWsToken: p.wsToken,
      onlinePlayerId: p.playerId,
      onlineIsHost: p.isHost,
      onlineSessionLanguage: undefined,
      phase: "lobby",
    });
  },

  setOnlineSessionLanguage: (lang) => set({ onlineSessionLanguage: lang }),

  applyRoundSnapshot: (snapshot) =>
    set({
      ...snapshot,
      answers: {},
      votes: {},
    }),

  prepareOnlineGameFromLobby: (playerCount) =>
    set((s) => {
      if (s.mode !== "ONLINE") return s;
      return {
        phase: "lobby",
        players: [],
        round: 0,
        answers: {},
        takenCharacters: [],
        targetPlayersCount: playerCount,
        oddOneId: undefined,
        timerSec: undefined,
        currentBaseQuestionId: undefined,
        currentOddQuestionId: undefined,
        questionNameTarget: undefined,
        impostorNameSubstitute: undefined,
        questionType: undefined,
        isBonusRound: false,
        gameQuestions: [],
        votes: {},
        usedQuestionIds: [],
        lives: {},
        lastAppliedLivesRoundKey: undefined,
        onlineSessionLanguage: s.onlineSessionLanguage,
      };
    }),

  setGameQuestions: (questions) => set({ gameQuestions: questions }),

  startGameSession: (mode) => {
    const gameId = `game_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set({ gameId, mode, currentRoundId: undefined });
    return gameId;
  },

  setCurrentRoundId: (roundId) => set({ currentRoundId: roundId }),

  reset: () => {
    disconnectMultiplayerRelay();
    set({
      gameId: undefined,
      currentRoundId: undefined,
      mode: "LOCAL",
      roomCode: undefined,
      onlineRoomId: undefined,
      onlineHostSecret: undefined,
      onlinePlayerId: undefined,
      onlineWsToken: undefined,
      onlineIsHost: undefined,
      onlineSessionLanguage: undefined,
      phase: "lobby",
      players: [],
      round: 0,
      timerSec: undefined,
      oddOneId: undefined,
      answers: {},
      takenCharacters: [],
      targetPlayersCount: undefined,
      gameSettings: defaultGameSettings(),
      currentBaseQuestionId: undefined,
      currentOddQuestionId: undefined,
      questionNameTarget: undefined,
      impostorNameSubstitute: undefined,
      questionType: undefined,
      isBonusRound: false,
      gameQuestions: [],
      votes: {},
      usedQuestionIds: [],
      lives: {},
      lastAppliedLivesRoundKey: undefined,
      originalPlayers: undefined,
      deathMatchWinnerIds: undefined,
    });
  },

  beginLocalGame: (count) =>
    set((s) => ({
      gameId: undefined,
      currentRoundId: undefined,
      mode: "LOCAL",
      phase: "lobby",
      players: [],
      round: 0,
      answers: {},
      takenCharacters: [],
      targetPlayersCount: count,
      oddOneId: undefined,
      timerSec: undefined,
      roomCode: undefined,
      onlineRoomId: undefined,
      onlineHostSecret: undefined,
      onlinePlayerId: undefined,
      onlineWsToken: undefined,
      onlineIsHost: undefined,
      onlineSessionLanguage: undefined,
      gameSettings: s.gameSettings,
      currentBaseQuestionId: undefined,
      currentOddQuestionId: undefined,
      questionNameTarget: undefined,
      impostorNameSubstitute: undefined,
      questionType: undefined,
      isBonusRound: false,
      gameQuestions: [],
      votes: {},
      usedQuestionIds: [],
      lives: {},
      lastAppliedLivesRoundKey: undefined,
    })),

  addPlayer: (p) =>
    set((s) => {
      if (s.players.some((x) => x.id === p.id)) return s;
      return { players: [...s.players, p] };
    }),

  assignCharacter: (playerId, characterId) =>
    set((s) => {
      if (s.takenCharacters.includes(characterId)) return s;
      const players = s.players.map((pl) =>
        pl.id === playerId ? { ...pl, characterId } : pl,
      );
      return {
        players,
        takenCharacters: [...s.takenCharacters, characterId],
      };
    }),

  applyRemoteHeroPick: ({ playerId, characterId, name }) =>
    set((s) => {
      if (s.mode !== "ONLINE") return s;
      const existingIdx = s.players.findIndex((p) => p.id === playerId);
      const oldChar =
        existingIdx >= 0 ? s.players[existingIdx].characterId : undefined;
      let taken = s.takenCharacters.filter((id) => id !== oldChar);
      if (taken.includes(characterId)) return s;
      const nextPlayer: Player = {
        id: playerId,
        name,
        characterId,
        connected: true,
      };
      const players =
        existingIdx >= 0
          ? s.players.map((p, i) => (i === existingIdx ? nextPlayer : p))
          : [...s.players, nextPlayer];
      return { players, takenCharacters: [...taken, characterId] };
    }),

  isCharacterTaken: (characterId) =>
    get().takenCharacters.includes(characterId),

  getPlayersCount: () => get().players.length,

  setGameSettings: (patch) =>
    set((s) => ({ gameSettings: { ...s.gameSettings, ...patch } })),

  replaceGameSettings: (settings) => set({ gameSettings: settings }),

  setAnswer: (playerId, answer) =>
    set((s) => ({
      answers: {
        ...s.answers,
        [playerId]: answer,
      },
    })),

  setVote: (voterId, targetId) =>
    set((s) => ({
      votes: {
        ...s.votes,
        [voterId]: targetId,
      },
    })),

  initRoundQuestions: () => {
    const players = get().players;
    if (!players.length) return;

    const questions = get().gameQuestions;
    const active = questions.filter((q) => q.isActive);
    if (!active.length) return;

    const used = get().usedQuestionIds || [];
    const completedRounds = get().round ?? 0;
    const currentRoundIndex = completedRounds + 1;
    const scheduleType = getScheduleTypeForRound(currentRoundIndex);
    const isBonusRound = isBonusRoundIndex(currentRoundIndex);

    const pickSourceForType = (type: QuestionType) => {
      const byTypeAll = active.filter((q) => q.type === type);
      const byTypeUnused = byTypeAll.filter((q) => !used.includes(q.id));

      // Prefer unused questions; fall back to all of type when exhausted
      if (byTypeUnused.length >= 2) return byTypeUnused;
      return byTypeAll;
    };

    const getOddPoolForBase = (base: IQuestion, type: QuestionType) => {
      const fullExactPool = active.filter(
        (q) =>
          q.type === type && q.id !== base.id && haveSameRelatedGroups(base, q),
      );
      const samePackExactPool = fullExactPool.filter(
        (q) => q.packSlug === base.packSlug,
      );
      const fullPool =
        samePackExactPool.length >= 1 ? samePackExactPool : fullExactPool;
      const preferred = fullPool.filter((q) => !used.includes(q.id));
      if (preferred.length >= 1) return preferred;
      if (fullPool.length >= 1) return fullPool;
      return [base];
    };

    const possibleTypes: QuestionType[] = ["pick", "number", "input"];
    let candidates = possibleTypes
      .map((t) => ({ type: t, list: pickSourceForType(t) }))
      .filter((x) => x.list.length >= 2);

    const forSchedule = candidates.filter((c) => c.type === scheduleType);
    if (forSchedule.length >= 1) candidates = forSchedule;

    if (!candidates.length) {
      console.warn("No question type with at least 2 active questions");
      return;
    }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    const pairableList = chosen.list.filter((q) => {
      if (NAME_PLACEHOLDER_RE.test(q.text)) return true;
      return getOddPoolForBase(q, chosen.type).some((odd) => odd.id !== q.id);
    });
    const list = pairableList.length >= 1 ? pairableList : chosen.list;

    const firstIdx = Math.floor(Math.random() * list.length);
    const base = list[firstIdx];

    const oddPool = getOddPoolForBase(base, chosen.type);
    const oddPoolFiltered = oddPool.filter((q) => q.id !== base.id);
    const pool = oddPoolFiltered.length >= 1 ? oddPoolFiltered : oddPool;
    let odd = pool[Math.floor(Math.random() * pool.length)];

    const oddPlayer = players[Math.floor(Math.random() * players.length)];

    let questionNameTarget: string | undefined;
    let impostorNameSubstitute: string | undefined;

    const baseHasNamePlaceholder = NAME_PLACEHOLDER_RE.test(base.text);

    if (baseHasNamePlaceholder) {
      // All non-impostors see the same player name in the base question
      const baseTarget = players[Math.floor(Math.random() * players.length)];
      questionNameTarget = baseTarget.name;

      // Impostor gets the same question, but with a different player name.
      odd = base;
      const otherNameTargets = players.filter((p) => p.id !== baseTarget.id);
      const impostorTarget =
        otherNameTargets.length > 0
          ? otherNameTargets[
              Math.floor(Math.random() * otherNameTargets.length)
            ]
          : baseTarget;
      impostorNameSubstitute = impostorTarget.name;
    } else if (NAME_PLACEHOLDER_RE.test(odd.text)) {
      const impostorTarget =
        players[Math.floor(Math.random() * players.length)];
      impostorNameSubstitute = impostorTarget.name;
    }

    const usedIds =
      odd.id === base.id
        ? [...get().usedQuestionIds, base.id]
        : [...get().usedQuestionIds, base.id, odd.id];

    set({
      questionType: chosen.type,
      isBonusRound,
      currentBaseQuestionId: base.id,
      currentOddQuestionId: odd.id,
      oddOneId: oddPlayer.id,
      questionNameTarget: questionNameTarget ?? null,
      impostorNameSubstitute: impostorNameSubstitute ?? null,
      answers: {},
      votes: {},
      usedQuestionIds: usedIds,
    });
  },

  // само подготвяме новия рунд (без да пипаме round)
  startRound: () => {
    const s = get();
    if (Object.keys(s.lives).length === 0 && s.players.length > 0) {
      s.initLives();
    }
    if (s.mode === "ONLINE" && !s.onlineIsHost) {
      return;
    }
    get().initRoundQuestions();
    const st = get();
    if (st.mode !== "ONLINE" || !st.onlineIsHost) return;
    if (
      !st.currentBaseQuestionId ||
      !st.currentOddQuestionId ||
      !st.oddOneId ||
      !st.questionType
    ) {
      return;
    }
    sendMultiplayerRelay({
      type: ROUND_STATE_MESSAGE_TYPE,
      payload: {
        currentBaseQuestionId: st.currentBaseQuestionId,
        currentOddQuestionId: st.currentOddQuestionId,
        oddOneId: st.oddOneId,
        questionType: st.questionType,
        isBonusRound: st.isBonusRound ?? false,
        questionNameTarget: st.questionNameTarget ?? null,
        impostorNameSubstitute: st.impostorNameSubstitute ?? null,
        usedQuestionIds: st.usedQuestionIds ?? [],
      },
    });
  },

  // вдигаме броя на завършените рундове
  goToNextRound: () =>
    set((s) => ({
      round: s.round + 1,
    })),

  restartWithSamePlayersAndHeroes: () =>
    set((s) => {
      // Restore the full roster (including players who died during the game).
      const allPlayers = s.originalPlayers ?? s.players;
      const perPlayer = s.gameSettings.livesPerPlayer ?? 3;
      const nextLives: Record<string, number> = {};
      const takenCharacters = allPlayers
        .map((p) => p.characterId)
        .filter((id): id is string => Boolean(id));

      allPlayers.forEach((p) => {
        nextLives[p.id] = perPlayer;
      });

      return {
        currentRoundId: undefined,
        phase: "lobby" as const,
        round: 0,
        timerSec: undefined,
        oddOneId: undefined,
        answers: {},
        votes: {},
        usedQuestionIds: [],
        currentBaseQuestionId: undefined,
        currentOddQuestionId: undefined,
        questionNameTarget: undefined,
        impostorNameSubstitute: undefined,
        questionType: undefined,
        isBonusRound: false,
        players: allPlayers,
        targetPlayersCount: allPlayers.length,
        takenCharacters,
        lives: nextLives,
        lastAppliedLivesRoundKey: undefined,
        originalPlayers: allPlayers,
      };
    }),

  initLives: () =>
    set((s) => {
      const { players, gameSettings } = s;
      const perPlayer = gameSettings.livesPerPlayer ?? 3;
      const nextLives: Record<string, number> = {};
      players.forEach((p) => {
        nextLives[p.id] = perPlayer;
      });
      return { lives: nextLives };
    }),

  applyRoundLives: () =>
    set((s) => {
      const { votes, oddOneId, players, lives } = s;
      if (!oddOneId) return {};
      const roundKey = s.currentRoundId ?? `round_${s.round + 1}`;
      if (s.lastAppliedLivesRoundKey === roundKey) return {};

      const imposterId = oddOneId;
      const imposter = players.find((p) => p.id === imposterId);
      if (!imposter) return {};

      const votedWinner = Object.entries(votes).reduce(
        (acc, [voterId, targetId]) => {
          if (voterId === imposterId) return acc;
          acc[targetId] = (acc[targetId] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
      const maxVotes = Math.max(0, ...Object.values(votedWinner));
      const topTargets = Object.entries(votedWinner)
        .filter(([, v]) => v === maxVotes && maxVotes > 0)
        .map(([id]) => id);
      const impostorLost =
        topTargets.length === 1 && topTargets[0] === imposterId;

      const nextLives: Record<string, number> = { ...lives };
      players.forEach((p) => {
        if (nextLives[p.id] == null) nextLives[p.id] = 3;
      });

      if (impostorLost) {
        nextLives[imposterId] = Math.max(0, (nextLives[imposterId] ?? 3) - 1);
      } else {
        players.forEach((p) => {
          if (p.id !== imposterId) {
            nextLives[p.id] = Math.max(0, (nextLives[p.id] ?? 3) - 1);
          }
        });
      }

      return { lives: nextLives, lastAppliedLivesRoundKey: roundKey };
    }),
}));
