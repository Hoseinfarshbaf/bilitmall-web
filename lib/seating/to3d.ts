import {
  CANVAS_SEAT_SIZE,
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_WIDTH,
  resolveStagePlacement,
  stageFocusPoint,
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

function canvasPointToWorld(
  x: number,
  y: number,
  canvasWidth: number
): { wx: number; wz: number } {
  const cx = canvasWidth / 2;
  return {
    wx: (x - cx) * WORLD_SCALE,
    // Canvas +Y down → world −Z toward typical stage-at-bottom layouts.
    wz: -((y - 0) * WORLD_SCALE),
  };
}

/** Build a simple theater hall from the freeform 2D seating layout. */
export function buildHall3D(layout: SeatingLayout): Hall3DModel {
  const canvasWidth = layout.canvasWidth ?? DEFAULT_CANVAS_WIDTH;
  const canvasHeight = layout.canvasHeight ?? DEFAULT_CANVAS_HEIGHT;
  const width = canvasWidth * WORLD_SCALE;
  const depth = canvasHeight * WORLD_SCALE;
  const placed = resolveStagePlacement(layout);
  const focus = stageFocusPoint(layout);
  const stageWorld = canvasPointToWorld(focus.x, focus.y, canvasWidth);

  const stageCenter: [number, number, number] = [
    stageWorld.wx,
    STAGE_HEIGHT / 2,
    stageWorld.wz,
  ];
  const stageSize: [number, number, number] = [
    Math.max(placed.stageWidth * WORLD_SCALE, 6),
    STAGE_HEIGHT,
    STAGE_DEPTH,
  ];

  const seats: SeatWorldPose[] = layout.cells
    .filter((c) => c.type === "seat" || c.type === "blocked")
    .map((cell) => {
      const x = typeof cell.x === "number" ? cell.x : 0;
      const y = typeof cell.y === "number" ? cell.y : 0;
      const { wx, wz } = canvasPointToWorld(
        x + CANVAS_SEAT_SIZE / 2,
        y + CANVAS_SEAT_SIZE / 2,
        canvasWidth
      );
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

  const overviewTarget: [number, number, number] = [
    stageCenter[0],
    0.5,
    stageCenter[2] + depth * 0.2,
  ];
  const overviewPosition: [number, number, number] = [
    stageCenter[0] + width * 0.12,
    Math.max(8, depth * 0.55),
    stageCenter[2] + depth * 0.65,
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
