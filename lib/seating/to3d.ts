import {
  CANVAS_SEAT_SIZE,
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_WIDTH,
} from "@/lib/seating/layout";
import type { SeatCell, SeatingLayout } from "@/lib/seating/types";

/** Meters per canvas pixel — keeps a typical hall ~20–40m wide. */
export const WORLD_SCALE = 0.04;
export const SEAT_EYE_HEIGHT = 1.15;
export const SEAT_MESH_HEIGHT = 0.55;
export const STAGE_DEPTH = 4;
export const STAGE_HEIGHT = 0.9;

export type SeatWorldPose = {
  id: string;
  cell: SeatCell;
  /** Center of seat cushion in world space. */
  position: [number, number, number];
  /** Yaw in radians (0 = facing −Z / stage). */
  yaw: number;
  /** Camera eye when viewing from this seat. */
  eye: [number, number, number];
  /** Look-at target (stage center). */
  lookAt: [number, number, number];
};

export type Hall3DModel = {
  width: number;
  depth: number;
  seats: SeatWorldPose[];
  stageCenter: [number, number, number];
  stageSize: [number, number, number];
  floorSize: [number, number];
  overviewTarget: [number, number, number];
  overviewPosition: [number, number, number];
};

function canvasToWorld(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number
): { wx: number; wz: number } {
  const cx = canvasWidth / 2;
  // Stage sits near the bottom of the 2D canvas → world −Z.
  const stageLineY = canvasHeight * 0.92;
  return {
    wx: (x + CANVAS_SEAT_SIZE / 2 - cx) * WORLD_SCALE,
    wz: (stageLineY - (y + CANVAS_SEAT_SIZE / 2)) * WORLD_SCALE,
  };
}

/** Build a simple theater hall from the freeform 2D seating layout. */
export function buildHall3D(layout: SeatingLayout): Hall3DModel {
  const canvasWidth = layout.canvasWidth ?? DEFAULT_CANVAS_WIDTH;
  const canvasHeight = layout.canvasHeight ?? DEFAULT_CANVAS_HEIGHT;
  const width = canvasWidth * WORLD_SCALE;
  const depth = canvasHeight * WORLD_SCALE;

  const stageCenter: [number, number, number] = [0, STAGE_HEIGHT / 2, -STAGE_DEPTH * 0.35];
  const stageSize: [number, number, number] = [
    Math.max(width * 0.72, 8),
    STAGE_HEIGHT,
    STAGE_DEPTH,
  ];

  const seats: SeatWorldPose[] = layout.cells
    .filter((c) => c.type === "seat" || c.type === "blocked")
    .map((cell) => {
      const x = typeof cell.x === "number" ? cell.x : 0;
      const y = typeof cell.y === "number" ? cell.y : 0;
      const { wx, wz } = canvasToWorld(x, y, canvasWidth, canvasHeight);
      // 2D rotation is degrees; seats face stage (−Z) when rotation ≈ 0.
      const yaw = ((cell.rotation ?? 0) * Math.PI) / 180;
      const position: [number, number, number] = [wx, SEAT_MESH_HEIGHT / 2, wz];
      const eye: [number, number, number] = [wx, SEAT_EYE_HEIGHT, wz];
      return {
        id: cell.id,
        cell,
        position,
        yaw,
        eye,
        lookAt: stageCenter,
      };
    });

  const overviewTarget: [number, number, number] = [0, 0.5, depth * 0.15];
  const overviewPosition: [number, number, number] = [
    width * 0.15,
    Math.max(8, depth * 0.55),
    depth * 0.75,
  ];

  return {
    width,
    depth,
    seats,
    stageCenter,
    stageSize,
    floorSize: [width * 1.35, depth * 1.25],
    overviewTarget,
    overviewPosition,
  };
}
