export default function HomePage() {
  const cards = [
    {
      title: "Nordic Snowline",
      price: "$8",
      description: "Graphic winter colorwork pattern with bold repeats.",
    },
    {
      title: "Mountain Fade Mittens",
      price: "$6",
      description: "Compact motif set for mitten and cuff projects.",
    },
    {
      title: "Forest Trail Yoke",
      price: "$10",
      description: "Round-yoke sweater chart with repeating woodland bands.",
    },
  ];

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

          <div
            style={{
              marginTop: 8,
              display: "inline-block",
              width: "fit-content",
              padding: "10px 14px",
              borderRadius: 8,
              background: "#1d4ed8",
              color: "#eff6ff",
              fontWeight: 600,
            }}
          >
            Start here! See Info → Tutorial Info
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
          {cards.map((card) => (
            <article
              key={card.title}
              style={{
                padding: 18,
                borderRadius: 12,
                border: "1px solid #374151",
                background: "#111827",
                display: "grid",
                gap: 8,
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
                  {card.title}
                </h3>
                <span style={{ color: "#93c5fd", fontWeight: 700 }}>
                  {card.price}
                </span>
              </div>
              <p style={{ margin: 0, color: "#cbd5e1", fontSize: 14 }}>
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}