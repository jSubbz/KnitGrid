import { useState } from "react";
import { useWorkspace } from "../workspace/state/WorkspaceContext";
import Segmented from "../../shared/components/Segmented";
import { t } from "../i18n/i18n";
import {
  FEEDBACK_KINDS,
  REPO_URL,
  issueUrl,
  openContactEmail,
  saveReportFile,
  type FeedbackDraft,
  type FeedbackKind,
} from "./feedback";

const field: React.CSSProperties = {
  width: "100%",
  padding: "9px 11px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  fontSize: 14,
  fontFamily: "inherit",
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "var(--muted)",
  marginBottom: 6,
};

const button: React.CSSProperties = {
  padding: "9px 14px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--raised)",
  color: "var(--text)",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

export default function FeedbackForm() {
  const { state } = useWorkspace();
  const [draft, setDraft] = useState<FeedbackDraft>({
    kind: "bug",
    summary: "",
    detail: "",
    includeChart: false,
  });
  const [savedTo, setSavedTo] = useState<string | null>(null);

  const set = <K extends keyof FeedbackDraft>(key: K, value: FeedbackDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setSavedTo(null);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <p style={{ margin: 0 }}>{t("info.fbIntro")}</p>

      <Segmented<FeedbackKind>
        options={FEEDBACK_KINDS.map((kind) => ({
          value: kind.value,
          label: t(kind.labelKey),
        }))}
        value={draft.kind}
        onChange={(value) => set("kind", value)}
      />

      <div>
        <label style={label} htmlFor="feedback-summary">
          {t("info.fbSummaryLabel")}
        </label>
        <input
          id="feedback-summary"
          style={field}
          value={draft.summary}
          onChange={(event) => set("summary", event.target.value)}
          placeholder={t("info.fbSummaryPlaceholder")}
        />
      </div>

      <div>
        <label style={label} htmlFor="feedback-detail">
          {t("info.fbDetailLabel")}
        </label>
        <textarea
          id="feedback-detail"
          style={{ ...field, minHeight: 140, resize: "vertical" }}
          value={draft.detail}
          onChange={(event) => set("detail", event.target.value)}
          placeholder={t("info.fbDetailPlaceholder")}
        />
      </div>

      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14 }}>
        <input
          type="checkbox"
          checked={draft.includeChart}
          onChange={(event) => set("includeChart", event.target.checked)}
          style={{ marginTop: 3 }}
        />
        <span>
          {t("info.fbChart")}
          <span style={{ color: "var(--muted)" }}> {t("info.fbChartNote")}</span>
        </span>
      </label>

      <div>
        <a
          href={issueUrl(draft, state)}
          target="_blank"
          rel="noreferrer"
          style={{
            ...button,
            display: "inline-block",
            background: "var(--accent)",
            borderColor: "var(--accent)",
            color: "var(--on-accent)",
            textDecoration: "none",
          }}
        >
          {t("info.fbIssueButton")}
        </a>
        <p style={{ margin: "8px 0 0 0", color: "var(--muted)", fontSize: 13 }}>
          {t("info.fbIssueNote")}{" "}
          <a href={REPO_URL} target="_blank" rel="noreferrer" style={{ color: "var(--link)" }}>
            {REPO_URL.replace("https://github.com/", "")}
          </a>
        </p>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: 16,
          display: "grid",
          gap: 10,
        }}
      >
        <div style={{ color: "var(--text-strong)", fontWeight: 600 }}>
          {t("info.fbNoAccountTitle")}
        </div>
        <p style={{ margin: 0, fontSize: 14 }}>{t("info.fbNoAccountBody")}</p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            style={button}
            onClick={async () => setSavedTo(await saveReportFile(draft, state))}
          >
            {t("info.fbSaveButton")}
          </button>
          <button
            type="button"
            style={button}
            onClick={() =>
              openContactEmail(`KnitGrid: ${draft.summary.trim() || "feedback"}`)
            }
          >
            {t("info.fbEmailButton")}
          </button>
        </div>

        {savedTo && (
          <div style={{ color: "var(--ok-text)", fontSize: 13 }}>
            {t("info.fbSavedTo", { where: savedTo })}
          </div>
        )}
      </div>
    </div>
  );
}
