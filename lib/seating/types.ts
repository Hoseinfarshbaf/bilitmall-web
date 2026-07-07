export type StagePosition = "top" | "bottom" | "left" | "right";

export type SeatCellType = "seat" | "empty" | "blocked" | "stage" | "aisle";

export type SeatingZoneType = "floor" | "balcony" | "vip";

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
