import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../features/workspace/state/WorkspaceContext";
import { MAX_CAST_ON, MIN_CAST_ON } from "../features/project/types";
import type { KnitMode, RowAnchor } from "../features/project/types";
import { t } from "../features/i18n/i18n";
import { useLanguage } from "../features/i18n/useLanguage";

const fieldStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--raised)",
  color: "var(--text)",
  cursor: "pointer",
  fontWeight: 600,
};

const labelStyle: React.CSSProperties = { display: "grid", gap: 6, textAlign: "left" };

export default function CreatePatternPage() {
  const { dispatch } = useWorkspace();
  const navigate = useNavigate();
  useLanguage();

  const [castOn, setCastOn] = useState("6");
  const [notes, setNotes] = useState("");
  const [knitMode, setKnitMode] = useState<KnitMode>("flat");
  const [anchor, setAnchor] = useState<RowAnchor>("center");

  const parsed = Number(castOn);
  const valid =
    Number.isInteger(parsed) && parsed >= MIN_CAST_ON && parsed <= MAX_CAST_ON;

  const start = () => {
    if (!valid) return;
    dispatch({ type: "RESET_PROJECT", castOn: parsed, notes, name: t("untitled") });
    dispatch({ type: "SET_KNIT_MODE", mode: knitMode });
    dispatch({ type: "SET_ANCHOR", anchor });
    navigate("/workspace");
  };

  return (
    <main style={{ display: "grid", gap: 20, maxWidth: 520, color: "var(--text)", padding: 24 }}>
      <h1 style={{ margin: 0, color: "var(--text-strong)", textAlign: "center" }}>
        {t("createNewPattern")}
      </h1>

      <label style={labelStyle}>
        <span>{t("stitchesToCastOn")}</span>
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
            borderColor: valid || castOn === "" ? "var(--border)" : "#b91c1c",
          }}
        />
        <span style={{ fontSize: 12, color: valid ? "var(--muted)" : "var(--danger-text)" }}>
          {t("castOnRange", { min: MIN_CAST_ON, max: MAX_CAST_ON })}
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
                background: knitMode === mode ? "var(--accent)" : "var(--raised)",
              }}
            >
              {t(mode === "flat" ? "flat" : "circular")}
            </button>
          ))}
        </div>
      </div>

      <div style={labelStyle}>
        <span>{t("visualAlignment")}</span>
        <div style={{ display: "flex", gap: 8 }}>
          {(
            [
              ["left", t("left")],
              ["center", t("centre")],
              ["right", t("right")],
            ] as [RowAnchor, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setAnchor(value)}
              style={{
                ...buttonStyle,
                background: anchor === value ? "var(--accent)" : "var(--raised)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          {t("alignmentHint")}
        </span>
      </div>

      <label style={labelStyle}>
        <span>{t("notes")}</span>
        <textarea
          rows={5}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={t("notesPlaceholder")}
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
            background: valid ? "var(--accent)" : "var(--border)",
            cursor: valid ? "pointer" : "not-allowed",
          }}
        >
          {t("startCreating")}
        </button>
        <button type="button" onClick={() => navigate("/")} style={buttonStyle}>
          {t("cancel")}
        </button>
      </div>
    </main>
  );
}
