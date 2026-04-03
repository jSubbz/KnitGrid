import { useNavigate } from "react-router-dom";
import { patternListings } from "../features/patternZone/patterns";

export default function HomePage() {
  const navigate = useNavigate();
  const highlights = patternListings.filter((pattern) => pattern.featured).slice(0, 3);

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
            Browse patterns for sale, or use <strong>File → New</strong> to start a pattern yourself.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <button
              type="button"
              onClick={() => navigate("/patterns")}
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
              Browse Pattern Zone
            </button>

            <div
              style={{
                display: "inline-block",
                width: "fit-content",
                padding: "10px 14px",
                borderRadius: 8,
                background: "#1f2937",
                color: "#e5e7eb",
                fontWeight: 600,
              }}
            >
              Start here! See Info → Tutorial Info
            </div>
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2
          style={{
            margin: 0,
            color: "#f8fafc",
            fontSize: 24,
          }}
        >
          Highlights from patterns for sale
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {highlights.map((pattern) => (
            <article
              key={pattern.id}
              onClick={() => navigate("/patterns")}
              style={{
                padding: 18,
                borderRadius: 12,
                border: "1px solid #374151",
                background: "#111827",
                display: "grid",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  height: 140,
                  borderRadius: 8,
                  background:
                    "linear-gradient(135deg, rgba(59,130,246,0.20), rgba(168,85,247,0.20))",
                  border: "1px solid #1f2937",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "baseline",
                }}
              >
                <h3 style={{ margin: 0, color: "#f8fafc", fontSize: 18 }}>
                  {pattern.title}
                </h3>
                <span style={{ color: "#93c5fd", fontWeight: 700 }}>
                  ${pattern.price}
                </span>
              </div>
              <p style={{ margin: 0, color: "#cbd5e1", fontSize: 14 }}>
                {pattern.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}