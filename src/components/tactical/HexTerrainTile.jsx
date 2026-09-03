import React from "react";
import { TERRAIN } from "@/lib/tactical/field";

// One hex of ground: flat token fill, texture pass, elevation shading, deploy
// tint, grid edge and the defender's stamped work. Purely presentational.
export default function HexTerrainTile({ x, y, corners, tile, zone, onHover }) {
  const t = TERRAIN[tile.terrain] || TERRAIN.open;
  const impassable = tile.moveCost === null;

  return (
    <g transform={`translate(${x},${y})`} onMouseEnter={onHover} className="cursor-crosshair">
      <polygon points={corners} fill={t.fill} />
      <polygon points={corners} fill={`url(#tx_${tile.terrain})`} />

      {/* elevation — a rise catches light, a crest catches more and rings itself */}
      {tile.elev > 0 && (
        <polygon points={corners} fill="hsl(40 30% 92%)" opacity={tile.elev === 2 ? 0.14 : 0.07} />
      )}
      {tile.elev === 2 && (
        <polygon points={corners} fill="none" stroke="hsl(var(--brass) / 0.55)" strokeWidth="1.1" strokeDasharray="3 3" />
      )}

      {/* deployment strips */}
      {zone && (
        <polygon
          points={corners}
          fill={zone === "attacker" ? "hsl(var(--rust) / 0.16)" : "hsl(var(--steel) / 0.18)"}
        />
      )}

      {/* works — trench zigzag, bunker with an embrasure slit */}
      {tile.work === "trench" && (
        <path
          d="M-11 5 l5 -4 l5 4 l5 -4 l5 4"
          fill="none"
          stroke="hsl(26 24% 8% / 0.85)"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      )}
      {tile.work === "bunker" && (
        <g>
          <rect x="-8" y="-5" width="16" height="11" rx="1.5" fill="hsl(210 6% 20%)" stroke="hsl(0 0% 0% / 0.7)" strokeWidth="1.2" />
          <rect x="-5" y="-1.5" width="10" height="2.6" fill="hsl(0 0% 0% / 0.85)" />
        </g>
      )}

      <polygon
        points={corners}
        fill="none"
        stroke={impassable ? "hsl(0 0% 0% / 0.6)" : "hsl(40 8% 84% / 0.10)"}
        strokeWidth={impassable ? 1.3 : 0.8}
      />
    </g>
  );
}