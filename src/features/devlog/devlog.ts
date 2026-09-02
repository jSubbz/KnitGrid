/**
 * Session log.
 *
 * Records what was dispatched and what the chart looked like afterwards, so a
 * testing session can be handed over as a file instead of retyping symptoms.
 * Entries persist across reloads and can be annotated the moment something
 * looks wrong.
 */
import type { KnitProject } from "../project/types";
import { liveCountFor, rowStatus } from "../project/rowMath";

const STORAGE_KEY = "knitgrid.devlog.v1";
const MAX_ENTRIES = 500;

export interface LogEntry {
  at: string;
  kind: "action" | "note";
  action?: string;
  detail?: Record<string, unknown>;
  cursor?: { row: number; index: number };
  row?: {
    index: number;
    state: string;
    live: number;
    consumed: number;
    produced: number;
    cells: string[];
  };
  note?: string;
}

function load(): LogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LogEntry[]) : [];
  } catch {
    return [];
  }
}

let buffer: LogEntry[] = load();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buffer));
  } catch {
    // A full or unavailable store must never break charting.
  }
}

function push(entry: LogEntry) {
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) buffer = buffer.slice(-MAX_ENTRIES);
  persist();
}

function snapshot(project: KnitProject) {
  const index = project.cursor.row;
  const row = project.rows[index];
  const status = rowStatus(project, index, true);
  return {
    index,
    state: status.state,
    live: liveCountFor(project, index),
    consumed: status.consumed,
    produced: status.produced,
    cells: row ? row.cells.map((c) => c.stitch) : [],
  };
}

export function logAction(
  action: { type: string } & Record<string, unknown>,
  after: KnitProject
) {
  const { type, ...detail } = action;
  push({
    at: new Date().toISOString(),
    kind: "action",
    action: type,
    detail: Object.keys(detail).length ? detail : undefined,
    cursor: { ...after.cursor },
    row: snapshot(after),
  });
}

export function logNote(note: string, project?: KnitProject) {
  push({
    at: new Date().toISOString(),
    kind: "note",
    note,
    cursor: project ? { ...project.cursor } : undefined,
    row: project ? snapshot(project) : undefined,
  });
}

export function getLog(): LogEntry[] {
  return buffer;
}

export function clearLog() {
  buffer = [];
  persist();
}

export function serializeLog(project?: KnitProject): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      entries: buffer,
      finalProject: project ?? null,
    },
    null,
    2
  );
}

type SavePickerWindow = Window & {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    id?: string;
    startIn?: string;
    types?: Array<{ description: string; accept: Record<string, string[]> }>;
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: string) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};

/** Writes the log out as a file. Save it into the project folder to hand over. */
export async function saveLog(project?: KnitProject) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const name = `knitgrid-log-${stamp}.json`;
  const text = serializeLog(project);
  const win = window as SavePickerWindow;

  if (typeof win.showSaveFilePicker === "function") {
    const handle = await win.showSaveFilePicker({
      suggestedName: name,
      // The browser remembers the last directory used under this id, so once
      // a log has been saved into the project's logs folder the picker keeps
      // returning there.
      id: "knitgrid-logs",
      types: [
        { description: "KnitGrid session log", accept: { "application/json": [".json"] } },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
    return;
  }

  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}
