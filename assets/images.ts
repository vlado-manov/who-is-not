/**
 * Image assets – all use CDN via cdn() helper.
 * Paths map to: https://cdn.mydomain.com/{path}.webp
 */
import { cdn } from "../src/utils/image";

const g = (id: string, file: string) => ({
  uri: cdn(`images/gallery/${id}-${file}`),
});

export const images = {
  curtainTop: cdn("images/gallery/0dc9c386-810b-456a-b982-d940950ae855-curtainTop"),
  curtainBottom: cdn("images/gallery/e0a83a0a-c4cc-45ad-88a7-4b9e026e236d-curtainBottom"),
  loader: g("c8f07632-e624-4445-a78d-967fe0b5570e", "loader"),
  googleIcon: g("dbd21784-b5c1-4e80-b440-531ce451635c", "googleIcon"),
  webtzarLogo: g("6692a4ad-7c22-49ec-bc60-af99788a1ea0", "webtzar-logo"),
};

export const game_images = {
  passDevice: g("3f78d4b6-e57b-4cc9-b01d-49ce395f8261", "HandThePhone"),
  logoMusicOn: g("121cf548-6af9-49bf-90db-0e9040d1af42", "logoMusicOn"),
  logoMusicOff: g("9832312b-b1d4-41bf-9260-97216165a7c9", "logoMusicOff"),
  logoFrMusicOn: g("c309e37a-dc35-4f68-b484-afd52237e15c", "logoFrMusicOn"),
  logoFrMusicOff: g("afd49abf-de83-48f0-b3a9-633335cc219e", "logoFrMusicOff"),
  logoEsMusicOn: g("e1445854-f8bd-4c60-abf7-08f760c6d1a2", "logoEsMusicOn"),
  logoEsMusicOff: g("7824e467-1183-4f13-bf28-fedf35e167f9", "logoEsMusicOff"),
  logoBgMusicOn: g("d432e583-4c9e-4d74-90e3-40051c6a422d", "logoBgMusicOn"),
  logoBgMusicOff: g("eb3fecd0-267d-48f5-96a5-f98c107c00e8", "logoBgMusicOff"),
  settingsIcon: g("9cf23d6c-aafc-45e7-882e-1a4b752d1a43", "settingsIcon"),
  userIcon: g("81c0ee3f-6afc-4f58-acb1-cd8fb4b9071a", "userIcon"),
  storeIcon: g("29581ca9-6c61-4995-a98f-97e775703da9", "storeIcon"),
  htpIcon: g("b8300793-c232-47ff-9332-48047dd5ff78", "htpIcon"),
  btnMinus: g("09ff9060-48c0-4c0b-a3a0-8dfa725893fb", "btnMinus"),
  btnPlus: g("431055a5-400c-4912-82bc-20f323fe5f9a", "btnPlus"),
  pplCountContainer: g("09ab591f-5c5a-4cb6-a2bf-e2ba51cc1d80", "calcPpl"),
  leftArrow: g("189c0167-2f86-4f03-8fc4-e21aa01c03c2", "arrowLeft"),
  rightArrow: g("601f3287-867f-4966-b5da-e92d6cbc29a6", "arrowRight"),
  heroPickerBottom: g("107a0ffc-d5fe-4ab3-9f92-b537ae121453", "HeroPickerBottom"),
  lock: g("d538ff35-2e20-4ce5-b579-de2b51cb8bf8", "lock01"),
  lock2: g("609a50bf-5e6d-44f9-b14a-9a021a9c9ca4", "lock02"),
  lock3: g("89ca29b8-17ff-4026-ace2-0ae9d053093d", "lock03"),
  lock4: g("6d51b22f-6bc6-4c44-add7-e69d3388a257", "lock04"),
  lock5: g("9b37fb80-682c-42f3-9551-b7f0718a5dac", "lock05"),
  arrowRightVote: g("6bffee60-ec8c-44e8-b4d7-04363a36d0bc", "arrowRightVote"),
  timer: g("1cfc5248-ba48-4f61-aa08-1ef32d14be84", "timer"),
};

export const loaderFrames = {
  frame01: g("8d29004d-7127-48b9-b525-994634135ace", "dubaitest"),
  frame02: g("3becc993-529f-4d5a-885c-a382a26ae580", "dubaitest2"),
  frame03: g("74670cba-dc7c-4e6f-90f1-d916f2e0dec8", "dubaitest3"),
  frame04: g("9d1979ac-4df1-401a-abef-fccb7a3d45e0", "dubaitest4"),
  frame05: g("5690ad62-23d8-48e3-8b72-9150e5aa260a", "dubaitest5"),
  frame06: g("0c8a6d4b-e9c5-4039-9b08-148d1fc768d6", "dubaitest6"),
  frame07: g("58a3687b-f3a4-4eeb-a3b7-552d8bd2390c", "dubaitest7"),
  frame08: g("350cd03d-dafc-45b0-b2dc-bb20ff109415", "dubaitest8"),
};

export const htp_images = {
  htp03: g("0b704162-590b-4fa7-9f9d-9328e2f5d897", "htp03"),
  htp05: g("678c89c3-7403-4a68-a0ac-0f9e4352a8b7", "htp05"),
  htp06: g("43fc77a1-cb7c-4073-b58d-91c273bd30cf", "htp06"),
  htp07: g("93e2d935-6ae8-4a2a-9364-1d726c4eace2", "htp07"),
  htp08: g("267e8cf5-afbb-4838-bdbd-1a769d58f5c2", "htp08"),
  htp09: g("2f9f88e2-f593-4960-8084-9f05f470ead0", "htp09"),
};

