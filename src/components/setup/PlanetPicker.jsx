import React from "react";
import { Link } from "react-router-dom";
import { WORLDS } from "@/lib/macro/worlds";

// Tiny silhouette of a world — its landmasses inked on the board
export function WorldSilhouette({ world, className = "w-full h-14" }) {
  const { w, h } = world.size;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="xMidYMid meet">
      <rect width={w} height={h} fill="#07090c" />
      {world.continents.map((c) => (
        <polygon
          key={c.id}
          points={c.outline.map((p) => p.join(",")).join(" ")}
          fill={world.palette.land}
          stroke={world.palette.coast}
          strokeWidth="4"
          opacity="0.95"
        />
      ))}
    </svg>
  );
}

// Pick which charted world hosts the war
export default function PlanetPicker({ value, onChange }) {
  const selected = WORLDS.find((w) => w.id === value);
  return (
    <div>
      <label className="cq-label">Theater World</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
        {WORLDS.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => onChange(w.id)}
            title={w.blurb}
            className={`text-left p-2 rounded-sm border transition-colors ${
              value === w.id ? "border-brass bg-brass/10" : "border-border bg-secondary/30 hover:border-brass/50"
            }`}
          >
            <WorldSilhouette world={w} />
            <span className={`block mt-1.5 font-heading uppercase tracking-widest text-xs ${value === w.id ? "text-brass-bright" : "text-secondary-foreground"}`}>
              {w.name}
            </span>
            <span className="block font-mono text-[9px] text-muted-foreground mt-0.5">
              {w.continents.length} LANDMASSES · {w.nodes.length} SITES
            </span>
          </button>
        ))}
      </div>
      {selected && (
        <Link
          to={`/star-map?planet=${selected.id}`}
          className="inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-muted-foreground hover:text-brass-bright transition-colors mt-1.5"
        >
          ◈ SURVEY {selected.name.toUpperCase()} ON THE WAR TABLE ▸
        </Link>
      )}
    </div>
  );
}
