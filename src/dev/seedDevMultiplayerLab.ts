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
  discussionSeconds: 120,
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

function resolveHeroId(slug: string, fallbackId: string): string {
  const heroes = useHeroesStore.getState().heroes;
  return heroes.find((h) => h.slug === slug)?.id ?? fallbackId;
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

export function seedRevealLose() {
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

/** Impostor (p2) wins — voters did not catch them. */
export function seedRevealWin() {
  seedDevLabBase();
  useGameStore.getState().set({
    answers: {
      [DEV_IDS.local]: "A",
      [DEV_IDS.p2]: "B",
      [DEV_IDS.p3]: "C",
    },
    votes: {
      [DEV_IDS.local]: DEV_IDS.p3,
      [DEV_IDS.p3]: DEV_IDS.local,
    },
    phase: "reveal",
    round: 0,
    currentRoundId: "dev_round_win",
  });
}

/** @deprecated Use seedRevealLose */
export function seedReveal() {
  seedRevealLose();
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

/**
 * Demo: fires state changes after the death screen animation finishes (~5s).
 * The base offset of 6 000 ms ensures every event lands after the feed hook
 * has subscribed. Events are staggered at varying intervals so the feed
 * populates gradually, one line at a time.
 *
 * Timeline (ms from seed call):
 *   T+6 000  phase → voting        → "Players are voting"
 *   T+7 800  p3 loses life         → "Bot Bob lost a life — 2 remaining"
 *   T+10 200 round 2 + new Q       → "Round 2" + question text
 *   T+11 900 phase → voting        → "Players are voting"
 *   T+13 700 p2 loses life         → "Bot Alice lost a life — 1 remaining"
 *   T+16 300 round 3 + new Q       → "Round 3" + question text
 *   T+18 100 phase → voting        → "Players are voting"
 *   T+20 000 p3 loses life         → "Bot Bob lost a life — 1 remaining"
 *   T+22 600 p2 eliminated         → "Bot Alice was eliminated"
 *   T+25 000 round 4 + new Q       → "Round 4" + question text
 *   T+26 800 phase → voting        → "Players are voting"
 *   T+29 200 p3 eliminated         → "Bot Bob was eliminated"
 */
export function seedPlayerDeathWatchDemo() {
  const vanessaId = resolveVanessaId();
  const store = useGameStore.getState();
  store.reset();
  store.set({
    mode: "LOCAL",
    gameId: `dev_${Date.now()}`,
    phase: "answering",
    round: 1,
    players: threePlayers(vanessaId),
    takenCharacters: [vanessaId],
    gameSettings: defaultSettings(),
    gameQuestions: DEV_STUB_QUESTIONS,
    currentBaseQuestionId: "dev-q1",
    currentOddQuestionId: "dev-q2",
    oddOneId: DEV_IDS.p2,
    isBonusRound: false,
    questionType: "pick",
    lives: {
      [DEV_IDS.local]: 0,
      [DEV_IDS.p2]: 2,
      [DEV_IDS.p3]: 3,
    },
  });

  const s = useGameStore.getState;
  setTimeout(() => s().set({ phase: "voting" }),                                                       6_000);
  setTimeout(() => s().set({ lives: { [DEV_IDS.local]: 0, [DEV_IDS.p2]: 2, [DEV_IDS.p3]: 2 } }),    7_800);
  setTimeout(() => s().set({ round: 2, phase: "answering", currentBaseQuestionId: "dev-q2" }),        10_200);
  setTimeout(() => s().set({ phase: "voting" }),                                                       11_900);
  setTimeout(() => s().set({ lives: { [DEV_IDS.local]: 0, [DEV_IDS.p2]: 1, [DEV_IDS.p3]: 2 } }),    13_700);
  setTimeout(() => s().set({ round: 3, phase: "answering", currentBaseQuestionId: "dev-q1" }),        16_300);
  setTimeout(() => s().set({ phase: "voting" }),                                                       18_100);
  setTimeout(() => s().set({ lives: { [DEV_IDS.local]: 0, [DEV_IDS.p2]: 1, [DEV_IDS.p3]: 1 } }),    20_000);
  setTimeout(() => s().set({ lives: { [DEV_IDS.local]: 0, [DEV_IDS.p2]: 0, [DEV_IDS.p3]: 1 } }),    22_600);
  setTimeout(() => s().set({ round: 4, phase: "answering", currentBaseQuestionId: "dev-q2" }),        25_000);
  setTimeout(() => s().set({ phase: "voting" }),                                                       26_800);
  setTimeout(() => s().set({ lives: { [DEV_IDS.local]: 0, [DEV_IDS.p2]: 0, [DEV_IDS.p3]: 0 } }),    29_200);
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

/**
 * Deathmatch entry point: 2 alive players remain (p3 eliminated), all ready
 * for the intro + guessing game. Both alive players use Remote Susie so her
 * deathmatch_image is shown for both heroes in the intro animation.
 */
export function seedDeathMatchLocal() {
  const remoteSusieId = resolveHeroId("remote-susie", "7");
  const store = useGameStore.getState();
  store.reset();
  store.set({
    mode: "LOCAL",
    gameId: `dev_${Date.now()}`,
    phase: "result",
    round: 3,
    players: [
      { id: DEV_IDS.local, name: "You", characterId: remoteSusieId, connected: true, isHost: true },
      { id: DEV_IDS.p2,    name: "Bot Alice", characterId: remoteSusieId, connected: true },
      { id: DEV_IDS.p3,    name: "Bot Bob",   characterId: remoteSusieId, connected: true },
    ],
    takenCharacters: [remoteSusieId],
    gameSettings: defaultSettings(),
    gameQuestions: DEV_STUB_QUESTIONS,
    oddOneId: DEV_IDS.p2,
    votes: {
      [DEV_IDS.local]: DEV_IDS.p2,
      [DEV_IDS.p3]: DEV_IDS.p2,
    },
    lives: {
      [DEV_IDS.local]: 2,
      [DEV_IDS.p2]: 1,
      [DEV_IDS.p3]: 0,
    },
    deathMatchWinnerIds: undefined,
  });
}

/** Winner screen seeded with a single deathmatch winner (You). */
export function seedDeathMatchWinnerSingle() {
  const vanessaId = resolveVanessaId();
  const store = useGameStore.getState();
  store.reset();
  store.set({
    mode: "LOCAL",
    gameId: `dev_${Date.now()}`,
    phase: "result",
    round: 3,
    players: threePlayers(vanessaId),
    takenCharacters: [vanessaId],
    gameSettings: defaultSettings(),
    gameQuestions: DEV_STUB_QUESTIONS,
    oddOneId: DEV_IDS.p2,
    lives: {
      [DEV_IDS.local]: 2,
      [DEV_IDS.p2]: 1,
      [DEV_IDS.p3]: 0,
    },
    deathMatchWinnerIds: [DEV_IDS.local],
  });
}

/** Winner screen seeded with a deathmatch tie (both alive players win). */
export function seedDeathMatchWinnerTie() {
  const vanessaId = resolveVanessaId();
  const store = useGameStore.getState();
  store.reset();
  store.set({
    mode: "LOCAL",
    gameId: `dev_${Date.now()}`,
    phase: "result",
    round: 3,
    players: threePlayers(vanessaId),
    takenCharacters: [vanessaId],
    gameSettings: defaultSettings(),
    gameQuestions: DEV_STUB_QUESTIONS,
    oddOneId: DEV_IDS.p2,
    lives: {
      [DEV_IDS.local]: 2,
      [DEV_IDS.p2]: 1,
      [DEV_IDS.p3]: 0,
    },
    deathMatchWinnerIds: [DEV_IDS.local, DEV_IDS.p2],
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

/**
 * Hero button styles — group 1 (10 heroes):
 * Vanessa · Simpalot · Retrograda · Brochain · Dubai Princess ·
 * Uncle Vape · Virala · Plugged In Pete · Remote Susie · Dad GPT
 *
 * "You" (Vanessa) is the voter at index 0, so all 10 hero buttons are visible.
 */
export function seedHeroButtonsGroup1() {
  const store = useGameStore.getState();
  store.reset();

  const vanessaId = resolveVanessaId();

  const heroCandidates = [
    { id: "dev-h1-p1",  name: "Silent Vanessa",  characterId: resolveHeroId("silent-vanessa",  "1")  },
    { id: "dev-h1-p2",  name: "Sir Simpalot",     characterId: resolveHeroId("sir-simpalot",    "2")  },
    { id: "dev-h1-p3",  name: "Retrograda",       characterId: resolveHeroId("retrograda",      "5")  },
    { id: "dev-h1-p4",  name: "Brochain",         characterId: resolveHeroId("brochain",        "8")  },
    { id: "dev-h1-p5",  name: "Dubai Princess",   characterId: resolveHeroId("dubai-princess",  "3")  },
    { id: "dev-h1-p6",  name: "Uncle Vape",       characterId: resolveHeroId("uncle-vape",      "4")  },
    { id: "dev-h1-p7",  name: "Virala",           characterId: resolveHeroId("virala",          "17") },
    { id: "dev-h1-p8",  name: "Plugged In Pete",  characterId: resolveHeroId("plugged-in-pete", "6")  },
    { id: "dev-h1-p9",  name: "Remote Susie",     characterId: resolveHeroId("remote-susie",    "7")  },
    { id: "dev-h1-p10", name: "Dad GPT",          characterId: resolveHeroId("dad-gpt",         "12") },
  ];

  const localPlayer = { id: DEV_IDS.local, name: "You", characterId: vanessaId, connected: true, isHost: true };
  const players = [localPlayer, ...heroCandidates.map((p) => ({ ...p, connected: true }))];

  const answers: Record<string, string> = {};
  players.forEach((p) => { answers[p.id] = heroCandidates[0].id; });

  store.set({
    mode: "LOCAL",
    gameId: `dev_${Date.now()}`,
    phase: "discussion",
    round: 1,
    players,
    takenCharacters: players.map((p) => p.characterId),
    gameSettings: defaultSettings(),
    gameQuestions: DEV_STUB_QUESTIONS,
    currentBaseQuestionId: "dev-q1",
    currentOddQuestionId: "dev-q2",
    oddOneId: heroCandidates[1].id,
    questionType: "pick",
    isBonusRound: false,
    questionNameTarget: null,
    impostorNameSubstitute: null,
    answers,
    votes: {},
    usedQuestionIds: ["dev-q1", "dev-q2"],
  });
  store.initLives();
}

/**
 * Hero button styles — group 2 (8 heroes):
 * Screena · Booena · Chef Franco · Mr. Good Time ·
 * Wine Bender · Tedimechov · Hangreta · Dr. Wrong
 *
 * "You" (Vanessa) is the voter at index 0, so all 8 hero buttons are visible.
 */
export function seedHeroButtonsGroup2() {
  const store = useGameStore.getState();
  store.reset();

  const vanessaId = resolveVanessaId();

  const heroCandidates = [
    { id: "dev-h2-p1", name: "Screena",       characterId: resolveHeroId("screena",      "11") },
    { id: "dev-h2-p2", name: "Booena",        characterId: resolveHeroId("booena",       "9")  },
    { id: "dev-h2-p3", name: "Chef Franco",   characterId: resolveHeroId("chef-franco",  "22") },
    { id: "dev-h2-p4", name: "Mr. Good Time", characterId: resolveHeroId("mrgoodtime",   "16") },
    { id: "dev-h2-p5", name: "Wine Bender",   characterId: resolveHeroId("wine-bender",  "13") },
    { id: "dev-h2-p6", name: "Tedimechov",    characterId: resolveHeroId("tedimechov",   "18") },
    { id: "dev-h2-p7", name: "Hangreta",      characterId: resolveHeroId("hangreta",     "15") },
    { id: "dev-h2-p8", name: "Dr. Wrong",     characterId: resolveHeroId("drwrong",      "10") },
  ];

  const localPlayer = { id: DEV_IDS.local, name: "You", characterId: vanessaId, connected: true, isHost: true };
  const players = [localPlayer, ...heroCandidates.map((p) => ({ ...p, connected: true }))];

  const answers: Record<string, string> = {};
  players.forEach((p) => { answers[p.id] = heroCandidates[0].id; });

  store.set({
    mode: "LOCAL",
    gameId: `dev_${Date.now()}`,
    phase: "discussion",
    round: 1,
    players,
    takenCharacters: players.map((p) => p.characterId),
    gameSettings: defaultSettings(),
    gameQuestions: DEV_STUB_QUESTIONS,
    currentBaseQuestionId: "dev-q1",
    currentOddQuestionId: "dev-q2",
    oddOneId: heroCandidates[1].id,
    questionType: "pick",
    isBonusRound: false,
    questionNameTarget: null,
    impostorNameSubstitute: null,
    answers,
    votes: {},
    usedQuestionIds: ["dev-q1", "dev-q2"],
  });
  store.initLives();
}
