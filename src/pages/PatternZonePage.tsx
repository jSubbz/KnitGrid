import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  buildProjectFromPattern,
  patternListings,
  type PatternListing,
} from "../features/patternZone/patterns";
import { useWorkspace } from "../features/workspace/state/WorkspaceContext";

const FAVORITES_KEY = "knitgrid.pattern-favorites.v1";

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value) => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

export default function PatternZonePage() {
  const navigate = useNavigate();
  const { dispatch } = useWorkspace();
  const [query, setQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());
  const [selectedPattern, setSelectedPattern] = useState<PatternListing | null>(null);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredPatterns = useMemo(() => {
    return patternListings.filter((pattern) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        pattern.title.toLowerCase().includes(normalizedQuery) ||
        pattern.designer.toLowerCase().includes(normalizedQuery) ||
        pattern.category.toLowerCase().includes(normalizedQuery) ||
        pattern.description.toLowerCase().includes(normalizedQuery) ||
        pattern.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

      const matchesFavorites =
        !showFavoritesOnly || favorites.includes(pattern.id);

      return matchesQuery && matchesFavorites;
    });
  }, [normalizedQuery, showFavoritesOnly, favorites]);

  const featured = useMemo(
    () =>
      filteredPatterns
        .filter((pattern) => pattern.featured)
        .sort((a, b) => b.rating - a.rating),
    [filteredPatterns]
  );

  const topToday = useMemo(
    () =>
      filteredPatterns
        .filter((pattern) => pattern.topToday)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10),
    [filteredPatterns]
  );

  const catalog = useMemo(
    () =>
      [...filteredPatterns].sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.title.localeCompare(b.title);
      }),
    [filteredPatterns]
  );

  const showSearchResults = normalizedQuery.length > 0 || showFavoritesOnly;

  const toggleFavorite = (patternId: string) => {
    setFavorites((current) =>
      current.includes(patternId)
        ? current.filter((id) => id !== patternId)
        : [...current, patternId]
    );
  };

  const openPatternInWorkspace = (pattern: PatternListing) => {
    const project = buildProjectFromPattern(pattern);
    dispatch({ type: "LOAD_PROJECT", project });
    navigate("/workspace");
  };

  const Card = ({ pattern }: { pattern: PatternListing }) => (
    <article
      style={{
        display: "grid",
        gap: 10,
        padding: 16,
        borderRadius: 12,
        border: "1px solid #374151",
        background: "#111827",
      }}
    >
      <button
        type="button"
        onClick={() => setSelectedPattern(pattern)}
        style={{
          height: 120,
          borderRadius: 8,
          background:
            "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(59,130,246,0.18))",
          border: "1px solid #1f2937",
          cursor: "pointer",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <strong style={{ color: "#f8fafc" }}>{pattern.title}</strong>
        <button
          type="button"
          onClick={() => toggleFavorite(pattern.id)}
          aria-label={favorites.includes(pattern.id) ? "Remove favorite" : "Add favorite"}
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

      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <span style={{ color: "#93c5fd", fontWeight: 700 }}>
          ${pattern.price}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setSelectedPattern(pattern)}>
            Details
          </button>
          <button
            type="button"
            onClick={() => openPatternInWorkspace(pattern)}
          >
            Open in Workspace
          </button>
        </div>
      </div>
    </article>
  );

  return (
    <main style={{ display: "grid", gap: 24, color: "#e5e7eb" }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button type="button" onClick={() => navigate("/")}>
          Home
        </button>
      </div>

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
        <p style={{ margin: 0, color: "#cbd5e1" }}>
          Browse featured patterns, search the catalog, save favorites, and open a pattern directly into the workspace.
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

      {!showSearchResults && featured.length > 0 && (
        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, color: "#f8fafc" }}>Featured</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {featured.map((pattern) => (
              <Card key={pattern.id} pattern={pattern} />
            ))}
          </div>
        </section>
      )}

      {!showSearchResults && topToday.length > 0 && (
        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, color: "#f8fafc" }}>Top Ten Today</h2>
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
                  gridTemplateColumns: "56px 1fr auto auto auto",
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

                <button
                  type="button"
                  onClick={() => setSelectedPattern(pattern)}
                  style={{
                    background: "transparent",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <div style={{ color: "#f8fafc", fontWeight: 600 }}>
                    {pattern.title}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 13 }}>
                    {pattern.designer} · {pattern.category} · ★ {pattern.rating}
                  </div>
                </button>

                <div style={{ color: "#93c5fd", fontWeight: 700 }}>
                  ${pattern.price}
                </div>

                <button
                  type="button"
                  onClick={() => toggleFavorite(pattern.id)}
                >
                  {favorites.includes(pattern.id) ? "★" : "☆"}
                </button>

                <button
                  type="button"
                  onClick={() => openPatternInWorkspace(pattern)}
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, color: "#f8fafc" }}>
          {showSearchResults ? "Search Results" : "Catalog"}
        </h2>

        {catalog.length === 0 ? (
          <div
            style={{
              padding: 18,
              borderRadius: 12,
              border: "1px solid #374151",
              background: "#111827",
              color: "#cbd5e1",
            }}
          >
            No patterns matched that search.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {catalog.map((pattern) => (
              <Card key={pattern.id} pattern={pattern} />
            ))}
          </div>
        )}
      </section>

      {selectedPattern && (
        <div
          onClick={() => setSelectedPattern(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "grid",
            placeItems: "center",
            padding: 20,
            zIndex: 50,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(640px, 100%)",
              display: "grid",
              gap: 14,
              padding: 20,
              borderRadius: 16,
              border: "1px solid #374151",
              background: "#111827",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, color: "#f8fafc" }}>
                  {selectedPattern.title}
                </h2>
                <div style={{ color: "#94a3b8", marginTop: 4 }}>
                  {selectedPattern.designer} · {selectedPattern.category} · ★ {selectedPattern.rating}
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleFavorite(selectedPattern.id)}
              >
                {favorites.includes(selectedPattern.id) ? "★ Favorite" : "☆ Favorite"}
              </button>
            </div>

            <div
              style={{
                height: 180,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, rgba(59,130,246,0.20), rgba(168,85,247,0.20))",
                border: "1px solid #1f2937",
              }}
            />

            <p style={{ margin: 0, color: "#cbd5e1" }}>
              {selectedPattern.description}
            </p>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {selectedPattern.tags.map((tag) => (
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

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ color: "#93c5fd", fontWeight: 700, fontSize: 18 }}>
                ${selectedPattern.price}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setSelectedPattern(null)}>
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => openPatternInWorkspace(selectedPattern)}
                >
                  Open in Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}