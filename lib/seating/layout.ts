import type {
  CanvasRowMarker,
  SeatCell,
  SeatingLayout,
  SeatingMode,
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

/** Dot spacing / snap size on freeform canvas (px). */
export const CANVAS_GRID_SIZE = 40;
export const CANVAS_SEAT_SIZE = 36;
export const DEFAULT_CANVAS_WIDTH = 960;
export const DEFAULT_CANVAS_HEIGHT = 720;
export const CANVAS_STAGE_BAND = 72;
export const CANVAS_PADDING = 48;

export function rowLabel(row: number, layout?: Pick<SeatingLayout, "rowLabels">): string {
  const custom = layout?.rowLabels?.[row]?.trim();
  if (custom) return custom;
  return String(row + 1);
}

/** Legacy letter labels (A, B, …) — kept for older data that stored letter prefixes. */
export function rowLetter(row: number): string {
  return ROW_LETTERS[row] ?? String(row + 1);
}

export function cellId(row: number, col: number): string {
  return `r${row}c${col}`;
}

export function seatLabel(row: number, col: number, layout?: Pick<SeatingLayout, "rowLabels" | "seatNumbersRtl" | "cols">): string {
  const rowName = rowLabel(row, layout);
  const seatNo =
    layout?.seatNumbersRtl === false
      ? col + 1
      : (layout?.cols ?? col + 1) - col;
  return `${rowName}-${seatNo}`;
}

/** Display number inside a seat box (HonarTicket: RTL counting within the row). */
export function seatDisplayNumber(
  col: number,
  cols: number,
  seatNumbersRtl = true
): number {
  // col 0 is always the left seat in storage/layout.
  // RTL (HonarTicket): numbers increase right→left → rightmost seat is 1.
  return seatNumbersRtl ? cols - col : col + 1;
}

export function ensureRowLabels(layout: SeatingLayout): string[] {
  const labels = [...(layout.rowLabels ?? [])];
  while (labels.length < layout.rows) {
    labels.push(String(labels.length + 1));
  }
  return labels.slice(0, layout.rows);
}

/** Move or swap a seat onto another cell (empty/aisle/seat). */
export function moveSeatCell(
  layout: SeatingLayout,
  fromId: string,
  toId: string
): SeatingLayout {
  if (fromId === toId) return layout;
  const from = layout.cells.find((c) => c.id === fromId);
  const to = layout.cells.find((c) => c.id === toId);
  if (!from || !to) return layout;
  if (from.type !== "seat") return layout;
  if (to.type === "stage" || to.type === "blocked") return layout;

  const cells = layout.cells.map((c) => {
    if (c.id === toId) {
      return {
        ...from,
        id: to.id,
        row: to.row,
        col: to.col,
        label: seatLabel(to.row, to.col, layout),
      };
    }
    if (c.id === fromId) {
      if (to.type === "seat") {
        return {
          ...to,
          id: from.id,
          row: from.row,
          col: from.col,
          label: seatLabel(from.row, from.col, layout),
        };
      }
      return {
        ...c,
        type: "empty" as const,
        available: false,
        label: "",
        priceRial: layout.defaultPriceRial,
        priceLabel: formatPriceLabel(layout.defaultPriceRial),
        zoneId: undefined,
      };
    }
    return c;
  });

  return normalizeLayout({ ...layout, cells });
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

/**
 * Stage is a decorative banner only — it must never occupy grid seats.
 * Kept for legacy callers; returns an empty/out-of-grid rect.
 */
export function defaultStageRect(
  _rows: number,
  _cols: number,
  _stagePosition: StagePosition
): StageRect {
  return { rowStart: -1, rowEnd: -1, colStart: -1, colEnd: -1 };
}

/** Convert any legacy stage cells back into bookable seats. */
export function liberateStageCells(layout: SeatingLayout): SeatCell[] {
  return layout.cells.map((cell) => {
    if (cell.type !== "stage") return cell;
    const price = cell.priceRial || layout.defaultPriceRial;
    return {
      ...cell,
      type: "seat" as const,
      available: true,
      label: seatLabel(cell.row, cell.col, layout),
      priceRial: price,
      priceLabel: formatPriceLabel(price),
    };
  });
}

/** @deprecated Stage no longer occupies grid cells — banner only. */
export function applyStageRect(layout: SeatingLayout, _rect: StageRect): SeatingLayout {
  return normalizeLayout({
    ...layout,
    stageRect: defaultStageRect(layout.rows, layout.cols, layout.stagePosition),
    cells: liberateStageCells(layout),
  });
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
  // Banner-only stage — never consume a seating row/column.
  const stageRect = defaultStageRect(layout.rows, layout.cols, layout.stagePosition);
  const liberated = liberateStageCells(layout);
  const mode: SeatingMode = "canvas";
  const gridSize = layout.gridSize && layout.gridSize > 0 ? layout.gridSize : CANVAS_GRID_SIZE;
  const canvasWidth =
    layout.canvasWidth && layout.canvasWidth > 0
      ? layout.canvasWidth
      : DEFAULT_CANVAS_WIDTH;
  const canvasHeight =
    layout.canvasHeight && layout.canvasHeight > 0
      ? layout.canvasHeight
      : DEFAULT_CANVAS_HEIGHT;
  const snapEnabled = layout.snapEnabled !== false;
  const stageStyle = layout.stageStyle ?? "semicircle";

  let zones = layout.zones ?? [];
  if (zones.length === 0) {
    zones = [
      {
        id: "zone-floor",
        name: "سالن اصلی",
        type: "floor",
        color: ZONE_COLORS.floor,
        rowStart: 0,
        rowEnd: layout.rows - 1,
        colStart: 0,
        colEnd: layout.cols - 1,
      },
    ];
  }

  const withLabelsBase = {
    ...layout,
    rowLabels: ensureRowLabels({ ...layout, rows: layout.rows }),
    seatNumbersRtl: layout.seatNumbersRtl !== false,
  };

  let cells = liberated.map((cell) => {
    if (cell.type !== "seat" && cell.type !== "blocked") return cell;
    const zone = zones.find((z) => cellInRect(cell.row, cell.col, z));
    return {
      ...cell,
      label:
        cell.label ||
        (cell.type === "seat" ? seatLabel(cell.row, cell.col, withLabelsBase) : cell.label),
      zoneId: zone?.id,
    };
  });

  cells = ensureCanvasPositions(
    { ...layout, mode, gridSize, canvasWidth, canvasHeight, stageStyle, cells },
    cells
  );

  return {
    ...layout,
    mode,
    gridSize,
    canvasWidth,
    canvasHeight,
    snapEnabled,
    stageStyle,
    stageRect,
    zones,
    seatNumbersRtl: layout.seatNumbersRtl !== false,
    rowLabels: ensureRowLabels({ ...layout, rows: layout.rows }),
    rowMarkers: Array.isArray(layout.rowMarkers) ? layout.rowMarkers : [],
    cells,
  };
}

export function snapToGrid(value: number, gridSize = CANVAS_GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize;
}

export function seatGridStep(gridSize = CANVAS_GRID_SIZE): number {
  const gap = Math.max(4, Math.round(gridSize * 0.15));
  return CANVAS_SEAT_SIZE + gap;
}

export function seatBlockSize(
  rows: number,
  cols: number,
  gridSize = CANVAS_GRID_SIZE
): { width: number; height: number; step: number } {
  const step = seatGridStep(gridSize);
  return {
    step,
    width: Math.max(CANVAS_SEAT_SIZE, (cols - 1) * step + CANVAS_SEAT_SIZE),
    height: Math.max(CANVAS_SEAT_SIZE, (rows - 1) * step + CANVAS_SEAT_SIZE),
  };
}

/** Space reserved for the semicircle stage at the bottom of the board. */
export const CANVAS_STAGE_FOOTER = 108;

/**
 * Place a seat in a rows×cols block that is horizontally centered on the
 * canvas and sits squarely in front of the stage (above the semicircle).
 */
export function seatCanvasPosition(
  row: number,
  col: number,
  rows: number,
  cols: number,
  options: {
    seatNumbersRtl?: boolean;
    gridSize?: number;
    canvasWidth?: number;
    canvasHeight?: number;
    stageStyle?: "banner" | "semicircle";
    stagePosition?: StagePosition;
  } = {}
): { x: number; y: number } {
  const gridSize = options.gridSize ?? CANVAS_GRID_SIZE;
  const canvasWidth = options.canvasWidth ?? DEFAULT_CANVAS_WIDTH;
  const canvasHeight = options.canvasHeight ?? DEFAULT_CANVAS_HEIGHT;
  const { step, width: blockW, height: blockH } = seatBlockSize(rows, cols, gridSize);
  // col 0 = left side of the block (numbers handle RTL separately — avoid double-flip)
  const displayCol = col;

  // Always center the seating block on the stage (horizontal center of canvas).
  const originX = Math.round((canvasWidth - blockW) / 2);

  let originY: number;
  const useSemicircle = options.stageStyle !== "banner";
  const stagePos = options.stagePosition ?? "top";

  if (useSemicircle || stagePos === "bottom") {
    // Stage at bottom → seats sit just above it, centered as a block.
    const footer = useSemicircle ? CANVAS_STAGE_FOOTER : CANVAS_STAGE_BAND;
    originY = Math.round(canvasHeight - footer - blockH - CANVAS_PADDING / 2);
    originY = Math.max(CANVAS_PADDING, originY);
  } else if (stagePos === "top") {
    originY = CANVAS_STAGE_BAND + CANVAS_PADDING;
  } else {
    // Side stages: vertically center the block.
    originY = Math.round((canvasHeight - blockH) / 2);
    originY = Math.max(CANVAS_PADDING, originY);
  }

  return {
    x: originX + displayCol * step,
    y: originY + row * step,
  };
}

/** Assign x/y for seats missing canvas coords (from classic row/col). */
export function ensureCanvasPositions(
  layout: SeatingLayout,
  cells: SeatCell[] = layout.cells
): SeatCell[] {
  const gridSize = layout.gridSize ?? CANVAS_GRID_SIZE;
  const rtl = layout.seatNumbersRtl !== false;
  const opts = {
    seatNumbersRtl: rtl,
    gridSize,
    canvasWidth: layout.canvasWidth ?? DEFAULT_CANVAS_WIDTH,
    canvasHeight: layout.canvasHeight ?? DEFAULT_CANVAS_HEIGHT,
    stageStyle: layout.stageStyle,
    stagePosition: layout.stagePosition,
  };
  return cells.map((cell) => {
    if (cell.type !== "seat" && cell.type !== "blocked") return cell;
    let next = cell;
    if (typeof cell.x !== "number" || typeof cell.y !== "number") {
      const pos = seatCanvasPosition(
        cell.row,
        cell.col,
        layout.rows,
        layout.cols,
        opts
      );
      next = { ...cell, x: pos.x, y: pos.y };
    }
    if (typeof next.rotation !== "number") {
      next = {
        ...next,
        rotation: defaultSeatRotation(layout),
      };
    }
    return next;
  });
}

export function placedSeats(layout: SeatingLayout): SeatCell[] {
  return layout.cells.filter((c) => c.type === "seat" || c.type === "blocked");
}

export function seatsInRow(layout: SeatingLayout, rowIndex: number): SeatCell[] {
  return placedSeats(layout)
    .filter((c) => c.row === rowIndex)
    .sort((a, b) => a.col - b.col);
}

export function listOccupiedRows(layout: SeatingLayout): number[] {
  const set = new Set(placedSeats(layout).map((c) => c.row));
  return [...set].sort((a, b) => a - b);
}

/** Renumber cols 0..n-1 left→right and refresh labels for a row. */
export function renumberRowSeats(
  layout: SeatingLayout,
  rowIndex: number
): SeatingLayout {
  const rowSeats = seatsInRow(layout, rowIndex).sort(
    (a, b) => (a.x ?? 0) - (b.x ?? 0)
  );
  const idToCol = new Map(rowSeats.map((s, i) => [s.id, i]));
  const cols = Math.max(layout.cols, rowSeats.length);

  return normalizeLayout({
    ...layout,
    mode: "canvas",
    cols: Math.max(layout.cols, cols),
    cells: placedSeats(layout).map((c) => {
      if (c.row !== rowIndex) return c;
      const col = idToCol.get(c.id) ?? c.col;
      return {
        ...c,
        col,
        label: seatLabel(rowIndex, col, {
          ...layout,
          cols: Math.max(layout.cols, rowSeats.length),
        }),
      };
    }),
  });
}

/** Append one seat to the end of a row (RTL-aware: after the last visual seat). */
export function addSeatToRow(
  layout: SeatingLayout,
  rowIndex: number
): SeatingLayout {
  const rowSeats = seatsInRow(layout, rowIndex);
  const step = seatGridStep(layout.gridSize ?? CANVAS_GRID_SIZE);
  const rotation = defaultSeatRotation(layout);

  let x: number;
  let y: number;

  if (rowSeats.length === 0) {
    const pos = seatCanvasPosition(rowIndex, 0, Math.max(layout.rows, rowIndex + 1), 1, {
      seatNumbersRtl: layout.seatNumbersRtl !== false,
      gridSize: layout.gridSize,
      canvasWidth: layout.canvasWidth,
      canvasHeight: layout.canvasHeight,
      stageStyle: layout.stageStyle ?? "semicircle",
      stagePosition: layout.stagePosition,
    });
    x = pos.x;
    y = pos.y;
  } else {
    // Place to the left of the leftmost seat (RTL: new highest number on the left)
    // or to the right of rightmost — for LTR append to the right.
    const sortedByX = [...rowSeats].sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
    const leftmost = sortedByX[0]!;
    const rightmost = sortedByX[sortedByX.length - 1]!;
    const rtl = layout.seatNumbersRtl !== false;
    if (rtl) {
      x = (leftmost.x ?? 0) - step;
      y = leftmost.y ?? 0;
    } else {
      x = (rightmost.x ?? 0) + step;
      y = rightmost.y ?? 0;
    }
  }

  const col = rowSeats.length;
  const id = `seat-row${rowIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const cell: SeatCell = {
    id,
    row: rowIndex,
    col,
    x: Math.round(x),
    y: Math.round(y),
    rotation,
    label: seatLabel(rowIndex, col, {
      ...layout,
      cols: Math.max(layout.cols, col + 1),
    }),
    type: "seat",
    priceRial: layout.defaultPriceRial,
    priceLabel: formatPriceLabel(layout.defaultPriceRial),
    available: true,
  };

  const next = normalizeLayout({
    ...layout,
    mode: "canvas",
    rows: Math.max(layout.rows, rowIndex + 1),
    cols: Math.max(layout.cols, col + 1),
    cells: [...placedSeats(layout), cell],
  });

  return renumberRowSeats(next, rowIndex);
}

/** Remove an entire row of seats. */
export function removeRowSeats(
  layout: SeatingLayout,
  rowIndex: number
): SeatingLayout {
  return normalizeLayout({
    ...layout,
    mode: "canvas",
    cells: placedSeats(layout).filter((c) => c.row !== rowIndex),
    rowMarkers: (layout.rowMarkers ?? []).filter((m) => m.rowIndex !== rowIndex),
  });
}

/** Move every seat in a row by the same delta (used when dragging the row). */
export function moveRowByDelta(
  layout: SeatingLayout,
  rowIndex: number,
  dx: number,
  dy: number
): SeatingLayout {
  const seats = placedSeats(layout);
  return normalizeLayout({
    ...layout,
    mode: "canvas",
    cells: seats.map((c) =>
      c.row === rowIndex
        ? {
            ...c,
            x: Math.round((c.x ?? 0) + dx),
            y: Math.round((c.y ?? 0) + dy),
          }
        : c
    ),
    rowMarkers: (layout.rowMarkers ?? []).map((m) =>
      m.rowIndex === rowIndex
        ? { ...m, x: Math.round(m.x + dx), y: Math.round(m.y + dy) }
        : m
    ),
  });
}

export function switchToCanvasMode(layout: SeatingLayout): SeatingLayout {
  const base = normalizeLayout({ ...layout, mode: "canvas" });
  const stageStyle = base.stageStyle ?? "semicircle";
  const canvasWidth = base.canvasWidth ?? DEFAULT_CANVAS_WIDTH;
  const canvasHeight = base.canvasHeight ?? DEFAULT_CANVAS_HEIGHT;
  const posOpts = {
    seatNumbersRtl: base.seatNumbersRtl !== false,
    gridSize: base.gridSize ?? CANVAS_GRID_SIZE,
    canvasWidth,
    canvasHeight,
    stageStyle,
    stagePosition: base.stagePosition,
  };

  const seats = base.cells
    .filter((c) => c.type === "seat" || c.type === "blocked")
    .map((c) => {
      const pos = seatCanvasPosition(c.row, c.col, base.rows, base.cols, posOpts);
      return {
        ...c,
        x: pos.x,
        y: pos.y,
        rotation: defaultSeatRotation({
          ...base,
          mode: "canvas",
          stageStyle,
        }),
      };
    });

  return normalizeLayout({
    ...base,
    mode: "canvas",
    stageStyle,
    canvasWidth,
    canvasHeight,
    cells: seats,
  });
}

/** Rebuild a regular rows×cols seat grid on the freeform canvas. */
export function applyClassicGridToCanvas(
  layout: SeatingLayout,
  rows: number,
  cols: number
): SeatingLayout {
  const gridSize = layout.gridSize ?? CANVAS_GRID_SIZE;
  const rtl = layout.seatNumbersRtl !== false;
  const stageStyle = layout.stageStyle ?? "semicircle";
  const rowLabels = Array.from({ length: rows }, (_, i) =>
    layout.rowLabels?.[i] ?? String(i + 1)
  );

  const { width: blockW, height: blockH } = seatBlockSize(rows, cols, gridSize);
  const canvasWidth = Math.max(
    DEFAULT_CANVAS_WIDTH,
    snapToGrid(blockW + CANVAS_PADDING * 2, gridSize)
  );
  const canvasHeight = Math.max(
    DEFAULT_CANVAS_HEIGHT,
    snapToGrid(blockH + CANVAS_STAGE_FOOTER + CANVAS_PADDING * 2, gridSize)
  );

  const posOpts = {
    seatNumbersRtl: rtl,
    gridSize,
    canvasWidth,
    canvasHeight,
    stageStyle,
    stagePosition: layout.stagePosition,
  };

  const rotation = defaultSeatRotation({
    ...layout,
    mode: "canvas",
    stageStyle,
  });

  const cells: SeatCell[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const pos = seatCanvasPosition(row, col, rows, cols, posOpts);
      cells.push({
        id: `seat-${row}-${col}-${Date.now()}-${col}`,
        row,
        col,
        x: pos.x,
        y: pos.y,
        rotation,
        label: seatLabel(row, col, { cols, seatNumbersRtl: rtl, rowLabels }),
        type: "seat",
        priceRial: layout.defaultPriceRial,
        priceLabel: formatPriceLabel(layout.defaultPriceRial),
        available: true,
      });
    }
  }

  return normalizeLayout({
    ...layout,
    mode: "canvas",
    stageStyle,
    rows,
    cols,
    rowLabels,
    cells,
    canvasWidth,
    canvasHeight,
  });
}

export function addCanvasSeat(
  layout: SeatingLayout,
  x: number,
  y: number,
  type: "seat" | "blocked" = "seat",
  extras?: { rotation?: number; sectionColor?: string }
): SeatingLayout {
  const snap = layout.snapEnabled !== false;
  const gridSize = layout.gridSize ?? CANVAS_GRID_SIZE;
  const sx = snap ? snapToGrid(x, gridSize) : Math.round(x);
  const sy = snap ? snapToGrid(y, gridSize) : Math.round(y);
  const seats = placedSeats(layout);

  if (
    seats.some(
      (c) =>
        Math.abs((c.x ?? 0) - sx) < CANVAS_SEAT_SIZE * 0.6 &&
        Math.abs((c.y ?? 0) - sy) < CANVAS_SEAT_SIZE * 0.6
    )
  ) {
    return layout;
  }

  const rowGuess = Math.max(
    0,
    Math.round((sy - CANVAS_STAGE_BAND - CANVAS_PADDING) / (CANVAS_SEAT_SIZE + 4))
  );
  const colGuess = seats.filter((c) => c.row === rowGuess).length;
  const id = `seat-free-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const row = Math.min(Math.max(rowGuess, 0), Math.max(layout.rows - 1, 0));
  const col = colGuess;

  const cell: SeatCell = {
    id,
    row,
    col,
    x: sx,
    y: sy,
    rotation:
      extras?.rotation ??
      defaultSeatRotation({ ...layout, mode: "canvas" }),
    sectionColor: extras?.sectionColor,
    label: seatLabel(row, col, layout),
    type,
    priceRial: layout.defaultPriceRial,
    priceLabel: formatPriceLabel(layout.defaultPriceRial),
    available: type === "seat",
  };

  return normalizeLayout({
    ...layout,
    mode: "canvas",
    rows: Math.max(layout.rows, row + 1),
    cols: Math.max(layout.cols, col + 1),
    cells: [...seats, cell],
  });
}

export function moveCanvasSeat(
  layout: SeatingLayout,
  seatId: string,
  x: number,
  y: number,
  options?: { snap?: boolean }
): SeatingLayout {
  const snap = options?.snap ?? layout.snapEnabled !== false;
  const gridSize = layout.gridSize ?? CANVAS_GRID_SIZE;
  const sx = snap ? snapToGrid(x, gridSize) : Math.round(x);
  const sy = snap ? snapToGrid(y, gridSize) : Math.round(y);
  const seats = placedSeats(layout);

  return normalizeLayout({
    ...layout,
    mode: "canvas",
    cells: seats.map((c) => (c.id === seatId ? { ...c, x: sx, y: sy } : c)),
  });
}

export function moveCanvasSeats(
  layout: SeatingLayout,
  moves: { id: string; x: number; y: number }[],
  options?: { snap?: boolean }
): SeatingLayout {
  const snap = options?.snap ?? layout.snapEnabled !== false;
  const gridSize = layout.gridSize ?? CANVAS_GRID_SIZE;
  const map = new Map(moves.map((m) => [m.id, m]));
  const seats = placedSeats(layout);

  return normalizeLayout({
    ...layout,
    mode: "canvas",
    cells: seats.map((c) => {
      const m = map.get(c.id);
      if (!m) return c;
      const x = snap ? snapToGrid(m.x, gridSize) : Math.round(m.x);
      const y = snap ? snapToGrid(m.y, gridSize) : Math.round(m.y);
      return { ...c, x, y };
    }),
  });
}

export function rotateCanvasSeats(
  layout: SeatingLayout,
  seatIds: string[],
  rotation: number,
  mode: "absolute" | "delta" = "absolute"
): SeatingLayout {
  const idSet = new Set(seatIds);
  const seats = placedSeats(layout);
  return normalizeLayout({
    ...layout,
    mode: "canvas",
    cells: seats.map((c) => {
      if (!idSet.has(c.id)) return c;
      const next =
        mode === "delta"
          ? (c.rotation ?? 0) + rotation
          : rotation;
      return { ...c, rotation: normalizeAngle(next) };
    }),
  });
}

export function normalizeAngle(deg: number): number {
  let a = deg % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return Math.round(a * 10) / 10;
}

/** Default canvas seat rotation — numbers stay upright for the viewer. */
export function defaultSeatRotation(_layout?: SeatingLayout): number {
  return 0;
}

/** Rotation so the seat front faces the stage (semicircle = bottom of canvas). */
export function stageFacingRotation(
  layout: SeatingLayout,
  x: number,
  y: number
): number {
  const w = layout.canvasWidth ?? DEFAULT_CANVAS_WIDTH;
  const h = layout.canvasHeight ?? DEFAULT_CANVAS_HEIGHT;
  let stageX = w / 2;
  let stageY = h - 18;

  if (layout.stageStyle === "banner") {
    const pos = layout.stagePosition ?? "top";
    if (pos === "top") {
      stageX = w / 2;
      stageY = 40;
    } else if (pos === "bottom") {
      stageX = w / 2;
      stageY = h - 18;
    } else if (pos === "left") {
      stageX = 40;
      stageY = h / 2;
    } else {
      stageX = w - 40;
      stageY = h / 2;
    }
  }

  const cx = x + CANVAS_SEAT_SIZE / 2;
  const cy = y + CANVAS_SEAT_SIZE / 2;
  const deg = (Math.atan2(stageY - cy, stageX - cx) * 180) / Math.PI;
  // CSS 0° = upright; seat "front" is the bottom edge → face stage
  return normalizeAngle(deg - 90);
}

export function faceSeatsTowardStage(
  layout: SeatingLayout,
  seatIds?: string[],
  mode: "upright" | "radial" = "upright"
): SeatingLayout {
  const idSet = seatIds?.length ? new Set(seatIds) : null;
  const posOpts = {
    seatNumbersRtl: layout.seatNumbersRtl !== false,
    gridSize: layout.gridSize ?? CANVAS_GRID_SIZE,
    canvasWidth: layout.canvasWidth ?? DEFAULT_CANVAS_WIDTH,
    canvasHeight: layout.canvasHeight ?? DEFAULT_CANVAS_HEIGHT,
    stageStyle: layout.stageStyle ?? "semicircle",
    stagePosition: layout.stagePosition,
  };

  return normalizeLayout({
    ...layout,
    mode: "canvas",
    stageStyle: layout.stageStyle ?? "semicircle",
    cells: placedSeats(layout).map((c) => {
      if (idSet && !idSet.has(c.id)) return c;
      if (c.type !== "seat" && c.type !== "blocked") return c;

      // When fixing ALL seats to face stage, also re-center the classic grid.
      const shouldRecenter = !idSet && mode === "upright";
      const pos = shouldRecenter
        ? seatCanvasPosition(c.row, c.col, layout.rows, layout.cols, posOpts)
        : { x: c.x ?? 0, y: c.y ?? 0 };

      return {
        ...c,
        x: shouldRecenter ? pos.x : c.x,
        y: shouldRecenter ? pos.y : c.y,
        rotation:
          mode === "radial"
            ? stageFacingRotation(layout, pos.x, pos.y)
            : defaultSeatRotation(layout),
      };
    }),
  });
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function peerSpacing(
  peers: SeatCell[],
  axis: "x" | "y"
): number {
  if (peers.length < 2) return CANVAS_SEAT_SIZE + 6;
  const vals = peers
    .map((p) => (axis === "x" ? p.x ?? 0 : p.y ?? 0))
    .sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < vals.length; i += 1) {
    const g = vals[i]! - vals[i - 1]!;
    if (g > CANVAS_SEAT_SIZE * 0.4) gaps.push(g);
  }
  return gaps.length ? median(gaps) : CANVAS_SEAT_SIZE + 6;
}

/**
 * Snap selected seats back into line with left/right/up/down neighbors
 * (same row Y, same column X, even spacing, matching rotation).
 */
export function alignSeatsToNeighbors(
  layout: SeatingLayout,
  seatIds: string[]
): SeatingLayout {
  if (!seatIds.length) return layout;
  const seats = placedSeats(layout);
  const idSet = new Set(seatIds);
  const ROW_TOL = CANVAS_SEAT_SIZE * 0.85;
  const COL_TOL = CANVAS_SEAT_SIZE * 0.85;

  const next = seats.map((seat) => {
    if (!idSet.has(seat.id)) return seat;
    const sx = seat.x ?? 0;
    const sy = seat.y ?? 0;
    const others = seats.filter((s) => s.id !== seat.id);

    const rowPeers = others
      .filter((s) => Math.abs((s.y ?? 0) - sy) <= ROW_TOL)
      .sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
    const colPeers = others
      .filter((s) => Math.abs((s.x ?? 0) - sx) <= COL_TOL)
      .sort((a, b) => (a.y ?? 0) - (b.y ?? 0));

    const left = [...rowPeers].reverse().find((s) => (s.x ?? 0) < sx - 2);
    const right = rowPeers.find((s) => (s.x ?? 0) > sx + 2);
    const above = [...colPeers].reverse().find((s) => (s.y ?? 0) < sy - 2);
    const below = colPeers.find((s) => (s.y ?? 0) > sy + 2);

    let nx = sx;
    let ny = sy;

    if (rowPeers.length > 0) {
      const spacingX = peerSpacing(rowPeers, "x");
      ny = Math.round(median(rowPeers.map((p) => p.y ?? 0)));
      if (left && right) {
        const fromLeft = (sx - (left.x ?? 0)) / spacingX;
        const slot = Math.max(1, Math.round(fromLeft));
        nx = Math.round((left.x ?? 0) + slot * spacingX);
        // Prefer sitting cleanly between left and right if there's only one gap
        const mid = Math.round(((left.x ?? 0) + (right.x ?? 0)) / 2);
        if (Math.abs((right.x ?? 0) - (left.x ?? 0) - spacingX) < spacingX * 0.35) {
          nx = mid;
        }
      } else if (left) {
        nx = Math.round((left.x ?? 0) + spacingX);
      } else if (right) {
        nx = Math.round((right.x ?? 0) - spacingX);
      } else if (rowPeers.length) {
        // Only peers further away — snap Y, keep X but snap to peer grid
        const anchor = rowPeers[0]!;
        const spacing = peerSpacing([anchor, ...rowPeers], "x");
        const slot = Math.round(((sx - (anchor.x ?? 0)) / spacing));
        nx = Math.round((anchor.x ?? 0) + slot * spacing);
      }
    }

    if (colPeers.length > 0) {
      const spacingY = peerSpacing(colPeers, "y");
      // Column alignment for X when vertical neighbors dominate or reinforce
      if (above || below) {
        const colX = median(colPeers.map((p) => p.x ?? 0));
        if (!rowPeers.length || Math.abs(colX - nx) < COL_TOL) {
          nx = Math.round(colX);
        }
      }
      if (above && below && !left && !right) {
        const fromAbove = (sy - (above.y ?? 0)) / spacingY;
        const slot = Math.max(1, Math.round(fromAbove));
        ny = Math.round((above.y ?? 0) + slot * spacingY);
        const mid = Math.round(((above.y ?? 0) + (below.y ?? 0)) / 2);
        if (Math.abs((below.y ?? 0) - (above.y ?? 0) - spacingY) < spacingY * 0.35) {
          ny = mid;
        }
      } else if (above && !left && !right) {
        ny = Math.round((above.y ?? 0) + spacingY);
      } else if (below && !left && !right) {
        ny = Math.round((below.y ?? 0) - spacingY);
      }
    }

    const neighborRots = [left, right, above, below]
      .filter(Boolean)
      .map((s) => s!.rotation ?? 0);
    const nrot = neighborRots.length
      ? median(neighborRots)
      : stageFacingRotation(layout, nx, ny);

    return {
      ...seat,
      x: nx,
      y: ny,
      rotation: normalizeAngle(nrot),
    };
  });

  return normalizeLayout({
    ...layout,
    mode: "canvas",
    cells: next,
  });
}

export function setSeatsSectionColor(
  layout: SeatingLayout,
  seatIds: string[],
  color: string | undefined
): SeatingLayout {
  const idSet = new Set(seatIds);
  return normalizeLayout({
    ...layout,
    mode: "canvas",
    cells: placedSeats(layout).map((c) =>
      idSet.has(c.id) ? { ...c, sectionColor: color } : c
    ),
  });
}

function rotatePoint(
  x: number,
  y: number,
  cx: number,
  cy: number,
  deg: number
): { x: number; y: number } {
  const r = (deg * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  return {
    x: cx + dx * Math.cos(r) - dy * Math.sin(r),
    y: cy + dx * Math.sin(r) + dy * Math.cos(r),
  };
}

/** Place a rectangular block of seats, then rotate the whole block (theater fan). */
export function addAngledSeatBlock(
  layout: SeatingLayout,
  opts: {
    rows: number;
    cols: number;
    originX: number;
    originY: number;
    /** Block rotation in degrees — seats inherit the same facing angle. */
    rotation?: number;
    sectionColor?: string;
  }
): SeatingLayout {
  const rotation = opts.rotation ?? 0;
  const gap = 6;
  const step = CANVAS_SEAT_SIZE + gap;
  const seats = [...placedSeats(layout)];
  const stamp = Date.now();
  const blockW = (opts.cols - 1) * step;
  const blockH = (opts.rows - 1) * step;
  const cx = opts.originX + blockW / 2;
  const cy = opts.originY + blockH / 2;

  for (let row = 0; row < opts.rows; row += 1) {
    for (let col = 0; col < opts.cols; col += 1) {
      const localX = opts.originX + col * step;
      const localY = opts.originY + row * step;
      const pos = rotatePoint(localX, localY, cx, cy, rotation);
      const px = Math.round(pos.x);
      const py = Math.round(pos.y);
      seats.push({
        id: `block-${stamp}-r${row}c${col}`,
        row,
        col,
        x: px,
        y: py,
        // Face the stage upright — not tilted left/right with the block
        rotation: defaultSeatRotation({
          ...layout,
          mode: "canvas",
          stageStyle: layout.stageStyle ?? "semicircle",
        }),
        sectionColor: opts.sectionColor,
        label: seatLabel(row, col, {
          cols: opts.cols,
          seatNumbersRtl: layout.seatNumbersRtl !== false,
          rowLabels: layout.rowLabels,
        }),
        type: "seat",
        priceRial: layout.defaultPriceRial,
        priceLabel: formatPriceLabel(layout.defaultPriceRial),
        available: true,
      });
    }
  }

  return normalizeLayout({
    ...layout,
    mode: "canvas",
    stageStyle: layout.stageStyle ?? "semicircle",
    rows: Math.max(layout.rows, opts.rows),
    cols: Math.max(layout.cols, opts.cols),
    cells: seats,
  });
}

/** Curved (arc) row of seats facing a center point — like rear balcony arcs. */
export function addArcSeatRow(
  layout: SeatingLayout,
  opts: {
    centerX: number;
    centerY: number;
    radius: number;
    startDeg: number;
    endDeg: number;
    count: number;
    sectionColor?: string;
    rowIndex?: number;
  }
): SeatingLayout {
  const seats = [...placedSeats(layout)];
  const stamp = Date.now();
  const row = opts.rowIndex ?? 0;
  const count = Math.max(2, opts.count);

  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const deg = opts.startDeg + (opts.endDeg - opts.startDeg) * t;
    const rad = (deg * Math.PI) / 180;
    const x = opts.centerX + opts.radius * Math.cos(rad) - CANVAS_SEAT_SIZE / 2;
    const y = opts.centerY + opts.radius * Math.sin(rad) - CANVAS_SEAT_SIZE / 2;
    const px = Math.round(x);
    const py = Math.round(y);
    seats.push({
      id: `arc-${stamp}-${i}`,
      row,
      col: i,
      x: px,
      y: py,
      rotation: defaultSeatRotation({
        ...layout,
        mode: "canvas",
        stageStyle: layout.stageStyle ?? "semicircle",
      }),
      sectionColor: opts.sectionColor,
      label: seatLabel(row, i, {
        cols: count,
        seatNumbersRtl: layout.seatNumbersRtl !== false,
        rowLabels: layout.rowLabels,
      }),
      type: "seat",
      priceRial: layout.defaultPriceRial,
      priceLabel: formatPriceLabel(layout.defaultPriceRial),
      available: true,
    });
  }

  return normalizeLayout({
    ...layout,
    mode: "canvas",
    stageStyle: layout.stageStyle ?? "semicircle",
    rows: Math.max(layout.rows, row + 1),
    cols: Math.max(layout.cols, count),
    cells: seats,
  });
}

export function removeCanvasSeat(layout: SeatingLayout, seatId: string): SeatingLayout {
  return normalizeLayout({
    ...layout,
    mode: "canvas",
    cells: placedSeats(layout).filter((c) => c.id !== seatId),
  });
}

export function removeCanvasSeats(layout: SeatingLayout, seatIds: string[]): SeatingLayout {
  const idSet = new Set(seatIds);
  return normalizeLayout({
    ...layout,
    mode: "canvas",
    cells: placedSeats(layout).filter((c) => !idSet.has(c.id)),
  });
}

export function addRowMarker(
  layout: SeatingLayout,
  x: number,
  y: number,
  label?: string
): SeatingLayout {
  const snap = layout.snapEnabled !== false;
  const gridSize = layout.gridSize ?? CANVAS_GRID_SIZE;
  const sx = snap ? snapToGrid(x, gridSize) : Math.round(x);
  const sy = snap ? snapToGrid(y, gridSize) : Math.round(y);
  const markers = [...(layout.rowMarkers ?? [])];
  const rowIndex = markers.length;
  const autoLabel =
    label?.trim() ||
    layout.rowLabels?.[rowIndex] ||
    String.fromCharCode(65 + (rowIndex % 26));

  const marker: CanvasRowMarker = {
    id: `row-mark-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label: autoLabel,
    x: sx,
    y: sy,
    rowIndex,
  };

  const rowLabels = ensureRowLabels({
    ...layout,
    rows: Math.max(layout.rows, rowIndex + 1),
  });
  rowLabels[rowIndex] = autoLabel;

  return normalizeLayout({
    ...layout,
    mode: "canvas",
    rows: Math.max(layout.rows, rowIndex + 1),
    rowLabels,
    rowMarkers: [...markers, marker],
  });
}

export function moveRowMarker(
  layout: SeatingLayout,
  markerId: string,
  x: number,
  y: number
): SeatingLayout {
  const snap = layout.snapEnabled !== false;
  const gridSize = layout.gridSize ?? CANVAS_GRID_SIZE;
  const sx = snap ? snapToGrid(x, gridSize) : Math.round(x);
  const sy = snap ? snapToGrid(y, gridSize) : Math.round(y);
  return normalizeLayout({
    ...layout,
    mode: "canvas",
    rowMarkers: (layout.rowMarkers ?? []).map((m) =>
      m.id === markerId ? { ...m, x: sx, y: sy } : m
    ),
  });
}

export function updateRowMarkerLabel(
  layout: SeatingLayout,
  markerId: string,
  label: string
): SeatingLayout {
  const trimmed = label.trim() || "؟";
  const markers = (layout.rowMarkers ?? []).map((m) =>
    m.id === markerId ? { ...m, label: trimmed } : m
  );
  const target = markers.find((m) => m.id === markerId);
  let rowLabels = ensureRowLabels(layout);
  if (target && typeof target.rowIndex === "number") {
    rowLabels = [...rowLabels];
    while (rowLabels.length <= target.rowIndex) {
      rowLabels.push(String(rowLabels.length + 1));
    }
    rowLabels[target.rowIndex] = trimmed;
  }
  return normalizeLayout({
    ...layout,
    mode: "canvas",
    rowMarkers: markers,
    rowLabels,
  });
}

export function removeRowMarkers(
  layout: SeatingLayout,
  markerIds: string[]
): SeatingLayout {
  const idSet = new Set(markerIds);
  return normalizeLayout({
    ...layout,
    mode: "canvas",
    rowMarkers: (layout.rowMarkers ?? []).filter((m) => !idSet.has(m.id)),
  });
}

/** Place/update left-side row signs from existing seat rows. */
export function syncRowMarkersFromSeats(layout: SeatingLayout): SeatingLayout {
  const seats = placedSeats(layout).filter((c) => c.type === "seat");
  const byRow = new Map<number, SeatCell[]>();
  for (const s of seats) {
    const list = byRow.get(s.row) ?? [];
    list.push(s);
    byRow.set(s.row, list);
  }

  const markers: CanvasRowMarker[] = [];
  const rowLabels = ensureRowLabels(layout);
  const sortedRows = [...byRow.keys()].sort((a, b) => a - b);

  for (const row of sortedRows) {
    const group = byRow.get(row)!;
    const minX = Math.min(...group.map((s) => s.x ?? 0));
    const avgY =
      group.reduce((sum, s) => sum + (s.y ?? 0), 0) / Math.max(group.length, 1);
    const label = rowLabels[row] ?? String(row + 1);
    markers.push({
      id: `row-sync-${row}`,
      label,
      x: Math.max(8, minX - 44),
      y: Math.round(avgY),
      rowIndex: row,
    });
  }

  return normalizeLayout({
    ...layout,
    mode: "canvas",
    rowMarkers: markers,
  });
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
  const rowLabels = Array.from({ length: rows }, (_, i) => String(i + 1));
  return applyClassicGridToCanvas(
    {
      name,
      rows,
      cols,
      stagePosition,
      stageLabel: "صحنه اجرا",
      stageRect: defaultStageRect(rows, cols, stagePosition),
      zones: [],
      defaultPriceRial,
      seatNumbersRtl: true,
      rowLabels,
      cells: [],
      mode: "canvas",
      gridSize: CANVAS_GRID_SIZE,
      canvasWidth: DEFAULT_CANVAS_WIDTH,
      canvasHeight: DEFAULT_CANVAS_HEIGHT,
      stageStyle: "semicircle",
    },
    rows,
    cols
  );
}

export function parseSeatingLayout(raw: unknown): SeatingLayout | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<SeatingLayout>;
  if (!Array.isArray(data.cells) || !data.rows || !data.cols) return null;
  return normalizeLayout({
    name: String(data.name ?? "سالن"),
    rows: Number(data.rows),
    cols: Number(data.cols),
    stagePosition: (data.stagePosition as StagePosition) ?? "top",
    stageLabel: String(data.stageLabel ?? "صحنه اجرا"),
    stageRect: data.stageRect as StageRect | undefined,
    zones: Array.isArray(data.zones) ? (data.zones as SeatingZone[]) : undefined,
    defaultPriceRial: Number(data.defaultPriceRial ?? 350_000),
    cells: data.cells as SeatCell[],
    rowLabels: Array.isArray(data.rowLabels) ? (data.rowLabels as string[]) : undefined,
    rowMarkers: Array.isArray(data.rowMarkers)
      ? (data.rowMarkers as CanvasRowMarker[])
      : undefined,
    seatNumbersRtl: data.seatNumbersRtl !== false,
    mode: "canvas",
    canvasWidth: data.canvasWidth ? Number(data.canvasWidth) : undefined,
    canvasHeight: data.canvasHeight ? Number(data.canvasHeight) : undefined,
    gridSize: data.gridSize ? Number(data.gridSize) : undefined,
    snapEnabled: data.snapEnabled !== false,
    stageStyle: data.stageStyle === "banner" ? "banner" : data.stageStyle === "semicircle" ? "semicircle" : undefined,
  });
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

/** Only moves the decorative stage banner — does not touch seats. */
export function applyStagePosition(
  layout: SeatingLayout,
  stagePosition: StagePosition
): SeatingLayout {
  return normalizeLayout({
    ...layout,
    stagePosition,
    stageRect: defaultStageRect(layout.rows, layout.cols, stagePosition),
  });
}

export function resizeLayout(
  layout: SeatingLayout,
  rows: number,
  cols: number
): SeatingLayout {
  return applyClassicGridToCanvas(layout, rows, cols);
}
