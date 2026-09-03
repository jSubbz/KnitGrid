/**
 * Crash protection, and nothing else.
 *
 * The working chart is written to sessionStorage on every change so a reload
 * or an accidental navigation does not lose it. sessionStorage rather than
 * localStorage on purpose: it dies with the tab, which is exactly the intended
 * lifetime. Opening KnitGrid gives a new design; a reload mid-session does not.
 *
 * There is deliberately no saved-pattern manager here. A browser store is not
 * somewhere a knitter's work should live, and offering one invites people to
 * trust it. Saving a pattern means printing it or exporting the JSON.
 *
 * Rows are stored as a space-joined string of stitch ids rather than an array
 * of objects - a 128-stitch row is about 250 bytes that way against roughly a
 * kilobyte as `[{"stitch":"k"}, ...]`.
 */
import { parseProjectJson } from "./storage";
import type { KnitProject, PatternRow } from "./types";

const WORKING_KEY = "knitgrid.working.v2";

type CompactRow = { c: string; s?: 1; n?: string };

function encode(project: KnitProject): string {
  const rows: CompactRow[] = project.rows.map((row) => {
    const compact: CompactRow = { c: row.cells.map((cell) => cell.stitch).join(" ") };
    if (row.short) compact.s = 1;
    if (row.note) compact.n = row.note;
    return compact;
  });
  return JSON.stringify({ ...project, rows });
}

function decode(text: string): KnitProject {
  const raw = JSON.parse(text) as Record<string, unknown>;
  const rows: PatternRow[] = Array.isArray(raw.rows)
    ? (raw.rows as CompactRow[]).map((row) => ({
        cells: (row.c ?? "").split(" ").filter(Boolean).map((stitch) => ({ stitch })),
        short: row.s === 1,
        note: row.n ?? "",
      }))
    : [];
  // Through the same parser an opened file uses, so restored work gets
  // identical validation, clamping and version migration.
  return parseProjectJson(JSON.stringify({ ...raw, rows }));
}

/**
 * Called on every change, so it must never throw: a full or unavailable store
 * should quietly stop protecting rather than break charting.
 */
export function saveWorking(project: KnitProject) {
  try {
    sessionStorage.setItem(WORKING_KEY, encode(project));
  } catch {
    // Nothing to do. The chart is still on screen.
  }
}

export function loadWorking(): KnitProject | null {
  try {
    const raw = sessionStorage.getItem(WORKING_KEY);
    return raw ? decode(raw) : null;
  } catch {
    return null;
  }
}

export function clearWorking() {
  try {
    sessionStorage.removeItem(WORKING_KEY);
  } catch {
    // Nothing to do.
  }
}
