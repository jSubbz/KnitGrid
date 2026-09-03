import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <main
      style={{
        display: "grid",
        gap: 24,
        color: "#e5e7eb",
      }}
    >
      <section
        style={{
          padding: 28,
          border: "1px solid #374151",
          borderRadius: 12,
          background:
            "linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.98))",
        }}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 42,
              lineHeight: 1.1,
              color: "#f8fafc",
            }}
          >
            KnitGrid
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: 720,
              color: "#cbd5e1",
              fontSize: 16,
            }}
          >
            Chart knitting patterns on a grid. The shape comes from the stitches:
            cast on, type a row, and the next row is worked out for you.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <button
              type="button"
              onClick={() => navigate("/create")}
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
              New pattern
            </button>

            <button
              type="button"
              onClick={() => navigate("/patterns")}
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
              My Patterns
            </button>
          </div>
        </div>
      </section>

    </main>
  );
}
