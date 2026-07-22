"use client";

export type StagePosition = "top" | "bottom" | "left" | "right";

export type SeatCellType = "seat" | "empty" | "blocked" | "stage" | "aisle";

/** Runtime / purchase overlay — sold & pending come from orders when wired. */
export type SeatSaleStatus =
  | "available"
  | "selected"
  | "sold"
  | "pending"
  | "unavailable";

export type SeatingZoneType = "floor" | "balcony" | "vip";

/** classic = ردیف×ستون | canvas = بوم نقطه‌ای با جایگذاری آزاد */
export type SeatingMode = "classic" | "canvas";

export type StageRect = {
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
};

export type SeatingZone = {
  id: string;
  name: string;
  type: SeatingZoneType;
  color: string;
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
};

export type SeatCell = {
  id: string;
  row: number;
  col: number;
  label: string;
  type: SeatCellType;
  priceRial: number;
  priceLabel: string;
  available: boolean;
  zoneId?: string;
  /** Canvas free-placement (px from top-left of board). */
  x?: number;
  y?: number;
  /** Rotation in degrees (0 = upright). Fan layouts use ±15…±75. */
  rotation?: number;
  /** Section / category fill color (hex), overrides default status tint when set. */
  sectionColor?: string;
};

/** Freeform canvas row sign (A, B, 1, …) placed on the dotted board. */
export type CanvasRowMarker = {
  id: string;
  label: string;
  x: number;
  y: number;
  /** Optional link to seating row index for price/label sync. */
  rowIndex?: number;
};

export type SeatingLayout = {
  name: string;
  rows: number;
  cols: number;
  stagePosition: StagePosition;
  stageLabel: string;
  stageRect?: StageRect;
  zones?: SeatingZone[];
  defaultPriceRial: number;
  cells: SeatCell[];
  /** Custom row titles shown on both sides (defaults to 1..N). */
  rowLabels?: string[];
  /** Freeform row signs on the canvas. */
  rowMarkers?: CanvasRowMarker[];
  /** Seat numbers increase right→left (RTL, HonarTicket-style) when true. */
  seatNumbersRtl?: boolean;
  /** Placement mode — defaults to classic. */
  mode?: SeatingMode;
  canvasWidth?: number;
  canvasHeight?: number;
  /** Dot / snap spacing in px. */
  gridSize?: number;
  /** When false, freeform seats move with 1px precision. Default true. */
  snapEnabled?: boolean;
  /** Canvas stage look: banner curve or theater semicircle. */
  stageStyle?: "banner" | "semicircle";
};

export type VenueTemplateRecord = {
  id: number;
  name: string;
  slug: string;
  isDefault: boolean;
  layout: SeatingLayout;
  createdAt: string;
  updatedAt: string;
};
