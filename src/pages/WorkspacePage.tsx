import { useEffect, useRef } from "react";
import WorkspaceGrid from "../features/workspace/components/WorkspaceGrid";
import { useWorkspace } from "../features/workspace/state/WorkspaceContext";
import type { PatternSymbol } from "../features/project/types";

function keyToSymbol(event: React.KeyboardEvent<HTMLDivElement>): PatternSymbol | null {
  if (event.key >= "0" && event.key <= "5") {
    switch (event.key) {
      case "0":
        return "empty";
      case "1":
        return "dot";
      case "2":
        return "h";
      case "3":
        return "v";
      case "4":
        return "diagFwd";
      case "5":
        return "diagBack";
      default:
        return null;
    }
  }

  switch (event.code) {
    case "Numpad0":
      return "empty";
    case "Numpad1":
      return "dot";
    case "Numpad2":
      return "h";
    case "Numpad3":
      return "v";
    case "Numpad4":
      return "diagFwd";
    case "Numpad5":
      return "diagBack";
    default:
      return null;
  }
}

const infoRows = [
  { name: "Add cells", description: "Add shape cells", hotkey: "Left-drag" },
  { name: "Remove cells", description: "Remove shape cells", hotkey: "Right-drag" },
  { name: "Paint", description: "Paint and advance", hotkey: "0–5 / Num 0–5" },
  { name: "Erase", description: "Back up and clear", hotkey: "Del / Backspace" },
  { name: "Next row", description: "Jump to row start above", hotkey: "Enter" },
  { name: "Move cursor", description: "Move current cursor", hotkey: "Arrow keys" },
  { name: "Select box", description: "Make selection rectangle", hotkey: "Shift + arrows" },
  { name: "Capture motif", description: "Store selected motif", hotkey: "T" },
  { name: "Set destination", description: "Store selected destination", hotkey: "D" },
  { name: "Tile across", description: "Fill leftward", hotkey: "Button" },
  { name: "Tile up", description: "Fill upward", hotkey: "Button" },
  { name: "Tile destination", description: "Fill destination box", hotkey: "Button" },
];

