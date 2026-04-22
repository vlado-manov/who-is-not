/**
 * Dev-only: seed Zustand game state so Game stack screens render without a real session.
 * Uses LOCAL mode (no WebSocket) so flows are not blocked by multiplayer sync.
 * Hero: Silent Vanessa when available from the heroes store, else bundled id "1".
 */
import { useGameStore } from "../store/useGameStore";
import { useHeroesStore } from "../store/useHeroesStore";
import type { GameSettings } from "../store/useGameStore";
import type { IQuestion, QuestionTypeApi } from "../types/question";

export const DEV_IDS = {
  local: "dev-local",
  p2: "dev-p2",
  p3: "dev-p3",
} as const;

const defaultSettings = (): GameSettings => ({
  discussionSeconds: 5,
  selectedPacks: ["main"],
  livesPerPlayer: 3,
});

export const DEV_STUB_QUESTIONS: IQuestion[] = [
  {
    id: "dev-q1",
    text: "Pick a snack nobody would admit they eat at midnight.",
    type: "pick",
    used: 0,
    isActive: true,
  },
  {
    id: "dev-q2",
    text: "Pick a snack nobody would admit they eat at midnight.",
    type: "pick",
    used: 0,
    isActive: true,
  },
];

function resolveVanessaId(): string {
  const heroes = useHeroesStore.getState().heroes;
  const v = heroes.find((h) => h.name === "Silent Vanessa");
  return v?.id ?? "1";
}

function threePlayers(vanessaId: string) {
  return [
    {
      id: DEV_IDS.local,
      name: "You",
      characterId: vanessaId,
      connected: true,
      isHost: true,
    },
    {
      id: DEV_IDS.p2,
      name: "Bot Alice",
      characterId: vanessaId,
      connected: true,
    },
    {
      id: DEV_IDS.p3,
      name: "Bot Bob",
      characterId: vanessaId,
      connected: true,
    },
  ];
}

/** Clears session and applies a LOCAL dev game with 3× Silent Vanessa. */
export function seedDevLabBase() {
  const vanessaId = resolveVanessaId();
  const store = useGameStore.getState();
  store.reset();
  store.set({
    mode: "LOCAL",
    gameId: `dev_${Date.now()}`,
    phase: "answering",
    round: 0,
    players: threePlayers(vanessaId),
    takenCharacters: [vanessaId],
    gameSettings: defaultSettings(),
    gameQuestions: DEV_STUB_QUESTIONS,
    currentBaseQuestionId: "dev-q1",
    currentOddQuestionId: "dev-q2",
    oddOneId: DEV_IDS.p2,
    questionType: "pick",
    isBonusRound: false,
    questionNameTarget: null,
    impostorNameSubstitute: null,
    answers: {},
    votes: {},
    usedQuestionIds: ["dev-q1", "dev-q2"],
  });
  store.initLives();
}

export function seedQuestionScreen() {
  seedDevLabBase();
}

export function seedPassDeviceGameplay() {
  seedDevLabBase();
  useGameStore.getState().set({
    answers: {
      [DEV_IDS.local]: "Pizza",
    },
  });
}

/** Results — pick: answers must be player ids (who each player voted for). */
export function seedResultsScreen() {
  seedDevLabBase();
  useGameStore.getState().set({
    answers: {
      [DEV_IDS.local]: DEV_IDS.p2,
      [DEV_IDS.p2]: DEV_IDS.p3,
      [DEV_IDS.p3]: DEV_IDS.local,
    },
    phase: "discussion",
  });
}

export function seedVoteNow() {
  seedResultsScreen();
}

export function seedVoteScreen() {
  seedResultsScreen();
}

export function seedPreReveal() {
  seedResultsScreen();
}

export function seedReveal() {
  seedDevLabBase();
  useGameStore.getState().set({
    answers: {
      [DEV_IDS.local]: "A",
      [DEV_IDS.p2]: "B",
      [DEV_IDS.p3]: "C",
    },
    votes: {
      [DEV_IDS.local]: DEV_IDS.p2,
      [DEV_IDS.p3]: DEV_IDS.p2,
    },
    phase: "reveal",
    round: 0,
    currentRoundId: "dev_round_1",
  });
}

/**
 * Lives reveal: impostor (p2) caught — only they lose a life.
 * LOCAL path so no WS; long animation plays through.
 */
