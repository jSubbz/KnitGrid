/**
 * Written pattern export.
 *
 * Turns the chart into the prose a knitter actually reads - "Row 4: (k2, m1)
 * x6. (18 sts)" - rather than a grid of symbols. The chart holds unambiguous
 * per-cell truth, so this is the step where the ambiguity of written notation
 * gets reintroduced on purpose, in whichever convention is asked for.
 */
import { COMPOSITES, getStitch } from "../stitches/stitches";
import { compositeAbbr, stitchAbbr, tp } from "../i18n/i18n";
import { producedBy } from "./rowMath";
import type { KnitProject, PatternRow } from "./types";

export interface WrittenOptions {
  /**
   * Composite notation writes "kfb" and the paired lifted increases as single
   * tokens; bare notation writes the cells out separately, which is what the
   * chart actually stores.
   */
  composite: boolean;
}

/** Collapses adjacent cells that spell a named composite into that name. */
function applyComposites(ids: string[]): string[] {
  const out: string[] = [];
  let i = 0;

  while (i < ids.length) {
    const match = COMPOSITES.find((composite) =>
      composite.cells.every((cell, offset) => ids[i + offset] === cell)
    );
    if (match) {
      out.push(`::${match.abbr}`);
      i += match.cells.length;
    } else {
      out.push(ids[i]);
      i += 1;
    }
  }
  return out;
}

/**
 * Smallest repeating unit of a row, if it has one. This is what turns forty-two
 * tokens into "(k6, m1) x6" - the way the row was thought of in the first place.
 */
function findRepeat(tokens: string[]): { unit: string[]; times: number } | null {
  const n = tokens.length;
  if (n < 4) return null;

  for (let size = 1; size <= n / 2; size += 1) {
    if (n % size !== 0) continue;
    const unit = tokens.slice(0, size);
    const repeats = tokens.every((token, i) => token === unit[i % size]);
    if (repeats) return { unit, times: n / size };
  }
  return null;
}

/**
 * "k, k, k, p" becomes "k3, p1". Plain stitches always carry a count, because
 * that is how patterns are written; a shaping stitch does not, since "m1r1"
 * is not a thing anyone writes.
 */
function runLength(tokens: string[]): string {
  const parts: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    let run = 1;
    while (tokens[i + run] === tokens[i]) run += 1;
    const token = tokens[i];
    // Composites are marked so they resolve against the composite table rather
    // than being looked up as stitches that do not exist.
    if (token.startsWith("::")) {
      const abbr = compositeAbbr(token.slice(2));
      parts.push(run > 1 ? tp("countedStitch", { abbr, count: run }) : abbr);
      i += run;
      continue;
    }
    const stitch = getStitch(token);
    const abbr = stitchAbbr(token, stitch.abbr || token);
    const counted = run > 1 || stitch.category === "base";
    // Where the count sits differs by language: English writes k6, German
    // 6 M re. The locale supplies the shape, not just the words.
    parts.push(counted ? tp("countedStitch", { abbr, count: run }) : abbr);
    i += run;
  }
  return parts.join(tp("separator"));
}

export function rowInstruction(row: PatternRow, options: WrittenOptions): string {
  const ids = row.cells.map((cell) => cell.stitch);
  const tokens = options.composite ? applyComposites(ids) : ids;
  if (tokens.length === 0) return "-";

  // A repeat is only worth bracketing when the unit has more than one stitch
  // in it: six knits are "k6", not "(k) x6".
  const repeat = findRepeat(tokens);
  if (repeat && repeat.times > 1 && new Set(repeat.unit).size > 1) {
    return tp("repeat", { unit: runLength(repeat.unit), times: repeat.times });
  }
  return runLength(tokens);
}

export function toWrittenPattern(
  project: KnitProject,
  options: WrittenOptions = { composite: true }
): string {
  const lines: string[] = [];

  lines.push(tp("castOn", { count: project.castOn }));
  lines.push(tp(project.knitMode === "round" ? "workedRound" : "workedFlat"));
  lines.push("");

  project.rows.forEach((row, index) => {
    const label = tp(project.knitMode === "round" ? "round" : "row");
    const produced = producedBy(row);
    const turn = row.short ? ` ${tp("turn")}` : "";
    const count = tp("stitchCount", { count: produced });
    lines.push(
      `${label} ${index + 1}: ${rowInstruction(row, options)}.${turn} ${count}`
    );
  });

  if (project.notes.trim()) {
    lines.push("", tp("notesHeading"), "-----", project.notes.trim());
  }

  return lines.join("\n");
}
