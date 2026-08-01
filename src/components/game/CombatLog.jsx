import React, { useState } from "react";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "combat", label: "Battles" },
  { key: "capture", label: "Captures" },
];

export default function CombatLog({ entries = [] }) {
  const [filter, setFilter] = useState("all");
  const shown = filter === "all" ? entries : entries.filter((e) => e.type === filter);

  return (
    <div className="cq-panel cq-brackets p-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="cq-label">Field Reports</h3>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        <span className="w-1.5 h-1.5 rounded-full bg-rust text-rust cq-lamp animate-pulse" />
      </div>
      <div className="flex gap-1 mb-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-2 py-0.5 text-[10px] font-heading uppercase tracking-[0.2em] rounded-sm border transition-colors ${
              filter === f.key ? "border-brass/60 text-brass-bright bg-brass/10" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="space-y-1.5 max-h-52 overflow-y-auto text-xs">
        {shown.length === 0 && <p className="text-muted-foreground">No engagements reported.</p>}
        {[...shown].reverse().map((e, i) => (
          <div key={i} className="text-muted-foreground border-l-2 border-brass/40 pl-2">
            <span className="text-steel font-mono mr-1">T{e.turn}</span>
            {e.type === "event" ? (
              <span className="text-brass">{e.text}</span>
            ) : e.type === "capture" ? (
              <span>
                <span className="text-brass-bright font-semibold">{e.faction}</span> seized{" "}
                <span className="text-secondary-foreground">{e.isCapital ? "★ " : ""}{e.tileName}</span>
                {e.from && <span> from <span className="text-secondary-foreground">{e.from}</span></span>}
                {e.resource && <span className="text-olive"> · +{e.amount}/turn</span>}
                {(e.buildings || []).length > 0 && <span className="text-steel"> · {e.buildings.length} structure{e.buildings.length > 1 ? "s" : ""} captured</span>}
              </span>
            ) : (
              <span>
                <span className="text-secondary-foreground">{e.attacker}</span> assaulted{" "}
                <span className="text-secondary-foreground">{e.tileName}</span> ({e.defender}) —{" "}
                {e.outcome === "captured" && <span className="text-olive font-semibold">zone captured</span>}
                {e.outcome === "repelled" && <span className="text-rust font-semibold">assault repelled</span>}
                {e.outcome === "retreated" && <span className="text-brass-bright font-semibold">forces withdrew</span>}
                {" "}· losses {e.attLosses}/{e.defLosses}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}