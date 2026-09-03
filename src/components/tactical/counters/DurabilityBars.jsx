import React from "react";

// The layer bars stacked at the foot of a counter's portrait, in depletion
// order: protection first, health last and thickest. A stand with no plate
// shows only a health bar, which is the whole point — it has nothing to lose
// before its men.
export default function DurabilityBars({ layers, x, y, width }) {
  const { protection, health, exposed } = layers;
  const PH = 1.3; // protection bar
  const HH = 2.0; // health bar
  const top = y - (protection.length * (PH + 0.35) + HH);

  return (
    <g>
      <rect
        x={x}
        y={top - 0.6}
        width={width}
        height={protection.length * (PH + 0.35) + HH + 1.2}
        fill="#0E1113"
        opacity="0.72"
      />

      {protection.map((l, i) => {
        const by = top + i * (PH + 0.35);
        const f = l.max > 0 ? Math.max(0, l.cur / l.max) : 0;
        return (
          <g key={l.key}>
            <rect x={x} y={by} width={width} height={PH} fill="#22262A" />
            <rect x={x} y={by} width={width * f} height={PH} fill={l.tone} />
            {/* a beaten-in layer keeps a hatched ghost so you can see it existed */}
            {f <= 0 && <rect x={x} y={by} width={width} height={PH} fill={l.tone} opacity="0.16" />}
          </g>
        );
      })}

      <rect x={x} y={top + protection.length * (PH + 0.35)} width={width} height={HH} fill="#22262A" />
      <rect
        x={x}
        y={top + protection.length * (PH + 0.35)}
        width={width * health.frac}
        height={HH}
        fill={health.tone}
      />

      {/* exposed: all protection gone, every further hit lands on the men */}
      {exposed && (
        <rect x={x - 0.8} y={top - 1} width={width + 1.6} height={protection.length * (PH + 0.35) + HH + 2} fill="none" stroke="#E2483A" strokeWidth="0.5" strokeDasharray="1.5 1.2" />
      )}
    </g>
  );
}