export function seedLivesRevealScreen() {
  seedDevLabBase();
  useGameStore.getState().set({
    answers: {
      [DEV_IDS.local]: "x",
      [DEV_IDS.p2]: "y",
      [DEV_IDS.p3]: "z",
    },
    votes: {
      [DEV_IDS.local]: DEV_IDS.p2,
      [DEV_IDS.p3]: DEV_IDS.p2,
    },
    phase: "result",
    round: 0,
    currentRoundId: "dev_lr_1",
    lastAppliedLivesRoundKey: undefined,
  });
}

export function seedPlayerDeathContinue() {
  seedDevLabBase();
}

export function seedPlayerDeathGameOver() {
  seedDevLabBase();
}

export function seedWinnerCelebration() {
  const vanessaId = resolveVanessaId();
  const store = useGameStore.getState();
  store.reset();
  store.set({
    mode: "LOCAL",
    gameId: `dev_${Date.now()}`,
    phase: "result",
    round: 5,
    players: threePlayers(vanessaId),
    takenCharacters: [vanessaId],
    gameSettings: defaultSettings(),
    oddOneId: DEV_IDS.p2,
    votes: {
      [DEV_IDS.local]: DEV_IDS.p2,
      [DEV_IDS.p3]: DEV_IDS.p2,
    },
    lives: {
      [DEV_IDS.local]: 3,
      [DEV_IDS.p2]: 0,
      [DEV_IDS.p3]: 0,
    },
    gameQuestions: DEV_STUB_QUESTIONS,
  });
}

/** Online-style eliminated panel inside Winner (EliminatedGameEndView). */
export function seedWinnerEliminatedOnline() {
  const vanessaId = resolveVanessaId();
  const store = useGameStore.getState();
  store.reset();
  store.set({
    mode: "ONLINE",
    gameId: `dev_${Date.now()}`,
    roomCode: "DEV00",
    onlineRoomId: "dev-room",
    onlinePlayerId: DEV_IDS.local,
    onlineIsHost: false,
    onlineWsToken: "dev",
    onlineHostSecret: null,
    onlineSpectating: false,
    phase: "result",
    round: 3,
    players: threePlayers(vanessaId),
    takenCharacters: [vanessaId],
    gameSettings: defaultSettings(),
    oddOneId: DEV_IDS.p2,
    lives: {
      [DEV_IDS.local]: 0,
      [DEV_IDS.p2]: 2,
      [DEV_IDS.p3]: 2,
    },
    gameQuestions: DEV_STUB_QUESTIONS,
  });
}

export function seedRoundScreen() {
  const vanessaId = resolveVanessaId();
  const store = useGameStore.getState();
  store.reset();
  store.set({
    mode: "LOCAL",
    gameId: `dev_${Date.now()}`,
    phase: "lobby",
    round: 1,
    players: threePlayers(vanessaId),
    takenCharacters: [vanessaId],
    gameSettings: defaultSettings(),
    gameQuestions: DEV_STUB_QUESTIONS,
  });
  store.initLives();
}

export function seedStandingsScreen() {
  const vanessaId = resolveVanessaId();
  const store = useGameStore.getState();
  store.reset();
  store.set({
    mode: "LOCAL",
    gameId: `dev_${Date.now()}`,
    phase: "result",
    round: 2,
    players: threePlayers(vanessaId),
    takenCharacters: [vanessaId],
    gameSettings: defaultSettings(),
    lives: {
      [DEV_IDS.local]: 2,
      [DEV_IDS.p2]: 3,
      [DEV_IDS.p3]: 1,
    },
    gameQuestions: DEV_STUB_QUESTIONS,
  });
}

/** Round screen — бонус рунд: `round` = завършени рундове; 4 ⇒ показва се „рунд 5“ + Bonus overlay. */
export function seedRoundBonusScreen() {
  const vanessaId = resolveVanessaId();
  const store = useGameStore.getState();
  store.reset();
  store.set({
    mode: "LOCAL",
    gameId: `dev_${Date.now()}`,
    phase: "lobby",
    round: 4,
    players: threePlayers(vanessaId),
    takenCharacters: [vanessaId],
    gameSettings: defaultSettings(),
    gameQuestions: DEV_STUB_QUESTIONS,
  });
  store.initLives();
}

