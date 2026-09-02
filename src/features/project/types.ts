export type KnitMode = "flat" | "round";
export type WorkspaceMode = "design" | "track";
export type TileMode = "across" | "up" | "dest";

/** Where a row sits when it is narrower than the widest row. */
export type RowAnchor = "left" | "center" | "right";

/** One stitch in the finished fabric. `stitch` is an id into the stitch table. */
export interface PatternCell {
  stitch: string;
}

export interface Cursor {
  r: number;
  c: number;
}

export interface SelectionRect {
  minR: number;
  minC: number;
  maxR: number;
  maxC: number;
}

export interface WorkspaceSelection {
  active: boolean;
  role: "source" | "dest";
  anchor: Cursor | null;
  focus: Cursor | null;
  rect: SelectionRect | null;
}

export interface TileSource {
  originR: number;
  originC: number;
  tileRows: number;
  tileCols: number;
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

export interface KnitProject {
  version: number;
  anchor: RowAnchor;
  rows: number;
  cols: number;
  knitMode: KnitMode;
  yarn: YarnDetails;
  shapeMask: boolean[][];
  pattern: PatternCell[][];
  confirmedShape: boolean;
  workspaceMode: WorkspaceMode;
  mirrorX: boolean;
  mirrorY: boolean;
  cursor: Cursor;
  selectedRow: number;
  rowNotes: Record<string, string>;
  selection: WorkspaceSelection;
  tileSource: TileSource;
  tileApply: TileApplyState;
}