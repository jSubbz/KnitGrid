import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceGrid from "../features/workspace/components/WorkspaceGrid";
import { useWorkspace } from "../features/workspace/state/WorkspaceContext";
import { DEFAULT_PALETTE, getStitch } from "../features/stitches/stitches";
import { liveCountFor, paintOutcome, rowStatus } from "../features/project/rowMath";
import { eventToHotkey, loadHotkeyBindings } from "../features/hotkeys/hotkeys";
import type { RowAnchor } from "../features/project/types";
import { clearLog, getLog, logNote, saveLog } from "../features/devlog/devlog";

/**
 * Reads a stitch off the number row or the numpad. Matching on `code` as well
 * as `key` keeps the numpad working with NumLock off, where the digits report
 * themselves as arrow keys, and keeps Shift+digit working, where they report
 * themselves as punctuation.
 */
function keyToStitch(event: React.KeyboardEvent<HTMLDivElement>): string | null {
  const digit = /^(Digit|Numpad)[0-9]$/.test(event.code)
    ? Number(event.code.slice(-1))
    : event.key >= "0" && event.key <= "9"
      ? Number(event.key)
      : null;

  if (digit === null) return null;
  return DEFAULT_PALETTE[digit] ?? null;
}

const buttonStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #374151",
  background: "#1f2937",
  color: "#e5e7eb",
  cursor: "pointer",
  fontSize: 13,
};

