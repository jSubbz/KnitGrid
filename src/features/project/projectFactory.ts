import { DEFAULT_STITCH } from "../stitches/stitches";
import { createRow } from "./rowMath";
import { MAX_CAST_ON, MIN_CAST_ON } from "./types";
import type { KnitProject, PatternRow } from "./types";

export function clampCastOn(value: number): number {
  if (!Number.isFinite(value)) return MIN_CAST_ON;
  return Math.max(MIN_CAST_ON, Math.min(MAX_CAST_ON, Math.floor(value)));
}

/**
 * A new project starts with one empty row waiting on the cast-on stitches.
 * Nothing is pre-allocated: rows appear as they are worked.
 */
export function createProject(castOn = 6, notes = ""): KnitProject {
  const rows: PatternRow[] = [createRow()];

  return {
    version: 3,
    castOn: clampCastOn(castOn),
    notes,
    knitMode: "flat",
    anchor: "right",
    yarn: {
      stitchesPerInch: "",
      rowsPerInch: "",
      yarnName: "",
      yarnDescriptors: "",
      patternTags: "",
    },
    rows,
    workspaceMode: "design",
    mirrorX: false,
    mirrorY: false,
    cursor: { row: 0, index: 0 },
    selection: {
      active: false,
      role: "source",
      anchor: null,
      focus: null,
      rect: null,
    },
    tileSource: { rect: null, overwriteBlanks: true, confirmed: false },
    tileApply: { mode: "dest", destRect: null },
  };
}

/** Kept for callers that only want a blank chart at the default cast-on. */
export function createEmptyProject(): KnitProject {
  return createProject();
}

export { DEFAULT_STITCH };
