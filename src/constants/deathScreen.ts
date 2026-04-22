/** Shared remote assets for elimination / “YOU DIED” flows. */

const GALLERY =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/";

/** Filename as stored on CDN (UTF-8 “г.”). */
export const YOU_DIED_TITLE_URI =
  GALLERY +
  encodeURIComponent(
    "15b9ff0e-00d0-41e0-85f8-5254fcfb02a5-ChatGPT Image 2.04.2026 г., 18_20_16.webp"
  );

/** Alternate encoding if the asset was uploaded with mojibake (Ð + ³). */
export const YOU_DIED_TITLE_URI_ALT =
  GALLERY +
  encodeURIComponent(
    "15b9ff0e-00d0-41e0-85f8-5254fcfb02a5-ChatGPT Image 2.04.2026 \u00D0\u00B3., 18_20_16.webp"
  );

export const DEATH_X_PART_1_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/61d7faf3-5a8a-4aa8-babd-c20a6b82c588-xpart1.webp";
export const DEATH_X_PART_2_URI =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/ec0c25c5-748e-4689-9742-b6a211bf0a2b-xpart2.webp";
