import type { NavigatorScreenParams } from "@react-navigation/native";

export type OnboardingStackParamList = {
  Welcome: { skipCurtain?: boolean } | undefined;
  Menu: undefined;
  MenuPlay: undefined;
  Store: undefined;
  Profile: undefined;
  Referral: undefined;
  Rules: undefined;
  Privacy: undefined;
  Terms: undefined;
  Support: undefined;
  /** __DEV__ only — open seeded Game screens without a real multiplayer session. */
  DevMultiplayerLab: undefined;
  /** __DEV__ only — button + background visual lab. */
  DevButtonLab: undefined;
  /** __DEV__ only — font preview lab. Shows a QuestionScreen mock with the given font. */
  DevFontPreview: { fontFamily: string; label: string };
};

export type CreateGameStackParamList = {
  PlayersNumber: undefined;
  Name: { index: number };
  HeroPicker: { playerId?: string; index: number };
  PassDevice: { index: number };
  Lobby: undefined;
  /** Online: host creates room, share join code (API + WebSocket). */
  OnlineHost: undefined;
  /** Online: join with room code. */
  OnlineJoin: undefined;
};

export type GameStackParamList = {
  PassDeviceGameplay: { playerIndex: number };
  Question: { playerIndex: number };
  Results: undefined;
  VoteNow: { voterIndex: number };
  Vote: { voterIndex: number };
  VoteResults: undefined;
  PreReveal: undefined;
  Reveal: undefined;
  LivesReveal: undefined;
  /** Multiplayer elimination cinematic; `gameOver` → then Winner. */
  PlayerDeath: {
    variant: "continue" | "gameOver";
    deadPlayerId: string;
  };
  Winner: undefined;
  DeathMatch: undefined;
  Round: undefined;
  Standings: undefined;
};

export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList> | undefined;
  CreateGame: NavigatorScreenParams<CreateGameStackParamList> | undefined;
  Game: NavigatorScreenParams<GameStackParamList> | undefined;
};
