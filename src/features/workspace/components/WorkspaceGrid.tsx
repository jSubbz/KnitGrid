import type { ReactNode } from "react";
import { getStitch } from "../../stitches/stitches";
import { liveCountFor, rowStatus } from "../../project/rowMath";
import { useWorkspace } from "../state/WorkspaceContext";
import type { RowStatus } from "../../project/rowMath";

const CELL = 20;

const STATE_COLOR: Record<RowStatus["state"], string> = {
  empty: "#6b7280",
  inProgress: "#93c5fd",
  complete: "#6ee7b7",
  short: "#fcd34d",
  overflow: "#fca5a5",
  underflow: "#fdba74",
};

export default function WorkspaceGrid() {
  const { state, dispatch } = useWorkspace();

  const justify =
    state.anchor === "left"
      ? "flex-start"
      : state.anchor === "center"
        ? "center"
        : "flex-end";

  // Stored bottom-up and right-to-left in work order; flipped here so the chart
  // reads the way the knitter sees it.
  const rows: ReactNode[] = state.rows
    .map((row, rowIndex) => {
      const isCurrentRow = state.cursor.row === rowIndex;
      const status = rowStatus(state, rowIndex, isCurrentRow);
      const live = liveCountFor(state, rowIndex);
      const rect = state.selection.rect;

      const cells = row.cells
        .map((cell, index) => {
          const stitch = getStitch(cell.stitch);
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
        })
        .reverse();

      // The caret sits past the last stitch while a row is still being worked.
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

      return (
        <div
          key={rowIndex}
          style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: justify }}
        >
          <div
            style={{
              minWidth: 96,
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

          <div style={{ display: "flex", background: "#cfcfcf", padding: 1 }}>
            {caret}
            {cells}
          </div>

          <div style={{ minWidth: 40, fontSize: 11, color: "#6b7280" }}>
            {rowIndex + 1}
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
      <div style={{ fontSize: 11, color: "#6b7280", paddingTop: 6 }}>
        cast on {state.castOn} · {state.rows.length} row
        {state.rows.length === 1 ? "" : "s"} · {state.knitMode}
      </div>
    </div>
  );
}
