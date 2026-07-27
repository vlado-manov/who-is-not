// assets/backgrounds.ts
// Cloudflare R2 URLs – всички бекграунди са remote за оптимално зареждане
const R2 = "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery";

export const backgrounds = {
  bg000: require("./images/bg000.png"),
  bg003: { uri: `${R2}/9dd10679-acba-4b66-8ffd-84a2c12b1f97-bg003.webp` },
  bg004: { uri: `${R2}/eef21476-a766-4970-8620-7391d4c82573-IMG_4014.webp` },
  bg005: { uri: `${R2}/7d92a71b-401b-4465-9145-ff3fd76818f6-bg005.webp` },
  bg006: {
    uri: `${R2}/3cc5d84d-a6de-49ca-95ba-2bae992bd4c4-bgbuttonstart.webp`,
  },
  bg007: {
    uri: `${R2}/1c201fa7-dcc1-4df6-ad43-7b3c4693664e-IMG_4027.webp`,
  },
  bg015: { uri: `${R2}/ee506751-e5ed-4f50-b825-f0deb75952c2-bg015.webp` },
  bg016: { uri: `${R2}/026f17d6-0604-46ea-87a0-c07216dd1b29-bg016.webp` },
  bg018: { uri: `${R2}/80d0e764-68fc-4f6f-a0a2-4b5845904ee8-bg018.webp` },
  bg019: { uri: `${R2}/0c94e51c-8441-4ce7-b0e6-4bab4555b278-bg019.webp` },
  bg022: { uri: `${R2}/c2f18448-68f7-467e-9778-359b5d04f370-bg022.webp` },
  bg023: { uri: `${R2}/f2148fbc-f11a-4892-bddd-a90e652dd67c-IMG_4006.webp` },
  bg024: { uri: `${R2}/0da0f559-3aa8-4a67-8741-af28f38a6912-bg001.webp` },
  bg025: { uri: `${R2}/f476da26-cd35-4a5a-a4ba-108a84338a7a-bg019.webp` },
  bg026: { uri: `${R2}/4948042f-d7c4-42e0-b62a-7158cbc84f48-bg026.webp` },
  bg027: {
    uri: `${R2}/a2fc9ef6-3784-4335-980e-b0774928c70e-ChatGPT Image 8.04.2026 Ð³., 16_10_41.webp`,
  },
  bg028: {
    uri: `${R2}/f5a28a0c-fc98-4bc2-9d12-dc36cfb56222-ChatGPT Image 8.04.2026 Ð³., 16_10_50.webp`,
  },
  bg029: { uri: `${R2}/62640c5a-b953-4641-a7ce-f1b2e73138be-bg029.webp` },
  bg030: { uri: `${R2}/e2e9083e-b7c8-4399-8ac6-0d6aa8b0f4f1-bg030.webp` },
  bgheroes01: `${R2}/ba09f448-5270-4b9b-84d1-aaac8869f4b4-bg-heroes01.webp`,

  // Tablet variants (width >= 768)
  bg004t: { uri: `${R2}/17237e5b-bfe8-4d99-bbb3-56752efd7e46-E4935A9E-38C4-4158-A44A-952A4B047F03.webp` },
  bg019t: { uri: `${R2}/3da39fea-74cb-41fc-bcfe-928b9bff3b33-C6FBDADC-24D4-4CAE-BDDB-D436AD544BC2.webp` },
  bg023t: { uri: `${R2}/ddc0374b-64cd-4ab5-94ba-645dbb3bc713-BB124CF2-65A7-477D-B58D-6C1E6E56C03A.webp` },
  bg029t: { uri: `${R2}/c1bbcb26-60ff-4a1c-ac31-bc665cc4a0cf-3BC23129-D335-4B46-BAD3-ECD6C457CCA6.webp` },
  bg030t: { uri: `${R2}/bb1ce8e9-580b-45f8-9430-651807adef4f-C888418D-32C7-4581-8ACD-42A68D2A0943.webp` },
  winnerBgt: { uri: `${R2}/a2fbeb9b-8fe5-4e82-9e45-d9c83d2ef780-83DEAB58-3BFA-4C8B-BAA3-F14D3DECDCD6.webp` },
};
