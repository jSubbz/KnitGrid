export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  title?: string;
}

/**
 * Sliding selector. Two options read as a switch, three as a position picker.
 *
 * The track is a grid of equal columns so every segment is the same width
 * whatever its label, which is what lets the pill be positioned by arithmetic.
 * That arithmetic has to subtract the track's own padding: a percentage on an
 * absolutely positioned child resolves against the padding box, not the space
 * the buttons actually sit in, so 100%/n is a few pixels wider than a column
 * and the error compounds along the row.
 */
export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}) {
  const index = Math.max(0, options.findIndex((option) => option.value === value));
  const pad = 3;
  const column = `((100% - ${pad * 2}px) / ${options.length})`;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {label && <span style={{ fontSize: 12, color: "var(--muted)" }}>{label}</span>}
      <div
        style={{
          position: "relative",
          display: "inline-grid",
          gridTemplateColumns: `repeat(${options.length}, 1fr)`,
          padding: pad,
          borderRadius: 999,
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: pad,
            bottom: pad,
            left: `calc(${pad}px + ${index} * ${column})`,
            width: `calc(${column})`,
            borderRadius: 999,
            background: "var(--accent)",
            transition: "left 140ms ease",
          }}
        />
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            title={option.title}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            style={{
              position: "relative",
              padding: "6px 16px",
              border: "none",
              background: "transparent",
              color: option.value === value ? "var(--on-accent)" : "var(--muted)",
              fontSize: 13,
              // Constant weight: a bold selected label is wider than an
              // unselected one, so varying it resizes the columns under the
              // pill every time the selection moves.
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
