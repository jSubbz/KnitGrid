import { useRef, useState } from "react";
import { LOCALE_LIST, getLanguage, setLanguage, t } from "../../features/i18n/i18n";
import { useLanguage } from "../../features/i18n/useLanguage";
import { Outlet, useNavigate } from "react-router-dom";
import { useWorkspace } from "../../features/workspace/state/WorkspaceContext";
import { buildPatternFile, readPatternFile } from "../../features/project/patternFile";
import HotkeyEditorModal from "../../features/workspace/components/HotkeyEditorModal";
import { APP_VERSION } from "../../features/feedback/feedback";

type MenuKey = "file" | "edit" | "languages" | "info" | null;

export default function AppShell() {
  const { state, dispatch } = useWorkspace();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [showHotkeyEditor, setShowHotkeyEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  useLanguage();

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
    color: "var(--text)",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: 14,
  };

  const menuPanelStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: 0,
    minWidth: 200,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
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
    color: "var(--text)",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
      }}
      onClick={() => {
        if (openMenu) closeMenus();
      }}
    >
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            minHeight: 34,
            padding: "0 8px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface-2)",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div style={{ position: "relative" }}>
            <button
              type="button"
              style={buttonStyle}
              onClick={() => setOpenMenu(openMenu === "file" ? null : "file")}
            >
              {t("file")}
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
                  {t("new")}
                </button>
                <button
                  type="button"
                  style={menuItemStyle}
                  onClick={handleSavePattern}
                >
                  {t("savePattern")}
                </button>
                <button
                  type="button"
                  style={menuItemStyle}
                  onClick={handleLoadClick}
                >
                  {t("loadPattern")}
                </button>
                <button
                  type="button"
                  style={menuItemStyle}
                  onClick={() => {
                    closeMenus();
                    navigate("/print");
                  }}
                >
                  {t("print")}
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
              {t("edit")}
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
                  {t("hotkeys")}
                </button>
                <button
                  type="button"
                  style={menuItemStyle}
                  onClick={() => {
                    closeMenus();
                    navigate("/settings");
                  }}
                >
                  {t("settings")}
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
              {t("languages")}
            </button>
            {openMenu === "languages" && (
              <div style={menuPanelStyle}>
                {LOCALE_LIST.map((locale) => (
                  <button
                    key={locale.code}
                    type="button"
                    style={{
                      ...menuItemStyle,
                      fontWeight: getLanguage() === locale.code ? 700 : 400,
                    }}
                    onClick={() => {
                      setLanguage(locale.code);
                      closeMenus();
                    }}
                  >
                    {locale.name}
                    {!locale.reviewed && (
                      <span style={{ color: "var(--muted)", fontSize: 11 }}> · unchecked</span>
                    )}
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
              {t("info")}
            </button>
            {openMenu === "info" && (
              <div style={menuPanelStyle}>
                {([
                  ["start", t("gettingStarted")],
                  ["about", t("about")],
                  ["feedback", t("submitFeedback")],
                ] as const).map(([pane, text]) => (
                  <button
                    key={pane}
                    type="button"
                    style={menuItemStyle}
                    onClick={() => {
                      closeMenus();
                      navigate("/info", { state: { pane } });
                    }}
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              marginLeft: "auto",
              paddingRight: 8,
              fontSize: 13,
              color: "var(--muted)",
              display: "flex",
              gap: 12,
            }}
          >
            <span>v{APP_VERSION}</span>
            <span>{getLanguage().toUpperCase()}</span>
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