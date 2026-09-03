import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceGrid from "../features/workspace/components/WorkspaceGrid";
import { useWorkspace } from "../features/workspace/state/WorkspaceContext";
import { DEFAULT_PALETTE, getStitch } from "../features/stitches/stitches";
import StitchGlyph from "../features/stitches/StitchGlyph";
import Segmented from "../shared/components/Segmented";
import { stitchAbbr, stitchName, t } from "../features/i18n/i18n";
import { useLanguage } from "../features/i18n/useLanguage";
import { liveCountFor, paintOutcome, rowStatus } from "../features/project/rowMath";
import {
  CURSOR_COMMANDS,
  eventToHotkey,
  loadHotkeyBindings,
  matchesHotkey,
  type CursorCommand,
} from "../features/hotkeys/hotkeys";
import { logNote, saveLog } from "../features/devlog/devlog";

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
  border: "1px solid var(--border)",
  background: "var(--raised)",
  color: "var(--text)",
  cursor: "pointer",
  fontSize: 13,
};

export default function WorkspacePage() {
  const { state, dispatch, canUndo, canRedo } = useWorkspace();
  const navigate = useNavigate();
  const gridWrapRef = useRef<HTMLDivElement | null>(null);
  useLanguage();
  const [pendingForce, setPendingForce] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);

  const hotkeys = loadHotkeyBindings();

  useEffect(() => {
    gridWrapRef.current?.focus();
  }, []);

  const act: React.CSSProperties = { ...buttonStyle, minHeight: 44 };

  const run = (action: Parameters<typeof dispatch>[0]) => {
    dispatch(action);
    gridWrapRef.current?.focus();
  };

  const paint = (stitch: string) => {
    setBlocked(null);
    if (paintOutcome(state, stitch) === "overflow") {
      setPendingForce(stitch);
    } else {
      dispatch({ type: "PAINT_AND_ADVANCE", stitch });
    }
    gridWrapRef.current?.focus();
  };

  const current = rowStatus(state, state.cursor.row, true);
  const live = liveCountFor(state, state.cursor.row);

  return (
    <main style={{ display: "grid", gap: 16, color: "var(--text)", width: "100%" }}>
      <div
        style={{
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          alignItems: "center",
          paddingBottom: 4,
          borderBottom: "1px solid var(--raised)",
        }}
      >
        <button type="button" style={buttonStyle} onClick={() => navigate("/")}>
          Home
        </button>

        <input
          value={state.name}
          onChange={(event) =>
            dispatch({ type: "SET_NAME", value: event.target.value })
          }
          placeholder={t("untitled")}
          aria-label={t("patternName")}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text-strong)",
            fontSize: 14,
            fontWeight: 600,
            minWidth: 180,
          }}
        />

        <Segmented
          value={state.knitMode}
          onChange={(mode) => dispatch({ type: "SET_KNIT_MODE", mode })}
          options={[
            { value: "flat", label: t("flat") },
            { value: "round", label: t("circular") },
          ]}
        />

        <Segmented
          value={state.anchor}
          onChange={(anchor) => dispatch({ type: "SET_ANCHOR", anchor })}
          options={[
            { value: "left", label: t("left") },
            { value: "center", label: t("centre") },
            { value: "right", label: t("right") },
          ]}
        />

        <Segmented
          value={state.workspaceMode}
          onChange={(mode) => dispatch({ type: "SET_WORKSPACE_MODE", mode })}
          options={[
            { value: "design", label: t("designing") },
            { value: "track", label: t("knitting") },
          ]}
        />
      </div>

      <div style={{ fontSize: 13, color: "var(--muted)" }}>
        Row {state.cursor.row + 1} · {current.consumed} of {live} stitches worked ·{" "}
        {current.produced} produced
      </div>

      {blocked && (
        <div
          style={{
            fontSize: 13,
            color: "var(--warn-text)",
            border: "1px solid var(--warn-border)",
            background: "var(--warn-bg)",
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

          if (matchesHotkey(hotkey, hotkeys.undo)) {
            event.preventDefault();
            if (canUndo) dispatch({ type: "UNDO" });
            return;
          }

          if (matchesHotkey(hotkey, hotkeys.redo)) {
            event.preventDefault();
            if (canRedo) dispatch({ type: "REDO" });
            return;
          }

          const stitch = keyToStitch(event);
          if (stitch) {
            event.preventDefault();
            setBlocked(null);
            paint(stitch);
            return;
          }

          // Shift with a cursor key grows the selection rather than moving, so
          // the cursor bindings are matched without it before anything else.
          const bare = hotkey.replace(/^Shift\+/, "");
          const cursor = (Object.keys(CURSOR_COMMANDS) as CursorCommand[]).find(
            (command) => matchesHotkey(bare, hotkeys[command])
          );
          if (cursor) {
            event.preventDefault();
            const dir = CURSOR_COMMANDS[cursor];
            dispatch(
              event.shiftKey
                ? { type: "EXTEND_SELECTION", dir }
                : { type: "MOVE_CURSOR", dir }
            );
            return;
          }

          if (matchesHotkey(hotkey, hotkeys.captureMotif)) {
            event.preventDefault();
            dispatch({ type: "CAPTURE_MOTIF" });
            return;
          }

          if (matchesHotkey(hotkey, hotkeys.setDestination)) {
            event.preventDefault();
            dispatch({ type: "SET_DESTINATION_FROM_SELECTION" });
            return;
          }

          if (matchesHotkey(hotkey, hotkeys.fillRow)) {
            event.preventDefault();
            setBlocked(null);
            dispatch({ type: "FILL_ROW" });
            return;
          }

          if (matchesHotkey(hotkey, hotkeys.turnWork)) {
            event.preventDefault();
            dispatch({ type: "TURN_WORK" });
            return;
          }

          if (matchesHotkey(hotkey, hotkeys.nextRow)) {
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

          if (matchesHotkey(hotkey, hotkeys.erase)) {
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
          // The chart stays on paper whatever the interface is doing.
          background: "var(--chart-paper)",
          borderRadius: 8,
          outline: "none",
          width: "fit-content",
        }}
      >
        <WorkspaceGrid />
      </div>

      {/* A focusable div never raises a keyboard on a phone, so every key has
          a button too. Tapping returns focus to the grid. */}
      <div
        style={{
          display: "grid",
          gap: 10,
          width: "100%",
          padding: "12px 14px",
          borderRadius: 10,
          border: "1px solid var(--raised)",
          background: "var(--surface)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {DEFAULT_PALETTE.map((id, digit) => {
            const stitch = getStitch(id);
            return (
              <button
                key={id}
                type="button"
                title={`${stitchName(id, stitch.name)} - ${digit}`}
                onClick={() => paint(id)}
                style={{
                  minWidth: 52,
                  minHeight: 48,
                  display: "grid",
                  placeItems: "center",
                  gap: 1,
                  padding: "4px 8px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                <StitchGlyph stitch={stitch} size={18} color="var(--text)" />
                <span style={{ fontSize: 11 }}>{stitchAbbr(id, stitch.abbr).toUpperCase()}</span>
                <span style={{ fontSize: 9, color: "var(--muted)" }}>{digit}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              style={act}
              disabled={!canUndo}
              onClick={() => run({ type: "UNDO" })}
            >
              {t("undo")}
            </button>
            <button
              type="button"
              style={act}
              disabled={!canRedo}
              onClick={() => run({ type: "REDO" })}
            >
              {t("redo")}
            </button>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              style={act}
              title="Work to the last stitch, where shaping goes. Again takes the last one. (Space)"
              onClick={() => {
                setBlocked(null);
                run({ type: "FILL_ROW" });
              }}
            >
              {t("toLastStitch")}
            </button>
            <button
              type="button"
              style={act}
              title="Erase the stitch before the cursor (Backspace)"
              onClick={() => run({ type: "ERASE_AND_BACKSPACE" })}
            >
              {t("erase")}
            </button>
            <button
              type="button"
              style={act}
              title="Start the next row, once this one is finished (Enter)"
              disabled={
                current.remaining > 0 &&
                (state.rows[state.cursor.row]?.cells.length ?? 0) > 0
              }
              onClick={() => run({ type: "NEXT_ROW" })}
            >
              {t("nextRow")}
            </button>
            <button
              type="button"
              style={{ ...act, borderColor: "var(--warn-border)" }}
              title="Turn early, making this a short row. Reshapes everything above it. (Shift+Enter)"
              disabled={current.remaining <= 0}
              onClick={() => run({ type: "TURN_WORK" })}
            >
              {t("turnWork")}
            </button>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" style={act} onClick={() => run({ type: "CAPTURE_MOTIF" })}>
              Capture motif
            </button>
            <button
              type="button"
              style={act}
              onClick={() => run({ type: "SET_DESTINATION_FROM_SELECTION" })}
            >
              {t("setDestination")}
            </button>
          </div>

          {/* Development aids. Both come out before release. */}
          <div style={{ display: "flex", gap: 6, marginLeft: "auto", opacity: 0.6 }}>
            <button
              type="button"
              style={act}
              title="Stamp a note into the session log at this moment"
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
              style={act}
              onClick={() => {
                void saveLog(state).then(
                  (where) => setBlocked(`Log written to ${where}`),
                  (error: unknown) => setBlocked(`Could not save log: ${String(error)}`)
                );
              }}
            >
              Save log
            </button>
          </div>
        </div>
      </div>

      {pendingForce && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            padding: 20,
            overflowY: "auto",
            zIndex: 60,
          }}
        >
          <div
            style={{
              margin: "auto",
              width: "min(420px, 90%)",
              display: "grid",
              gap: 14,
              padding: 20,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
            }}
          >
            <h3 style={{ margin: 0, color: "var(--text-strong)" }}>That does not fit</h3>
            <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 14 }}>
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
                style={{ ...buttonStyle, background: "var(--warn-border)" }}
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
