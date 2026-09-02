import type { ReactNode } from "react";
import { getStitch, workedAs } from "../../stitches/stitches";
import { liveCountFor, rowStatus, widestRow } from "../../project/rowMath";
import { useWorkspace } from "../state/WorkspaceContext";
import type { RowStatus } from "../../project/rowMath";

const CELL = 20;
const GUTTER = 96;
const NUMBER_COL = 40;

const STATE_COLOR: Record<RowStatus["state"], string> = {
  empty: "#9ca3af",
  inProgress: "#2563eb",
  complete: "#059669",
  short: "#b45309",
  overflow: "#b91c1c",
  underflow: "#c2410c",
};

export default function WorkspaceGrid() {
  const { state, dispatch } = useWorkspace();

  // The canvas is as wide as the widest row so every row anchors against a
  // fixed edge. Without this the first row grows the container as it is typed
  // and appears to build rightwards, unlike every row after it.
  const widest = widestRow(state);
  const canvas = widest * CELL + 2;

  const justify =
    state.anchor === "left"
      ? "flex-start"
      : state.anchor === "center"
        ? "center"
        : "flex-end";

  /** Wrong-side rows are only flipped while actually knitting, never at design time. */
  const tracking = state.workspaceMode === "track";

  const rows: ReactNode[] = state.rows
    .map((row, rowIndex) => {
      const isCurrentRow = state.cursor.row === rowIndex;
      const status = rowStatus(state, rowIndex, isCurrentRow);
      const live = liveCountFor(state, rowIndex);
      const rect = state.selection.rect;

      const rightSide = !tracking || state.knitMode === "round" || rowIndex % 2 === 0;

      const cells = row.cells.map((cell, index) => {
        const stitch = tracking ? workedAs(cell.stitch, rightSide) : getStitch(cell.stitch);
        const hasGlyph = stitch.glyph !== "";
        const glyph = hasGlyph ? stitch.glyph : stitch.id === "k" ? "k" : "";

        const isCursor = isCurrentRow && state.cursor.index === index;
        const isSelected =
          !!rect &&
          rowIndex >= rect.minRow &&
          rowIndex <= rect.maxRow &&
          index >= rect.minIndex &&
          index <= rect.maxIndex;

        return (
          <div
            key={index}
            title={`${stitch.name} · ${stitch.consumes} in, ${stitch.produces} out`}
            onMouseDown={(event) => {
              event.preventDefault();
              dispatch({ type: "SET_CURSOR", cursor: { row: rowIndex, index } });
            }}
            style={{
              width: CELL,
              height: CELL,
              border: "1px solid #cfcfcf",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              boxSizing: "border-box",
              background: isCursor ? "#dbeafe" : isSelected ? "#bfdbfe" : "#ffffff",
              color: hasGlyph ? "#111827" : "#c3cad3",
              outline: isCursor ? "2px solid #2563eb" : "none",
              outlineOffset: "-2px",
              userSelect: "none",
              cursor: "pointer",
            }}
          >
            {glyph}
          </div>
        );
      });

      const caret =
        isCurrentRow && state.cursor.index >= row.cells.length ? (
          <div
            key="caret"
            style={{
              width: CELL,
              height: CELL,
              border: "1px dashed #2563eb",
              background: "#eff6ff",
              boxSizing: "border-box",
            }}
          />
        ) : null;

      // Stored in work order; the chart reads right to left, so the run is
      // reversed unless a wrong-side row is being followed on the needles.
      const ordered = rightSide ? [caret, ...cells.slice().reverse()] : [...cells, caret];

      return (
        <div key={rowIndex} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: GUTTER,
              textAlign: "right",
              fontSize: 11,
              color: STATE_COLOR[status.state],
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {status.state === "overflow"
              ? `over by ${-status.remaining}`
              : status.state === "short"
                ? `short · ${status.produced} sts`
                : status.remaining > 0
                  ? `${status.remaining} of ${live} left`
                  : `${status.produced} sts`}
          </div>

          <div
            style={{
              width: canvas,
              display: "flex",
              justifyContent: justify,
              background: "#eef1f4",
              padding: 1,
              boxSizing: "border-box",
            }}
          >
            {ordered}
          </div>

          <div style={{ width: NUMBER_COL, fontSize: 11, color: "#6b7280" }}>
            {rowIndex + 1}
            {tracking && state.knitMode === "flat" && (
              <span style={{ color: "#9ca3af" }}> {rightSide ? "RS" : "WS"}</span>
            )}
          </div>
        </div>
      );
    })
    .reverse();

  return (
    <div
      onContextMenu={(event) => event.preventDefault()}
      style={{ display: "grid", gap: 2, width: "fit-content" }}
    >
      {rows}
      <div style={{ fontSize: 11, color: "#6b7280", paddingTop: 6, paddingLeft: GUTTER + 8 }}>
        cast on {state.castOn} · {state.rows.length} row
        {state.rows.length === 1 ? "" : "s"} · {state.knitMode}
        {tracking ? " · following" : ""}
      </div>
    </div>
  );
}
