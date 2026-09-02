import { useMemo, useState } from "react";
import {
  DEFAULT_HOTKEYS,
  loadHotkeyBindings,
  normalizeHotkeyString,
  saveHotkeyBindings,
  type HotkeyBindings,
  type HotkeyCommand,
} from "../../hotkeys/hotkeys";

interface HotkeyEditorModalProps {
  onClose: () => void;
}

const labels: Record<HotkeyCommand, string> = {
  undo: "Undo",
  redo: "Redo",
  captureMotif: "Capture Motif",
  setDestination: "Set Destination",
  nextRow: "Next Row",
  turnWork: "Turn Work",
  fillRow: "Knit To Last Stitch",
};

const descriptions: Record<HotkeyCommand, string> = {
  undo: "Undo last action",
  redo: "Redo last undone action",
  captureMotif: "Capture current selection as motif",
  setDestination: "Store current selection as destination",
  nextRow: "Move to the next row (only once the current row is finished)",
  turnWork: "Turn early, making the current row a short row",
  fillRow: "Work to the last stitch, where shaping goes. Press again to take the last one",
};

export default function HotkeyEditorModal({ onClose }: HotkeyEditorModalProps) {
  const [bindings, setBindings] = useState<HotkeyBindings>(() => loadHotkeyBindings());

  const duplicateKeys = useMemo(() => {
    const seen = new Map<string, number>();

    Object.values(bindings).forEach((binding) => {
      if (!binding) return;
      seen.set(binding, (seen.get(binding) ?? 0) + 1);
    });

    return new Set(
      [...seen.entries()]
        .filter(([, count]) => count > 1)
        .map(([binding]) => binding)
    );
  }, [bindings]);

  const commands = Object.keys(labels) as HotkeyCommand[];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "grid",
        placeItems: "center",
        padding: 20,
        zIndex: 100,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(720px, 100%)",
          display: "grid",
          gap: 16,
          padding: 20,
          borderRadius: 16,
          border: "1px solid #374151",
          background: "#111827",
          color: "#e5e7eb",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, color: "#f8fafc" }}>Hotkey Editor</h2>
            <p style={{ margin: "6px 0 0 0", color: "#94a3b8" }}>
              Use formats like Ctrl+Z, Ctrl+Y, T, D, Enter.
            </p>
          </div>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gap: 0,
            border: "1px solid #374151",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "180px 1fr 180px",
              background: "#1f2937",
              fontWeight: 700,
            }}
          >
            <div style={{ padding: "10px 12px" }}>Action</div>
            <div style={{ padding: "10px 12px" }}>Description</div>
            <div style={{ padding: "10px 12px" }}>Hotkey</div>
          </div>

          {commands.map((command, index) => {
            const binding = bindings[command];
            const isDuplicate = duplicateKeys.has(binding);

            return (
              <div
                key={command}
                style={{
                  display: "grid",
                  gridTemplateColumns: "180px 1fr 180px",
                  borderTop: index === 0 ? "none" : "1px solid #1f2937",
                }}
              >
                <div style={{ padding: "10px 12px", color: "#f8fafc", fontWeight: 600 }}>
                  {labels[command]}
                </div>
                <div style={{ padding: "10px 12px", color: "#cbd5e1" }}>
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
                      border: `1px solid ${isDuplicate ? "#dc2626" : "#374151"}`,
                      background: "#0f172a",
                      color: "#e5e7eb",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {duplicateKeys.size > 0 && (
          <div
            style={{
              color: "#fca5a5",
              background: "#3f1111",
              border: "1px solid #7f1d1d",
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
            onClick={() => setBindings(DEFAULT_HOTKEYS)}
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={() => {
              const normalizedBindings: HotkeyBindings = {
                undo: normalizeHotkeyString(bindings.undo) || DEFAULT_HOTKEYS.undo,
                redo: normalizeHotkeyString(bindings.redo) || DEFAULT_HOTKEYS.redo,
                captureMotif:
                  normalizeHotkeyString(bindings.captureMotif) ||
                  DEFAULT_HOTKEYS.captureMotif,
                setDestination:
                  normalizeHotkeyString(bindings.setDestination) ||
                  DEFAULT_HOTKEYS.setDestination,
                nextRow:
                  normalizeHotkeyString(bindings.nextRow) ||
                  DEFAULT_HOTKEYS.nextRow,
                turnWork:
                  normalizeHotkeyString(bindings.turnWork) ||
                  DEFAULT_HOTKEYS.turnWork,
                fillRow:
                  normalizeHotkeyString(bindings.fillRow) ||
                  DEFAULT_HOTKEYS.fillRow,
              };

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