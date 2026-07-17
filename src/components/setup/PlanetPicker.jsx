import React from "react";
import { Link } from "react-router-dom";
import { PLANETS } from "@/lib/macro/planets";

// Pick which of the three charted worlds hosts the war
export default function PlanetPicker({ value, onChange }) {
  const selected = PLANETS.find((p) => p.id === value);
  return (
    <div>
      <label className="cq-label">Theater World</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
        {PLANETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            title={p.blurb}
            className={`text-left p-2.5 rounded-sm border transition-colors ${
              value === p.id ? "border-brass bg-brass/10" : "border-border bg-secondary/30 hover:border-brass/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full ring-1 ring-black/50 shrink-0"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${p.palette.high}, ${p.palette.base} 60%, ${p.palette.low})`,
                  boxShadow: `0 0 7px ${p.palette.atmo}66`,
                }}
              />
              <span className={`font-heading uppercase tracking-widest text-xs ${value === p.id ? "text-brass-bright" : "text-secondary-foreground"}`}>
                {p.name}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 leading-snug">{p.blurb}</p>
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
