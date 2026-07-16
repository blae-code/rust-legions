import React from "react";
import { ALL_MANEUVERS } from "@/lib/massCombat";

export default function ReportForce({ side, title, accent, won }) {
  const maneuvers = Object.entries(side.maneuvers || {}).sort((a, b) => b[1] - a[1]);
  return (
    <div className={`flex-1 border rounded-sm p-3 ${won ? "border-brass/60 bg-brass/5" : "border-border bg-background/40"}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="cq-label" style={{ color: accent }}>{title}{won ? " · Victor" : ""}</p>
        {side.rank && <span className="cq-tag border-border text-muted-foreground">{side.rank}</span>}
      </div>
      <p className="text-sm font-heading font-semibold text-secondary-foreground">{side.faction}</p>
      <p className="text-[10px] font-mono text-muted-foreground mb-2">{side.general}</p>
      <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px] mb-2">
        <div className="border border-border rounded-sm py-1">
          <p className="text-rust font-bold">{side.losses}</p>
          <p className="text-muted-foreground text-[8px] uppercase">Losses</p>
        </div>
        <div className="border border-border rounded-sm py-1">
          <p className="text-brass-bright font-bold">{side.remaining}</p>
          <p className="text-muted-foreground text-[8px] uppercase">Remaining</p>
        </div>
        <div className="border border-border rounded-sm py-1">
          <p className="text-secondary-foreground font-bold">{side.morale}</p>
          <p className="text-muted-foreground text-[8px] uppercase">Morale</p>
        </div>
      </div>
      <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Maneuvers Employed</p>
      {maneuvers.length === 0 ? (
        <p className="text-[10px] font-mono text-muted-foreground">— None recorded —</p>
      ) : (
        <div className="space-y-0.5">
          {maneuvers.map(([key, count]) => (
            <div key={key} className="flex justify-between text-[10px] font-mono text-secondary-foreground">
              <span>{ALL_MANEUVERS[key]?.icon} {ALL_MANEUVERS[key]?.label || key}</span>
              <span className="text-brass-bright">×{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}