export default function WorkspacePage() {
  const { state, dispatch, canUndo, canRedo } = useWorkspace();
  const gridWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gridWrapRef.current?.focus();
  }, []);

  const handleTileAcross = () => {
    if (!state.tileSource.confirmed) {
      return;
    }

    const widthToLeftEdge = state.tileSource.originC + state.tileSource.tileCols;
    const remainder = widthToLeftEdge % state.tileSource.tileCols;

    if (remainder === 0) {
      dispatch({ type: "TILE_ACROSS", strategy: "partial" });
      return;
    }

    const usePartial = window.confirm(
      "Tile width is not an exact multiple of the motif width.\n\nPress OK for partial fill.\nPress Cancel for truncate."
    );

    dispatch({
      type: "TILE_ACROSS",
      strategy: usePartial ? "partial" : "truncate",
    });
  };

  const handleTileUp = () => {
    if (!state.tileSource.confirmed) {
      return;
    }

    const heightToTop = state.tileSource.originR + state.tileSource.tileRows;
    const remainder = heightToTop % state.tileSource.tileRows;

    if (remainder === 0) {
      dispatch({ type: "TILE_UP", strategy: "partial" });
      return;
    }

    const usePartial = window.confirm(
      "Tile height is not an exact multiple of the motif height.\n\nPress OK for partial fill.\nPress Cancel for truncate."
    );

    dispatch({
      type: "TILE_UP",
      strategy: usePartial ? "partial" : "truncate",
    });
  };

  const handleTileDestination = () => {
    if (!state.tileSource.confirmed || !state.tileApply.destRect) {
      return;
    }

    const destRows =
      state.tileApply.destRect.maxR - state.tileApply.destRect.minR + 1;
    const destCols =
      state.tileApply.destRect.maxC - state.tileApply.destRect.minC + 1;

    const rowRemainder = destRows % state.tileSource.tileRows;
    const colRemainder = destCols % state.tileSource.tileCols;

    if (rowRemainder === 0 && colRemainder === 0) {
      dispatch({ type: "TILE_DESTINATION", strategy: "partial" });
      return;
    }

    const usePartial = window.confirm(
      "Destination box is not an exact multiple of the motif size.\n\nPress OK for partial fill.\nPress Cancel for truncate."
    );

    dispatch({
      type: "TILE_DESTINATION",
      strategy: usePartial ? "partial" : "truncate",
    });
  };

  return (
    <main style={{ padding: 24, display: "grid", gap: 16 }}>
      <h1>Workspace</h1>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => dispatch({ type: "UNDO" })} disabled={!canUndo}>
          Undo
        </button>
        <button type="button" onClick={() => dispatch({ type: "REDO" })} disabled={!canRedo}>
          Redo
        </button>
        <button type="button" onClick={() => dispatch({ type: "TOGGLE_MIRROR_X" })}>
          Mirror X: {state.mirrorX ? "On" : "Off"}
        </button>
        <button type="button" onClick={() => dispatch({ type: "TOGGLE_MIRROR_Y" })}>
          Mirror Y: {state.mirrorY ? "On" : "Off"}
        </button>
        <button type="button" onClick={() => dispatch({ type: "ADD_COL" })}>
          + Col
        </button>
        <button type="button" onClick={() => dispatch({ type: "REMOVE_COL" })}>
          - Col
        </button>
        <button type="button" onClick={() => dispatch({ type: "ADD_ROW" })}>
          + Row
        </button>
        <button type="button" onClick={() => dispatch({ type: "REMOVE_ROW" })}>
          - Row
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => dispatch({ type: "CLEAR_SELECTION" })}>
          Clear Selection
        </button>
        <button type="button" onClick={() => dispatch({ type: "CAPTURE_MOTIF" })}>
          Capture Motif
        </button>
        <button type="button" onClick={() => dispatch({ type: "SET_DESTINATION_FROM_SELECTION" })}>
          Set Destination
        </button>
        <button type="button" onClick={() => dispatch({ type: "CLEAR_DESTINATION" })}>
          Clear Destination
        </button>
        <button
          type="button"
          onClick={handleTileAcross}
          disabled={!state.tileSource.confirmed}
        >
          Tile Across
        </button>
        <button
          type="button"
          onClick={handleTileUp}
          disabled={!state.tileSource.confirmed}
        >
          Tile Up
        </button>
        <button
          type="button"
          onClick={handleTileDestination}
          disabled={!state.tileSource.confirmed || !state.tileApply.destRect}
        >
          Tile Destination
        </button>
      </div>

      <p>
        Grid: {state.cols} × {state.rows}
      </p>
      <p>
        Cursor display position: row {state.rows - state.cursor.r}, col {state.cols - state.cursor.c}
      </p>
      <p>
        Motif:{" "}
        {state.tileSource.confirmed
          ? `${state.tileSource.tileCols} × ${state.tileSource.tileRows} captured`
          : "not captured"}
      </p>
      <p>
        Destination:{" "}
        {state.tileApply.destRect
          ? `${state.tileApply.destRect.maxC - state.tileApply.destRect.minC + 1} × ${
              state.tileApply.destRect.maxR - state.tileApply.destRect.minR + 1
            } set`
          : "not set"}
      </p>

      <div
        ref={gridWrapRef}
        tabIndex={0}
        onMouseDownCapture={() => {
          gridWrapRef.current?.focus();
        }}
        onKeyDown={(event) => {
          const symbol = keyToSymbol(event);

          const shouldExitMirrorMode =
            !!symbol ||
            event.key === "Backspace" ||
            event.key === "Delete" ||
            event.key === "Enter";

          if (shouldExitMirrorMode && (state.mirrorX || state.mirrorY)) {
            dispatch({ type: "CLEAR_MIRRORS" });
          }

          if (event.shiftKey && event.key === "ArrowLeft") {
            event.preventDefault();
            dispatch({ type: "EXTEND_SELECTION", dir: "left" });
            return;
          }

          if (event.shiftKey && event.key === "ArrowRight") {
            event.preventDefault();
            dispatch({ type: "EXTEND_SELECTION", dir: "right" });
            return;
          }

          if (event.shiftKey && event.key === "ArrowUp") {
            event.preventDefault();
            dispatch({ type: "EXTEND_SELECTION", dir: "up" });
            return;
          }

          if (event.shiftKey && event.key === "ArrowDown") {
            event.preventDefault();
            dispatch({ type: "EXTEND_SELECTION", dir: "down" });
            return;
          }

          if (event.key === "t" || event.key === "T") {
            event.preventDefault();
            dispatch({ type: "CAPTURE_MOTIF" });
            return;
          }

          if (event.key === "d" || event.key === "D") {
            event.preventDefault();
            dispatch({ type: "SET_DESTINATION_FROM_SELECTION" });
            return;
          }

          if (symbol) {
            event.preventDefault();
            dispatch({ type: "PAINT_AND_ADVANCE", symbol });
            return;
          }

          if (event.key === "Backspace" || event.key === "Delete") {
            event.preventDefault();
            dispatch({ type: "ERASE_AND_BACKSPACE" });
            return;
          }

          if (event.key === "ArrowLeft") {
            event.preventDefault();
            dispatch({ type: "MOVE_CURSOR", dir: "left" });
            return;
          }

          if (event.key === "ArrowRight") {
            event.preventDefault();
            dispatch({ type: "MOVE_CURSOR", dir: "right" });
            return;
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            dispatch({ type: "MOVE_CURSOR", dir: "up" });
            return;
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            dispatch({ type: "MOVE_CURSOR", dir: "down" });
            return;
          }

          if (event.key === "Enter") {
            event.preventDefault();
            dispatch({ type: "NEXT_ROW_START" });
          }
        }}
        style={{
          width: "fit-content",
          border: "1px solid #374151",
          padding: 12,
          borderRadius: 8,
          background: "#111827",
          outline: "none",
        }}
      >
        <WorkspaceGrid />
      </div>

      <section
        style={{
          border: "1px solid #374151",
          borderRadius: 8,
          overflow: "hidden",
          background: "#111827",
          color: "#e5e7eb",
          maxWidth: 960,
          fontSize: 14,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "170px 1fr 170px",
            background: "#1f2937",
            fontWeight: 600,
            borderBottom: "1px solid #374151",
          }}
        >
          <div style={{ padding: "8px 10px" }}>Action</div>
          <div style={{ padding: "8px 10px" }}>Description</div>
          <div style={{ padding: "8px 10px" }}>Hotkey</div>
        </div>

        {infoRows.map((row, index) => (
          <div
            key={row.name}
            style={{
              display: "grid",
              gridTemplateColumns: "170px 1fr 170px",
              borderBottom: index === infoRows.length - 1 ? "none" : "1px solid #1f2937",
              textAlign: "left",
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ padding: "8px 10px", color: "#f9fafb", fontWeight: 500 }}>
              {row.name}
            </div>
            <div style={{ padding: "8px 10px", color: "#d1d5db", overflow: "hidden", textOverflow: "ellipsis" }}>
              {row.description}
            </div>
            <div style={{ padding: "8px 10px", fontFamily: "monospace", color: "#93c5fd" }}>
              {row.hotkey}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}