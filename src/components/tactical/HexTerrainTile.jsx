import React from "react";
import { TOPO_FILL, INK } from "@/lib/tactical/topoStyle";
import TerrainGlyph from "./topo/TerrainGlyph";

// One hex of surveyed ground: paper tint, hatched fill, contour shading, the
// terrain's map symbol, deploy tint and any stamped work. Purely presentational
// — the grid is ruled over the whole sheet by TopoGrid, not per hex.
const HATCH = {
  woods: "topo_woods",
  field: "topo_field",
  hedgerow: "topo_woods",
  water: "topo_water",
  marsh: "topo_marsh",
  building: "topo_urban",
  ruins: "topo_urban",
  rubble: "topo_urban",
  wall: "topo_solid",
  precursor_wall: "topo_solid",
  hill: "topo_hachure",
};

export default function HexTerrainTile({ x, y, corners, tile, zone, q, r, onHover }) {
  const impassable = tile.moveCost === null;
  const hatch = HATCH[tile.terrain];

  return (
    <g transform={`translate(${x},${y})`} onMouseEnter={onHover} className="cursor-crosshair">
      <polygon points={corners} fill={TOPO_FILL[tile.terrain] || TOPO_FILL.open} />
      {hatch && <polygon points={corners} fill={`url(#${hatch})`} />}

      {/* relief — a rise is shaded, a crest is ringed with a contour */}
      {tile.elev > 0 && (
        <polygon points={corners} fill={INK.contour} opacity={tile.elev === 2 ? 0.18 : 0.09} />
      )}
      {tile.elev === 2 && (
        <polygon
          points={corners}
          fill="none"
          stroke={INK.contour}
          strokeWidth="1.2"
          transform="scale(0.82)"
          opacity="0.75"
        />
      )}
      {tile.elev === 1 && (
        <polygon
          points={corners}
          fill="none"
          stroke={INK.contour}
          strokeWidth="0.9"
          transform="scale(0.88)"
          opacity="0.45"
        />
      )}

      {/* the map symbol for this ground */}
      <TerrainGlyph tile={tile} q={q} r={r} />

      {/* deployment strips, printed as a wash */}
      {zone && (
        <polygon
          points={corners}
          fill={zone === "attacker" ? "hsl(4 68% 40% / 0.14)" : "hsl(210 40% 35% / 0.14)"}
        />
      )}

      {/* works — trench zigzag and a bunker with its embrasure */}
      {tile.work === "trench" && (
        <path
          d="M-11 6 l5 -4 l5 4 l5 -4 l5 4"
          fill="none"
          stroke={INK.line}
          strokeWidth="2.6"
          strokeLinecap="round"
          opacity="0.85"
        />
      )}
      {tile.work === "bunker" && (
        <g opacity="0.9">
          <rect x="-7" y="-4" width="14" height="9" rx="1" fill={INK.line} fillOpacity="0.55" stroke={INK.line} strokeWidth="1" />
          <rect x="-4" y="-1" width="8" height="2.2" fill="#E4D6AE" opacity="0.7" />
        </g>
      )}

      {/* faint hex edge — the playing grid, kept lighter than the map grid */}
      <polygon points={corners} fill="none" stroke={INK.line} strokeWidth="0.5" opacity="0.22" />

      {impassable && (
        <polygon points={corners} fill="none" stroke={INK.line} strokeWidth="1.1" opacity="0.55" />
      )}
    </g>
  );
}