import React, { useMemo } from "react";
import { hexPixel, hexCorners } from "@/lib/tactical/field";
import TerrainDefs from "./TerrainDefs";
import HexTerrainTile from "./HexTerrainTile";

const SIZE = 26;

// The 15x11 axial board, drawn faithfully: x = size*√3*(q + r/2) skews the grid
// into a rhombus, which is what the engine's own geometry describes. Rendering
// it as a rectangle would make visual adjacency disagree with hexDistance.
export default function BattlefieldBoard({ field, onHoverTile }) {
  const corners = useMemo(() => hexCorners(SIZE), []);
  const zoneOf = useMemo(() => {
    const m = {};
    for (const h of field.deploy.attacker) m[`${h.q},${h.r}`] = "attacker";
    for (const h of field.deploy.defender) m[`${h.q},${h.r}`] = "defender";
    return m;
  }, [field]);

  const cells = useMemo(() => {
    const out = [];
    for (let q = 0; q < field.w; q++) {
      for (let r = 0; r < field.h; r++) {
        const key = `${q},${r}`;
        const tile = field.tiles[key];
        if (!tile) continue;
        const { x, y } = hexPixel(q, r, SIZE);
        out.push({ key, q, r, x, y, tile });
      }
    }
    return out;
  }, [field]);

  const maxX = Math.max(...cells.map((c) => c.x));
  const maxY = Math.max(...cells.map((c) => c.y));
  const pad = SIZE * 1.4;

  return (
    <svg
      viewBox={`${-pad} ${-pad} ${maxX + pad * 2} ${maxY + pad * 2}`}
      className="w-full h-auto select-none"
      role="img"
      aria-label="Tactical battlefield"
    >
      <TerrainDefs />
      {cells.map((c) => (
        <HexTerrainTile
          key={c.key}
          x={c.x}
          y={c.y}
          corners={corners}
          tile={c.tile}
          zone={zoneOf[c.key]}
          onHover={() => onHoverTile?.({ ...c.tile, q: c.q, r: c.r })}
        />
      ))}
    </svg>
  );
}