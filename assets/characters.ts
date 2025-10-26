export const characters = {
  allan: require("./images/characters/picker/premium/Bitcoin_Allan.png"),
  booena: require("./images/characters/picker/Booena.png"),
  cryptobro: require("./images/characters/picker/Crypto_Bro.png"),
  dadgpt: require("./images/characters/picker/premium/Dad_GPT.png"),
  drwrong: require("./images/characters/picker/Dr_Wrong.png"),
  dubai: require("./images/characters/picker/Dubai_Princess.png"),
  goodtime: require("./images/characters/picker/premium/Mr_GoodTime.png"),
  hangreta: require("./images/characters/picker/premium/Hangreta.png"),
  monday: require("./images/characters/picker/premium/Monday.png"),
  pete: require("./images/characters/picker/PluggedIn_Pete.png"),
  retrograda: require("./images/characters/picker/Retrograda.png"),
  screena: require("./images/characters/picker/premium/Screena.png"),
  simpalot: require("./images/characters/picker/Sir_Simpalot.png"),
  susie: require("./images/characters/picker/Remote_Susie.png"),
  tedimechov: require("./images/characters/picker/premium/Tedimechov.png"),
  vanessa: require("./images/characters/picker/Silent_Vanessa.png"),
  vape: require("./images/characters/picker/Uncle_Vape.png"),
  vibeswitch: require("./images/characters/picker/premium/Vibeswitch.png"),
  virala: require("./images/characters/picker/premium/Virala.png"),
  winebender: require("./images/characters/picker/premium/Wine_Bender.png"),
};

export const characters_loss = {};

export const characters_win = {};

export const character_avatars = {
  abu_dubaiena: require("./images/characters/avatars/Dubai_Princess.png"),
  bitcoin_allan: require("./images/characters/avatars/bitcoin_allan.png"),
  booena: require("./images/characters/avatars/Booena.png"),
  brochain: require("./images/characters/avatars/Crypto_bro.png"),
  dad_gpt: require("./images/characters/avatars/dad_gpt.png"),
  dr_wrong: require("./images/characters/avatars/drwrong.png"),
  hangreta: require("./images/characters/avatars/hangreta.png"),
  monday: require("./images/characters/avatars/monday.png"),
  mr_good_time: require("./images/characters/avatars/mr_good_time.png"),
  plugged_in_pete: require("./images/characters/avatars/Pluggedin_pete.png"),
  remote_susie: require("./images/characters/avatars/Remote_susie.png"),
  retrograda: require("./images/characters/avatars/Retrograda.png"),
  screena: require("./images/characters/avatars/screena.png"),
  silent_vanessa: require("./images/characters/avatars/Silent_Vanessa.png"),
  sir_simpalot: require("./images/characters/avatars/Sir_Simpalot.png"),
  tedimechov: require("./images/characters/avatars/tedimechov.png"),
  uncle_vape: require("./images/characters/avatars/Uncle_Vape.png"),
  vibeswitch: require("./images/characters/avatars/vibeswitch.png"),
  virala: require("./images/characters/avatars/virala.png"),
  wine_bender: require("./images/characters/avatars/wine_bender.png"),
} as const;

export type AvatarId = keyof typeof character_avatars;
