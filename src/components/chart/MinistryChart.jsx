import React, { useEffect, useMemo, useRef, useState } from "react";
import NodeRadialMenu from "@/components/chart/NodeRadialMenu";
import { NODE_KINDS } from "@/lib/macro/graph";

// The Ministry Tactical Chart — the canonical macro map (docs/MACRO_MAP.md).
// A pannable, zoomable flat war chart: dark board, brass survey grid, landmass
// silhouettes grown around the settlements, glowing routes, node reticles.
// Pure SVG — renders sandbox worlds, live fog-filtered war state, and the
// Cartography Bureau's editing canvas through the same surface.

const QUALITY_COLORS = { highway: "#C9A227", road: "#9a927f", track: "#6e675c", trail: "#5a5348", sealane: "#7A93A5" };
const KIND_R = { city: 7, town: 5, depot: 5, crossroads: 3.5, ruin: 4.5 };
const DEFAULT_PALETTE = { land: "#141821", coast: "#C9A227", grid: "#7a6a3a", sea: "#7A93A5", accent: "#8a3e2f" };

// A convoy lane bows over the water — quadratic arc with a perpendicular bulge
export function seaLanePath(A, B) {
  const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
  const dx = B.x - A.x, dy = B.y - A.y;
  const len = Math.hypot(dx, dy) || 1;
  const bulge = Math.min(len * 0.14, 42);
  const cx = mx - (dy / len) * bulge, cy = my + (dx / len) * bulge;
  return { d: `M ${A.x} ${A.y} Q ${cx} ${cy} ${B.x} ${B.y}`, cx, cy };
}

// Point at fraction t along a route (straight land road or bowed convoy lane)
export function routePoint(A, B, quality, t) {
  if (quality === "sealane") {
    const { cx, cy } = seaLanePath(A, B);
    const u = 1 - t;
    return { x: u * u * A.x + 2 * u * t * cx + t * t * B.x, y: u * u * A.y + 2 * u * t * cy + t * t * B.y };
  }
  return { x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t };
}

function NodeGlyph({ node, r, color, dim, ringColor, isBase, baseColor, hovered, menuOpen, onClick, onHover }) {
  const cls = hovered || menuOpen ? 1 : 0;
  const stroke = dim ? "#4a4436" : cls ? "#E8C15A" : color;
  return (
    <g
      opacity={dim ? 0.45 : 1}
      style={{ cursor: onClick ? "pointer" : "default" }}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(node); } : undefined}
      onMouseEnter={onHover ? () => onHover(node) : undefined}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
    >
      {/* generous invisible hit area */}
      <circle cx={node.x} cy={node.y} r={r + 7} fill="transparent" />
      {ringColor && <circle cx={node.x} cy={node.y} r={r + 3.5} fill="none" stroke={ringColor} strokeWidth="1.6" opacity="0.85" />}
      {node.kind === "depot" ? (
        <rect x={node.x - r} y={node.y - r} width={r * 2} height={r * 2} fill="#0b0e12" stroke={stroke} strokeWidth="1.3" />
      ) : (
        <circle cx={node.x} cy={node.y} r={r} fill="#0b0e12" stroke={stroke} strokeWidth="1.3" strokeDasharray={node.kind === "ruin" ? "3 2" : undefined} />
      )}
      {/* survey crosshair ticks on major sites */}
      {(node.kind === "city" || node.kind === "depot") &&
        [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy], i) => (
          <line key={i} x1={node.x + dx * (r + 2)} y1={node.y + dy * (r + 2)} x2={node.x + dx * (r + 5)} y2={node.y + dy * (r + 5)} stroke={stroke} strokeWidth="1" />
        ))}
      {node.kind === "city" && <circle cx={node.x} cy={node.y} r={r - 3} fill="none" stroke={stroke} strokeWidth="0.8" />}
      {isBase && (
        <g stroke={baseColor || "#C9A227"} strokeWidth="1.6" fill="none">
          {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], i) => {
            const bx = node.x + sx * (r + 8), by = node.y + sy * (r + 8);
            return <path key={i} d={`M ${bx} ${by + sy * -5} L ${bx} ${by} L ${bx + sx * -5} ${by}`}>
              <animate attributeName="opacity" values="1;0.45;1" dur="2.4s" repeatCount="indefinite" />
            </path>;
          })}
        </g>
      )}
    </g>
  );
}

