import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../features/workspace/state/WorkspaceContext";
import { getStitch, STITCH_LIST } from "../features/stitches/stitches";
import StitchGlyph from "../features/stitches/StitchGlyph";
import { liveCountFor, producedBy, widestRow } from "../features/project/rowMath";
import { toWrittenPattern } from "../features/project/writtenPattern";

/** Usable width of a portrait page after margins, in millimetres. */
const PAGE_MM = 170;

export default function PrintPage() {
  const { state, savedAs } = useWorkspace();
  const navigate = useNavigate();
  const [composite, setComposite] = useState(true);

  const written = useMemo(
    () => toWrittenPattern(state, { composite }),
    [state, composite]
  );

  const name = savedAs?.name ?? state.yarn.yarnName ?? "knitgrid-pattern";

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

  const used = useMemo(() => {
    const ids = new Set<string>();
    state.rows.forEach((row) => row.cells.forEach((cell) => ids.add(cell.stitch)));
    return STITCH_LIST.filter((stitch) => ids.has(stitch.id));
  }, [state.rows]);

  useEffect(() => {
    document.title = savedAs?.name ?? state.yarn.yarnName ?? "KnitGrid chart";
    return () => {
      document.title = "KnitGrid";
    };
  }, [savedAs, state.yarn.yarnName]);

  const justify =
    state.anchor === "left" ? "flex-start" : state.anchor === "center" ? "center" : "flex-end";

  return (
    <>
      <style>{`
        /* The screen keeps the app's dark shell; paper is always black on
           white, and blank-is-knit, which is the printed chart convention the
           editor deliberately breaks with its grey k placeholder. */
        .print-sheet { background: #fff; color: #000; }
        .print-only { display: none; }
        @media print {
          @page { size: portrait; margin: 15mm; }
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-only { display: block; }
          .print-sheet { box-shadow: none; margin: 0; padding: 0; width: auto; }
        }
      `}</style>

      <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button type="button" onClick={() => navigate("/workspace")}>
          Back to workspace
        </button>
        <button type="button" onClick={() => window.print()}>
          Print
        </button>
        <button type="button" onClick={downloadWritten}>
          Download written pattern
        </button>
        <label style={{ alignSelf: "center", fontSize: 13, color: "#94a3b8" }}>
          <input
            type="checkbox"
            checked={composite}
            onChange={(event) => setComposite(event.target.checked)}
          />{" "}
          kfb notation
        </label>
        <span style={{ alignSelf: "center", fontSize: 13, color: "#94a3b8" }}>
          {widest} stitches wide · {state.rows.length} rows · {cellMm.toFixed(1)}mm per stitch
        </span>
      </div>

      <div
        className="print-sheet"
        style={{ padding: "12mm", width: `${PAGE_MM + 24}mm`, boxSizing: "border-box" }}
      >
        <h1 style={{ margin: 0, fontSize: "5mm" }}>
          {savedAs?.name ?? state.yarn.yarnName ?? "Untitled chart"}
        </h1>
        <p style={{ margin: "2mm 0 0", fontSize: "3mm" }}>
          Cast on {state.castOn} · {state.rows.length} rows · worked{" "}
          {state.knitMode === "round" ? "in the round" : "flat"} · read bottom to
          top, right to left
        </p>

        {/* The chart, bottom row last in the DOM so it prints the right way up. */}
        <div style={{ marginTop: "6mm", display: "grid", gap: 0 }}>
          {[...state.rows]
            .map((row, index) => {
              const live = liveCountFor(state, index);
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
                            <StitchGlyph stitch={stitch} size={cellMm * 3.2} color="#000" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ width: "8mm", fontSize: "2.6mm" }}>
                    {index + 1}
                    {row.short ? "‹" : ""}
                    {live !== produced ? "" : ""}
                  </div>
                </div>
              );
            })
            .reverse()}
        </div>

        <div style={{ marginTop: "6mm", pageBreakInside: "avoid" }}>
          <h2 style={{ fontSize: "3.5mm", margin: "0 0 2mm" }}>Key</h2>
          <div style={{ display: "grid", gap: "1mm", fontSize: "2.8mm" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "2mm" }}>
              <span
                style={{
                  width: `${cellMm}mm`,
                  height: `${cellMm}mm`,
                  border: "0.2mm solid #000",
                  display: "inline-block",
                }}
              />
              <span>blank — knit</span>
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
                      width: `${cellMm}mm`,
                      height: `${cellMm}mm`,
                      border: "0.2mm solid #000",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <StitchGlyph stitch={stitch} size={cellMm * 3.2} color="#000" />
                  </span>
                  <span>
                    {stitch.abbr} — {stitch.name}
                  </span>
                </div>
              ))}
            {state.rows.some((row) => row.short) && (
              <div>‹ — short row, turned before the end</div>
            )}
          </div>
        </div>

        <div style={{ marginTop: "6mm", pageBreakBefore: "always" }}>
          <h2 style={{ fontSize: "3.5mm", margin: "0 0 2mm" }}>Written</h2>
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
            <h2 style={{ fontSize: "3.5mm", margin: "0 0 2mm" }}>Notes</h2>
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
      </div>
    </>
  );
}
