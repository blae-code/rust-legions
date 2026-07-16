import React from "react";
import { Layers, Flag, Factory } from "lucide-react";

const MODES = [
  { key: null, label: "Terrain", icon: Layers },
  { key: "control", label: "Control", icon: Flag },
  { key: "production", label: "Production", icon: Factory },
];

const PROD_LEGEND = [
  { color: "#C9B88A", label: "Manpower" },
  { color: "#9FA8B5", label: "Steel" },
  { color: "#C79A6B", label: "Fuel" },
];

export default function OverlayToggle({ overlay, onChange, factions = [] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-sm border border-border overflow-hidden">
        {MODES.map((m) => (
          <button
            key={m.label}
            onClick={() => onChange(m.key)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-heading uppercase tracking-[0.15em] transition-colors ${
              overlay === m.key ? "bg-brass/20 text-brass-bright" : "bg-card text-muted-foreground hover:text-secondary-foreground"
            }`}
          >
            <m.icon className="w-3 h-3" /> {m.label}
          </button>
        ))}
      </div>
      {overlay === "production" && (
        <div className="flex items-center gap-2.5 font-mono text-[9px] text-muted-foreground tracking-widest">
          {PROD_LEGEND.map((l) => (
            <span key={l.label} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm border border-black/50" style={{ background: l.color }} /> {l.label.toUpperCase()}
            </span>
          ))}
        </div>
      )}
      {overlay === "control" && (
        <div className="flex items-center gap-2.5 font-mono text-[9px] text-muted-foreground tracking-widest">
          {factions.filter((f) => !f.eliminated).map((f) => (
            <span key={f.slotIndex} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm border border-black/50" style={{ background: f.color }} /> {f.factionName?.slice(0, 12).toUpperCase()}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm border border-black/50 bg-[#3B342D]" /> NEUTRAL
          </span>
        </div>
      )}
    </div>
  );
}