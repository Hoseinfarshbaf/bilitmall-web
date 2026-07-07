import type {
  SeatCell,
  SeatingLayout,
  SeatingZone,
  StagePosition,
  StageRect,
} from "./types";

const ROW_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const ZONE_COLORS = {
  floor: "#1e3a5f",
  balcony: "#4c1d95",
  vip: "#854d0e",
} as const;

export function rowLabel(row: number): string {
  return ROW_LETTERS[row] ?? String(row + 1);
}

export function cellId(row: number, col: number): string {
  return `r${row}c${col}`;
}

export function seatLabel(row: number, col: number): string {
  return `${rowLabel(row)}${col + 1}`;
}

export function cellInRect(
  row: number,
  col: number,
  rect: StageRect | SeatingZone
): boolean {
  return (
    row >= rect.rowStart &&
    row <= rect.rowEnd &&
    col >= rect.colStart &&
    col <= rect.colEnd
  );
}

export function deriveStageRect(layout: SeatingLayout): StageRect | null {
  if (layout.stageRect) return layout.stageRect;
  const stageCells = layout.cells.filter((c) => c.type === "stage");
  if (stageCells.length === 0) return null;
  const rows = stageCells.map((c) => c.row);
  const cols = stageCells.map((c) => c.col);
  return {
    rowStart: Math.min(...rows),
    rowEnd: Math.max(...rows),
    colStart: Math.min(...cols),
    colEnd: Math.max(...cols),
  };
}

export function defaultStageRect(
  rows: number,
  cols: number,
  stagePosition: StagePosition
): StageRect {
  if (stagePosition === "top") {
    return { rowStart: 0, rowEnd: 0, colStart: 0, colEnd: cols - 1 };
  }
  if (stagePosition === "bottom") {
    return { rowStart: rows - 1, rowEnd: rows - 1, colStart: 0, colEnd: cols - 1 };
  }
  if (stagePosition === "left") {
    return { rowStart: 0, rowEnd: rows - 1, colStart: 0, colEnd: 0 };
  }
  return { rowStart: 0, rowEnd: rows - 1, colStart: cols - 1, colEnd: cols - 1 };
}

export function applyStageRect(layout: SeatingLayout, rect: StageRect): SeatingLayout {
  const cells = layout.cells.map((cell) => {
    if (cellInRect(cell.row, cell.col, rect)) {
      return {
        ...cell,
        type: "stage" as const,
        label: layout.stageLabel,
        available: false,
        zoneId: undefined,
      };
    }
    if (cell.type === "stage") {
      return {
        ...cell,
        type: "empty" as const,
        label: "",
        available: false,
      };
    }
    return cell;
  });

  return normalizeLayout({ ...layout, stageRect: rect, cells });
}

export function createZone(
  layout: SeatingLayout,
  type: SeatingZone["type"],
  name: string,
  rect: StageRect
): SeatingZone {
  const id = `zone-${type}-${Date.now()}`;
  return {
    id,
    name,
    type,
    color: ZONE_COLORS[type],
    ...rect,
  };
}

export function assignCellsToZone(layout: SeatingLayout, zone: SeatingZone): SeatingLayout {
  const cells = layout.cells.map((cell) => {
    if (cell.type === "stage") return cell;
    if (cellInRect(cell.row, cell.col, zone)) {
      return { ...cell, zoneId: zone.id };
    }
    if (cell.zoneId === zone.id) {
      return { ...cell, zoneId: undefined };
    }
    return cell;
  });
  return { ...layout, cells };
}

export function normalizeLayout(layout: SeatingLayout): SeatingLayout {
  const stageRect = layout.stageRect ?? deriveStageRect(layout) ?? defaultStageRect(
    layout.rows,
    layout.cols,
    layout.stagePosition
  );

  let zones = layout.zones ?? [];
  if (zones.length === 0) {
    zones = [
      {
        id: "zone-floor",
        name: "سالن اصلی",
        type: "floor",
        color: ZONE_COLORS.floor,
        rowStart: stageRect.rowEnd + 1 < layout.rows ? stageRect.rowEnd + 1 : 1,
        rowEnd: layout.rows - 1,
        colStart: 0,
        colEnd: layout.cols - 1,
      },
    ];
    if (layout.stagePosition === "bottom") {
      zones[0].rowEnd = stageRect.rowStart - 1;
      zones[0].rowStart = 0;
    }
  }

  let cells = layout.cells;
  if (!layout.stageRect) {
    cells = applyStageRect({ ...layout, cells }, stageRect).cells;
  }

  return {
    ...layout,
    stageRect,
    zones,
    cells: cells.map((cell) => {
      if (cell.type !== "seat") return cell;
      const zone = zones.find((z) => cellInRect(cell.row, cell.col, z));
      return {
        ...cell,
        label: cell.label || seatLabel(cell.row, cell.col),
        zoneId: zone?.id,
      };
    }),
  };
}

