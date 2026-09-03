import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../features/workspace/state/WorkspaceContext";
import { getStitch, STITCH_LIST } from "../features/stitches/stitches";
import StitchGlyph from "../features/stitches/StitchGlyph";
import { stitchAbbr, stitchName, t } from "../features/i18n/i18n";
import { useLanguage } from "../features/i18n/useLanguage";
import { producedBy, widestRow } from "../features/project/rowMath";
import { rowInstruction, toWrittenPattern } from "../features/project/writtenPattern";

/** Usable width of a portrait page after margins, in millimetres. */
const PAGE_MM = 170;
/** CSS millimetres to pixels, so glyph sizes match the cells they sit in. */
const PX_PER_MM = 96 / 25.4;

export default function PrintPage() {
  const { state } = useWorkspace();
  const navigate = useNavigate();
  const [composite, setComposite] = useState(true);
  const [beside, setBeside] = useState(false);
  useLanguage();

  const written = useMemo(
    () => toWrittenPattern(state, { composite }),
    [state, composite]
  );

  const name = state.name || state.yarn.yarnName || "Untitled chart";

  // Fixed at mount so a long print job carries one consistent timestamp.
  const bar: React.CSSProperties = {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid #374151",
    background: "#1f2937",
    color: "#e5e7eb",
    cursor: "pointer",
    fontSize: 13,
  };

  const printedAt = useMemo(
    () =>
      new Date().toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    []
  );

  const downloadWritten = () => {
    const url = URL.createObjectURL(new Blob([written], { type: "text/plain" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${name.replace(/[^\w -]/g, "").trim() || "pattern"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const widest = widestRow(state);

  // Scale the cell to whatever makes the widest row fit the paper, within
  // limits: below about 3mm the symbols stop being readable, and above 7mm a
  // small chart looks like a poster.
  const cellMm = Math.max(3, Math.min(7, PAGE_MM / Math.max(widest, 1)));
  /** The key is read up close, so its swatches ignore the chart's scale. */
  const keyMm = Math.max(cellMm, 6);

  const used = useMemo(() => {
    const ids = new Set<string>();
    state.rows.forEach((row) => row.cells.forEach((cell) => ids.add(cell.stitch)));
    return STITCH_LIST.filter((stitch) => ids.has(stitch.id));
  }, [state.rows]);

  useEffect(() => {
    document.title = name;
    return () => {
      document.title = "KnitGrid";
    };
  }, [name]);

  const justify =
    state.anchor === "left" ? "flex-start" : state.anchor === "center" ? "center" : "flex-end";

  return (
    <>
      <style>{`
        /* The screen keeps the app's dark shell; paper is always black on
           white, and blank-is-knit, which is the printed chart convention the
           editor deliberately breaks with its grey k placeholder. */
        .print-sheet { background: #fff; color: #000; }
        .running-head, .running-foot {
          display: flex;
          justify-content: space-between;
          font-size: 2.6mm;
          color: #444;
        }
        .running-head { border-bottom: 0.2mm solid #999; padding-bottom: 1.5mm; margin-bottom: 4mm; }
        .running-foot { border-top: 0.2mm solid #999; padding-top: 1.5mm; margin-top: 6mm; }
        @media print {
          /* Space at top and bottom of every sheet for the running header and
             footer, which are fixed and so repeat on each page. */
          @page { size: portrait; margin: 18mm 15mm 16mm; }
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-sheet { box-shadow: none; margin: 0; padding: 0; width: auto; }
          /* Fixed so they repeat on every sheet, in the space @page reserves. */
          .running-head, .running-foot { position: fixed; left: 0; right: 0; margin: 0; }
          .running-head { top: -12mm; }
          .running-foot { bottom: -11mm; }
        }
      `}</style>

      <div
        className="no-print"
        style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}
      >
        <button type="button" style={bar} onClick={() => navigate("/workspace")}>
          Back to workspace
        </button>
        <button
          type="button"
          style={{ ...bar, background: "#1d4ed8", borderColor: "#1d4ed8", fontWeight: 600 }}
          onClick={() => window.print()}
        >
          Print
        </button>
        <button type="button" style={bar} onClick={downloadWritten}>
          Download only written instructions
        </button>
        <label
          style={{ alignSelf: "center", fontSize: 13, color: "#94a3b8" }}
          title="Write paired stitches as one token: k+lli as lli, kf+kb as kfb. Off writes each cell out separately."
        >
          <input
            type="checkbox"
            checked={composite}
            onChange={(event) => setComposite(event.target.checked)}
          />{" "}
          Shorthand
        </label>
        <label style={{ alignSelf: "center", fontSize: 13, color: "#94a3b8" }}>
          <input
            type="checkbox"
            checked={beside}
            onChange={(event) => setBeside(event.target.checked)}
          />{" "}
          instructions beside rows
        </label>
      </div>

      <div
        className="print-sheet"
        style={{ padding: "12mm", width: `${PAGE_MM + 24}mm`, boxSizing: "border-box" }}
      >
        <div className="running-head">
          <span>
            <strong>{name}</strong>
          </span>
          <span>KnitGrid</span>
        </div>

        <h1 style={{ margin: 0, fontSize: "5mm" }}>{name}</h1>
        <p style={{ margin: "2mm 0 0", fontSize: "3mm" }}>
          Cast on {state.castOn} · {state.rows.length} rows · worked{" "}
          {state.knitMode === "round" ? "in the round" : "flat"}
        </p>

        {/* The chart, bottom row last in the DOM so it prints the right way up. */}
        <div style={{ marginTop: "6mm", display: "grid", gap: 0 }}>
          {/* Instructions beside their row read bottom-up, since the chart
              does. Off by default until that turns out to be readable. */}
          {[...state.rows]
            .map((row, index) => {
              
              const produced = producedBy(row);
              return (
                <div
                  key={index}
                  style={{ display: "flex", alignItems: "center", gap: "2mm" }}
                >
                  <div
                    style={{
                      width: "14mm",
                      textAlign: "right",
                      fontSize: "2.6mm",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {produced} sts
                  </div>

                  <div
                    style={{
                      width: `${widest * cellMm}mm`,
                      display: "flex",
                      justifyContent: justify,
                    }}
                  >
                    {[...row.cells].reverse().map((cell, i) => {
                      const stitch = getStitch(cell.stitch);
                      return (
                        <div
                          key={i}
                          style={{
                            width: `${cellMm}mm`,
                            height: `${cellMm}mm`,
                            border: "0.2mm solid #000",
                            boxSizing: "border-box",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: `${cellMm * 0.6}mm`,
                          }}
                        >
                          {/* Knit prints blank, as printed charts do. */}
                          {stitch.id === "k" ? "" : (
                            <StitchGlyph stitch={stitch} size={cellMm * PX_PER_MM * 0.92} color="#000" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ width: "8mm", fontSize: "2.6mm" }}>
                    {index + 1}
                    {row.short ? "‹" : ""}
                  </div>

                  {beside && (
                    <div style={{ flex: 1, fontSize: "2.6mm", paddingLeft: "1mm" }}>
                      {rowInstruction(row, { composite })}
                      {row.short ? " Turn." : ""}
                    </div>
                  )}
                </div>
              );
            })
            .reverse()}
        </div>

        <div style={{ marginTop: "6mm", pageBreakInside: "avoid" }}>
          <h2 style={{ fontSize: "3.5mm", margin: "0 0 2mm" }}>{t("key")}</h2>
          <div style={{ display: "grid", gap: "1.5mm", fontSize: "3.2mm" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "2mm" }}>
              <span
                style={{
                  width: `${keyMm}mm`,
                  height: `${keyMm}mm`,
                  border: "0.2mm solid #000",
                  display: "inline-block",
                }}
              />
              <span>{t("blankIsKnit")}</span>
            </div>
            {used
              .filter((stitch) => stitch.id !== "k")
              .map((stitch) => (
                <div
                  key={stitch.id}
                  style={{ display: "flex", alignItems: "center", gap: "2mm" }}
                >
                  <span
                    style={{
                      width: `${keyMm}mm`,
                      height: `${keyMm}mm`,
                      border: "0.2mm solid #000",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <StitchGlyph stitch={stitch} size={keyMm * PX_PER_MM * 0.92} color="#000" />
                  </span>
                  <span>
                    {stitchAbbr(stitch.id, stitch.abbr)} - {stitchName(stitch.id, stitch.name)}
                  </span>
                </div>
              ))}
            {state.rows.some((row) => row.short) && (
              <div>‹ - {t("shortRowMark")}</div>
            )}
          </div>
        </div>

        <div
          style={{ marginTop: "6mm", pageBreakBefore: "always" }}
          hidden={beside}
        >
          <h2 style={{ fontSize: "3.5mm", margin: "0 0 2mm" }}>{t("written")}</h2>
          <pre
            style={{
              margin: 0,
              fontSize: "2.8mm",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
            }}
          >
            {written}
          </pre>
        </div>

        {(state.notes || state.yarn.yarnName || state.yarn.stitchesPerInch) && (
          <div style={{ marginTop: "6mm", fontSize: "2.8mm", pageBreakInside: "avoid" }}>
            <h2 style={{ fontSize: "3.5mm", margin: "0 0 2mm" }}>{t("notesHeading")}</h2>
            {state.yarn.yarnName && <div>Yarn: {state.yarn.yarnName}</div>}
            {state.yarn.stitchesPerInch && (
              <div>
                Gauge: {state.yarn.stitchesPerInch} sts
                {state.yarn.rowsPerInch ? ` / ${state.yarn.rowsPerInch} rows` : ""} per inch
              </div>
            )}
            {state.notes && <div style={{ whiteSpace: "pre-wrap" }}>{state.notes}</div>}
          </div>
        )}

        <div className="running-foot">
          <span>{printedAt}</span>
          <span>jsubbz.github.io/KnitGrid</span>
        </div>
      </div>
    </>
  );
}
