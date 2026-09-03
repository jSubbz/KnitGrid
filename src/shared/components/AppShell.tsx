import { useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useWorkspace } from "../../features/workspace/state/WorkspaceContext";
import { buildPatternFile, readPatternFile } from "../../features/project/patternFile";
import HotkeyEditorModal from "../../features/workspace/components/HotkeyEditorModal";

type MenuKey = "file" | "edit" | "languages" | "info" | null;
type LanguageKey = "English" | "German" | "French";

export default function AppShell() {
  const { state, dispatch } = useWorkspace();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [language, setLanguage] = useState<LanguageKey>("English");
  const [showHotkeyEditor, setShowHotkeyEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const closeMenus = () => setOpenMenu(null);

  const handleLoadClick = () => {
    closeMenus();
    fileInputRef.current?.click();
  };

  const handleSavePattern = () => {
    closeMenus();
    const name = (state.name || state.yarn.yarnName || "pattern")
      .replace(/[^\w -]/g, "")
      .trim() || "pattern";
    const blob = new Blob([buildPatternFile(state)], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${name}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const project = readPatternFile(await file.text());
      dispatch({ type: "LOAD_PROJECT", project });
      navigate("/workspace");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load project.";
      window.alert(message);
    } finally {
      event.target.value = "";
    }
  };

  const buttonStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    color: "#e5e7eb",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: 14,
  };

  const menuPanelStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: 0,
    minWidth: 200,
    background: "#111827",
    border: "1px solid #374151",
    boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
    zIndex: 20,
    display: "grid",
  };

  const menuItemStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    textAlign: "left",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: 14,
    color: "#e5e7eb",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        color: "#e5e7eb",
      }}
      onClick={() => {
        if (openMenu) closeMenus();
      }}
    >
      <header
        style={{
          borderBottom: "1px solid #374151",
          background: "#0f172a",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            minHeight: 34,
            padding: "0 8px",
            borderBottom: "1px solid #374151",
            background: "#111827",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div style={{ position: "relative" }}>
            <button
              type="button"
              style={buttonStyle}
              onClick={() => setOpenMenu(openMenu === "file" ? null : "file")}
            >
              File
            </button>
            {openMenu === "file" && (
              <div style={menuPanelStyle}>
                <button
                  type="button"
                  style={menuItemStyle}
                  onClick={() => {
                    closeMenus();
                    navigate("/create");
                  }}
                >
                  New
                </button>
                <button
                  type="button"
                  style={menuItemStyle}
                  onClick={handleSavePattern}
                >
                  Save pattern...
                </button>
                <button
                  type="button"
                  style={menuItemStyle}
                  onClick={handleLoadClick}
                >
                  Load pattern...
                </button>
                <button
                  type="button"
                  style={menuItemStyle}
                  onClick={() => {
                    closeMenus();
                    navigate("/print");
                  }}
                >
                  Print...
                </button>


              </div>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <button
              type="button"
              style={buttonStyle}
              onClick={() => setOpenMenu(openMenu === "edit" ? null : "edit")}
            >
              Edit
            </button>
            {openMenu === "edit" && (
              <div style={menuPanelStyle}>
                <button
                  type="button"
                  style={menuItemStyle}
                  onClick={() => {
                    closeMenus();
                    setShowHotkeyEditor(true);
                  }}
                >
                  Hotkeys
                </button>
              </div>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <button
              type="button"
              style={buttonStyle}
              onClick={() =>
                setOpenMenu(openMenu === "languages" ? null : "languages")
              }
            >
              Languages
            </button>
            {openMenu === "languages" && (
              <div style={menuPanelStyle}>
                {(["English", "German", "French"] as LanguageKey[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    style={{
                      ...menuItemStyle,
                      fontWeight: language === item ? 700 : 400,
                    }}
                    onClick={() => {
                      setLanguage(item);
                      window.alert(`${item} selected. Translation wiring can come next.`);
                      closeMenus();
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <button
              type="button"
              style={buttonStyle}
              onClick={() => setOpenMenu(openMenu === "info" ? null : "info")}
            >
              Info
            </button>
            {openMenu === "info" && (
              <div style={menuPanelStyle}>
                <button
                  type="button"
                  style={menuItemStyle}
                  onClick={() => {
                    window.alert(
                      "Start here:\n\nOpen a starter chart from the Library, or use File -> New to begin your own pattern."
                    );
                    closeMenus();
                  }}
                >
                  Tutorial Info
                </button>
                <button
                  type="button"
                  style={menuItemStyle}
                  onClick={() => {
                    window.alert(
                      "KnitGrid\nDevelopment build\nWorkspace, Library, and tiling are in active development."
                    );
                    closeMenus();
                  }}
                >
                  Developer Info
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              marginLeft: "auto",
              paddingRight: 8,
              fontSize: 13,
              color: "#94a3b8",
              display: "flex",
              gap: 12,
            }}
          >
            <span>v0.7.1-dev</span>
            <span>{language}</span>
          </div>
        </div>

      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm,.json,application/json,text/html"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {showHotkeyEditor && (
        <HotkeyEditorModal onClose={() => setShowHotkeyEditor(false)} />
      )}

      <div style={{ padding: 12 }}>
        <Outlet />
      </div>
    </div>
  );
}