export type OnboardingStackParamList = {
  InitialLoading: undefined;
  Welcome: undefined;
  Menu: undefined;
  MenuPlay: undefined;
  Store: undefined;
  Profile: undefined;
  Settings: undefined;
  Rules: undefined;
};

export type CreateGameStackParamList = {
  PlayersNumber: undefined;
  Name: { index: number };
  HeroPicker: { playerId?: string; index: number };
  Settings: undefined;
  PassDevice: { index: number };
  Lobby: undefined;
};

export type GameStackParamList = {
  PassDeviceGameplay: { playerIndex: number };
  Question: { playerIndex: number };
  Results: undefined;
  VoteNow: undefined;
  PassDeviceVote: { voterIndex: number };
  Vote: { voterIndex: number };
  VoteResults: undefined;
  PreReveal: undefined;
  Reveal: undefined;
  Round: undefined;
  Standings: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  CreateGame: undefined;
  Game: undefined;
};
