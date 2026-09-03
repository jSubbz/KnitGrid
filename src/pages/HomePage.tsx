import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <main
      style={{
        display: "grid",
        gap: 24,
        color: "var(--text)",
      }}
    >
      <section
        style={{
          padding: 28,
          border: "1px solid var(--border)",
          borderRadius: 12,
          background: "linear-gradient(135deg, var(--raised), var(--surface))",
        }}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 42,
              lineHeight: 1.1,
              color: "var(--text-strong)",
            }}
          >
            KnitGrid
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: 720,
              color: "var(--text-soft)",
              fontSize: 16,
            }}
          >
            A knitting chart editor. It counts your stitches, and flags the
            rows that don't add up. Cast on, type a row, and the next row is
            worked out from what that row produced.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <button
              type="button"
              onClick={() => navigate("/create")}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "var(--accent)",
                color: "var(--on-accent)",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              New pattern
            </button>

            <button
              type="button"
              onClick={() => navigate("/info", { state: { pane: "start" } })}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "var(--raised)",
                color: "var(--text)",
                fontWeight: 600,
                border: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              Getting started
            </button>
          </div>
        </div>
      </section>

    </main>
  );
}
