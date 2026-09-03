import type { ReactNode } from "react";
import { getStitch, workedAs } from "../../stitches/stitches";
import StitchGlyph from "../../stitches/StitchGlyph";
import { stitchName } from "../../i18n/i18n";
import { useLanguage } from "../../i18n/useLanguage";
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
  useLanguage();

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
        const muted = stitch.id === "k";

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
            title={`${stitchName(stitch.id, stitch.name)} · ${stitch.consumes} in, ${stitch.produces} out`}
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
              color: muted ? "#c3cad3" : "#111827",
              outline: isCursor ? "2px solid #2563eb" : "none",
              outlineOffset: "-2px",
              userSelect: "none",
              cursor: "pointer",
            }}
          >
            <StitchGlyph stitch={stitch} color={muted ? "#c3cad3" : "#111827"} />
          </div>
        );
      });

      const rowFull = status.remaining <= 0 && row.cells.length > 0;
      const caret =
        isCurrentRow && !rowFull && state.cursor.index >= row.cells.length ? (
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

      // Ghosts stand in for the live stitches this row has still to work. They
      // give the row its full extent immediately, so the first stitch lands at
      // the right-hand end of where the row will sit rather than drifting in
      // from the middle under centre alignment.
      const ghostCount = isCurrentRow ? Math.max(0, status.remaining - (caret ? 1 : 0)) : 0;
      const ghosts = Array.from({ length: ghostCount }, (_, i) => (
        <div
          key={`ghost-${i}`}
          style={{
            width: CELL,
            height: CELL,
            border: "1px dotted #dfe3e8",
            boxSizing: "border-box",
          }}
        />
      ));

      // Stored in work order; the chart reads right to left, so the run is
      // reversed unless a wrong-side row is being followed on the needles.
      const ordered = rightSide
        ? [...ghosts, caret, ...cells.slice().reverse()]
        : [...cells, caret, ...ghosts];

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
                  : isCurrentRow
                    ? `${status.produced} sts · Enter`
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

  // When the current row is full, the next consuming stitch starts a row that
  // does not exist yet. Show where it will land rather than leaving the caret
  // dangling off the end of a finished row.
  const currentRow = state.rows[state.cursor.row];
  const currentStatus = rowStatus(state, state.cursor.row, true);
  const showPhantom =
    !!currentRow &&
    currentRow.cells.length > 0 &&
    currentStatus.remaining <= 0 &&
    state.cursor.row === state.rows.length - 1;

  const phantom = showPhantom ? (
    <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.7 }}>
      <div style={{ width: GUTTER, textAlign: "right", fontSize: 11, color: "#9ca3af" }}>
        next · {currentStatus.produced} sts
      </div>
      <div
        style={{
          width: canvas,
          display: "flex",
          justifyContent: justify,
          padding: 1,
          boxSizing: "border-box",
        }}
      >
        {Array.from({ length: Math.max(0, currentStatus.produced - 1) }, (_, i) => (
          <div
            key={i}
            style={{ width: CELL, height: CELL, border: "1px dotted #dfe3e8", boxSizing: "border-box" }}
          />
        ))}
        <div
          style={{
            width: CELL,
            height: CELL,
            border: "1px dashed #2563eb",
            background: "#eff6ff",
            boxSizing: "border-box",
          }}
        />
      </div>
      <div style={{ width: NUMBER_COL, fontSize: 11, color: "#9ca3af" }}>
        {state.rows.length + 1}
      </div>
    </div>
  ) : null;

  return (
    <div
      onContextMenu={(event) => event.preventDefault()}
      style={{ display: "grid", gap: 2, width: "fit-content" }}
    >
      {phantom}
      {rows}
      <div style={{ fontSize: 11, color: "#6b7280", paddingTop: 6, paddingLeft: GUTTER + 8 }}>
        cast on {state.castOn} · {state.rows.length} row
        {state.rows.length === 1 ? "" : "s"} · {state.knitMode}
        {tracking ? " · following" : ""}
      </div>
    </div>
  );
}
