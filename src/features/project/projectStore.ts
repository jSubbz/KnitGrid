/**
 * Saved projects.
 *
 * Two separate things live in browser storage and they are not the same:
 *
 *   - the working project, saved continuously so that closing the tab or
 *     reloading the page does not lose an afternoon's charting
 *   - a library of named saves the knitter made on purpose
 *
 * Rows are stored as a space-joined string of stitch ids rather than an array
 * of objects. A 128-stitch row is about 250 bytes that way against roughly a
 * kilobyte as `[{"stitch":"k"}, ...]`, which matters because localStorage is
 * only a few megabytes and a long piece is thousands of rows.
 */
import { createProject } from "./projectFactory";
import { parseProjectJson, serializeProject } from "./storage";
import type { KnitProject, PatternRow } from "./types";

const INDEX_KEY = "knitgrid.library.v1";
const PROJECT_PREFIX = "knitgrid.project.";
const WORKING_KEY = "knitgrid.working.v1";

export interface SavedProjectMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  /** Shown in the library list without having to load the whole project. */
  rows: number;
  castOn: number;
}

export class StorageFullError extends Error {
  constructor() {
    super("Browser storage is full. Delete a saved project, or save to a file.");
    this.name = "StorageFullError";
  }
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

// -- compact form ----------------------------------------------------------

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
        cells: (row.c ?? "")
          .split(" ")
          .filter(Boolean)
          .map((stitch) => ({ stitch })),
        short: row.s === 1,
        note: row.n ?? "",
      }))
    : [];
  // Round-trip through the file parser so stored projects get the same
  // validation, clamping and version migration that opened files do.
  return parseProjectJson(JSON.stringify({ ...raw, rows }));
}

// -- the library -----------------------------------------------------------

export function listProjects(): SavedProjectMeta[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as SavedProjectMeta[]).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
  } catch {
    return [];
  }
}

function writeIndex(entries: SavedProjectMeta[]) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(entries));
}

export function loadProject(id: string): KnitProject | null {
  try {
    const raw = localStorage.getItem(PROJECT_PREFIX + id);
    return raw ? decode(raw) : null;
  } catch {
    return null;
  }
}

/** Saves under an existing id, or creates a new entry when none is given. */
export function saveProject(
  project: KnitProject,
  name: string,
  id?: string
): SavedProjectMeta {
  const now = new Date().toISOString();
  const entries = listProjects();
  const existing = id ? entries.find((entry) => entry.id === id) : undefined;

  const meta: SavedProjectMeta = {
    id: existing?.id ?? id ?? newId(),
    name: name.trim() || "Untitled",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    rows: project.rows.length,
    castOn: project.castOn,
  };

  try {
    localStorage.setItem(PROJECT_PREFIX + meta.id, encode(project));
  } catch (error) {
    if (isQuotaError(error)) throw new StorageFullError();
    throw error;
  }

  writeIndex([meta, ...entries.filter((entry) => entry.id !== meta.id)]);
  return meta;
}

export function renameProject(id: string, name: string) {
  writeIndex(
    listProjects().map((entry) =>
      entry.id === id
        ? { ...entry, name: name.trim() || entry.name, updatedAt: new Date().toISOString() }
        : entry
    )
  );
}

export function deleteProject(id: string) {
  localStorage.removeItem(PROJECT_PREFIX + id);
  writeIndex(listProjects().filter((entry) => entry.id !== id));
}

// -- the working project ---------------------------------------------------

export interface WorkingState {
  project: KnitProject;
  /** Set when the working project came from a library entry. */
  savedAs?: { id: string; name: string };
}

/**
 * Called on every change, so it must never throw: a full store should stop
 * autosaving quietly rather than break charting. Explicit saves do report it.
 */
export function saveWorking(state: WorkingState) {
  try {
    localStorage.setItem(
      WORKING_KEY,
      JSON.stringify({ savedAs: state.savedAs, project: JSON.parse(encode(state.project)) })
    );
  } catch {
    // Out of room, or storage unavailable. Nothing to do here.
  }
}

export function loadWorking(): WorkingState | null {
  try {
    const raw = localStorage.getItem(WORKING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAs?: { id: string; name: string }; project: unknown };
    if (!parsed.project) return null;
    return { project: decode(JSON.stringify(parsed.project)), savedAs: parsed.savedAs };
  } catch {
    return null;
  }
}

export function clearWorking() {
  try {
    localStorage.removeItem(WORKING_KEY);
  } catch {
    // Nothing to do.
  }
}

/** Rough share of the storage budget in use, for warning before it runs out. */
export function storageUsedBytes(): number {
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith("knitgrid.")) continue;
      total += key.length + (localStorage.getItem(key)?.length ?? 0);
    }
  } catch {
    return 0;
  }
  return total * 2; // UTF-16 code units
}

export { createProject, serializeProject };
