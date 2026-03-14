// src/utils/prefetchRemoteUrls.ts
// Central list of remote image URLs used in the app. Prefetch at bootstrap.
import { Image } from "expo-image";

const BASE_URL =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery";

/** Remote URLs used in game/question screens - prefetch before showing app. */
export const REMOTE_GAME_URLS: string[] = [
  // images (CDN)
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/6692a4ad-7c22-49ec-bc60-af99788a1ea0-webtzar-logo.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/c8f07632-e624-4445-a78d-967fe0b5570e-loader.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/dbd21784-b5c1-4e80-b440-531ce451635c-googleIcon.webp",
  // game_images (CDN)
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/3f78d4b6-e57b-4cc9-b01d-49ce395f8261-HandThePhone.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/121cf548-6af9-49bf-90db-0e9040d1af42-logoMusicOn.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/9832312b-b1d4-41bf-9260-97216165a7c9-logoMusicOff.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/c309e37a-dc35-4f68-b484-afd52237e15c-logoFrMusicOn.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/afd49abf-de83-48f0-b3a9-633335cc219e-logoFrMusicOff.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/e1445854-f8bd-4c60-abf7-08f760c6d1a2-logoEsMusicOn.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/7824e467-1183-4f13-bf28-fedf35e167f9-logoEsMusicOff.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/d432e583-4c9e-4d74-90e3-40051c6a422d-logoBgMusicOn.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/eb3fecd0-267d-48f5-96a5-f98c107c00e8-logoBgMusicOff.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/9cf23d6c-aafc-45e7-882e-1a4b752d1a43-settingsIcon.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/81c0ee3f-6afc-4f58-acb1-cd8fb4b9071a-userIcon.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/29581ca9-6c61-4995-a98f-97e775703da9-storeIcon.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/b8300793-c232-47ff-9332-48047dd5ff78-htpIcon.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/09ff9060-48c0-4c0b-a3a0-8dfa725893fb-btnMinus.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/431055a5-400c-4912-82bc-20f323fe5f9a-btnPlus.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/09ab591f-5c5a-4cb6-a2bf-e2ba51cc1d80-calcPpl.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/189c0167-2f86-4f03-8fc4-e21aa01c03c2-arrowLeft.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/601f3287-867f-4966-b5da-e92d6cbc29a6-arrowRight.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/107a0ffc-d5fe-4ab3-9f92-b537ae121453-HeroPickerBottom.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/d538ff35-2e20-4ce5-b579-de2b51cb8bf8-lock01.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/609a50bf-5e6d-44f9-b14a-9a021a9c9ca4-lock02.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/89ca29b8-17ff-4026-ace2-0ae9d053093d-lock03.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/6d51b22f-6bc6-4c44-add7-e69d3388a257-lock04.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/9b37fb80-682c-42f3-9551-b7f0718a5dac-lock05.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/6bffee60-ec8c-44e8-b4d7-04363a36d0bc-arrowRightVote.webp",
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/1cfc5248-ba48-4f61-aa08-1ef32d14be84-timer.webp",
  //
  // QuestionScreen number input background
  `${BASE_URL}/efba9ddd-bff8-436b-8c3e-946f53c01a3b-input.webp`,
  // RatingSlider rail frame
  `${BASE_URL}/b179af07-61f2-46ea-812e-79ed27826ed0-border2.webp`,
  // RatingSlider thumb
  `${BASE_URL}/3db0af2c-1a13-4110-96e2-b79348d66976-border1.webp`,
  // RatingSlider buttons 1-10
  `${BASE_URL}/7d65e802-5be7-48ca-b85e-5019c980da34-btntest01.webp`,
  `${BASE_URL}/10817853-e3c5-46d3-aa4c-b9cfde3df758-btntest02.webp`,
  `${BASE_URL}/72a41c99-dd0f-4006-97f3-fd626ab75203-btntest03.webp`,
  `${BASE_URL}/e442e88f-769f-4590-9866-912c57eeeb83-btntest04.webp`,
  `${BASE_URL}/7af0211b-e8fd-4313-baeb-8379d4f179f6-btntest05.webp`,
  `${BASE_URL}/71903ea7-8f66-4a17-9b3c-49728f916027-btntest06.webp`,
  `${BASE_URL}/33c1be1e-ea32-4655-9b60-60ebf8989431-btntest07.webp`,
  `${BASE_URL}/337fd83b-f5ca-41d3-b84d-50296322ae70-btntest08.webp`,
  `${BASE_URL}/0157745f-93e8-4c1e-b54c-3c874a491654-btntest09.webp`,
  `${BASE_URL}/d0fbbd5e-e69c-4d77-a0df-2e236da08b50-btntest10.webp`,
  // Backgrounds (Cloudflare R2)
  `${BASE_URL}/9dd10679-acba-4b66-8ffd-84a2c12b1f97-bg003.webp`,
  `${BASE_URL}/b5355ddc-31bf-4643-b627-946f544874a4-bg004.webp`,
  `${BASE_URL}/7d92a71b-401b-4465-9145-ff3fd76818f6-bg005.webp`,
  `${BASE_URL}/ee506751-e5ed-4f50-b825-f0deb75952c2-bg015.webp`,
  `${BASE_URL}/026f17d6-0604-46ea-87a0-c07216dd1b29-bg016.webp`,
  `${BASE_URL}/80d0e764-68fc-4f6f-a0a2-4b5845904ee8-bg018.webp`,
  `${BASE_URL}/0c94e51c-8441-4ce7-b0e6-4bab4555b278-bg019.webp`,
  `${BASE_URL}/c2f18448-68f7-467e-9778-359b5d04f370-bg022.webp`,
  `${BASE_URL}/015d01f0-9357-4da4-b215-5713a04e2fea-bg023.webp`,
  `${BASE_URL}/4948042f-d7c4-42e0-b62a-7158cbc84f48-bg026.webp`,
  `${BASE_URL}/62640c5a-b953-4641-a7ce-f1b2e73138be-bg029.webp`,
  `${BASE_URL}/e2e9083e-b7c8-4399-8ac6-0d6aa8b0f4f1-bg030.webp`,
  `${BASE_URL}/ba09f448-5270-4b9b-84d1-aaac8869f4b4-bg-heroes01.webp`,
  // CurtainOverlay (curtainTop, curtainBottom)
  `${BASE_URL}/0dc9c386-810b-456a-b982-d940950ae855-curtainTop.webp`,
  `${BASE_URL}/e0a83a0a-c4cc-45ad-88a7-4b9e026e236d-curtainBottom.webp`,
  // RevealScreen title images (win/lose variants)
  `${BASE_URL}/fd68c69c-00a0-4eaf-b73c-66816cbd971b-wonRound.webp`,
  `${BASE_URL}/8f530ecb-ae7e-4aca-9e7b-90805583e9c1-wonRoundLucky.webp`,
  `${BASE_URL}/96b5a28d-7c5e-4e82-9bac-fd244a7f53e2-wonRoundNormal.webp`,
  `${BASE_URL}/89483b00-f53b-49d5-a570-dae66661aa8e-lostRoundQuestion.webp`,
  `${BASE_URL}/4a51458d-b11f-45a9-b185-df8f3c1a2097-lostRoundQuestionAlmost.webp`,
  `${BASE_URL}/b798c1c8-c4ef-4cb4-b57a-7c98321fc26d-lostRoundQuestionNormal.webp`,
  // Loader frames (PreRevealScreen, LoadingScreen)
  `${BASE_URL}/8d29004d-7127-48b9-b525-994634135ace-dubaitest.webp`,
  `${BASE_URL}/3becc993-529f-4d5a-885c-a382a26ae580-dubaitest2.webp`,
  `${BASE_URL}/74670cba-dc7c-4e6f-90f1-d916f2e0dec8-dubaitest3.webp`,
  `${BASE_URL}/9d1979ac-4df1-401a-abef-fccb7a3d45e0-dubaitest4.webp`,
  `${BASE_URL}/5690ad62-23d8-48e3-8b72-9150e5aa260a-dubaitest5.webp`,
  `${BASE_URL}/0c8a6d4b-e9c5-4039-9b08-148d1fc768d6-dubaitest6.webp`,
  `${BASE_URL}/58a3687b-f3a4-4eeb-a3b7-552d8bd2390c-dubaitest7.webp`,
  `${BASE_URL}/350cd03d-dafc-45b0-b2dc-bb20ff109415-dubaitest8.webp`,
  // How To Play images (HowToPlayScreen, TutorialOverlay)
  `${BASE_URL}/0b704162-590b-4fa7-9f9d-9328e2f5d897-htp03.webp`,
  `${BASE_URL}/678c89c3-7403-4a68-a0ac-0f9e4352a8b7-htp05.webp`,
  `${BASE_URL}/43fc77a1-cb7c-4073-b58d-91c273bd30cf-htp06.webp`,
  `${BASE_URL}/93e2d935-6ae8-4a2a-9364-1d726c4eace2-htp07.webp`,
  `${BASE_URL}/267e8cf5-afbb-4838-bdbd-1a769d58f5c2-htp08.webp`,
  `${BASE_URL}/2f9f88e2-f593-4960-8084-9f05f470ead0-htp09.webp`,
];

export async function prefetchRemoteGameUrls(): Promise<void> {
  await Promise.all(
    REMOTE_GAME_URLS.map((url) => Image.prefetch(url).catch(() => false))
  );
}