export default function MinistryChart({
  world,                       // { nodes, routes, continents, size }
  palette = DEFAULT_PALETTE,
  control = {},                // nodeId -> slotIndex
  slotColors = {},
  observed = null,             // array of visible node ids, or null = all charted
  columns = [],                // fog-filtered server columns
  bases = [],                  // [{ slot, nodeId, march? }]
  marchPaths = [],             // [{ id, path: [nodeIds], color, dashed }]
  mySlot = null,
  hovered = null,
  onHoverNode,
  onNodeClick,
  onColumnClick,
  selectedColumnId = null,
  menuNodeId = null,
  menuOptions = null,
  onCloseMenu,
  onCanvasClick,               // (x, y) world coords — the Cartography Bureau's placement hook
  height = "62vh",
}) {
  const size = world.size || { w: 1000, h: 620 };
  const byId = useMemo(() => Object.fromEntries(world.nodes.map((n) => [n.id, n])), [world.nodes]);
  const observedSet = useMemo(() => (observed ? new Set(observed) : null), [observed]);
  const seen = (nid) => !observedSet || observedSet.has(nid);

  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const svgRef = useRef(null);
  const drag = useRef(null);

  const clamp = (v, k) => ({
    k,
    x: Math.min(Math.max(v.x, 0), size.w - size.w / k),
    y: Math.min(Math.max(v.y, 0), size.h - size.h / k),
  });

  // Wheel zoom anchored on the cursor — needs a non-passive listener
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e) => {
      e.preventDefault();
      setView((v) => {
        const rect = svg.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const k = Math.min(Math.max(v.k * (e.deltaY < 0 ? 1.22 : 1 / 1.22), 1), 7);
        const wx = v.x + px * (size.w / v.k);
        const wy = v.y + py * (size.h / v.k);
        return clamp({ x: wx - px * (size.w / k), y: wy - py * (size.h / k) }, k);
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [size.w, size.h]);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    drag.current = { sx: e.clientX, sy: e.clientY, view: { ...view }, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.current.sx) / rect.width) * (size.w / view.k);
    const dy = ((e.clientY - drag.current.sy) / rect.height) * (size.h / view.k);
    if (Math.abs(e.clientX - drag.current.sx) + Math.abs(e.clientY - drag.current.sy) > 4) drag.current.moved = true;
    setView(clamp({ x: drag.current.view.x - dx, y: drag.current.view.y - dy }, view.k));
  };
  const onPointerUp = (e) => {
    const wasDrag = drag.current?.moved;
    drag.current = null;
    if (!wasDrag && onCanvasClick && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = view.x + ((e.clientX - rect.left) / rect.width) * (size.w / view.k);
      const y = view.y + ((e.clientY - rect.top) / rect.height) * (size.h / view.k);
      onCanvasClick(Math.round(x), Math.round(y));
    }
  };

  // World → container-pixel transform (uniform: wrapper keeps the chart aspect)
  const toScreen = (x, y) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { left: 0, top: 0 };
    return {
      left: ((x - view.x) / (size.w / view.k)) * rect.width,
      top: ((y - view.y) / (size.h / view.k)) * rect.height,
    };
  };

  const labelVisible = (n) => hovered?.id === n.id || menuNodeId === n.id || view.k >= 2.2 || (n.kind === "city" && view.k >= 1.35);
  const menuNode = menuNodeId ? byId[menuNodeId] : null;
  const menuPos = menuNode ? toScreen(menuNode.x, menuNode.y) : null;

  return (
    <div className="relative w-full mx-auto" style={{ aspectRatio: `${size.w}/${size.h}`, maxHeight: height }}>
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${size.w / view.k} ${size.h / view.k}`}
        className="w-full h-full select-none touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={() => onCloseMenu?.()}
      >
        <defs>
          <pattern id="mc-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke={palette.grid} strokeWidth="0.4" opacity="0.13" />
          </pattern>
          <pattern id="mc-grid-major" width="250" height="250" patternUnits="userSpaceOnUse">
            <path d="M 250 0 L 0 0 0 250" fill="none" stroke={palette.grid} strokeWidth="0.7" opacity="0.22" />
          </pattern>
          <filter id="mc-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>

        {/* The board + survey grid */}
        <rect x="0" y="0" width={size.w} height={size.h} fill="#07090c" />
        <rect x="0" y="0" width={size.w} height={size.h} fill="url(#mc-grid)" />
        <rect x="0" y="0" width={size.w} height={size.h} fill="url(#mc-grid-major)" />
        <rect x="1" y="1" width={size.w - 2} height={size.h - 2} fill="none" stroke={palette.grid} strokeWidth="1" opacity="0.4" />

        {/* Landmasses — silhouettes with a double coastline */}
        {(world.continents || []).map((c) => {
          const pts = c.outline.map((p) => p.join(",")).join(" ");
          return (
            <g key={c.id}>
              <polygon points={pts} fill="none" stroke={palette.coast} strokeWidth="6" opacity="0.10" />
              <polygon points={pts} fill={palette.land} stroke={palette.coast} strokeWidth="1.3" opacity="0.96" />
              <polygon points={pts} fill="none" stroke={palette.coast} strokeWidth="0.5" opacity="0.35" transform={`translate(3.5 3.5)`} />
            </g>
          );
        })}

        {/* Routes */}
        {world.routes.map((r, i) => {
          const [a, b, , quality] = r;
          const A = byId[a], B = byId[b];
          if (!A || !B) return null;
          const dimmed = !seen(a) && !seen(b);
          if (quality === "sealane") {
            return <path key={i} d={seaLanePath(A, B).d} fill="none" stroke={QUALITY_COLORS.sealane} strokeWidth="1.1" strokeDasharray="6 5" opacity={dimmed ? 0.2 : 0.55} />;
          }
          return (
            <line
              key={i}
              x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              stroke={QUALITY_COLORS[quality] || "#777"}
              strokeWidth={quality === "highway" ? 1.7 : 1.1}
              strokeDasharray={quality === "trail" ? "3 3" : undefined}
              opacity={dimmed ? 0.18 : quality === "trail" ? 0.4 : 0.6}
            />
          );
        })}

        {/* Plotted marches — glowing brass (columns) / rust (the fortress-base) */}
        {marchPaths.map((mp) => {
          const pts = mp.path.map((nid) => byId[nid]).filter(Boolean);
          if (pts.length < 2) return null;
          const d = pts.slice(1).reduce((acc, p, i) => {
            const prev = pts[i];
            const route = world.routes.find(([x, y]) => (x === mp.path[i] && y === mp.path[i + 1]) || (y === mp.path[i] && x === mp.path[i + 1]));
            if (route?.[3] === "sealane") {
              const { cx, cy } = seaLanePath(prev, p);
              return acc + ` Q ${cx} ${cy} ${p.x} ${p.y}`;
            }
            return acc + ` L ${p.x} ${p.y}`;
          }, `M ${pts[0].x} ${pts[0].y}`);
          return (
            <g key={mp.id}>
              <path d={d} fill="none" stroke={mp.color} strokeWidth="3.2" opacity="0.35" filter="url(#mc-glow)" />
              <path d={d} fill="none" stroke={mp.color} strokeWidth="1.4" strokeDasharray={mp.dashed ? "5 4" : undefined} opacity="0.95" />
              <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3.2" fill="none" stroke={mp.color} strokeWidth="1.2">
                <animate attributeName="r" values="2.6;4.4;2.6" dur="1.8s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}

        {/* Node reticles */}
        {world.nodes.map((n) => (
          <g key={n.id}>
            <NodeGlyph
              node={n}
              r={KIND_R[n.kind] || 4}
              color="#8a8378"
              dim={!seen(n.id)}
              ringColor={control[n.id] !== undefined && control[n.id] !== null ? slotColors[control[n.id]] : null}
              isBase={bases.some((b) => b.nodeId === n.id)}
              baseColor={slotColors[bases.find((b) => b.nodeId === n.id)?.slot] || "#C9A227"}
              hovered={hovered?.id === n.id}
              menuOpen={menuNodeId === n.id}
              onClick={onNodeClick}
              onHover={onHoverNode}
            />
            {labelVisible(n) && (
              <text
                x={n.x}
                y={n.y + (KIND_R[n.kind] || 4) + 9}
                textAnchor="middle"
                className="font-mono"
                fontSize={Math.max(7, 9 / Math.sqrt(view.k))}
                fill={hovered?.id === n.id ? "#E8C15A" : "#9a927f"}
                opacity={seen(n.id) ? 0.9 : 0.4}
                style={{ pointerEvents: "none", letterSpacing: "0.08em" }}
              >
                {n.name.toUpperCase()}
              </text>
            )}
          </g>
        ))}

        {/* Columns in the field */}
        {columns.map((c) => {
          let p = null;
          if (c.nodeId && byId[c.nodeId]) {
            const n = byId[c.nodeId];
            p = { x: n.x + 9, y: n.y - 9 };
          } else if (c.march) {
            const A = byId[c.march.edge[0]], B = byId[c.march.edge[1]];
            const route = world.routes.find(([x, y]) => (x === c.march.edge[0] && y === c.march.edge[1]) || (y === c.march.edge[0] && x === c.march.edge[1]));
            if (A && B && route) p = routePoint(A, B, route[3], Math.min(Math.max(c.march.legMiles / route[2], 0), 1));
          }
          if (!p) return null;
          const mine = c.owner === mySlot;
          const color = slotColors[c.owner] || "#888";
          return (
            <g
              key={c.id}
              style={{ cursor: onColumnClick && mine ? "pointer" : "default" }}
              onClick={onColumnClick && mine ? (e) => { e.stopPropagation(); onColumnClick(c); } : undefined}
            >
              <circle cx={p.x} cy={p.y} r={selectedColumnId === c.id ? 5 : 3.4} fill={selectedColumnId === c.id ? "#FFE08A" : color} stroke="#0b0e12" strokeWidth="1">
                <animate attributeName="opacity" values="1;0.55;1" dur="1.6s" repeatCount="indefinite" />
              </circle>
              {view.k >= 1.3 && (
                <text x={p.x} y={p.y - 6} textAnchor="middle" className="font-mono" fontSize={Math.max(6, 7.5 / Math.sqrt(view.k))} fill={mine ? "#E8C15A" : "#b3ab9c"} style={{ pointerEvents: "none", letterSpacing: "0.06em" }}>
                  {c.name.toUpperCase()} · {c.strength}PT
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Radial orders menu — HTML overlay pinned over the node */}
      {menuNode && menuOptions && menuPos && (
        <div className="absolute z-20" style={{ left: menuPos.left, top: menuPos.top }}>
          <NodeRadialMenu node={menuNode} kindLabel={NODE_KINDS[menuNode.kind]?.label || menuNode.kind} options={menuOptions} onClose={onCloseMenu} />
        </div>
      )}
    </div>
  );
}
