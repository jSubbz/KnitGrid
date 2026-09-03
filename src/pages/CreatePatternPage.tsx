import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../features/workspace/state/WorkspaceContext";
import { MAX_CAST_ON, MIN_CAST_ON } from "../features/project/types";
import type { KnitMode, RowAnchor } from "../features/project/types";

const fieldStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #374151",
  background: "#0f172a",
  color: "#e5e7eb",
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #374151",
  background: "#1f2937",
  color: "#e5e7eb",
  cursor: "pointer",
  fontWeight: 600,
};

const labelStyle: React.CSSProperties = { display: "grid", gap: 6, textAlign: "left" };

export default function CreatePatternPage() {
  const { dispatch } = useWorkspace();
  const navigate = useNavigate();

  const [castOn, setCastOn] = useState("6");
  const [notes, setNotes] = useState("");
  const [knitMode, setKnitMode] = useState<KnitMode>("flat");
  const [anchor, setAnchor] = useState<RowAnchor>("center");

  const parsed = Number(castOn);
  const valid =
    Number.isInteger(parsed) && parsed >= MIN_CAST_ON && parsed <= MAX_CAST_ON;

  const start = () => {
    if (!valid) return;
    dispatch({ type: "RESET_PROJECT", castOn: parsed, notes, name: "Untitled" });
    dispatch({ type: "SET_KNIT_MODE", mode: knitMode });
    dispatch({ type: "SET_ANCHOR", anchor });
    navigate("/workspace");
  };

  return (
    <main style={{ display: "grid", gap: 20, maxWidth: 520, color: "#e5e7eb", padding: 24 }}>
      <h1 style={{ margin: 0, color: "#f8fafc", textAlign: "center" }}>
        Create New Pattern
      </h1>

      <label style={labelStyle}>
        <span>Stitches to cast on</span>
        <input
          type="number"
          inputMode="numeric"
          min={MIN_CAST_ON}
          max={MAX_CAST_ON}
          value={castOn}
          onChange={(event) => setCastOn(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") start();
          }}
          style={{
            ...fieldStyle,
            borderColor: valid || castOn === "" ? "#374151" : "#b91c1c",
          }}
        />
        <span style={{ fontSize: 12, color: valid ? "#6b7280" : "#fca5a5" }}>
          {MIN_CAST_ON} to {MAX_CAST_ON} stitches
        </span>
      </label>

      <div style={labelStyle}>
        <div style={{ display: "flex", gap: 8 }}>
          {(["flat", "round"] as KnitMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setKnitMode(mode)}
              style={{
                ...buttonStyle,
                background: knitMode === mode ? "#1d4ed8" : "#1f2937",
              }}
            >
              {mode === "flat" ? "Flat" : "In the round"}
            </button>
          ))}
        </div>
      </div>

      <div style={labelStyle}>
        <span>Visual Alignment</span>
        <div style={{ display: "flex", gap: 8 }}>
          {(
            [
              ["left", "Left"],
              ["center", "Centre"],
              ["right", "Right"],
            ] as [RowAnchor, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setAnchor(value)}
              style={{
                ...buttonStyle,
                background: anchor === value ? "#1d4ed8" : "#1f2937",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          Visual alignment can be toggled in the workspace to align in any
          direction.
        </span>
      </div>

      <label style={labelStyle}>
        <span>Notes</span>
        <textarea
          rows={5}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Gauge, yarn, needle size, sizing."
          style={{ ...fieldStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      </label>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          type="button"
          onClick={start}
          disabled={!valid}
          style={{
            ...buttonStyle,
            background: valid ? "#1d4ed8" : "#374151",
            cursor: valid ? "pointer" : "not-allowed",
          }}
        >
          Start Creating
        </button>
        <button type="button" onClick={() => navigate("/")} style={buttonStyle}>
          Cancel
        </button>
      </div>
    </main>
  );
}
