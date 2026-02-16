// src/store/useGameStore.ts
import { create } from "zustand";
import { QUESTIONS } from "../data/questions";
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

export type GamePackId =
  | "main"
  | "custom"
  | "christmas"
  | "halloween"
  | "festival"
  | "adult18";

export type GameSettings = {
  discussionSeconds: number;
  selectedPacks: GamePackId[];
};

const defaultGameSettings = (): GameSettings => ({
  discussionSeconds: 120,
  selectedPacks: ["main"],
});

type QuestionType = "pick" | "number";

type GameState = {
  gameId?: string;
  currentRoundId?: string;
  mode: GameMode;
  roomCode?: string;
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
  questionType?: QuestionType;

  // voting result – voterId -> targetId
  votes: Record<string, string>;

  // ново: използвани въпроси в рамките на текущата игра
  usedQuestionIds: string[];

  // ново: точки по играч
  scores: Record<string, number>;

  set: (p: Partial<GameState>) => void;
  startGameSession: (mode: GameMode) => string;
  setCurrentRoundId: (roundId?: string) => void;
  reset: () => void;
  beginLocalGame: (count: number) => void;
  addPlayer: (p: Player) => void;
  assignCharacter: (playerId: string, characterId: string) => void;
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

  // изчислява резултати за текущия рунд
  applyRoundScores: () => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  gameId: undefined,
  currentRoundId: undefined,
  mode: "LOCAL",
  phase: "lobby",
  players: [],
  round: 0,
  answers: {},
  takenCharacters: [],
  gameSettings: defaultGameSettings(),
  currentBaseQuestionId: undefined,
  currentOddQuestionId: undefined,
  questionType: undefined,
  oddOneId: undefined,

  votes: {},

  usedQuestionIds: [],
  scores: {},

  set: (p) => set(p),

  startGameSession: (mode) => {
    const gameId = `game_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set({ gameId, mode, currentRoundId: undefined });
    return gameId;
  },

  setCurrentRoundId: (roundId) => set({ currentRoundId: roundId }),

  reset: () =>
    set({
      gameId: undefined,
      currentRoundId: undefined,
      mode: "LOCAL",
      roomCode: undefined,
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
      questionType: undefined,
      votes: {},
      usedQuestionIds: [],
      scores: {},
    }),

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
      gameSettings: s.gameSettings,
      currentBaseQuestionId: undefined,
      currentOddQuestionId: undefined,
      questionType: undefined,
      votes: {},
      usedQuestionIds: [],
      scores: {},
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
        pl.id === playerId ? { ...pl, characterId } : pl
      );
      return {
        players,
        takenCharacters: [...s.takenCharacters, characterId],
      };
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

    const used = get().usedQuestionIds || [];

    const active = QUESTIONS.filter((q) => q.active);

    const pickSourceForType = (type: QuestionType) => {
      const byTypeAll = active.filter((q) => q.type === type);
      const byTypeUnused = byTypeAll.filter((q) => !used.includes(q.id));

      // ако има поне 2 неизползвани за този тип, ползваме тях.
      if (byTypeUnused.length >= 2) return byTypeUnused;

      // иначе падъм към всички активни от този тип (възможно повторение на въпрос чак когато свършат).
      return byTypeAll;
    };

    const possibleTypes: QuestionType[] = ["pick", "number"];

    const candidates = possibleTypes
      .map((t) => ({ type: t, list: pickSourceForType(t) }))
      .filter((x) => x.list.length >= 2);

    if (!candidates.length) {
      console.warn("No question type with at least 2 active questions");
      return;
    }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    const list = chosen.list;

    const firstIdx = Math.floor(Math.random() * list.length);
    let secondIdx = Math.floor(Math.random() * (list.length - 1));
    if (secondIdx >= firstIdx) secondIdx += 1;

    const base = list[firstIdx];
    const odd = list[secondIdx];

    const oddPlayer = players[Math.floor(Math.random() * players.length)];

    set((s) => ({
      questionType: chosen.type,
      currentBaseQuestionId: base.id,
      currentOddQuestionId: odd.id,
      oddOneId: oddPlayer.id,
      answers: {},
      votes: {},
      usedQuestionIds: [...s.usedQuestionIds, base.id, odd.id],
    }));
  },

  // само подготвяме новия рунд (без да пипаме round)
  startRound: () => {
    get().initRoundQuestions();
  },

  // вдигаме броя на завършените рундове
  goToNextRound: () =>
    set((s) => ({
      round: s.round + 1,
    })),

  // изчисляваме точки за текущия рунд
  applyRoundScores: () =>
    set((s) => {
      const { votes, oddOneId, players } = s;
      if (!oddOneId) return {};

      const imposterId = oddOneId;
      const imposter = players.find((p) => p.id === imposterId);
      if (!imposter) return {};

      const nextScores: Record<string, number> = { ...s.scores };

      // гарантираме, че всеки има entry
      players.forEach((p) => {
        if (nextScores[p.id] == null) nextScores[p.id] = 0;
      });

      // импостър: +2 за всеки, който НЕ е гласувал за него
      const fooledCount = Object.entries(votes).reduce(
        (acc, [voterId, targetId]) => {
          if (voterId === imposterId) return acc;
          if (targetId !== imposterId) return acc + 1;
          return acc;
        },
        0
      );

      nextScores[imposterId] += fooledCount * 1.5;

      // не импостър: +1 ако са гласували за импостъра
      Object.entries(votes).forEach(([voterId, targetId]) => {
        if (voterId === imposterId) return;
        if (targetId === imposterId) {
          nextScores[voterId] += 1;
        }
      });

      return { scores: nextScores };
    }),
}));
