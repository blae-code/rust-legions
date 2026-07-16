import React from "react";
import { RESOURCE_META } from "@/lib/units";

const incomeStr = (inc) => (inc ? Object.entries(inc).map(([k, v]) => `+${v} ${RESOURCE_META[k].icon}`).join(" ") : "—");

// Current → previewed hull statistics; deltas light up in brass
export default function StatReadout({ current, preview }) {
  const rows = [
    { label: "Hull Defense", cur: `+${current.defense}`, next: `+${preview.defense}`, changed: current.defense !== preview.defense },
    { label: "Mobility", cur: current.moves ? "1 zone / turn" : "Immobile", next: preview.moves ? "1 zone / turn" : "Immobile", changed: current.moves !== preview.moves },
    { label: "Terrain", cur: current.moves ? (current.allTerrain ? "All-terrain" : "Open ground") : "—", next: preview.moves ? (preview.allTerrain ? "All-terrain" : "Open ground") : "—", changed: current.allTerrain !== preview.allTerrain || current.moves !== preview.moves },
    { label: "On-Board Works", cur: incomeStr(current.income), next: incomeStr(preview.income), changed: incomeStr(current.income) !== incomeStr(preview.income) },
  ];
  return (
    <div className="border border-border rounded-sm bg-secondary/30 p-3">
      <p className="cq-label mb-2">Hull Readout</p>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-xs font-mono">
            <span className="text-muted-foreground text-[10px] uppercase tracking-widest">{r.label}</span>
            <span className="text-secondary-foreground">
              {r.cur}
              {r.changed && <span className="text-brass-bright"> → {r.next}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}