/**
 * Settings.
 *
 * Only the two choices that exist are here. An empty page promising more is
 * worse than a short one, and the rule the whole program is designed around -
 * nobody should have to come here to get usable behaviour - means this page
 * stays small on purpose.
 */
import Segmented from "../shared/components/Segmented";
import { LOCALE_LIST, getLanguage, setLanguage, t } from "../features/i18n/i18n";
import { useLanguage } from "../features/i18n/useLanguage";
import { getTheme, setTheme, type Theme } from "../features/theme/theme";
import { useTheme } from "../features/theme/useTheme";

const row: React.CSSProperties = {
  display: "grid",
  gap: 8,
  padding: "16px 0",
  borderTop: "1px solid var(--border)",
};

const hint: React.CSSProperties = { margin: 0, fontSize: 13, color: "var(--muted)" };

export default function SettingsPage() {
  useLanguage();
  useTheme();

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        color: "var(--text)",
        lineHeight: 1.5,
      }}
    >
      <h1 style={{ color: "var(--text-strong)", fontSize: 24, margin: "0 0 6px 0" }}>
        {t("settings.title")}
      </h1>
      <p style={hint}>{t("settings.intro")}</p>

      <h2
        style={{
          color: "var(--text-strong)",
          fontSize: 15,
          margin: "24px 0 0 0",
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        {t("settings.appearance")}
      </h2>

      <div style={row}>
        <div style={{ color: "var(--text-strong)", fontWeight: 600 }}>
          {t("settings.theme")}
        </div>
        <Segmented<Theme>
          options={[
            { value: "system", label: t("settings.themeSystem") },
            { value: "light", label: t("settings.themeLight") },
            { value: "dark", label: t("settings.themeDark") },
          ]}
          value={getTheme()}
          onChange={setTheme}
        />
        <p style={hint}>{t("settings.themeHint")}</p>
      </div>

      <div style={row}>
        <div style={{ color: "var(--text-strong)", fontWeight: 600 }}>
          {t("settings.language")}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {LOCALE_LIST.map((locale) => {
            const active = getLanguage() === locale.code;
            return (
              <button
                key={locale.code}
                type="button"
                onClick={() => setLanguage(locale.code)}
                title={locale.reviewed ? undefined : t("settings.unchecked")}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  background: active ? "var(--accent)" : "var(--raised)",
                  color: active ? "var(--on-accent)" : "var(--text)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {locale.name}
                {!locale.reviewed && <span style={{ opacity: 0.7 }}> *</span>}
              </button>
            );
          })}
        </div>
        <p style={hint}>{t("settings.languageHint")}</p>
      </div>

      <p style={{ ...hint, marginTop: 24 }}>{t("settings.rest")}</p>
    </main>
  );
}
