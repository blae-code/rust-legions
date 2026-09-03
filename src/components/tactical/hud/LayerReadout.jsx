import React from "react";
import { layersOf } from "@/lib/tactical/durability";

const Meter = ({ label, cur, max, tone }) => {
  const f = max > 0 ? Math.max(0, cur / max) : 0;
  return (
    <div className="flex items-center gap-1.5">
      <span className="cq-label w-14 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-secondary rounded-sm overflow-hidden">
        <div className="h-full" style={{ width: `${f * 100}%`, background: tone }} />
      </div>
      <span className="font-mono text-[9px] w-12 text-right" style={{ color: cur > 0 ? tone : "hsl(var(--muted-foreground))" }}>
        {cur}/{max}
      </span>
    </div>
  );
};

// The stand's layers in depletion order. Health is what kills it; everything
// above only buys time — and once it's all gone the stand reads EXPOSED.
export default function LayerReadout({ stand }) {
  const { protection, health, exposed, unprotected } = layersOf(stand);

  return (
    <div className="mt-1.5 space-y-1">
      {protection.map((l) => (
        <Meter key={l.key} label={l.label} cur={l.cur} max={l.max} tone={l.tone} />
      ))}
      <Meter label="Health" cur={health.cur} max={health.max} tone={health.tone} />
      {(exposed || unprotected) && (
        <p className="font-mono text-[8px] text-rust tracking-widest">
          {unprotected ? "NO PROTECTION — TAKES FULL WEIGHT OF FIRE" : "ARMOUR BEATEN IN — EXPOSED, ×1.5 DAMAGE"}
        </p>
      )}
    </div>
  );
}