export default function WorkspacePage() {
  const { state, dispatch, canUndo, canRedo } = useWorkspace();
  const navigate = useNavigate();
  const gridWrapRef = useRef<HTMLDivElement | null>(null);
  const [pendingForce, setPendingForce] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);

  const hotkeys = loadHotkeyBindings();

  useEffect(() => {
    gridWrapRef.current?.focus();
  }, []);

  // Read during render: every dispatch appends to the log and re-renders, so
  // this tracks without an effect syncing one source of truth into another.
  const logCount = getLog().length;
  const current = rowStatus(state, state.cursor.row, true);
  const live = liveCountFor(state, state.cursor.row);

  return (
    <main style={{ display: "grid", gap: 16, color: "#e5e7eb" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" style={buttonStyle} onClick={() => navigate("/")}>
          Home
        </button>
        <button
          type="button"
          style={buttonStyle}
          disabled={!canUndo}
          onClick={() => dispatch({ type: "UNDO" })}
        >
          Undo
        </button>
        <button
          type="button"
          style={buttonStyle}
          disabled={!canRedo}
          onClick={() => dispatch({ type: "REDO" })}
        >
          Redo
        </button>

        <span style={{ width: 12 }} />

        <button
          type="button"
          style={buttonStyle}
          onClick={() =>
            dispatch({
              type: "SET_KNIT_MODE",
              mode: state.knitMode === "flat" ? "round" : "flat",
            })
          }
        >
          {state.knitMode === "flat" ? "Flat" : "In the round"}
        </button>

        <span style={{ fontSize: 12, color: "#6b7280", paddingLeft: 4 }}>Align</span>
        {(
          [
            ["center", "Centre"],
            ["right", "Right"],
            ["left", "Left"],
          ] as [RowAnchor, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            title={`Where a row sits when it is narrower than the widest row (${label.toLowerCase()})`}
            style={{
              ...buttonStyle,
              background: state.anchor === value ? "#1d4ed8" : "#1f2937",
            }}
            onClick={() => dispatch({ type: "SET_ANCHOR", anchor: value })}
          >
            {label}
          </button>
        ))}

        <span style={{ width: 12 }} />

        <button
          type="button"
          style={{
            ...buttonStyle,
            background: state.workspaceMode === "track" ? "#047857" : "#1f2937",
          }}
          title="Follow the chart on the needles: wrong-side rows flip and show the stitch you actually work"
          onClick={() =>
            dispatch({
              type: "SET_WORKSPACE_MODE",
              mode: state.workspaceMode === "track" ? "design" : "track",
            })
          }
        >
          {state.workspaceMode === "track" ? "Knitting" : "Designing"}
        </button>

        <button
          type="button"
          style={{ ...buttonStyle, borderColor: "#b45309" }}
          title="Turn early, making this a short row. Reshapes everything above it."
          disabled={current.remaining <= 0}
          onClick={() => {
            dispatch({ type: "TURN_WORK" });
            gridWrapRef.current?.focus();
          }}
        >
          Turn work
        </button>

        <span style={{ width: 12 }} />

        <button
          type="button"
          style={buttonStyle}
          onClick={() => dispatch({ type: "CAPTURE_MOTIF" })}
        >
          Capture motif
        </button>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => dispatch({ type: "SET_DESTINATION_FROM_SELECTION" })}
        >
          Set destination
        </button>

        <span style={{ width: 12 }} />

        <button
          type="button"
          style={buttonStyle}
          title="Mark this moment in the session log"
          onClick={() => {
            const note = window.prompt("What went wrong here?");
            if (note) logNote(note, state);
            gridWrapRef.current?.focus();
          }}
        >
          Flag
        </button>
        <button
          type="button"
          style={buttonStyle}
          title="Write the session log out as a file"
          onClick={() => {
            void saveLog(state).then(
              (where) => setBlocked(`Log written to ${where}`),
              (error: unknown) => setBlocked(`Could not save log: ${String(error)}`)
            );
          }}
        >
          Save log ({logCount})
        </button>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            clearLog();
            dispatch({ type: "CLEAR_SELECTION" });
          }}
        >
          Clear log
        </button>
      </div>

      <div style={{ fontSize: 13, color: "#94a3b8" }}>
        Row {state.cursor.row + 1} · {current.consumed} of {live} stitches worked ·{" "}
        {current.produced} produced
      </div>

      {blocked && (
        <div
          style={{
            fontSize: 13,
            color: "#fcd34d",
            border: "1px solid #b45309",
            background: "#1c1917",
            borderRadius: 6,
            padding: "8px 12px",
            width: "fit-content",
          }}
        >
          {blocked}
        </div>
      )}

      <div
        ref={gridWrapRef}
        tabIndex={0}
        onClick={() => gridWrapRef.current?.focus()}
        onKeyDown={(event) => {
          const hotkey = eventToHotkey(event.nativeEvent);

          if (hotkey === hotkeys.undo) {
            event.preventDefault();
            if (canUndo) dispatch({ type: "UNDO" });
            return;
          }

          if (hotkey === hotkeys.redo) {
            event.preventDefault();
            if (canRedo) dispatch({ type: "REDO" });
            return;
          }

          const stitch = keyToStitch(event);
          if (stitch) {
            event.preventDefault();
            setBlocked(null);


            const outcome = paintOutcome(state, stitch);
            if (outcome === "overflow") {
              setPendingForce(stitch);
            } else {
              dispatch({ type: "PAINT_AND_ADVANCE", stitch });
            }
            return;
          }

          if (event.shiftKey && event.key.startsWith("Arrow")) {
            event.preventDefault();
            const dir = event.key.replace("Arrow", "").toLowerCase() as
              | "left"
              | "right"
              | "up"
              | "down";
            dispatch({ type: "EXTEND_SELECTION", dir });
            return;
          }

          if (event.key.startsWith("Arrow")) {
            event.preventDefault();
            const dir = event.key.replace("Arrow", "").toLowerCase() as
              | "left"
              | "right"
              | "up"
              | "down";
            dispatch({ type: "MOVE_CURSOR", dir });
            return;
          }

          if (hotkey === hotkeys.captureMotif) {
            event.preventDefault();
            dispatch({ type: "CAPTURE_MOTIF" });
            return;
          }

          if (hotkey === hotkeys.setDestination) {
            event.preventDefault();
            dispatch({ type: "SET_DESTINATION_FROM_SELECTION" });
            return;
          }

          if (hotkey === hotkeys.fillRow) {
            event.preventDefault();
            setBlocked(null);
            dispatch({ type: "FILL_ROW" });
            return;
          }

          if (hotkey === hotkeys.turnWork) {
            event.preventDefault();
            dispatch({ type: "TURN_WORK" });
            return;
          }

          if (hotkey === hotkeys.nextRow) {
            event.preventDefault();
            if (current.remaining > 0 && (state.rows[state.cursor.row]?.cells.length ?? 0) > 0) {
              setBlocked(
                `Row ${state.cursor.row + 1} still has ${current.remaining} stitch${
                  current.remaining === 1 ? "" : "es"
                } live. Finish it, or use Turn work to make it a short row.`
              );
              return;
            }
            dispatch({ type: "NEXT_ROW" });
            return;
          }

          if (event.key === "Backspace" || event.key === "Delete") {
            event.preventDefault();
            dispatch({ type: "ERASE_AND_BACKSPACE" });
            return;
          }

          if (event.key === "Escape") {
            event.preventDefault();
            dispatch({ type: "CLEAR_SELECTION" });
          }
        }}
        style={{
          padding: 12,
          background: "#f8fafc",
          borderRadius: 8,
          outline: "none",
          width: "fit-content",
        }}
      >
        <WorkspaceGrid />
      </div>

      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          {DEFAULT_PALETTE.map((id, digit) => (
            <span key={id} style={{ marginRight: 12 }}>
              <strong style={{ color: "#94a3b8" }}>{digit}</strong> {getStitch(id).abbr}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#4b5563" }}>
          <strong style={{ color: "#94a3b8" }}>Space</strong> works to the last
          stitch, where shaping goes — press again to take the last one ·{" "}
          <strong style={{ color: "#94a3b8" }}>Enter</strong> starts the next row
          · <strong style={{ color: "#94a3b8" }}>Shift+Enter</strong> turns early
          for a short row
        </div>
      </div>

      {pendingForce && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "grid",
            placeItems: "center",
            zIndex: 60,
          }}
        >
          <div
            style={{
              width: "min(420px, 90%)",
              display: "grid",
              gap: 14,
              padding: 20,
              borderRadius: 12,
              border: "1px solid #374151",
              background: "#111827",
            }}
          >
            <h3 style={{ margin: 0, color: "#f8fafc" }}>That does not fit</h3>
            <p style={{ margin: 0, color: "#cbd5e1", fontSize: 14 }}>
              {getStitch(pendingForce).name} takes{" "}
              {getStitch(pendingForce).consumes} stitches, and this row has{" "}
              {current.remaining} left. You can place it anyway; the row will be
              flagged as not closing.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                style={buttonStyle}
                onClick={() => setPendingForce(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{ ...buttonStyle, background: "#b45309" }}
                onClick={() => {
                  dispatch({
                    type: "PAINT_AND_ADVANCE",
                    stitch: pendingForce,
                    force: true,
                  });
                  setPendingForce(null);
                  gridWrapRef.current?.focus();
                }}
              >
                Place anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
