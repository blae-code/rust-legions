import React, { useMemo } from "react";
import { hexPixel, hexCorners } from "@/lib/tactical/field";
import { estimateExchange, neighborsOf } from "@/lib/tactical/orbat";
import TerrainDefs from "./TerrainDefs";
import HexTerrainTile from "./HexTerrainTile";
import UnitCounter, { CounterDefs } from "./counters/UnitCounter";
import AttackArrow from "./counters/AttackArrow";

const SIZE = 26;

// The 15x11 axial board, drawn faithfully: x = size*√3*(q + r/2) skews the grid
// into a rhombus, which is what the engine's own geometry describes. Rendering
// it as a rectangle would make visual adjacency disagree with hexDistance.
export default function BattlefieldBoard({
  field,
  stands = [],
  selectedId,
  targetId,
  onSelectStand,
  onClearSelection,
  onHoverTile,
}) {
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

  const selected = stands.find((s) => s.id === selectedId) || null;

  // Every enemy the selected stand is in contact with gets an assault arrow.
  const engagements = useMemo(() => {
    if (!selected) return [];
    const ring = neighborsOf(selected.q, selected.r);
    return stands
      .filter(
        (s) =>
          s.side !== selected.side &&
          ring.some((n) => n.q === s.q && n.r === s.r),
      )
      .map((foe) => {
        const cover = field.tiles[`${foe.q},${foe.r}`]?.cover || 0;
        return { foe, ...estimateExchange(selected, foe, cover) };
      });
  }, [selected, stands, field]);

  const maxX = Math.max(...cells.map((c) => c.x));
  const maxY = Math.max(...cells.map((c) => c.y));
  const pad = SIZE * 1.4;

  return (
    <svg
      viewBox={`${-pad} ${-pad} ${maxX + pad * 2} ${maxY + pad * 2}`}
      className="w-full h-auto select-none"
      role="img"
      aria-label="Tactical battlefield"
      onClick={() => onClearSelection?.()}
    >
      <TerrainDefs />
      <CounterDefs />

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

      {/* the selected stand's hex, ringed on the ground */}
      {selected &&
        (() => {
          const { x, y } = hexPixel(selected.q, selected.r, SIZE);
          return (
            <polygon
              points={corners}
              transform={`translate(${x},${y})`}
              fill="none"
              stroke="#E8D6A8"
              strokeWidth="2.2"
              pointerEvents="none"
            />
          );
        })()}

      {/* assault arrows, under the counters so plates stay readable */}
      {engagements.map((e) => (
        <AttackArrow
          key={e.foe.id}
          from={hexPixel(selected.q, selected.r, SIZE)}
          to={hexPixel(e.foe.q, e.foe.r, SIZE)}
          dealt={e.dealt}
          back={e.back}
          active={e.foe.id === targetId}
        />
      ))}

      {/* counters, north to south so a southern plate overlaps the one behind */}
      {[...stands]
        .sort((a, b) => a.r - b.r)
        .map((s) => {
          const { x, y } = hexPixel(s.q, s.r, SIZE);
          return (
            <g key={s.id} transform={`translate(${x},${y})`}>
              <UnitCounter
                stand={s}
                selected={s.id === selectedId}
                targeted={s.id === targetId}
                onSelect={onSelectStand}
              />
            </g>
          );
        })}
    </svg>
  );
}