// src/screens/Cam/camGridLayout.ts
import { CAM_GRID_COLUMNS } from "./cam.constants";

export type CamGridCell = { x: number; y: number; width: number; height: number };

export type CamGridLayout = {
  width: number;
  height: number;
  cells: CamGridCell[];
};

/**
 * Gapless two-column mosaic that fills the given area (see `CAM_GRID_COLUMNS`).
 * Each column shares the full height equally between its photos.
 *
 * Order of the players: with equal columns (4, 6) it reads row by row, left to
 * right, as people expect from a grid; with unequal ones (3, 5) it goes down
 * the left column first, then the right.
 */
export function computeCamGridLayout(
  count: number,
  width: number,
  height: number,
): CamGridLayout {
  const [left, right] = CAM_GRID_COLUMNS[count] ?? [
    Math.ceil(count / 2),
    Math.floor(count / 2),
  ];
  const columnWidth = right > 0 ? width / 2 : width;
  const cellIn = (column: 0 | 1, slot: number): CamGridCell => {
    const inColumn = column === 0 ? left : right;
    const cellHeight = height / inColumn;
    return {
      x: column * columnWidth,
      y: slot * cellHeight,
      width: columnWidth,
      height: cellHeight,
    };
  };

  const cells: CamGridCell[] = [];
  if (left === right) {
    for (let slot = 0; slot < left; slot++) {
      cells.push(cellIn(0, slot), cellIn(1, slot));
    }
  } else {
    for (let slot = 0; slot < left; slot++) cells.push(cellIn(0, slot));
    for (let slot = 0; slot < right; slot++) cells.push(cellIn(1, slot));
  }
  return { width, height, cells };
}
