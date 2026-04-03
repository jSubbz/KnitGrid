export type HotkeyCommand =
  | "undo"
  | "redo"
  | "captureMotif"
  | "setDestination"
  | "nextRow";

export type HotkeyBindings = Record<HotkeyCommand, string>;

export const DEFAULT_HOTKEYS: HotkeyBindings = {
  undo: "Ctrl+Z",
  redo: "Ctrl+Y",
  captureMotif: "T",
  setDestination: "D",
  nextRow: "Enter",
};

const STORAGE_KEY = "knitgrid.hotkeys.v1";

function normalizeKeyName(key: string): string {
  if (key === " ") return "Space";
  if (key === "Esc") return "Escape";
  if (key.length === 1) return key.toUpperCase();
  return key;
}

export function normalizeHotkeyString(input: string): string {
  const raw = input.trim();
  if (!raw) return "";

  const parts = raw
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  const modifiers = new Set<string>();
  let mainKey = "";

  for (const part of parts) {
    const lower = part.toLowerCase();

    if (lower === "ctrl" || lower === "control") {
      modifiers.add("Ctrl");
      continue;
    }

    if (lower === "shift") {
      modifiers.add("Shift");
      continue;
    }

    if (lower === "alt") {
      modifiers.add("Alt");
      continue;
    }

    if (lower === "meta" || lower === "cmd" || lower === "command") {
      modifiers.add("Meta");
      continue;
    }

    mainKey = normalizeKeyName(part);
  }

  const orderedModifiers = ["Ctrl", "Meta", "Alt", "Shift"].filter((name) =>
    modifiers.has(name)
  );

  return [...orderedModifiers, mainKey].filter(Boolean).join("+");
}

export function eventToHotkey(event: KeyboardEvent | React.KeyboardEvent): string {
  const parts: string[] = [];

  if (event.ctrlKey) parts.push("Ctrl");
  if (event.metaKey) parts.push("Meta");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");

  let key = event.key;
  key = normalizeKeyName(key);

  return [...parts, key].join("+");
}

export function loadHotkeyBindings(): HotkeyBindings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_HOTKEYS;

    const parsed = JSON.parse(raw) as Partial<HotkeyBindings>;
    return {
      undo: normalizeHotkeyString(parsed.undo ?? DEFAULT_HOTKEYS.undo) || DEFAULT_HOTKEYS.undo,
      redo: normalizeHotkeyString(parsed.redo ?? DEFAULT_HOTKEYS.redo) || DEFAULT_HOTKEYS.redo,
      captureMotif:
        normalizeHotkeyString(parsed.captureMotif ?? DEFAULT_HOTKEYS.captureMotif) ||
        DEFAULT_HOTKEYS.captureMotif,
      setDestination:
        normalizeHotkeyString(parsed.setDestination ?? DEFAULT_HOTKEYS.setDestination) ||
        DEFAULT_HOTKEYS.setDestination,
      nextRow:
        normalizeHotkeyString(parsed.nextRow ?? DEFAULT_HOTKEYS.nextRow) ||
        DEFAULT_HOTKEYS.nextRow,
    };
  } catch {
    return DEFAULT_HOTKEYS;
  }
}

export function saveHotkeyBindings(bindings: HotkeyBindings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
}