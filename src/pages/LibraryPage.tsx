import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { readProjectFile } from "../features/project/storage";
import { useWorkspace } from "../features/workspace/state/WorkspaceContext";

export default function LibraryPage() {
  const navigate = useNavigate();
  const { dispatch } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const project = await readProjectFile(file);
      dispatch({ type: "LOAD_PROJECT", project });
      navigate("/workspace");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not read that file."
      );
    } finally {
      event.target.value = "";
    }
  };

  return (
    <main style={{ display: "grid", gap: 24, color: "#e5e7eb" }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button type="button" onClick={() => navigate("/")}>
          Home
        </button>
      </div>

      <section
        style={{
          display: "grid",
          gap: 16,
          padding: 32,
          borderRadius: 12,
          border: "1px solid #374151",
          background: "#111827",
          justifyItems: "center",
          textAlign: "center",
        }}
      >
        <h2 style={{ margin: 0, color: "#f8fafc" }}>Library</h2>

        <p style={{ margin: 0, maxWidth: 480, color: "#cbd5e1" }}>
          Saved projects will be listed here. For now, open a project file from
          disk, or start a new chart from the workspace.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "#1d4ed8",
              color: "#eff6ff",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Load from file
          </button>

          <button
            type="button"
            onClick={() => navigate("/workspace")}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "#1f2937",
              color: "#e5e7eb",
              fontWeight: 600,
              border: "1px solid #374151",
              cursor: "pointer",
            }}
          >
            Open Workspace
          </button>
        </div>

        {error && (
          <p style={{ margin: 0, color: "#fca5a5", fontSize: 14 }}>{error}</p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </section>
    </main>
  );
}
