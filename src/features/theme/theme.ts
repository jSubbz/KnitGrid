/**
 * Light and dark.
 *
 * "system" is the default and is not a third palette - it means no attribute,
 * which lets the media query in index.css decide. Choosing light or dark pins
 * the attribute instead, which is why the pinned rules have to come last in the
 * stylesheet.
 */
export type Theme = "system" | "light" | "dark";

export const THEMES: Theme[] = ["system", "light", "dark"];

const STORAGE_KEY = "knitgrid.theme.v1";

function load(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
  } catch {
    // Blocked storage just means the choice does not persist.
  }
  return "system";
}

let current: Theme = load();
const listeners = new Set<() => void>();

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

/** Called once at start-up, before the first paint. */
export function initTheme() {
  apply(current);
}

export function getTheme(): Theme {
  return current;
}

export function setTheme(theme: Theme) {
  current = theme;
  apply(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // As above.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeToTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getThemeSnapshot(): Theme {
  return current;
}
