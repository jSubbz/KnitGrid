export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  title?: string;
}

/** Sliding selector. Two options read as a switch, three as a position picker. */
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
  const width = 100 / options.length;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {label && <span style={{ fontSize: 12, color: "#6b7280" }}>{label}</span>}
      <div
        style={{
          position: "relative",
          display: "flex",
          padding: 3,
          borderRadius: 999,
          background: "#0f172a",
          border: "1px solid #374151",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 3,
            bottom: 3,
            left: `calc(${index * width}% + 3px)`,
            width: `calc(${width}% - 6px)`,
            borderRadius: 999,
            background: "#1d4ed8",
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
              minWidth: 84,
              padding: "6px 14px",
              border: "none",
              background: "transparent",
              color: option.value === value ? "#eff6ff" : "#9ca3af",
              fontSize: 13,
              fontWeight: option.value === value ? 600 : 400,
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
