import React from "react";
import { DOMINANT_META } from "@/lib/macro/hotspots";

// The intelligence slip that reads the heat wash back to the commander
export default function HotspotLegend({ hotspots = [] }) {
  return (
    <div className="absolute top-3 left-3 z-10 cq-slip rounded-sm p-2.5 max-w-[15rem] space-y-1.5">
      <p className="font-heading uppercase tracking-[0.2em] text-[10px] text-brass-bright">Pressure Survey · 6 Days</p>
      <div className="space-y-0.5">
        {Object.entries(DOMINANT_META).map(([k, m]) => (
          <div key={k} className="flex items-center gap-2 font-mono text-[9px] text-muted-foreground">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: m.color, opacity: 0.75 }} />
            {m.label.toUpperCase()}
          </div>
        ))}
      </div>
      {hotspots.length === 0 ? (
        <p className="font-mono text-[9px] text-muted-foreground border-t border-brass/25 pt-1">THE FRONT IS QUIET — NO PRESSURE REPORTED.</p>
      ) : (
        <div className="border-t border-brass/25 pt-1 space-y-0.5">
          {hotspots.slice(0, 4).map((h, i) => (
            <p key={h.id} className="font-mono text-[9px] text-brass-bright">
              {i + 1}. {h.node.name.toUpperCase()}
              <span className="text-muted-foreground"> — {DOMINANT_META[h.dominant].label.toUpperCase()} · {Math.round(h.heat * 100)}%</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}