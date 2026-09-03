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

/**
 * New-pattern wizard. Only the cast-on is required - it seeds the live stitch
 * count for the first row, and everything above derives from there.
 */
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
    dispatch({ type: "RESET_PROJECT", castOn: parsed, notes });
    dispatch({ type: "SET_KNIT_MODE", mode: knitMode });
    dispatch({ type: "SET_ANCHOR", anchor });
    navigate("/workspace");
  };

  return (
    <main
      style={{
        display: "grid",
        gap: 20,
        maxWidth: 560,
        color: "#e5e7eb",
        padding: 24,
      }}
    >
      <div>
        <h1 style={{ margin: 0, color: "#f8fafc" }}>New pattern</h1>
        <p style={{ margin: "8px 0 0", color: "#94a3b8", fontSize: 14 }}>
          The cast-on is all that is needed to start. Every row above it is
          worked out from the stitches you enter.
        </p>
      </div>

      <label style={{ display: "grid", gap: 6 }}>
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

      <div style={{ display: "grid", gap: 6 }}>
        <span>Worked</span>
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

      <div style={{ display: "grid", gap: 6 }}>
        <span>
          Row alignment{" "}
          <span style={{ color: "#6b7280" }}>· changeable later</span>
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {(
            [
              ["center", "Centre", "Shaping spreads evenly to both sides"],
              ["right", "Right", "Rows line up where knitting starts"],
              ["left", "Left", "Rows line up at the far edge"],
            ] as [RowAnchor, string, string][]
          ).map(([value, label, hint]) => (
            <button
              key={value}
              type="button"
              title={hint}
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
          Where a row sits when it is narrower than the widest row.
        </span>
      </div>

      <label style={{ display: "grid", gap: 6 }}>
        <span>
          Notes <span style={{ color: "#6b7280" }}>· optional</span>
        </span>
        <textarea
          rows={5}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Gauge, yarn, needle size, sizing — anything you want kept with the chart."
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
          Start charting
        </button>
        <button type="button" onClick={() => navigate("/")} style={buttonStyle}>
          Cancel
        </button>
      </div>
    </main>
  );
}
