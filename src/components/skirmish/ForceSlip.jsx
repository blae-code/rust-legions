import React from "react";
import { X } from "lucide-react";
import { UNIT_TYPES } from "@/lib/tactical/orbat";
import { COST } from "@/lib/skirmish/roster";

// The commander's own order of battle for this engagement, with the allowance
// spent so far shown as a filling bar.
export default function ForceSlip({ items, points, spent, onRemove, onClear }) {
  const pct = Math.min(100, (spent / points) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="cq-label text-brass">Allowance</p>
        <p className="font-mono text-[10px]">
          <span className="text-brass-bright">{spent}</span>
          <span className="text-muted-foreground"> / {points} PTS</span>
        </p>
      </div>
      <div className="h-1.5 bg-secondary rounded-sm overflow-hidden">
        <div className="h-full bg-brass" style={{ width: `${pct}%` }} />
      </div>

      {items.length === 0 ? (
        <p className="font-mono text-[10px] text-muted-foreground tracking-widest pt-1">
          NO STANDS REQUISITIONED
        </p>
      ) : (
        <ul className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
          {items.map((it) => (
            <li
              key={it.key}
              className="flex items-center gap-2 border-l-2 border-brass/50 bg-secondary/40 pl-2 pr-1 py-1"
            >
              <span className="font-heading uppercase tracking-widest text-[10px] text-secondary-foreground flex-1 truncate">
                {UNIT_TYPES[it.type].label}
              </span>
              <span className="font-mono text-[9px] text-muted-foreground">{COST[it.type]}</span>
              <button onClick={() => onRemove(it.key)} className="text-muted-foreground hover:text-rust">
                <X className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <button
          onClick={onClear}
          className="font-mono text-[9px] text-muted-foreground hover:text-rust tracking-widest"
        >
          STRIKE THE WHOLE FORCE
        </button>
      )}
    </div>
  );
}