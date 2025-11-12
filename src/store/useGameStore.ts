// src/store/useGameStore.ts
import { create } from "zustand";
import { QUESTIONS } from "../data/questions";

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
  roomCode?: string;
  phase: Phase;
  players: Player[];
  round: number;
  timerSec?: number;
  oddOneId?: string;
  answers: Record<string, string>;
  takenCharacters: string[];
  targetPlayersCount?: number;
  gameSettings: GameSettings;
  currentBaseQuestionId?: string;
  currentOddQuestionId?: string;
  questionType?: QuestionType;
  set: (p: Partial<GameState>) => void;
  reset: () => void;
  beginLocalGame: (count: number) => void;
  addPlayer: (p: Player) => void;
  assignCharacter: (playerId: string, characterId: string) => void;
  isCharacterTaken: (characterId: string) => boolean;
  getPlayersCount: () => number;
  setGameSettings: (patch: Partial<GameSettings>) => void;
  replaceGameSettings: (settings: GameSettings) => void;
  setAnswer: (playerId: string, answer: string) => void;
  initRoundQuestions: () => void;
};

export const useGameStore = create<GameState>((set, get) => ({
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
  set: (p) => set(p),

  reset: () =>
    set({
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
    }),

  beginLocalGame: (count) =>
    set((s) => ({
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

  initRoundQuestions: () => {
    const players = get().players;
    if (!players.length) return;

    const active = QUESTIONS.filter((q) => q.active);

    const byType = (type: QuestionType) =>
      active.filter((q) => q.type === type);

    const possibleTypes: QuestionType[] = ["pick", "number"];

    const candidates = possibleTypes
      .map((t) => ({ type: t, list: byType(t) }))
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

    set({
      questionType: chosen.type,
      currentBaseQuestionId: base.id,
      currentOddQuestionId: odd.id,
      oddOneId: oddPlayer.id,
      answers: {},
    });
  },
}));
