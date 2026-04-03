import type { KnitProject, PatternCell } from "./types";

function createShapeMask(rows: number, cols: number, fill = true): boolean[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => fill)
  );
}

function createPattern(rows: number, cols: number): PatternCell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ symbol: "empty" as const }))
  );
}

export function createEmptyProject(rows = 40, cols = 40): KnitProject {
  return {
    version: 1,
    rows,
    cols,
    knitMode: "flat",
    yarn: {
      stitchesPerInch: "",
      rowsPerInch: "",
      yarnName: "",
      yarnDescriptors: "",
      patternTags: "",
    },
    shapeMask: createShapeMask(rows, cols, true),
    pattern: createPattern(rows, cols),
    confirmedShape: false,
    workspaceMode: "design",
    mirrorX: false,
    mirrorY: false,
    cursor: { r: rows - 1, c: cols - 1 },
    selectedRow: rows - 1,
    rowNotes: {},
    selection: {
      active: false,
      role: "source",
      anchor: null,
      focus: null,
      rect: null,
    },
    tileSource: {
      originR: 0,
      originC: 0,
      tileRows: 3,
      tileCols: 3,
      overwriteBlanks: true,
      confirmed: false,
    },
    tileApply: {
      mode: "across",
      destRect: null,
    },
  };
}