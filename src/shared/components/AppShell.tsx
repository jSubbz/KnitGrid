import { useMemo, useRef, useState } from "react";
import { STITCH_LIST } from "../../features/stitches/stitches";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useWorkspace } from "../../features/workspace/state/WorkspaceContext";
import { readProjectFile, saveProjectAs } from "../../features/project/storage";
import { StorageFullError, saveProject } from "../../features/project/projectStore";
import HotkeyEditorModal from "../../features/workspace/components/HotkeyEditorModal";

type MenuKey = "file" | "edit" | "languages" | "info" | null;
type LanguageKey = "English" | "German" | "French";

export default function AppShell() {
  const { state, dispatch, savedAs, setSavedAs } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [language, setLanguage] = useState<LanguageKey>("English");
  const [showHotkeyEditor, setShowHotkeyEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const title = useMemo(() => {
    if (location.pathname === "/create") return "New Pattern";
    if (location.pathname === "/workspace") return "Workspace";
    if (location.pathname === "/patterns") return "My Patterns";
    if (location.pathname === "/print") return "Save Pattern";
    if (location.pathname === "/settings") return "Settings";
    return "KnitGrid";
  }, [location.pathname]);

  const closeMenus = () => setOpenMenu(null);

  const handleLoadClick = () => {
    closeMenus();
    fileInputRef.current?.click();
  };

  // Three different things a knitter might mean by "save", kept apart:
  //   Save pattern      - the printable chart and written pattern, for paper
  //   Backup on browser - localStorage, instant, updates the same entry
  //   Export JSON       - the interchange format, for handing to another knitter
  // Called a backup rather than a save on purpose: it lives in one browser on
  // one machine and clearing site data destroys it, so the name should not
  // suggest the pattern is safe.
  const handleBackup = (askForName: boolean) => {
    closeMenus();
    const suggested = savedAs?.name ?? state.yarn.yarnName ?? "";
    const name = askForName || !savedAs
      ? window.prompt("Name this browser backup:", suggested || "Untitled")
      : savedAs.name;
    if (!name) return;

    try {
      const meta = saveProject(state, name, askForName ? undefined : savedAs?.id);
      setSavedAs({ id: meta.id, name: meta.name });
    } catch (error) {
      window.alert(
        error instanceof StorageFullError
          ? error.message
          : "Could not back up this pattern."
      );
    }
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
      setSavedAs(null);
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

  const menuSeparatorStyle: React.CSSProperties = {
    height: 1,
    background: "#374151",
    margin: "4px 0",
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
                  onClick={() => {
                    closeMenus();
                    navigate("/print");
                  }}
                >
                  Save pattern...
                </button>

                <div style={menuSeparatorStyle} />

                <button
                  type="button"
                  style={menuItemStyle}
                  onClick={() => handleBackup(false)}
                >
                  Backup on browser{savedAs ? `: ${savedAs.name}` : ""}
                </button>
                <button
                  type="button"
                  style={menuItemStyle}
                  onClick={() => handleBackup(true)}
                >
                  Backup as...
                </button>
                <button
                  type="button"
                  style={menuItemStyle}
                  onClick={() => {
                    closeMenus();
                    navigate("/patterns");
                  }}
                >
                  My Patterns
                </button>
                <div
                  style={{
                    padding: "2px 12px 8px",
                    fontSize: 11,
                    color: "#9ca3af",
                    maxWidth: 220,
                    lineHeight: 1.4,
                  }}
                >
                  Browser backups are convenience only. Clearing site data
                  deletes them. Save the pattern or export the JSON for anything
                  you need to keep.
                </div>

                <div style={menuSeparatorStyle} />

                <button
                  type="button"
                  style={menuItemStyle}
                  onClick={handleSaveClick}
                >
                  Export JSON...
                </button>
                <button
                  type="button"
                  style={menuItemStyle}
                  onClick={handleLoadClick}
                >
                  Import JSON...
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
              v0.5.1-dev · {STITCH_LIST.length} stitches
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