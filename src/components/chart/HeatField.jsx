import React from "react";
import { DOMINANT_META } from "@/lib/macro/hotspots";

// The staff's heat wash — soft blooms of pressure laid under the chart's ink.
export default function HeatField({ hotspots = [] }) {
  return (
    <g style={{ pointerEvents: "none" }}>
      {hotspots.map((h) => {
        const color = DOMINANT_META[h.dominant].color;
        const r = 26 + h.heat * 52;
        return (
          <g key={h.id}>
            <circle cx={h.node.x} cy={h.node.y} r={r} fill={color} opacity={0.07 + h.heat * 0.16} style={{ filter: "blur(9px)" }} />
            <circle cx={h.node.x} cy={h.node.y} r={r * 0.45} fill={color} opacity={0.08 + h.heat * 0.2} style={{ filter: "blur(5px)" }} />
            {h.heat > 0.55 && (
              <circle cx={h.node.x} cy={h.node.y} r={r * 0.7} fill="none" stroke={color} strokeWidth="0.7" strokeDasharray="3 5" opacity="0.5">
                <animate attributeName="r" values={`${r * 0.6};${r * 0.85};${r * 0.6}`} dur="3.4s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}
    </g>
  );
}