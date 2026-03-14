// src/store/useGameStore.ts
import { create } from "zustand";
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

type QuestionType = "pick" | "rate" | "number";

/** 12-round schedule; then repeats from the start. Bonus round is step 6. */
const ROUND_SCHEDULE: (QuestionType | "bonus")[] = [
  "pick",   // 1
  "pick",   // 2
  "number", // 3
  "rate",   // 4
  "pick",   // 5
  "bonus",  // 6
  "number", // 7
  "rate",   // 8
  "pick",   // 9
  "number", // 10
  "number", // 11
  "rate",   // 12
];

function getScheduleTypeForRound(roundIndex: number): QuestionType | "bonus" {
  if (roundIndex < 1) return "pick";
  const i = (roundIndex - 1) % ROUND_SCHEDULE.length;
  return ROUND_SCHEDULE[i];
}

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

  /** Животи по играч (playerId -> останали животи). */
  lives: Record<string, number>;
  lastAppliedLivesRoundKey?: string;

  set: (p: Partial<GameState>) => void;
  setGameQuestions: (questions: IQuestion[]) => void;
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
  restartWithSamePlayersAndHeroes: () => void;

  initLives: () => void;
  applyRoundLives: () => void;
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

  set: (p) => set(p),

  setGameQuestions: (questions) => set({ gameQuestions: questions }),

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
      questionNameTarget: undefined,
      impostorNameSubstitute: undefined,
      questionType: undefined,
      isBonusRound: false,
      gameQuestions: [],
      votes: {},
      usedQuestionIds: [],
      lives: {},
      lastAppliedLivesRoundKey: undefined,
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

    const questions = get().gameQuestions;
    const active = questions.filter((q) => q.isActive);
    if (!active.length) return;

    const used = get().usedQuestionIds || [];
    const completedRounds = get().round ?? 0;
    const currentRoundIndex = completedRounds + 1;
    const scheduleType = getScheduleTypeForRound(currentRoundIndex);
    const isBonusRound = scheduleType === "bonus";

    const pickSourceForType = (type: QuestionType) => {
      const byTypeAll = active.filter((q) => q.type === type);
      const byTypeUnused = byTypeAll.filter((q) => !used.includes(q.id));

      // Prefer unused questions; fall back to all of type when exhausted
      if (byTypeUnused.length >= 2) return byTypeUnused;
      return byTypeAll;
    };

    /**
     * Get the pool for picking the "odd" question. If base has relatedGroupIds,
     * pick from questions that share at least one group (same type); otherwise from all of type.
     * Excludes questions already used in this game (as main or impostor) so they never repeat.
     */
    const getOddPoolForBase = (base: IQuestion, type: QuestionType) => {
      const excludeUsed = (pool: typeof active) => pool.filter((q) => q.id !== base.id && !used.includes(q.id));
      const baseGroups = base.relatedGroupIds ?? [];
      let fullPool: typeof active;
      if (!baseGroups.length) {
        fullPool = pickSourceForType(type);
      } else {
        const related = active.filter(
          (q) =>
            q.type === type &&
            q.id !== base.id &&
            (q.relatedGroupIds ?? []).some((g) => baseGroups.includes(g))
        );
        fullPool = related.length >= 1 ? related : pickSourceForType(type).filter((q) => q.id !== base.id);
      }
      const preferred = excludeUsed(fullPool);
      if (preferred.length >= 1) return preferred;
      return fullPool.filter((q) => q.id !== base.id);
    };

    const possibleTypes: QuestionType[] = ["pick", "rate", "number"];
    let candidates = possibleTypes
      .map((t) => ({ type: t, list: pickSourceForType(t) }))
      .filter((x) => x.list.length >= 2);

    if (scheduleType !== "bonus") {
      const forSchedule = candidates.filter((c) => c.type === scheduleType);
      if (forSchedule.length >= 1) candidates = forSchedule;
    }

    if (!candidates.length) {
      console.warn("No question type with at least 2 active questions");
      return;
    }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    const list = chosen.list;

    const firstIdx = Math.floor(Math.random() * list.length);
    const base = list[firstIdx];

    const oddPool = getOddPoolForBase(base, chosen.type);
    const oddPoolFiltered = oddPool.filter((q) => q.id !== base.id);
    const pool = oddPoolFiltered.length >= 1 ? oddPoolFiltered : oddPool;
    let odd = pool[Math.floor(Math.random() * pool.length)];

    const oddPlayer = players[Math.floor(Math.random() * players.length)];

    let questionNameTarget: string | undefined;
    let impostorNameSubstitute: string | undefined;

    const baseHasNamePlaceholder = base.text.includes("{{name}}");

    if (baseHasNamePlaceholder) {
      // All non-impostors see the same player name in the base question
      const baseTarget = players[Math.floor(Math.random() * players.length)];
      questionNameTarget = baseTarget.name;

      const roll = Math.random();
      if (roll < 0.75) {
        // 75%: impostor gets the same question but with a different player's name
        odd = base;
        const others = players.filter(
          (p) => p.id !== oddPlayer.id && p.id !== baseTarget.id
        );
        const alt =
          others.length > 0
            ? others[Math.floor(Math.random() * others.length)]
            : baseTarget;
        impostorNameSubstitute = alt.name;
      } else {
        // 25%: impostor gets a different rate question from the pool
        // If that question also has {{name}}, show another random player's name to the impostor
        if (odd.text.includes("{{name}}")) {
          const candidates = players.filter((p) => p.id !== oddPlayer.id);
          const target =
            candidates.length > 0
              ? candidates[Math.floor(Math.random() * candidates.length)]
              : players[0];
          impostorNameSubstitute = target?.name;
        }
      }
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
    get().initRoundQuestions();
  },

  // вдигаме броя на завършените рундове
  goToNextRound: () =>
    set((s) => ({
      round: s.round + 1,
    })),

  restartWithSamePlayersAndHeroes: () =>
    set((s) => {
      const perPlayer = s.gameSettings.livesPerPlayer ?? 3;
      const nextLives: Record<string, number> = {};
      const takenCharacters = s.players
        .map((p) => p.characterId)
        .filter((id): id is string => Boolean(id));

      s.players.forEach((p) => {
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
        targetPlayersCount: s.players.length,
        takenCharacters,
        lives: nextLives,
        lastAppliedLivesRoundKey: undefined,
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

      const votedWinner =
        Object.entries(votes).reduce(
          (acc, [voterId, targetId]) => {
            if (voterId === imposterId) return acc;
            acc[targetId] = (acc[targetId] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
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

