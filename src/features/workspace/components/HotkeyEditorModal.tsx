import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_HOTKEYS,
  HOTKEY_COMMANDS,
  loadHotkeyBindings,
  hotkeyKeys,
  normalizeBindings,
  normalizeHotkeyString,
  saveHotkeyBindings,
  type HotkeyBindings,
  type HotkeyCommand,
} from "../../hotkeys/hotkeys";

const plainButton: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--raised)",
  color: "var(--text)",
  fontWeight: 600,
  cursor: "pointer",
};

const primaryButton: React.CSSProperties = {
  ...plainButton,
  background: "var(--accent)",
  borderColor: "var(--accent)",
  color: "var(--on-accent)",
};

interface HotkeyEditorModalProps {
  onClose: () => void;
}

const labels: Record<HotkeyCommand, string> = {
  undo: "Undo",
  redo: "Redo",
  cursorLeft: "Cursor Left",
  cursorRight: "Cursor Right",
  cursorUp: "Cursor Up",
  cursorDown: "Cursor Down",
  fillRow: "Knit To Last Stitch",
  nextRow: "Next Row",
  turnWork: "Turn Work",
  erase: "Erase",
  captureMotif: "Capture Motif",
  setDestination: "Set Destination",
};

const descriptions: Record<HotkeyCommand, string> = {
  undo: "Undo last action",
  redo: "Redo last undone action",
  cursorLeft: "Move the cursor left. Hold Shift to grow the selection instead",
  cursorRight: "Move the cursor right. Hold Shift to grow the selection instead",
  cursorUp: "Move the cursor up a row. Hold Shift to grow the selection instead",
  cursorDown: "Move the cursor down a row. Hold Shift to grow the selection instead",
  fillRow: "Work to the last stitch, where shaping goes. Press again to take the last one",
  nextRow: "Move to the next row (only once the current row is finished)",
  turnWork: "Turn early, making the current row a short row",
  erase: "Undo the last stitch worked and step back to it",
  captureMotif: "Capture current selection as motif",
  setDestination: "Store current selection as destination",
};

export default function HotkeyEditorModal({ onClose }: HotkeyEditorModalProps) {
  const [bindings, setBindings] = useState<HotkeyBindings>(() => loadHotkeyBindings());

  // Without this the page behind the dialog takes the scroll once the pointer
  // leaves the list, which reads as the dialog refusing to move.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const duplicateKeys = useMemo(() => {
    const seen = new Map<string, number>();

    Object.values(bindings).forEach((binding) => {
      hotkeyKeys(binding).forEach((key) => {
        seen.set(key, (seen.get(key) ?? 0) + 1);
      });
    });

    return new Set(
      [...seen.entries()]
        .filter(([, count]) => count > 1)
        .map(([binding]) => binding)
    );
  }, [bindings]);

  const commands = HOTKEY_COMMANDS;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        padding: 20,
        overflowY: "auto",
        zIndex: 100,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          // Auto margins centre it while there is room and let it grow past
          // the top when there is not, which grid centring does not.
          margin: "auto",
          width: "min(720px, 100%)",
          maxHeight: "calc(100dvh - 40px)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: 20,
          borderRadius: 16,
          border: "1px solid var(--border)",
          background: "var(--surface-2)",
          color: "var(--text)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, color: "var(--text-strong)" }}>Hotkey Editor</h2>
            <p style={{ margin: "6px 0 0 0", color: "var(--muted)" }}>
              Formats like Ctrl+Z, T, Enter, ArrowLeft. Separate alternates
              with a comma.
            </p>
          </div>
          <button type="button" onClick={onClose} style={plainButton}>
            Close
          </button>
        </div>

        <div
          style={{
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 0,
              border: "1px solid var(--border)",
              borderRadius: 10,
              // Rounds the row corners, and in doing so lets a flex parent
              // squash the table to nothing - hence flexShrink below.
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "180px 1fr 180px",
                background: "var(--raised)",
                fontWeight: 700,
              }}
            >
              <div style={{ padding: "10px 12px" }}>Action</div>
              <div style={{ padding: "10px 12px" }}>Description</div>
              <div style={{ padding: "10px 12px" }}>Hotkey</div>
            </div>

            {commands.map((command, index) => {
              const binding = bindings[command];
                      const isDuplicate = hotkeyKeys(binding).some((key) =>
                duplicateKeys.has(key)
              );

              return (
                <div
                  key={command}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "180px 1fr 180px",
                    borderTop: index === 0 ? "none" : "1px solid var(--raised)",
                  }}
                >
                  <div style={{ padding: "10px 12px", color: "var(--text-strong)", fontWeight: 600 }}>
                    {labels[command]}
                  </div>
                  <div style={{ padding: "10px 12px", color: "var(--text-soft)" }}>
                    {descriptions[command]}
                  </div>
                  <div style={{ padding: "10px 12px" }}>
                    <input
                      value={binding}
                      onChange={(event) => {
                        setBindings((current: HotkeyBindings) => ({
                          ...current,
                          [command]: event.target.value,
                        }));
                      }}
                      onBlur={(event) => {
                        const normalized = normalizeHotkeyString(event.target.value);
                        setBindings((current: HotkeyBindings) => ({
                          ...current,
                          [command]: normalized || DEFAULT_HOTKEYS[command],
                        }));
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: `1px solid ${isDuplicate ? "var(--danger-text)" : "var(--border)"}`,
                        background: "var(--surface)",
                        color: "var(--text)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
            The number keys <b>0</b> to <b>9</b> work stitches. Which stitch sits
            on which number is the stitch palette, in Settings. A command can
            answer to more than one key - separate them with a comma, the way
            Erase does.
          </p>
        </div>


        {duplicateKeys.size > 0 && (
          <div
            style={{
              color: "var(--danger-text)",
              background: "var(--danger-bg)",
              border: "1px solid var(--danger-border)",
              padding: "10px 12px",
              borderRadius: 8,
            }}
          >
            Duplicate hotkeys detected. Save anyway if you want, but conflicts may be confusing.
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            style={plainButton}
            onClick={() => setBindings(DEFAULT_HOTKEYS)}
          >
            Reset Defaults
          </button>
          <button
            type="button"
            style={primaryButton}
            onClick={() => {
              const normalizedBindings = normalizeBindings(bindings);

              saveHotkeyBindings(normalizedBindings);
              onClose();
            }}
          >
            Save Hotkeys
          </button>
        </div>
      </div>
    </div>
  );
}