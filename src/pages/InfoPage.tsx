/**
 * Info: how to start, why the program exists, and where a bug goes.
 *
 * The About text is Jay's, first person on purpose - a small program by one
 * person should say so rather than talking about itself in the third person.
 * It lives in the locale files with everything else, so translating the page
 * is the same job as translating the menus.
 */
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Segmented from "../shared/components/Segmented";
import RichText from "../shared/components/RichText";
import FeedbackForm from "../features/feedback/FeedbackForm";
import { REPO_URL } from "../features/feedback/feedback";
import { t } from "../features/i18n/i18n";
import { useLanguage } from "../features/i18n/useLanguage";

type Pane = "start" | "about" | "feedback";

const page: React.CSSProperties = {
  display: "grid",
  gap: 20,
  maxWidth: 780,
  margin: "0 auto",
  color: "var(--text-soft)",
  lineHeight: 1.6,
};

const sub: React.CSSProperties = {
  color: "var(--text-strong)",
  margin: "22px 0 6px 0",
  fontSize: 16,
};

function P({ children }: { children: string }) {
  return (
    <p style={{ margin: "0 0 12px 0" }}>
      <RichText>{children}</RichText>
    </p>
  );
}

function Step({ n }: { n: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 12 }}>
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 999,
          background: "var(--accent)",
          color: "var(--on-accent)",
          display: "grid",
          placeItems: "center",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {n}
      </div>
      <div>
        <div style={{ color: "var(--text-strong)", fontWeight: 600 }}>
          {t(`info.step${n}Title`)}
        </div>
        <div>
          <RichText>{t(`info.step${n}Body`)}</RichText>
        </div>
      </div>
    </div>
  );
}

function GettingStarted() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <p style={{ margin: 0 }}>{t("info.startIntro")}</p>
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <Step key={n} n={n} />
      ))}
      <p style={{ margin: "8px 0 0 0", color: "var(--muted)" }}>
        {t("info.startFooter")}
      </p>
    </div>
  );
}

function About() {
  return (
    <div>
      <h2 style={{ ...sub, marginTop: 0, fontSize: 20 }}>{t("info.whyTitle")}</h2>
      <P>{t("info.why1")}</P>
      <P>{t("info.why2")}</P>
      <P>{t("info.why3")}</P>

      <h3 style={sub}>{t("info.noServerTitle")}</h3>
      <P>{t("info.noServer1")}</P>
      <P>{t("info.noServer2")}</P>

      <h3 style={sub}>{t("info.noAiTitle")}</h3>
      <P>{t("info.noAi1")}</P>

      <h3 style={sub}>{t("info.whoForTitle")}</h3>
      <P>{t("info.whoFor1")}</P>

      <h3 style={sub}>{t("info.devTitle")}</h3>
      <P>{t("info.dev1")}</P>
      <P>{t("info.dev2")}</P>
      <P>{t("info.dev3")}</P>
      <p style={{ margin: 0 }}>
        {t("info.dev4")}{" "}
        <a
          style={{ color: "var(--link)" }}
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
        >
          {REPO_URL.replace("https://", "")}
        </a>
      </p>
    </div>
  );
}

export default function InfoPage() {
  const location = useLocation();
  useLanguage();
  const requested = (location.state as { pane?: Pane } | null)?.pane ?? "start";
  const [pane, setPane] = useState<Pane>(requested);

  // Coming from the Info menu while already on this page navigates to the same
  // route, so the component is never remounted and the initial state is stale.
  // The location key changes on every navigation, which is the signal to obey.
  useEffect(() => {
    setPane(requested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  return (
    <main style={page}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Segmented<Pane>
          options={[
            { value: "start", label: t("info.tabStart") },
            { value: "about", label: t("info.tabAbout") },
            { value: "feedback", label: t("info.tabFeedback") },
          ]}
          value={pane}
          onChange={setPane}
        />
      </div>

      {pane === "start" && <GettingStarted />}
      {pane === "about" && <About />}
      {pane === "feedback" && <FeedbackForm />}
    </main>
  );
}
