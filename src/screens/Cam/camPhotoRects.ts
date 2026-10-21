// src/screens/Cam/camPhotoRects.ts
import { CAM_LAYOUT } from "./cam.constants";
import type { CamRect } from "./cam.types";

type Frame = { width: number; height: number };

/** Screen rectangles the captured photos fly between. */
export function getCamPhotoRects(frame: Frame, bottomInset: number) {
  const thumbWidth = CAM_LAYOUT.keepsakeThumbWidth;
  const thumbHeight = thumbWidth * (frame.height / frame.width);

  const fullFrame: CamRect = {
    x: 0,
    y: 0,
    width: frame.width,
    height: frame.height,
  };
  const keepsake: CamRect = {
    x: frame.width - thumbWidth - CAM_LAYOUT.keepsakeRight,
    y: frame.height - bottomInset - thumbHeight - CAM_LAYOUT.keepsakeBottom,
    width: thumbWidth,
    height: thumbHeight,
  };

  return { fullFrame, keepsake };
}
