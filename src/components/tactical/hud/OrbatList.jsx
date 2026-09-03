import React from "react";
import { UNIT_TYPES } from "@/lib/tactical/orbat";

// Every stand on the field, by side — the roster view of the same counters.
export default function OrbatList({ stands, selectedId, onSelect }) {
  const groups = [
    { side: "attacker", label: "Our Order of Battle", dot: "bg-rust" },
    { side: "defender", label: "Enemy Order of Battle", dot: "bg-steel" },
  ];

  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.side}>
          <p className="cq-label mb-1.5">{g.label}</p>
          <div className="space-y-1">
            {stands
              .filter((s) => s.side === g.side)
              .map((s) => {
                const type = UNIT_TYPES[s.type];
                const frac = s.str / type.maxStr;
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelect(s)}
                    className={`w-full text-left border rounded-sm px-2 py-1 transition-colors ${
                      selectedId === s.id ? "border-brass bg-brass/10" : "border-border hover:border-brass/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${g.dot} shrink-0`} />
                      <span className="text-[11px] font-heading truncate flex-1">{s.name}</span>
                      <span className="font-mono text-[9px] text-muted-foreground shrink-0">{s.str}</span>
                    </div>
                    <div className="h-0.5 bg-muted mt-1">
                      <div
                        className={`h-full ${frac > 0.6 ? "bg-olive" : frac > 0.3 ? "bg-brass" : "bg-rust"}`}
                        style={{ width: `${frac * 100}%` }}
                      />
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}