import React from "react";
import { ARMY_UNIT_KEYS, REGIMENT_LABELS } from "@/lib/massCombat";

export default function BattleForce({ side, title, accent, isMe }) {
  return (
    <div className={`flex-1 border rounded-sm p-3 ${isMe ? "border-brass/60 bg-brass/5" : "border-border bg-secondary/30"}`}>
      <p className="cq-label" style={{ color: accent }}>{title}{isMe ? " (You)" : ""}</p>
      <p className="text-sm font-heading font-semibold text-secondary-foreground truncate">{side.faction}</p>
      <p className="font-mono text-[9px] text-muted-foreground mb-2">
        {side.general?.toUpperCase()} · STRATEGY {side.strategy}
        {side.rank && side.rank !== "Green" && <span className="text-brass"> · {side.rank.toUpperCase()} +{side.vetBonus}</span>}
      </p>
      {side.vehicle && (
        <p className="font-mono text-[9px] text-brass/80 -mt-1.5 mb-2 truncate cursor-help" title={side.vehicle.effect}>
          ⚙ {side.vehicle.label.toUpperCase()}
        </p>
      )}
      <div className="space-y-0.5 text-[11px] font-mono text-secondary-foreground">
        {ARMY_UNIT_KEYS.map((k) => (side.units?.[k] || 0) > 0 && (
          <div key={k} className="flex justify-between"><span className="text-muted-foreground">{REGIMENT_LABELS[k]}</span><span>×{side.units[k]}</span></div>
        ))}
        <div className="flex justify-between text-rust"><span>Losses</span><span>{side.losses}</span></div>
      </div>
      <div className="mt-2">
        <div className="flex justify-between font-mono text-[9px] text-muted-foreground mb-0.5"><span>MORALE</span><span>{side.morale}</span></div>
        <div className="h-1.5 bg-muted rounded-sm overflow-hidden">
          <div className="h-full transition-all duration-500" style={{ width: `${side.morale}%`, background: side.morale > 50 ? "#8A9A5B" : side.morale > 25 ? "#C9A227" : "#A63A2B" }} />
        </div>
      </div>
      {side.chosen && <p className="font-mono text-[9px] text-olive mt-1.5">✓ ORDERS ISSUED</p>}
    </div>
  );
}