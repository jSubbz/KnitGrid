import { useEffect, useRef, type ReactNode } from "react";
import type { PatternSymbol } from "../../project/types";
import { useWorkspace } from "../state/WorkspaceContext";

function symbolToText(symbol: PatternSymbol): string {
  switch (symbol) {
    case "empty":
      return "";
    case "dot":
      return "·";
    case "h":
      return "—";
    case "v":
      return "|";
    case "diagFwd":
      return "/";
    case "diagBack":
      return "\\";
    default:
      return "";
  }
}

export default function WorkspaceGrid() {
  const { state, dispatch } = useWorkspace();
  const dragModeRef = useRef<"add" | "remove" | null>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      dragModeRef.current = null;
    };

    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const applyShapeEdit = (r: number, c: number, value: boolean) => {
    dispatch({ type: "SET_SHAPE_CELL", r, c, value });
  };

  const cells: ReactNode[] = [];

  for (let r = 0; r < state.rows; r += 1) {
    for (let c = 0; c < state.cols; c += 1) {
      const isCursor = state.cursor.r === r && state.cursor.c === c;
      const inShape = state.shapeMask[r][c];
      const symbol = state.pattern[r][c].symbol;

      const rect = state.selection.rect;
      const isSelected =
        !!rect &&
        r >= rect.minR &&
        r <= rect.maxR &&
        c >= rect.minC &&
        c <= rect.maxC;

      const inCapturedMotif =
        state.tileSource.confirmed &&
        r >= state.tileSource.originR &&
        r < state.tileSource.originR + state.tileSource.tileRows &&
        c >= state.tileSource.originC &&
        c < state.tileSource.originC + state.tileSource.tileCols;

      const dest = state.tileApply.destRect;
      const inDestination =
        !!dest &&
        r >= dest.minR &&
        r <= dest.maxR &&
        c >= dest.minC &&
        c <= dest.maxC;

      cells.push(
        <div
          key={`${r}-${c}`}
          onMouseDown={(event) => {
            event.preventDefault();

            if (event.button === 2) {
              dragModeRef.current = "remove";
              applyShapeEdit(r, c, false);
              return;
            }

            if (event.button === 0) {
              dragModeRef.current = "add";
              applyShapeEdit(r, c, true);
            }
          }}
          onMouseEnter={() => {
            if (dragModeRef.current === "remove") {
              applyShapeEdit(r, c, false);
            }

            if (dragModeRef.current === "add") {
              applyShapeEdit(r, c, true);
            }
          }}
          onContextMenu={(event) => {
            event.preventDefault();
          }}
          style={{
            width: 20,
            height: 20,
            border: "1px solid #cfcfcf",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            boxSizing: "border-box",
            background: isCursor
              ? "#dbeafe"
              : isSelected
                ? "#bfdbfe"
                : inDestination
                  ? "#fed7aa"
                  : inCapturedMotif
                    ? "#d1fae5"
                    : inShape
                      ? "#ffffff"
                      : "#e5e7eb",
            color: "#111827",
            outline: isCursor
              ? "2px solid #2563eb"
              : inCapturedMotif
                ? "2px solid #10b981"
                : inDestination
                  ? "2px solid #f97316"
                  : "none",
            outlineOffset: "-2px",
            userSelect: "none",
            cursor: "crosshair",
          }}
        >
          {inShape ? symbolToText(symbol) : ""}
        </div>
      );
    }
  }

  return (
    <div
      onContextMenu={(event) => event.preventDefault()}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${state.cols}, 20px)`,
        gridTemplateRows: `repeat(${state.rows}, 20px)`,
        gap: 0,
        width: "fit-content",
        background: "#cfcfcf",
        padding: 1,
      }}
    >
      {cells}
    </div>
  );
}