/** Results — бонус рунд (без масов въпрос в UI). */
export function seedResultsBonusScreen() {
  seedDevLabBase();
  useGameStore.getState().set({
    answers: {
      [DEV_IDS.local]: DEV_IDS.p2,
      [DEV_IDS.p2]: DEV_IDS.p3,
      [DEV_IDS.p3]: DEV_IDS.local,
    },
    phase: "discussion",
    isBonusRound: true,
    questionType: "pick",
  });
}

const QUESTION_COPY: Record<
  QuestionTypeApi,
  { base: string; odd: string }
> = {
  pick: {
    base: "Who is most likely to forget why they opened the fridge?",
    odd: "Who is most likely to adopt a raccoon?",
  },
  number: {
    base: "How many coffees do you need on Monday? (number)",
    odd: "How many unread notifications do you have? (number)",
  },
  rate: {
    base: "Rate your mood today (1–10).",
    odd: "Rate how ready you are for Monday (1–10).",
  },
  input: {
    base: "In one word: your weekend plan.",
    odd: "In one word: what you had for breakfast.",
  },
};

/** Two dev questions (base + odd) for a given API type — for Question / Results lab. */
export function makeDevQuestionsForType(type: QuestionTypeApi): IQuestion[] {
  const copy = QUESTION_COPY[type];
  const baseId = `dev-${type}-base`;
  const oddId = `dev-${type}-odd`;
  return [
    {
      id: baseId,
      text: copy.base,
      type,
      used: 0,
      isActive: true,
    },
    {
      id: oddId,
      text: copy.odd,
      type,
      used: 0,
      isActive: true,
    },
  ];
}

/** Same as seedDevLabBase but questions + questionType match `type` (pick / number / rate / input). */
export function seedDevLabBaseForQuestionType(type: QuestionTypeApi) {
  const vanessaId = resolveVanessaId();
  const qs = makeDevQuestionsForType(type);
  const store = useGameStore.getState();
  store.reset();
  store.set({
    mode: "LOCAL",
    gameId: `dev_${Date.now()}`,
    phase: "answering",
    round: 0,
    players: threePlayers(vanessaId),
    takenCharacters: [vanessaId],
    gameSettings: defaultSettings(),
    gameQuestions: qs,
    currentBaseQuestionId: qs[0].id,
    currentOddQuestionId: qs[1].id,
    oddOneId: DEV_IDS.p2,
    questionType: type,
    isBonusRound: false,
    questionNameTarget: null,
    impostorNameSubstitute: null,
    answers: {},
    votes: {},
    usedQuestionIds: [qs[0].id, qs[1].id],
  });
  store.initLives();
}

export function seedQuestionScreenOfType(type: QuestionTypeApi) {
  seedDevLabBaseForQuestionType(type);
}

export function seedResultsScreenOfType(type: QuestionTypeApi) {
  seedDevLabBaseForQuestionType(type);
  const answers: Record<string, string> =
    type === "pick"
      ? {
          [DEV_IDS.local]: DEV_IDS.p2,
          [DEV_IDS.p2]: DEV_IDS.p3,
          [DEV_IDS.p3]: DEV_IDS.local,
        }
      : type === "number"
        ? {
            [DEV_IDS.local]: "42",
            [DEV_IDS.p2]: "7",
            [DEV_IDS.p3]: "100",
          }
        : type === "rate"
          ? {
              [DEV_IDS.local]: "8",
              [DEV_IDS.p2]: "3",
              [DEV_IDS.p3]: "6",
            }
          : {
              [DEV_IDS.local]: "Sleep",
              [DEV_IDS.p2]: "Party",
              [DEV_IDS.p3]: "Coding",
            };
  useGameStore.getState().set({
    answers,
    phase: "discussion",
  });
}

/** Same store prep as PlayersNumber → Continue — local session, then navigate to HeroPicker. */
export function seedCreateGameHeroPickerFlow(playerCount = 5): void {
  const store = useGameStore.getState();
  store.reset();
  store.beginLocalGame(playerCount);
  store.startGameSession("LOCAL");
  /** `DevGameExitOverlay` only mounts for ids `dev_*` (see Game / Create stacks). */
  store.set({ gameId: `dev_${Date.now()}` });
}
