/**
 * Language.
 *
 * Stitch notation is part of the language, not just the interface. `k2tog` is
 * English; German knitters write `2 re zus` and French `2 m ens`. So a locale
 * carries three things: interface strings, sentence templates for the written
 * pattern, and its own abbreviation and name for every stitch.
 *
 * The stitch table itself stays language-neutral - consumes, produces and lean
 * are facts about the fabric. That is also why a saved pattern is portable: it
 * stores stitch ids, so it renders in whatever language the reader has set.
 *
 * Anything a locale has not translated falls back to English, so a partial
 * translation is usable rather than broken.
 */
import en from "./locales/en.json";
import de from "./locales/de.json";
import fr from "./locales/fr.json";

export interface LocaleStitch {
  abbr: string;
  name: string;
}

export interface Locale {
  code: string;
  name: string;
  /** False until a speaker has checked it. Shown in the language menu. */
  reviewed: boolean;
  ui: Record<string, string>;
  pattern: Record<string, string>;
  /** Null where a stitch has nothing to translate, e.g. the blank no-stitch cell. */
  stitches: Record<string, LocaleStitch | null>;
  composites: Record<string, string>;
}

const LOCALES: Record<string, Locale> = {
  en: en as Locale,
  de: de as Locale,
  fr: fr as Locale,
};

export const LOCALE_LIST: Locale[] = Object.values(LOCALES);

const STORAGE_KEY = "knitgrid.language.v1";
const FALLBACK = "en";

let current = load();

function load(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in LOCALES) return saved;
    const preferred = navigator.languages?.map((tag) => tag.split("-")[0]) ?? [];
    return preferred.find((code) => code in LOCALES) ?? FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export function getLanguage(): string {
  return current;
}

export function setLanguage(code: string) {
  if (!(code in LOCALES)) return;
  current = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // A blocked store just means the choice does not persist.
  }
  listeners.forEach((listener) => listener());
}

function fill(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole
  );
}

/** Interface string. */
export function t(key: string, values?: Record<string, string | number>): string {
  const value = LOCALES[current]?.ui[key] ?? LOCALES[FALLBACK].ui[key] ?? key;
  return fill(value, values);
}

/** Written-pattern sentence template. */
export function tp(key: string, values?: Record<string, string | number>): string {
  const value =
    LOCALES[current]?.pattern[key] ?? LOCALES[FALLBACK].pattern[key] ?? key;
  return fill(value, values);
}

/** Abbreviation for a stitch in the current language. */
export function stitchAbbr(id: string, fallback: string): string {
  const stitches = LOCALES[current]?.stitches;
  if (stitches && id in stitches) return stitches[id]?.abbr ?? "";
  return fallback;
}

/** Full name for a stitch in the current language. */
export function stitchName(id: string, fallback: string): string {
  const stitches = LOCALES[current]?.stitches;
  if (stitches && id in stitches) return stitches[id]?.name ?? "";
  return fallback;
}

/** Written-notation name for a composite, e.g. kfb. */
export function compositeAbbr(abbr: string): string {
  return LOCALES[current]?.composites[abbr] ?? abbr;
}

/** Stitches this locale has not translated yet, for the review screen. */
export function untranslatedStitches(code: string, ids: string[]): string[] {
  const locale = LOCALES[code];
  if (!locale) return ids;
  return ids.filter((id) => !(id in locale.stitches));
}

// -- change notification ----------------------------------------------------

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export { subscribe as subscribeToLanguage };

export function getLanguageSnapshot(): string {
  return current;
}
