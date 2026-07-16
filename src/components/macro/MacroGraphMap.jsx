import React from "react";
import { MACRO_NODES, NODE_KINDS, nodeById } from "@/lib/macro/graph";
import RouteEdge from "@/components/macro/RouteEdge";

// SVG war-table view of the node-and-route graph. Click a node to set the
// column's origin, click a second to plot the march; camps mark each nightfall.
export default function MacroGraphMap({ routes, origin, dest, plan, onNodeClick }) {
  const onPath = (a, b) =>
    plan?.legs?.some((l) => (l.from === a && l.to === b) || (l.from === b && l.to === a));

  const campPoint = (camp) => {
    const leg = plan.legs[camp.legIndex];
    const A = nodeById(leg.from), B = nodeById(leg.to);
    return { x: A.x + (B.x - A.x) * camp.t, y: A.y + (B.y - A.y) * camp.t };
  };

  return (
    <svg viewBox="0 0 100 70" className="w-full h-full cq-board rounded">
      {routes.map((route, i) => (
        <RouteEdge key={i} route={route} highlighted={onPath(route[0], route[1])} />
      ))}

      {/* Overnight camps along the plotted march */}
      {plan?.camps?.map((camp) => {
        const p = campPoint(camp);
        return (
          <g key={camp.day}>
            <circle cx={p.x} cy={p.y} r="1.1" fill="hsl(26 24% 6%)" stroke="hsl(41 78% 58%)" strokeWidth="0.35" />
            <text x={p.x} y={p.y - 2} textAnchor="middle" fontSize="2.2" fill="hsl(41 78% 58%)" fontFamily="IBM Plex Mono, monospace">
              D{camp.day}
            </text>
          </g>
        );
      })}

      {MACRO_NODES.map((n) => {
        const kind = NODE_KINDS[n.kind];
        const isOrigin = n.id === origin;
        const isDest = n.id === dest;
        return (
          <g key={n.id} onClick={() => onNodeClick(n.id)} className="cursor-pointer">
            {(isOrigin || isDest) && (
              <circle cx={n.x} cy={n.y} r={kind.r + 1.4} fill="none"
                stroke={isOrigin ? "hsl(41 78% 58%)" : "hsl(8 55% 50%)"} strokeWidth="0.4" strokeDasharray="1 0.8" />
            )}
            <circle cx={n.x} cy={n.y} r={kind.r} fill="hsl(25 20% 12%)"
              stroke={isOrigin ? "hsl(41 78% 58%)" : isDest ? "hsl(8 55% 50%)" : "hsl(30 9% 40%)"} strokeWidth="0.45" />
            <circle cx={n.x} cy={n.y} r={kind.r * 0.35} fill={isOrigin || isDest ? "hsl(41 78% 58%)" : "hsl(30 9% 45%)"} />
            <text x={n.x} y={n.y + kind.r + 2.6} textAnchor="middle" fontSize="2.4"
              fill="hsl(35 22% 80%)" fontFamily="Barlow Condensed, sans-serif" letterSpacing="0.15">
              {n.name.toUpperCase()}
            </text>
            <text x={n.x} y={n.y + kind.r + 5} textAnchor="middle" fontSize="1.6"
              fill="hsl(30 9% 50%)" fontFamily="IBM Plex Mono, monospace">
              {NODE_KINDS[n.kind].label.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}