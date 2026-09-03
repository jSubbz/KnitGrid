/**
 * The saved pattern file.
 *
 * One file that is both the thing a knitter reads and the thing KnitGrid can
 * open again. It is a self-contained HTML document - double-click to read or
 * print it, no app needed - with the project JSON embedded in a script block
 * that never renders. Loading reads that block back out.
 *
 * That means Save and Export are not two incompatible worlds: a pattern saved
 * for paper can still be reopened and edited, and a plain .json exported by a
 * friend loads through the same door.
 */
import { getStitch, STITCH_LIST } from "../stitches/stitches";
import { stitchAbbr, stitchName, t } from "../i18n/i18n";
import { producedBy, widestRow } from "./rowMath";
import { parseProjectJson, serializeProject } from "./storage";
import { toWrittenPattern } from "./writtenPattern";
import type { KnitProject } from "./types";

const DATA_ID = "knitgrid-project";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildPatternFile(project: KnitProject): string {
  const name = project.name || project.yarn.yarnName || "Untitled chart";
  const widest = widestRow(project);
  const cellMm = Math.max(3, Math.min(7, 170 / Math.max(widest, 1)));

  const used = STITCH_LIST.filter((stitch) =>
    project.rows.some((row) => row.cells.some((cell) => cell.stitch === stitch.id))
  );

  const chart = [...project.rows]
    .map((row, index) => {
      const cells = [...row.cells]
        .reverse()
        .map((cell) => {
          const stitch = getStitch(cell.stitch);
          const glyph = stitch.id === "k" ? "" : escapeHtml(stitchAbbr(stitch.id, stitch.abbr));
          return `<i>${glyph}</i>`;
        })
        .join("");
      return `<div class="row"><span class="n">${producedBy(row)} sts</span><span class="cells">${cells}</span><span class="n">${index + 1}${row.short ? "&lsaquo;" : ""}</span></div>`;
    })
    .reverse()
    .join("\n");

  const key = used
    .filter((stitch) => stitch.id !== "k")
    .map(
      (stitch) =>
        `<li><i>${escapeHtml(stitchAbbr(stitch.id, stitch.abbr))}</i> ${escapeHtml(stitchAbbr(stitch.id, stitch.abbr))} - ${escapeHtml(stitchName(stitch.id, stitch.name))}</li>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(name)}</title>
<style>
  body { font-family: system-ui, sans-serif; color: #000; background: #fff; margin: 15mm; }
  h1 { font-size: 5mm; margin: 0; }
  .meta { font-size: 3mm; margin: 2mm 0 6mm; color: #444; }
  .row { display: flex; align-items: center; gap: 2mm; }
  .n { font-size: 2.6mm; min-width: 12mm; text-align: right; font-variant-numeric: tabular-nums; }
  .cells { display: flex; }
  .cells i, li i {
    width: ${cellMm}mm; height: ${cellMm}mm; border: 0.2mm solid #000;
    box-sizing: border-box; display: inline-flex; align-items: center;
    justify-content: center; font-size: ${(cellMm * 0.5).toFixed(1)}mm; font-style: normal;
  }
  h2 { font-size: 3.5mm; margin: 6mm 0 2mm; }
  ul { list-style: none; padding: 0; margin: 0; font-size: 3mm; }
  li { display: flex; align-items: center; gap: 2mm; margin-bottom: 1.5mm; }
  pre { font-family: inherit; font-size: 3mm; line-height: 1.5; white-space: pre-wrap; margin: 0; }
  footer { margin-top: 8mm; padding-top: 2mm; border-top: 0.2mm solid #999; font-size: 2.6mm; color: #444; display: flex; justify-content: space-between; }
  @media print { body { margin: 0; } @page { margin: 15mm; } }
</style>
</head>
<body>
<h1>${escapeHtml(name)}</h1>
<p class="meta">Cast on ${project.castOn} &middot; ${project.rows.length} rows &middot; worked ${project.knitMode === "round" ? "in the round" : "flat"}</p>

${chart}

<h2>${escapeHtml(t("key"))}</h2>
<ul>
<li><i></i> ${escapeHtml(t("blankIsKnit"))}</li>
${key}
</ul>

<h2>${escapeHtml(t("written"))}</h2>
<pre>${escapeHtml(toWrittenPattern(project))}</pre>

<footer><span>KnitGrid</span><span>jsubbz.github.io/KnitGrid</span></footer>

<!-- KnitGrid keeps the editable project here. Open this file in KnitGrid to
     carry on working on it. -->
<script id="${DATA_ID}" type="application/json">
${serializeProject(project).replace(/<\//g, "<\\/")}
</script>
</body>
</html>
`;
}

/** Reads a saved pattern file or a plain exported JSON. */
export function readPatternFile(text: string): KnitProject {
  const trimmed = text.trimStart();

  if (trimmed.startsWith("{")) return parseProjectJson(text);

  const match = new RegExp(
    `<script id="${DATA_ID}"[^>]*>([\\s\\S]*?)</script>`
  ).exec(text);
  if (!match) {
    throw new Error(
      "That file has no KnitGrid pattern in it. Open a saved pattern or an exported JSON."
    );
  }
  return parseProjectJson(match[1].replace(/<\\\//g, "</"));
}
