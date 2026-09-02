/**
 * The stitch table.
 *
 * The data itself lives in stitches.json so that other tools - notably the
 * textile eval harness, which is Python - can read exactly the same table
 * rather than reimplementing it. This module only types it and adds lookups.
 *
 * consumes = live stitches taken from the row below.
 * produces = stitches contributed to this row.
 * Those two numbers drive both the dynamic grid width and row validation.
 *
 * Charts record right-side appearance, so on a wrong-side row of flat knitting
 * the knitter works `wsCounterpart` instead. Entries with no counterpart are
 * unresearched rather than symmetric by default.
 */
import table from "./stitches.json";

export type StitchCategory = "base" | "increase" | "decrease" | "special";

/** Which way the stitch leans in the fabric. */
export type StitchLean = "left" | "right" | "center";

export interface StitchDef {
  id: string;
  abbr: string;
  name: string;
  glyph: string;
  consumes: number;
  produces: number;
  category: StitchCategory;
  lean?: StitchLean;
  wsCounterpart?: string;
}

export interface CompositeDef {
  abbr: string;
  name: string;
  cells: string[];
}

export const STITCH_LIST: StitchDef[] = table.stitches as StitchDef[];

export const COMPOSITES: CompositeDef[] = table.composites as CompositeDef[];

export const STITCHES: Record<string, StitchDef> = Object.fromEntries(
  STITCH_LIST.map((stitch) => [stitch.id, stitch])
);

export const NO_STITCH = "noStitch";
export const DEFAULT_STITCH = "k";

export function getStitch(id: string): StitchDef {
  return STITCHES[id] ?? STITCHES[NO_STITCH];
}

export function isKnownStitch(id: unknown): id is string {
  return typeof id === "string" && id in STITCHES;
}

/** Stitch worked in place of `id` on a wrong-side row of flat knitting. */
export function workedAs(id: string, rightSide: boolean): StitchDef {
  const stitch = getStitch(id);
  if (rightSide || !stitch.wsCounterpart) return stitch;
  return getStitch(stitch.wsCounterpart);
}

/**
 * Number-key palette for chart entry. The point of the workspace is that
 * charting should feel like typing a sentence, so the ten most-reached-for
 * stitches sit on the number row and the numpad. Intended to become
 * user-configurable from Settings.
 */
export const DEFAULT_PALETTE: string[] = [
  "k",     // 0
  "p",     // 1
  "k2tog", // 2
  "ssk",   // 3
  "m1l",   // 4
  "m1r",   // 5
  "yo",    // 6
  "lli",   // 7
  "rli",   // 8
  "sl",    // 9
];
