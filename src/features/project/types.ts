/**
 * Project model, version 3.
 *
 * A chart is a list of rows in the order they are worked: index 0 is the
 * cast-on row, and the renderer flips the list so the work builds upward on
 * screen. A row is a list of stitches, not a fixed-width slice of a grid - its
 * length is however many stitches it took to consume the row below.
 */

export type KnitMode = "flat" | "round";
export type WorkspaceMode = "design" | "track";
export type TileMode = "across" | "up" | "dest";

/** Where a row sits when it is narrower than the widest row. */
export type RowAnchor = "left" | "center" | "right";

/** One stitch in the finished fabric. `stitch` is an id into the stitch table. */
export interface PatternCell {
  stitch: string;
}

export interface PatternRow {
  cells: PatternCell[];
  /**
   * Set when the knitter deliberately turned before consuming the row below.
   * A short row is valid but under-consuming; without this flag it would be
   * indistinguishable from an unfinished row.
   */
  short: boolean;
  note: string;
}

/** Position of the caret: which row, and how many stitches into it. */
export interface Cursor {
  row: number;
  index: number;
}

export interface SelectionRect {
  minRow: number;
  minIndex: number;
  maxRow: number;
  maxIndex: number;
}

export interface WorkspaceSelection {
  active: boolean;
  role: "source" | "dest";
  anchor: Cursor | null;
  focus: Cursor | null;
  rect: SelectionRect | null;
}

export interface TileSource {
  rect: SelectionRect | null;
  overwriteBlanks: boolean;
  confirmed: boolean;
}

export interface TileApplyState {
  mode: TileMode;
  destRect: SelectionRect | null;
}

export interface YarnDetails {
  stitchesPerInch: string;
  rowsPerInch: string;
  yarnName: string;
  yarnDescriptors: string;
  patternTags: string;
}

export const MIN_CAST_ON = 1;
export const MAX_CAST_ON = 128;

export interface KnitProject {
  version: number;
  /** Shown on the printed pattern and used for exported filenames. */
  name: string;
  /** Stitches cast on. Seeds the live count for row 0. */
  castOn: number;
  /** Free text from the new-pattern wizard: gauge, yarn, sizing. */
  notes: string;
  knitMode: KnitMode;
  anchor: RowAnchor;
  yarn: YarnDetails;
  rows: PatternRow[];
  workspaceMode: WorkspaceMode;
  mirrorX: boolean;
  mirrorY: boolean;
  cursor: Cursor;
  selection: WorkspaceSelection;
  tileSource: TileSource;
  tileApply: TileApplyState;
}
