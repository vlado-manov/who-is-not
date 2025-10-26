export type OnboardingStackParamList = {
  InitialLoading: undefined;
  Welcome: undefined;
  Menu: undefined;
  MenuPlay: undefined;
  Store: undefined;
  Profile: undefined;
};

export type CreateGameStackParamList = {
  PlayersNumber: undefined;
  Name: { index: number };
  HeroPicker: { playerId: string; index: number };
  PassDevice: { index: number };
  Lobby: undefined;
};

export type GameStackParamList = {
  Question: undefined;
  Results: undefined;
  Vote: undefined;
  VoteResults: undefined;
  Reveal: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  CreateGame: undefined;
  Game: undefined;
};
