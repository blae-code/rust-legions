import React, { useMemo } from "react";
import { axialToPixel, hexPoints, HEX_SIZE } from "@/lib/hex";
import { totalUnits, TERRAIN_RESOURCE } from "@/lib/units";

const RES_SHORT = { manpower: "M", steel: "S", fuel: "F" };
const RES_COLOR = { manpower: "#C9B88A", steel: "#9FA8B5", fuel: "#C79A6B" };

const TERRAIN_FILL = {
  plains: "#57503A",
  forest: "#3B4A33",
  hills: "#5A4C38",
  mountains: "#4E4A52",
  industrial: "#4A403A",
};
const NEUTRAL = "#4A4540";
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

  const terrainFor = (tile) => {
    if (tile.isSea) return null;
    return TERRAIN_FILL[tile.terrain] || NEUTRAL;
  };

  return (
    <svg viewBox={viewBox} className="w-full" style={{ maxHeight }}>
      <defs>
        <linearGradient id="hxSea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1D2B36" />
          <stop offset="100%" stopColor="#16212B" />
        </linearGradient>
        <pattern id="hxFog" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <rect width="7" height="7" fill="#1B1713" />
          <line x1="0" y1="0" x2="0" y2="7" stroke="#26201B" strokeWidth="3" />
        </pattern>
        <pattern id="hxSeaWave" width="14" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 4 Q3.5 1 7 4 T14 4" stroke="#2C4152" strokeWidth="0.8" fill="none" />
        </pattern>
        <filter id="hxGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#E0A32E" floodOpacity="0.9" />
        </filter>
      </defs>

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
            className="cursor-pointer hover:fill-secondary/50"
            onClick={() => onGhostClick && onGhostClick(g)}
          />
        );
      })}

      {tiles.map((tile) => {
        const { x, y } = axialToPixel(tile.q, tile.r);
        const hidden = tile.visible === false;
        const units = totalUnits(tile.state?.units);
        const owner = tile.state?.owner;
        const ownerColor = owner !== null && owner !== undefined ? slotColors[owner] : null;
        const selected = selectedId === tile.id;

        return (
          <g
            key={tile.id}
            className={onTileClick ? "cursor-pointer" : ""}
            onClick={() => onTileClick && onTileClick(tile)}
            filter={selected ? "url(#hxGlow)" : undefined}
          >
            {/* Base terrain / fog / sea */}
            <polygon
              points={hexPoints(x, y, HEX_SIZE - 1.2)}
              fill={hidden ? "url(#hxFog)" : tile.isSea ? "url(#hxSea)" : terrainFor(tile)}
              stroke={selected ? "#E0A32E" : "#0c0a09"}
              strokeWidth={selected ? 2.5 : 1.5}
            />
            {/* Sea wave texture */}
            {!hidden && tile.isSea && (
              <polygon points={hexPoints(x, y, HEX_SIZE - 1.2)} fill="url(#hxSeaWave)" className="pointer-events-none" />
            )}
            {/* Ownership tint + inner ring */}
            {!hidden && ownerColor && (
              <>
                <polygon points={hexPoints(x, y, HEX_SIZE - 1.2)} fill={ownerColor} fillOpacity="0.45" className="pointer-events-none" />
                <polygon points={hexPoints(x, y, HEX_SIZE - 4.5)} fill="none" stroke={ownerColor} strokeWidth="1.8" strokeOpacity="0.9" className="pointer-events-none" />
              </>
            )}
            {/* Capital double ring */}
            {!hidden && tile.isCapital && (
              <polygon points={hexPoints(x, y, HEX_SIZE - 7.5)} fill="none" stroke="#E0A32E" strokeWidth="0.8" strokeDasharray="3 2" className="pointer-events-none" />
            )}

            {!hidden && (
              <>
                <text x={x} y={y - 8} textAnchor="middle" fontSize="7.5" fontFamily="'Barlow Condensed', sans-serif" letterSpacing="0.5" fill={tile.isSea ? "#7A93A5" : "#EDE6D6"} className="pointer-events-none select-none uppercase">
                  {tile.isCapital ? "★ " : ""}{tile.name?.slice(0, 10)}
                </text>
                {tile.resourceBonus && (
                  <text x={x} y={y + 4} textAnchor="middle" fontSize="9" className="pointer-events-none select-none">
                    {RESOURCE_ICONS[tile.resourceBonus]}
                  </text>
                )}
                {units > 0 && (
                  <>
                    <rect x={x - 9} y={y + 8} width="18" height="12" rx="2" fill="#0c0a09" opacity="0.85" className="pointer-events-none" />
                    <text x={x} y={y + 17} textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="'IBM Plex Mono', monospace" fill="#E0A32E" className="pointer-events-none select-none">
                      {units}
                    </text>
                  </>
                )}
                {!tile.isSea && units === 0 && tile.baseIncome > 0 && (
                  <text x={x} y={y + 14} textAnchor="middle" fontSize="7.5" fontFamily="'IBM Plex Mono', monospace" fill={RES_COLOR[TERRAIN_RESOURCE[tile.terrain] || "manpower"]} className="pointer-events-none select-none">
                    +{tile.baseIncome}{RES_SHORT[TERRAIN_RESOURCE[tile.terrain] || "manpower"]}
                  </text>
                )}
                {(tile.state?.buildings || []).map((b, i) => (
                  <rect
                    key={i}
                    x={x - 7 + i * 9}
                    y={y + 21}
                    width="6"
                    height="6"
                    fill={(b.level || 0) > 0 ? "#E0A32E" : "#6B5B3A"}
                    stroke="#0c0a09"
                    strokeWidth="0.6"
                    className="pointer-events-none"
                  >
                    <title>{b.type}</title>
                  </rect>
                ))}
              </>
            )}
            {hidden && (
              <text x={x} y={y + 3} textAnchor="middle" fontSize="10" fill="#3B342D" className="pointer-events-none select-none">
                ?
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}