import type { KnitProject, PatternCell, PatternSymbol } from "./types";

const VALID_SYMBOLS: PatternSymbol[] = [
  "empty",
  "dot",
  "h",
  "v",
  "diagFwd",
  "diagBack",
];

type SavePickerWindow = Window & {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
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

function normalizeSymbol(value: unknown): PatternSymbol {
  return VALID_SYMBOLS.includes(value as PatternSymbol)
    ? (value as PatternSymbol)
    : "empty";
}

function normalizePatternCell(value: unknown): PatternCell {
  if (isObject(value)) {
    return {
      symbol: normalizeSymbol(value.symbol),
    };
  }

  return { symbol: "empty" };
}

function normalizeBooleanMatrix(
  value: unknown,
  fallbackRows: number,
  fallbackCols: number,
  fill: boolean
): boolean[][] {
  if (!Array.isArray(value)) {
    return Array.from({ length: fallbackRows }, () =>
      Array.from({ length: fallbackCols }, () => fill)
    );
  }

  return value.map((row) =>
    Array.isArray(row) ? row.map((cell) => !!cell) : []
  );
}

function normalizePatternMatrix(
  value: unknown,
  fallbackRows: number,
  fallbackCols: number
): PatternCell[][] {
  if (!Array.isArray(value)) {
    return Array.from({ length: fallbackRows }, () =>
      Array.from({ length: fallbackCols }, () => ({ symbol: "empty" as const }))
    );
  }

  return value.map((row) =>
    Array.isArray(row) ? row.map((cell) => normalizePatternCell(cell)) : []
  );
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
        {
          description: "KnitGrid Project",
          accept: {
            "application/json": [".json"],
          },
        },
      ],
    });

    const writable = await handle.createWritable();
    await writable.write(serialized);
    await writable.close();
    return;
  }

  const fallbackName =
    window.prompt("Save project as:", suggestedName)?.trim() || suggestedName;

  const blob = new Blob([serialized], {
    type: "application/json",
  });

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
  const raw = JSON.parse(text) as unknown;

  if (!isObject(raw)) {
    throw new Error("Invalid project file.");
  }

  const rows =
    typeof raw.rows === "number" && Number.isFinite(raw.rows) && raw.rows > 0
      ? Math.floor(raw.rows)
      : 40;

  const cols =
    typeof raw.cols === "number" && Number.isFinite(raw.cols) && raw.cols > 0
      ? Math.floor(raw.cols)
      : 40;

  return {
    version:
      typeof raw.version === "number" && Number.isFinite(raw.version)
        ? raw.version
        : 1,
    rows,
    cols,
    knitMode: raw.knitMode === "round" ? "round" : "flat",
    yarn: {
      stitchesPerInch:
        isObject(raw.yarn) && typeof raw.yarn.stitchesPerInch === "string"
          ? raw.yarn.stitchesPerInch
          : "",
      rowsPerInch:
        isObject(raw.yarn) && typeof raw.yarn.rowsPerInch === "string"
          ? raw.yarn.rowsPerInch
          : "",
      yarnName:
        isObject(raw.yarn) && typeof raw.yarn.yarnName === "string"
          ? raw.yarn.yarnName
          : "",
      yarnDescriptors:
        isObject(raw.yarn) && typeof raw.yarn.yarnDescriptors === "string"
          ? raw.yarn.yarnDescriptors
          : "",
      patternTags:
        isObject(raw.yarn) && typeof raw.yarn.patternTags === "string"
          ? raw.yarn.patternTags
          : "",
    },
    shapeMask: normalizeBooleanMatrix(raw.shapeMask, rows, cols, true),
    pattern: normalizePatternMatrix(raw.pattern, rows, cols),
    confirmedShape: !!raw.confirmedShape,
    workspaceMode: raw.workspaceMode === "track" ? "track" : "design",
    mirrorX: !!raw.mirrorX,
    mirrorY: !!raw.mirrorY,
    cursor:
      isObject(raw.cursor) &&
      typeof raw.cursor.r === "number" &&
      typeof raw.cursor.c === "number"
        ? {
            r: Math.max(0, Math.min(rows - 1, Math.floor(raw.cursor.r))),
            c: Math.max(0, Math.min(cols - 1, Math.floor(raw.cursor.c))),
          }
        : { r: rows - 1, c: cols - 1 },
    selectedRow:
      typeof raw.selectedRow === "number" && Number.isFinite(raw.selectedRow)
        ? Math.max(0, Math.min(rows - 1, Math.floor(raw.selectedRow)))
        : rows - 1,
    rowNotes: isObject(raw.rowNotes)
      ? Object.fromEntries(
          Object.entries(raw.rowNotes).map(([key, value]) => [
            key,
            typeof value === "string" ? value : "",
          ])
        )
      : {},
    selection:
      isObject(raw.selection)
        ? {
            active: !!raw.selection.active,
            role: raw.selection.role === "dest" ? "dest" : "source",
            anchor:
              isObject(raw.selection.anchor) &&
              typeof raw.selection.anchor.r === "number" &&
              typeof raw.selection.anchor.c === "number"
                ? {
                    r: Math.max(0, Math.min(rows - 1, Math.floor(raw.selection.anchor.r))),
                    c: Math.max(0, Math.min(cols - 1, Math.floor(raw.selection.anchor.c))),
                  }
                : null,
            focus:
              isObject(raw.selection.focus) &&
              typeof raw.selection.focus.r === "number" &&
              typeof raw.selection.focus.c === "number"
                ? {
                    r: Math.max(0, Math.min(rows - 1, Math.floor(raw.selection.focus.r))),
                    c: Math.max(0, Math.min(cols - 1, Math.floor(raw.selection.focus.c))),
                  }
                : null,
            rect:
              isObject(raw.selection.rect) &&
              typeof raw.selection.rect.minR === "number" &&
              typeof raw.selection.rect.minC === "number" &&
              typeof raw.selection.rect.maxR === "number" &&
              typeof raw.selection.rect.maxC === "number"
                ? {
                    minR: Math.max(0, Math.min(rows - 1, Math.floor(raw.selection.rect.minR))),
                    minC: Math.max(0, Math.min(cols - 1, Math.floor(raw.selection.rect.minC))),
                    maxR: Math.max(0, Math.min(rows - 1, Math.floor(raw.selection.rect.maxR))),
                    maxC: Math.max(0, Math.min(cols - 1, Math.floor(raw.selection.rect.maxC))),
                  }
                : null,
          }
        : {
            active: false,
            role: "source",
            anchor: null,
            focus: null,
            rect: null,
          },
    tileSource:
      isObject(raw.tileSource)
        ? {
            originR:
              typeof raw.tileSource.originR === "number"
                ? Math.max(0, Math.min(rows - 1, Math.floor(raw.tileSource.originR)))
                : 0,
            originC:
              typeof raw.tileSource.originC === "number"
                ? Math.max(0, Math.min(cols - 1, Math.floor(raw.tileSource.originC)))
                : 0,
            tileRows:
              typeof raw.tileSource.tileRows === "number"
                ? Math.max(1, Math.floor(raw.tileSource.tileRows))
                : 3,
            tileCols:
              typeof raw.tileSource.tileCols === "number"
                ? Math.max(1, Math.floor(raw.tileSource.tileCols))
                : 3,
            overwriteBlanks: !!raw.tileSource.overwriteBlanks,
            confirmed: !!raw.tileSource.confirmed,
          }
        : {
            originR: 0,
            originC: 0,
            tileRows: 3,
            tileCols: 3,
            overwriteBlanks: true,
            confirmed: false,
          },
    tileApply:
      isObject(raw.tileApply)
        ? {
            mode:
              raw.tileApply.mode === "up"
                ? "up"
                : raw.tileApply.mode === "dest"
                  ? "dest"
                  : "across",
            destRect:
              isObject(raw.tileApply.destRect) &&
              typeof raw.tileApply.destRect.minR === "number" &&
              typeof raw.tileApply.destRect.minC === "number" &&
              typeof raw.tileApply.destRect.maxR === "number" &&
              typeof raw.tileApply.destRect.maxC === "number"
                ? {
                    minR: Math.max(0, Math.min(rows - 1, Math.floor(raw.tileApply.destRect.minR))),
                    minC: Math.max(0, Math.min(cols - 1, Math.floor(raw.tileApply.destRect.minC))),
                    maxR: Math.max(0, Math.min(rows - 1, Math.floor(raw.tileApply.destRect.maxR))),
                    maxC: Math.max(0, Math.min(cols - 1, Math.floor(raw.tileApply.destRect.maxC))),
                  }
                : null,
          }
        : {
            mode: "across",
            destRect: null,
          },
  };
}

export async function readProjectFile(file: File): Promise<KnitProject> {
  const text = await file.text();
  return parseProjectJson(text);
}