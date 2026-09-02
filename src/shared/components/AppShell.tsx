import { useMemo, useRef, useState } from "react";
import { STITCH_LIST } from "../../features/stitches/stitches";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useWorkspace } from "../../features/workspace/state/WorkspaceContext";
import { readProjectFile, saveProjectAs } from "../../features/project/storage";
import HotkeyEditorModal from "../../features/workspace/components/HotkeyEditorModal";

type MenuKey = "file" | "edit" | "languages" | "info" | null;
type LanguageKey = "English" | "German" | "French";

export default function AppShell() {
  const { state, dispatch } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [language, setLanguage] = useState<LanguageKey>("English");
  const [showHotkeyEditor, setShowHotkeyEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const title = useMemo(() => {
    if (location.pathname === "/create") return "New Pattern";
    if (location.pathname === "/workspace") return "Workspace";
    if (location.pathname === "/library") return "Library";
    if (location.pathname === "/settings") return "Settings";
    return "KnitGrid";
  }, [location.pathname]);

  const closeMenus = () => setOpenMenu(null);

  const handleLoadClick = () => {
    closeMenus();
    fileInputRef.current?.click();
  };

  const handleSaveClick = async () => {
    closeMenus();

    try {
      await saveProjectAs(state);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save project.";
      window.alert(message);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const project = await readProjectFile(file);
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
                  onClick={handleSaveClick}
                >
                  Save
                </button>
                <button
                  type="button"
                  style={menuItemStyle}
                  onClick={handleLoadClick}
                >
                  Load
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
            <span title={`${STITCH_LIST.length} stitches in the table`}>
              v0.4.2-dev · {STITCH_LIST.length} stitches
            </span>
            <span>{language}</span>
          </div>
        </div>

        <div
          style={{
            padding: "8px 12px",
            fontSize: 13,
            color: "#94a3b8",
            background: "#0f172a",
          }}
        >
          {title}
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
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