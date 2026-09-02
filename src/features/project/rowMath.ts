/**
 * Row arithmetic.
 *
 * Everything the engine knows about whether a chart holds together comes from
 * two sums per row: how many live stitches its cells consume from the row
 * below, and how many they produce for the row above. These are pure functions
 * over the project so the reducer, the validator and the renderer all agree.
 */
import { getStitch } from "../stitches/stitches";
import type { KnitProject, PatternRow } from "./types";

export function consumedBy(row: PatternRow): number {
  return row.cells.reduce((sum, cell) => sum + getStitch(cell.stitch).consumes, 0);
}

export function producedBy(row: PatternRow): number {
  return row.cells.reduce((sum, cell) => sum + getStitch(cell.stitch).produces, 0);
}

/** Stitches consumed by the first `count` cells of a row. */
export function consumedByPrefix(row: PatternRow, count: number): number {
  let total = 0;
  for (let i = 0; i < count && i < row.cells.length; i += 1) {
    total += getStitch(row.cells[i].stitch).consumes;
  }
  return total;
}

/**
 * Live stitches available to row `index` - the cast-on for the first row, and
 * whatever the row below produced for every row after it.
 */
export function liveCountFor(project: KnitProject, index: number): number {
  if (index <= 0) return project.castOn;
  const below = project.rows[index - 1];
  return below ? producedBy(below) : project.castOn;
}

export type RowState =
  | "empty"
  | "inProgress"
  | "complete"
  /** Deliberately turned early. Valid, but under-consuming. */
  | "short"
  /** Consumed more than the row below produced. Only reachable by forcing. */
  | "overflow"
  /** Advanced past without consuming everything and without being marked short. */
  | "underflow";

export interface RowStatus {
  state: RowState;
  live: number;
  consumed: number;
  produced: number;
  /** Live stitches not yet worked. Negative when the row has overflowed. */
  remaining: number;
}

export function rowStatus(
  project: KnitProject,
  index: number,
  isCurrent: boolean
): RowStatus {
  const row = project.rows[index];
  const live = liveCountFor(project, index);
  const consumed = row ? consumedBy(row) : 0;
  const produced = row ? producedBy(row) : 0;
  const remaining = live - consumed;

  let state: RowState;
  if (consumed > live) {
    state = "overflow";
  } else if (row?.short) {
    state = "short";
  } else if (remaining === 0 && (row?.cells.length ?? 0) > 0) {
    state = "complete";
  } else if ((row?.cells.length ?? 0) === 0) {
    state = "empty";
  } else if (isCurrent) {
    state = "inProgress";
  } else {
    state = "underflow";
  }

  return { state, live, consumed, produced, remaining };
}

/** True when adding `stitchId` would consume more than the row has left. */
export function wouldOverflow(
  project: KnitProject,
  rowIndex: number,
  stitchId: string
): boolean {
  const row = project.rows[rowIndex];
  if (!row) return false;
  const live = liveCountFor(project, rowIndex);
  return consumedBy(row) + getStitch(stitchId).consumes > live;
}

/** Widest row in the chart, used to size and anchor the canvas. */
export function widestRow(project: KnitProject): number {
  return project.rows.reduce(
    (max, row) => Math.max(max, row.cells.length),
    project.castOn
  );
}

export function createRow(): PatternRow {
  return { cells: [], short: false, note: "" };
}
