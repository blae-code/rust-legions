import React from "react";
import { nodeById, NODE_KINDS, routeBetween } from "@/lib/macro/graph";

// Intel layer painted over the macro graph: brass supply arteries and
// signal-red objective reticles on high-value resource nodes. Render between
// the route edges and the node markers; purely decorative (no pointer events).
export default function TacticalOverlay({ overlay }) {
  return (
    <g pointerEvents="none">
      {/* Supply arteries — the routes optimal marches funnel through */}
      {[...overlay.arteries].map((key) => {
        const [a, b] = key.split("|");
        if (!routeBetween(a, b)) return null;
        const A = nodeById(a), B = nodeById(b);
        return (
          <g key={key}>
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              stroke="hsl(41 78% 58% / 0.18)" strokeWidth="2.2" strokeLinecap="round" />
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              stroke="hsl(41 78% 58% / 0.75)" strokeWidth="0.35" strokeDasharray="2.2 1.2" strokeLinecap="round" />
          </g>
        );
      })}

      {/* High-value objectives — corner-bracket reticles with priority marks */}
      {overlay.targets.map((t) => {
        const n = nodeById(t.id);
        const r = NODE_KINDS[n.kind].r + 2.1;
        const c = 1.6; // bracket arm length
        const arm = (sx, sy) => (
          <path
            d={`M ${n.x + sx * r} ${n.y + sy * (r - c)} L ${n.x + sx * r} ${n.y + sy * r} L ${n.x + sx * (r - c)} ${n.y + sy * r}`}
            fill="none" stroke="hsl(4 68% 52%)" strokeWidth="0.4"
          />
        );
        return (
          <g key={t.id} className="cq-flicker">
            {arm(1, 1)}{arm(-1, 1)}{arm(1, -1)}{arm(-1, -1)}
            <text x={n.x + r + 0.8} y={n.y - r + 1.2} fontSize="2"
              fill="hsl(4 68% 52%)" fontFamily="IBM Plex Mono, monospace" fontWeight="600">
              OBJ {t.priority}
            </text>
            <text x={n.x} y={n.y - r - 0.8} textAnchor="middle" fontSize="1.5"
              fill="hsl(4 60% 60%)" fontFamily="IBM Plex Mono, monospace">
              {t.tag}
            </text>
          </g>
        );
      })}

      {/* Legend plate */}
      <g>
        <rect x="1" y="0.8" width="25" height="7" rx="0.5" fill="hsl(210 7% 9% / 0.85)" stroke="hsl(210 6% 20%)" strokeWidth="0.15" />
        <line x1="2.5" y1="3" x2="6.5" y2="3" stroke="hsl(41 78% 58% / 0.75)" strokeWidth="0.35" strokeDasharray="1.4 0.8" />
        <text x="7.5" y="3.6" fontSize="1.6" fill="hsl(41 60% 65%)" fontFamily="IBM Plex Mono, monospace">SUPPLY ARTERY</text>
        <path d="M 3 5.2 L 2.5 5.2 L 2.5 6.2 L 3 6.2 M 5.5 5.2 L 6 5.2 L 6 6.2 L 5.5 6.2"
          fill="none" stroke="hsl(4 68% 52%)" strokeWidth="0.3" />
        <text x="7.5" y="6.3" fontSize="1.6" fill="hsl(4 60% 60%)" fontFamily="IBM Plex Mono, monospace">CAPTURE OBJECTIVE</text>
      </g>
    </g>
  );
}