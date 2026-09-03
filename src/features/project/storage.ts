import { DEFAULT_STITCH, isKnownStitch } from "../stitches/stitches";
import { clampCastOn, createProject } from "./projectFactory";
import { createRow } from "./rowMath";
import type {
  KnitProject,
  PatternCell,
  PatternRow,
  RowAnchor,
  WorkspaceSelection,
} from "./types";

export const PROJECT_VERSION = 3;

/**
 * Version 1 stored six decorative glyphs with no stitch semantics. Mapping them
 * onto real stitches is a judgement call: `dot` and the two diagonals had an
 * obvious reading, `h` never did. Anything unrecognised becomes a plain knit,
 * which is count-neutral and so cannot make an old chart fail validation.
 */
const V1_SYMBOL_MAP: Record<string, string> = {
  empty: "k",
  dot: "p",
  v: "sl",
  diagFwd: "k2tog",
  diagBack: "ssk",
  h: "k",
};

type SavePickerWindow = Window & {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{ description: string; accept: Record<string, string[]> }>;
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: string) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeStitch(value: unknown): string {
  if (isKnownStitch(value)) return value;
  if (typeof value === "string" && value in V1_SYMBOL_MAP) {
    return V1_SYMBOL_MAP[value];
  }
  return DEFAULT_STITCH;
}

function normalizeCell(value: unknown): PatternCell {
  if (isObject(value)) {
    return { stitch: normalizeStitch(value.stitch ?? value.symbol) };
  }
  return { stitch: DEFAULT_STITCH };
}

function normalizeRow(value: unknown): PatternRow {
  if (!isObject(value)) return createRow();
  const cells = Array.isArray(value.cells) ? value.cells.map(normalizeCell) : [];
  return {
    cells,
    short: !!value.short,
    note: typeof value.note === "string" ? value.note : "",
  };
}

/**
 * Versions 1 and 2 stored a fixed rectangle plus a boolean mask saying which
 * cells were real. Rows were listed top-down; version 3 lists them in the order
 * they are worked, so the rectangle is masked, compacted and reversed.
 */
function migrateFromGrid(raw: Record<string, unknown>): PatternRow[] {
  const pattern = Array.isArray(raw.pattern) ? raw.pattern : [];
  const mask = Array.isArray(raw.shapeMask) ? raw.shapeMask : null;

  const rows: PatternRow[] = pattern.map((patternRow, r) => {
    const cells: PatternCell[] = [];
    if (Array.isArray(patternRow)) {
      patternRow.forEach((cell, c) => {
        const maskRow = mask?.[r];
        const inShape = Array.isArray(maskRow) ? !!maskRow[c] : true;
        if (inShape) cells.push(normalizeCell(cell));
      });
    }
    return { cells, short: false, note: "" };
  });

  return rows.reverse().filter((row, index, all) => {
    // Drop rows that were only empty grid padding above the work.
    if (row.cells.length > 0) return true;
    return all.slice(index).some((later) => later.cells.length > 0);
  });
}

function normalizeSelection(): WorkspaceSelection {
  return { active: false, role: "source", anchor: null, focus: null, rect: null };
}

export function serializeProject(project: KnitProject): string {
  return JSON.stringify(project, null, 2);
}

export async function saveProjectAs(
  project: KnitProject,
  suggestedName = "knitgrid-project.json"
) {
  const serialized = serializeProject(project);
  const win = window as SavePickerWindow;

  if (typeof win.showSaveFilePicker === "function") {
    const handle = await win.showSaveFilePicker({
      suggestedName,
      types: [
        { description: "KnitGrid Project", accept: { "application/json": [".json"] } },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(serialized);
    await writable.close();
    return;
  }

  const fallbackName =
    window.prompt("Save project as:", suggestedName)?.trim() || suggestedName;
  const blob = new Blob([serialized], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fallbackName.endsWith(".json")
    ? fallbackName
    : `${fallbackName}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseProjectJson(text: string): KnitProject {
  const raw: unknown = JSON.parse(text);
  if (!isObject(raw)) throw new Error("Invalid project file.");

  const base = createProject();

  const rows = Array.isArray(raw.rows)
    ? raw.rows.map(normalizeRow)
    : migrateFromGrid(raw);

  const castOn =
    typeof raw.castOn === "number"
      ? clampCastOn(raw.castOn)
      : clampCastOn(rows[0]?.cells.length || base.castOn);

  return {
    ...base,
    version: PROJECT_VERSION,
    name: typeof raw.name === "string" ? raw.name : "",
    castOn,
    notes: typeof raw.notes === "string" ? raw.notes : "",
    knitMode: raw.knitMode === "round" ? "round" : "flat",
    anchor:
      raw.anchor === "left" || raw.anchor === "center" || raw.anchor === "right"
        ? (raw.anchor as RowAnchor)
        : "center",
    yarn: isObject(raw.yarn)
      ? {
          stitchesPerInch: String(raw.yarn.stitchesPerInch ?? ""),
          rowsPerInch: String(raw.yarn.rowsPerInch ?? ""),
          yarnName: String(raw.yarn.yarnName ?? ""),
          yarnDescriptors: String(raw.yarn.yarnDescriptors ?? ""),
          patternTags: String(raw.yarn.patternTags ?? ""),
        }
      : base.yarn,
    rows: rows.length > 0 ? rows : [createRow()],
    workspaceMode: raw.workspaceMode === "track" ? "track" : "design",
    mirrorX: !!raw.mirrorX,
    mirrorY: !!raw.mirrorY,
    cursor: { row: 0, index: 0 },
    selection: normalizeSelection(),
  };
}

export async function readProjectFile(file: File): Promise<KnitProject> {
  return parseProjectJson(await file.text());
}
