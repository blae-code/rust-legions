import React, { useMemo } from "react";
import { axialToPixel, hexPoints, HEX_SIZE } from "@/lib/hex";
import { totalUnits } from "@/lib/units";

const NEUTRAL = "#4A4540";
const SEA = "#1E2A33";
const HIDDEN = "#221E1A";
const RESOURCE_ICONS = { oil_field: "⛽", coal_depot: "⚒", iron_foundry: "🏭" };

export default function HexBoard({
  tiles = [],
  slotColors = {},
  selectedId,
  onTileClick,
  ghosts = [],
  onGhostClick,
  maxHeight = 560,
}) {
  const { viewBox } = useMemo(() => {
    const all = [...tiles, ...ghosts];
    if (all.length === 0) return { viewBox: "-100 -100 200 200" };
    const pts = all.map((t) => axialToPixel(t.q, t.r));
    const pad = HEX_SIZE * 1.5;
    const minX = Math.min(...pts.map((p) => p.x)) - pad;
    const maxX = Math.max(...pts.map((p) => p.x)) + pad;
    const minY = Math.min(...pts.map((p) => p.y)) - pad;
    const maxY = Math.max(...pts.map((p) => p.y)) + pad;
    return { viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}` };
  }, [tiles, ghosts]);

  const fillFor = (tile) => {
    if (tile.visible === false) return HIDDEN;
    if (tile.isSea) return SEA;
    const owner = tile.state?.owner;
    if (owner === null || owner === undefined) return NEUTRAL;
    return slotColors[owner] || NEUTRAL;
  };

  return (
    <svg viewBox={viewBox} className="w-full" style={{ maxHeight }}>
      {ghosts.map((g) => {
        const { x, y } = axialToPixel(g.q, g.r);
        return (
          <polygon
            key={`ghost-${g.q},${g.r}`}
            points={hexPoints(x, y, HEX_SIZE - 2)}
            fill="transparent"
            stroke="#57534e"
            strokeDasharray="4 3"
            strokeWidth="1"
            className="cursor-pointer hover:fill-stone-800/50"
            onClick={() => onGhostClick && onGhostClick(g)}
          />
        );
      })}
      {tiles.map((tile) => {
        const { x, y } = axialToPixel(tile.q, tile.r);
        const hidden = tile.visible === false;
        const units = totalUnits(tile.state?.units);
        return (
          <g
            key={tile.id}
            className={onTileClick ? "cursor-pointer" : ""}
            onClick={() => onTileClick && onTileClick(tile)}
          >
            <polygon
              points={hexPoints(x, y, HEX_SIZE - 1.5)}
              fill={fillFor(tile)}
              fillOpacity={hidden ? 0.9 : 0.85}
              stroke={selectedId === tile.id ? "#D4830A" : "#0c0a09"}
              strokeWidth={selectedId === tile.id ? 3 : 1.5}
            />
            {!hidden && (
              <>
                <text x={x} y={y - 8} textAnchor="middle" fontSize="8" fill="#e7e5e4" className="pointer-events-none select-none">
                  {tile.isCapital ? "★ " : ""}{tile.name?.slice(0, 10)}
                </text>
                {tile.resourceBonus && (
                  <text x={x} y={y + 4} textAnchor="middle" fontSize="9" className="pointer-events-none select-none">
                    {RESOURCE_ICONS[tile.resourceBonus]}
                  </text>
                )}
                {units > 0 && (
                  <>
                    <circle cx={x} cy={y + 15} r="8" fill="#0c0a09" opacity="0.8" className="pointer-events-none" />
                    <text x={x} y={y + 18} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fbbf24" className="pointer-events-none select-none">
                      {units}
                    </text>
                  </>
                )}
                {!tile.isSea && !tile.state && tile.baseIncome > 0 && (
                  <text x={x} y={y + 14} textAnchor="middle" fontSize="8" fill="#a8a29e" className="pointer-events-none select-none">
                    +{tile.baseIncome}
                  </text>
                )}
              </>
            )}
            {hidden && (
              <text x={x} y={y + 3} textAnchor="middle" fontSize="10" fill="#44403c" className="pointer-events-none select-none">
                ?
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}