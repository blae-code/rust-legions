import React from "react";
import { nodeById } from "@/lib/macro/graph";

// Route styling by quality grade — highways broad and solid, trails thin and dashed
const STYLES = {
  highway: { width: 0.9, dash: null, color: "hsl(30 9% 42%)" },
  road: { width: 0.6, dash: null, color: "hsl(30 9% 36%)" },
  track: { width: 0.45, dash: "1.6 1", color: "hsl(30 9% 32%)" },
  trail: { width: 0.3, dash: "0.8 1", color: "hsl(30 9% 28%)" },
};

export default function RouteEdge({ route, highlighted }) {
  const [a, b, miles, quality] = route;
  const A = nodeById(a), B = nodeById(b);
  const s = STYLES[quality];
  const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
  return (
    <g>
      <line x1={A.x} y1={A.y} x2={B.x} y2={B.y}
        stroke={highlighted ? "hsl(41 78% 58%)" : s.color}
        strokeWidth={highlighted ? s.width + 0.35 : s.width}
        strokeDasharray={s.dash || undefined} strokeLinecap="round" />
      <text x={mx} y={my - 0.8} textAnchor="middle" fontSize="1.7"
        fill={highlighted ? "hsl(41 78% 58%)" : "hsl(30 9% 46%)"} fontFamily="IBM Plex Mono, monospace">
        {miles} MI
      </text>
    </g>
  );
}