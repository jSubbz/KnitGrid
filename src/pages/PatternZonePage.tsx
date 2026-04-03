import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { patternListings } from "../features/patternZone/patterns";

export default function PatternZonePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  const featured = useMemo(
    () => patternListings.filter((pattern) => pattern.featured),
    []
  );

  const topToday = useMemo(
    () => patternListings.filter((pattern) => pattern.topToday),
    []
  );

  const filteredPatterns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return patternListings.filter((pattern) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        pattern.title.toLowerCase().includes(normalizedQuery) ||
        pattern.designer.toLowerCase().includes(normalizedQuery) ||
        pattern.category.toLowerCase().includes(normalizedQuery) ||
        pattern.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

      const matchesFavorites =
        !showFavoritesOnly || favorites.includes(pattern.id);

      return matchesQuery && matchesFavorites;
    });
  }, [query, showFavoritesOnly, favorites]);

  const toggleFavorite = (patternId: string) => {
    setFavorites((current) =>
      current.includes(patternId)
        ? current.filter((id) => id !== patternId)
        : [...current, patternId]
    );
  };

  return (
    <main style={{ display: "grid", gap: 24, color: "#e5e7eb" }}>
      <section
        style={{
          display: "grid",
          gap: 12,
          padding: 20,
          borderRadius: 12,
          border: "1px solid #374151",
          background: "#111827",
        }}
      >
        <h1 style={{ margin: 0, color: "#f8fafc" }}>Pattern Zone</h1>
        <p style={{ margin: 0, color: "#cbd5e1" }}>
          Browse featured patterns, search the catalog, and save favorites.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search patterns, designers, tags..."
            style={{
              minWidth: 280,
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #374151",
              background: "#0f172a",
              color: "#e5e7eb",
            }}
          />
          <button
            type="button"
            onClick={() => setShowFavoritesOnly((value) => !value)}
          >
            {showFavoritesOnly ? "Show All" : "Favorites Only"}
          </button>
        </div>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, color: "#f8fafc" }}>Highlights</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {featured.map((pattern) => (
            <article
              key={pattern.id}
              style={{
                display: "grid",
                gap: 10,
                padding: 16,
                borderRadius: 12,
                border: "1px solid #374151",
                background: "#111827",
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
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong style={{ color: "#f8fafc" }}>{pattern.title}</strong>
                <span style={{ color: "#93c5fd" }}>${pattern.price}</span>
              </div>
              <div style={{ color: "#94a3b8", fontSize: 14 }}>
                {pattern.designer} · {pattern.category}
              </div>
              <p style={{ margin: 0, color: "#cbd5e1", fontSize: 14 }}>
                {pattern.description}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {pattern.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 999,
                      background: "#1f2937",
                      color: "#cbd5e1",
                      fontSize: 12,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, color: "#f8fafc" }}>Top Patterns Today</h2>
        <div
          style={{
            display: "grid",
            gap: 10,
            border: "1px solid #374151",
            borderRadius: 12,
            overflow: "hidden",
            background: "#111827",
          }}
        >
          {topToday.map((pattern, index) => (
            <div
              key={pattern.id}
              style={{
                display: "grid",
                gridTemplateColumns: "56px 1fr auto auto",
                gap: 12,
                alignItems: "center",
                padding: "12px 14px",
                borderBottom:
                  index === topToday.length - 1 ? "none" : "1px solid #1f2937",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  background: "#1d4ed8",
                  color: "#eff6ff",
                  fontWeight: 700,
                }}
              >
                {index + 1}
              </div>
              <div>
                <div style={{ color: "#f8fafc", fontWeight: 600 }}>
                  {pattern.title}
                </div>
                <div style={{ color: "#94a3b8", fontSize: 13 }}>
                  {pattern.designer} · {pattern.category} · ★ {pattern.rating}
                </div>
              </div>
              <div style={{ color: "#93c5fd", fontWeight: 700 }}>
                ${pattern.price}
              </div>
              <button
                type="button"
                onClick={() => toggleFavorite(pattern.id)}
              >
                {favorites.includes(pattern.id) ? "★" : "☆"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, color: "#f8fafc" }}>Browse All</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {filteredPatterns.map((pattern) => (
            <article
              key={pattern.id}
              style={{
                display: "grid",
                gap: 10,
                padding: 16,
                borderRadius: 12,
                border: "1px solid #374151",
                background: "#111827",
              }}
            >
              <div
                style={{
                  height: 120,
                  borderRadius: 8,
                  background:
                    "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(59,130,246,0.18))",
                  border: "1px solid #1f2937",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong style={{ color: "#f8fafc" }}>{pattern.title}</strong>
                <button
                  type="button"
                  onClick={() => toggleFavorite(pattern.id)}
                >
                  {favorites.includes(pattern.id) ? "★" : "☆"}
                </button>
              </div>
              <div style={{ color: "#94a3b8", fontSize: 14 }}>
                {pattern.designer} · {pattern.category} · ★ {pattern.rating}
              </div>
              <p style={{ margin: 0, color: "#cbd5e1", fontSize: 14 }}>
                {pattern.description}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ color: "#93c5fd", fontWeight: 700 }}>
                  ${pattern.price}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    window.alert(
                      `Open "${pattern.title}" in workspace is a placeholder for now.`
                    );
                    navigate("/workspace");
                  }}
                >
                  Open in Workspace
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}