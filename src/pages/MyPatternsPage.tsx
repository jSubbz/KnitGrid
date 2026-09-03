import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { readProjectFile } from "../features/project/storage";
import {
  deleteProject,
  listProjects,
  loadProject,
  renameProject,
  storageUsedBytes,
  type SavedProjectMeta,
} from "../features/project/projectStore";
import { useWorkspace } from "../features/workspace/state/WorkspaceContext";

const buttonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #374151",
  background: "#1f2937",
  color: "#e5e7eb",
  cursor: "pointer",
  fontSize: 13,
};

function when(iso: string): string {
  const then = new Date(iso);
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days === 0) return then.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString();
}

export default function MyPatternsPage() {
  const navigate = useNavigate();
  const { dispatch, setSavedAs } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [saved, setSaved] = useState<SavedProjectMeta[]>(() => listProjects());
  const [error, setError] = useState<string | null>(null);

  const refresh = () => setSaved(listProjects());

  const open = (meta: SavedProjectMeta) => {
    const project = loadProject(meta.id);
    if (!project) {
      setError(`"${meta.name}" could not be read. It may have been cleared by the browser.`);
      return;
    }
    dispatch({ type: "LOAD_PROJECT", project });
    setSavedAs({ id: meta.id, name: meta.name });
    navigate("/workspace");
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const project = await readProjectFile(file);
      dispatch({ type: "LOAD_PROJECT", project });
      setSavedAs(null);
      navigate("/workspace");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not read that file.");
    } finally {
      event.target.value = "";
    }
  };

  const used = storageUsedBytes();

  return (
    <main style={{ display: "grid", gap: 20, color: "#e5e7eb", maxWidth: 760 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" style={buttonStyle} onClick={() => navigate("/")}>
          Home
        </button>
        <button type="button" style={buttonStyle} onClick={() => navigate("/create")}>
          New pattern
        </button>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => fileInputRef.current?.click()}
        >
          Open a file
        </button>
      </div>

      <div>
        <h2 style={{ margin: 0, color: "#f8fafc" }}>My Patterns</h2>
        <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 13 }}>
          Backups only. These live in this browser on this computer, and
          clearing site data deletes them without warning. For anything you
          need to keep, use <strong>Save pattern</strong> for paper or{" "}
          <strong>Export JSON</strong> for a file.
        </p>
      </div>

      {error && (
        <div
          style={{
            fontSize: 13,
            color: "#fca5a5",
            border: "1px solid #b91c1c",
            borderRadius: 8,
            padding: "8px 12px",
          }}
        >
          {error}
        </div>
      )}

      {saved.length === 0 ? (
        <div
          style={{
            padding: 24,
            borderRadius: 12,
            border: "1px dashed #374151",
            color: "#94a3b8",
            textAlign: "center",
          }}
        >
          No backups yet. Use File then Backup on browser from the workspace.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {saved.map((meta) => (
            <div
              key={meta.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #374151",
                background: "#111827",
              }}
            >
              <button
                type="button"
                onClick={() => open(meta)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  padding: 0,
                  color: "inherit",
                }}
              >
                <div style={{ color: "#f8fafc", fontWeight: 600 }}>{meta.name}</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>
                  cast on {meta.castOn} · {meta.rows} row{meta.rows === 1 ? "" : "s"} ·{" "}
                  {when(meta.updatedAt)}
                </div>
              </button>

              <button
                type="button"
                style={buttonStyle}
                onClick={() => {
                  const name = window.prompt("Rename to:", meta.name);
                  if (name) {
                    renameProject(meta.id, name);
                    refresh();
                  }
                }}
              >
                Rename
              </button>
              <button
                type="button"
                style={{ ...buttonStyle, borderColor: "#7f1d1d" }}
                onClick={() => {
                  if (window.confirm(`Delete "${meta.name}"? This cannot be undone.`)) {
                    deleteProject(meta.id);
                    refresh();
                  }
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {used > 0 && (
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          Using about {Math.round(used / 1024)} KB of browser storage.
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </main>
  );
}
