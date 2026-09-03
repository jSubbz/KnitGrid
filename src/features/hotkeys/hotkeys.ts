/**
 * Keyboard bindings.
 *
 * Charting is meant to feel like typing a sentence, so the keyboard is the
 * primary interface and the toolbar is the discoverable copy of it. Everything
 * the workspace listens for is in this table and every entry can be changed.
 *
 * A binding is a comma-separated list, so one command can answer to more than
 * one key - erase is Backspace and Delete, because both mean the same thing to
 * the person pressing them. Selection is not listed separately: holding Shift
 * with a cursor key grows the selection instead of moving, whatever the cursor
 * keys have been rebound to.
 *
 * The number row is the exception. Which stitch each digit paints is the
 * stitch palette, which belongs in Settings, so it is described here rather
 * than bound here.
 */
export type HotkeyCommand =
  | "undo"
  | "redo"
  | "cursorLeft"
  | "cursorRight"
  | "cursorUp"
  | "cursorDown"
  | "fillRow"
  | "nextRow"
  | "turnWork"
  | "erase"
  | "captureMotif"
  | "setDestination";

export type HotkeyBindings = Record<HotkeyCommand, string>;

export const DEFAULT_HOTKEYS: HotkeyBindings = {
  undo: "Ctrl+Z",
  redo: "Ctrl+Y",
  cursorLeft: "ArrowLeft",
  cursorRight: "ArrowRight",
  cursorUp: "ArrowUp",
  cursorDown: "ArrowDown",
  fillRow: "Space",
  nextRow: "Enter",
  turnWork: "Shift+Enter",
  erase: "Backspace, Delete",
  captureMotif: "T",
  setDestination: "D",
};

export const HOTKEY_COMMANDS = Object.keys(DEFAULT_HOTKEYS) as HotkeyCommand[];

/** The cursor keys, in the order the workspace maps them to directions. */
export const CURSOR_COMMANDS = {
  cursorLeft: "left",
  cursorRight: "right",
  cursorUp: "up",
  cursorDown: "down",
} as const;

export type CursorCommand = keyof typeof CURSOR_COMMANDS;

const STORAGE_KEY = "knitgrid.hotkeys.v1";

function normalizeKeyName(key: string): string {
  if (key === " ") return "Space";
  if (key === "Esc") return "Escape";
  if (key.length === 1) return key.toUpperCase();
  return key;
}

/** One key with its modifiers, e.g. "Ctrl+Shift+Z". */
function normalizeOne(input: string): string {
  const parts = input
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  const modifiers = new Set<string>();
  let mainKey = "";

  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === "ctrl" || lower === "control") modifiers.add("Ctrl");
    else if (lower === "shift") modifiers.add("Shift");
    else if (lower === "alt") modifiers.add("Alt");
    else if (lower === "meta" || lower === "cmd" || lower === "command")
      modifiers.add("Meta");
    else mainKey = normalizeKeyName(part);
  }

  const ordered = ["Ctrl", "Meta", "Alt", "Shift"].filter((name) =>
    modifiers.has(name)
  );
  return [...ordered, mainKey].filter(Boolean).join("+");
}

/** A whole binding, which may list several keys. */
export function normalizeHotkeyString(input: string): string {
  return input
    .split(",")
    .map(normalizeOne)
    .filter(Boolean)
    .join(", ");
}

export function hotkeyKeys(binding: string): string[] {
  return binding
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function matchesHotkey(pressed: string, binding: string): boolean {
  return hotkeyKeys(binding).includes(pressed);
}

export function eventToHotkey(event: KeyboardEvent | React.KeyboardEvent): string {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.metaKey) parts.push("Meta");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  return [...parts, normalizeKeyName(event.key)].join("+");
}

/** Fills in defaults for anything missing or unreadable, one command at a time. */
export function normalizeBindings(input: Partial<HotkeyBindings>): HotkeyBindings {
  const out = {} as HotkeyBindings;
  for (const command of HOTKEY_COMMANDS) {
    out[command] =
      normalizeHotkeyString(input[command] ?? DEFAULT_HOTKEYS[command]) ||
      DEFAULT_HOTKEYS[command];
  }
  return out;
}

export function loadHotkeyBindings(): HotkeyBindings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_HOTKEYS;
    return normalizeBindings(JSON.parse(raw) as Partial<HotkeyBindings>);
  } catch {
    return DEFAULT_HOTKEYS;
  }
}

export function saveHotkeyBindings(bindings: HotkeyBindings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
  } catch {
    // A blocked store just means the bindings do not persist.
  }
}
