import type { StitchDef } from "./stitches";

/**
 * Draws a stitch.
 *
 * The stroke slants the way the stitch leans in the fabric, and carries a plus
 * for an increase or a minus for a decrease, so direction and effect are both
 * readable at a glance without knowing the abbreviations. Stitches with no lean
 * fall back to their text glyph.
 */
export default function StitchGlyph({
  stitch,
  size = 18,
  color = "#111827",
}: {
  stitch: StitchDef;
  size?: number;
  color?: string;
}) {
  const { lean, category } = stitch;

  if (!lean) {
    return (
      <span style={{ fontSize: 12, color, lineHeight: 1 }}>{stitch.glyph}</span>
    );
  }

  const pad = 3;
  const top = pad;
  const bottom = size - pad;
  const left = pad;
  const right = size - pad;

  // A right-leaning stitch travels up to the right; a left-leaning one up to
  // the left. Centred decreases get a chevron, since they pull from both sides.
  const stroke =
    lean === "center"
      ? `M ${left} ${bottom} L ${size / 2} ${top} L ${right} ${bottom}`
      : lean === "right"
        ? `M ${left} ${bottom} L ${right} ${top}`
        : `M ${right} ${bottom} L ${left} ${top}`;

  const badge =
    category === "increase" ? "+" : category === "decrease" ? "−" : null;

  // Tucked into the corner the stroke leaves empty.
  const badgeX = lean === "right" ? left + 1.5 : lean === "left" ? right - 1.5 : size / 2;
  const badgeY = lean === "center" ? bottom - 0.5 : top + 5;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <path
        d={stroke}
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {badge && (
        <text
          x={badgeX}
          y={badgeY}
          fontSize={8}
          fill={color}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {badge}
        </text>
      )}
    </svg>
  );
}