export function formatPriceLabel(rial: number): string {
  if (rial <= 0) return "رایگان";
  if (rial >= 1_000_000) {
    const millions = rial / 1_000_000;
    return millions % 1 === 0 ? `${millions} میلیون` : `${millions.toFixed(1)} میلیون`;
  }
  const thousands = Math.round(rial / 1000);
  return `${thousands} هزار`;
}

export function createEmptyLayout(
  name: string,
  rows = 8,
  cols = 12,
  stagePosition: StagePosition = "top",
  defaultPriceRial = 350_000
): SeatingLayout {
  const cells: SeatCell[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const isStage =
        (stagePosition === "top" && row === 0) ||
        (stagePosition === "bottom" && row === rows - 1) ||
        (stagePosition === "left" && col === 0) ||
        (stagePosition === "right" && col === cols - 1);

      cells.push({
        id: cellId(row, col),
        row,
        col,
        label: isStage ? "صحنه" : seatLabel(row, col),
        type: isStage ? "stage" : "seat",
        priceRial: defaultPriceRial,
        priceLabel: formatPriceLabel(defaultPriceRial),
        available: !isStage,
      });
    }
  }

  return {
    name,
    rows,
    cols,
    stagePosition,
    stageLabel: "صحنه اجرا",
    stageRect: defaultStageRect(rows, cols, stagePosition),
    zones: [],
    defaultPriceRial,
    cells,
  };
}

export function parseSeatingLayout(raw: unknown): SeatingLayout | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<SeatingLayout>;
  if (!Array.isArray(data.cells) || !data.rows || !data.cols) return null;
  return {
    name: String(data.name ?? "سالن"),
    rows: Number(data.rows),
    cols: Number(data.cols),
    stagePosition: (data.stagePosition as StagePosition) ?? "top",
    stageLabel: String(data.stageLabel ?? "صحنه اجرا"),
    stageRect: data.stageRect as StageRect | undefined,
    zones: Array.isArray(data.zones) ? (data.zones as SeatingZone[]) : undefined,
    defaultPriceRial: Number(data.defaultPriceRial ?? 350_000),
    cells: data.cells as SeatCell[],
  };
}

export function parseSeatingLayoutJson(json: string): SeatingLayout | null {
  try {
    return parseSeatingLayout(JSON.parse(json));
  } catch {
    return null;
  }
}

export function countBookableSeats(layout: SeatingLayout): number {
  return layout.cells.filter((c) => c.type === "seat" && c.available).length;
}

export function applyStagePosition(layout: SeatingLayout, stagePosition: StagePosition): SeatingLayout {
  const next = createEmptyLayout(
    layout.name,
    layout.rows,
    layout.cols,
    stagePosition,
    layout.defaultPriceRial
  );

  const oldSeatMap = new Map(
    layout.cells
      .filter((c) => c.type === "seat")
      .map((c) => [`${c.row},${c.col}`, c])
  );

  next.stageLabel = layout.stageLabel;
  next.cells = next.cells.map((cell) => {
    if (cell.type === "stage") return { ...cell, label: layout.stageLabel };
    const prev = oldSeatMap.get(`${cell.row},${cell.col}`);
    if (!prev) return { ...cell, type: "empty" as const, available: false, label: "" };
    return { ...prev, id: cell.id, row: cell.row, col: cell.col };
  });

  return normalizeLayout(next);
}

export function resizeLayout(
  layout: SeatingLayout,
  rows: number,
  cols: number
): SeatingLayout {
  const next = createEmptyLayout(layout.name, rows, cols, layout.stagePosition, layout.defaultPriceRial);
  next.stageLabel = layout.stageLabel;

  const oldMap = new Map(layout.cells.map((c) => [`${c.row},${c.col}`, c]));

  next.cells = next.cells.map((cell) => {
    const prev = oldMap.get(`${cell.row},${cell.col}`);
    if (!prev) return cell;
    return { ...prev, id: cell.id, row: cell.row, col: cell.col };
  });

  return normalizeLayout({ ...next, zones: layout.zones });
}
