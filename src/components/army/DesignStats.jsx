import React from "react";
import { costString } from "@/lib/units";

const pct = (v) => `${v > 1 ? "+" : ""}${Math.round((v - 1) * 100)}%`;

export default function DesignStats({ compiled }) {
  const c = compiled;
  const surcharge = costString(c.cost);
  return (
    <div className="border border-border rounded-sm bg-background/60 p-3 font-mono text-[11px] space-y-1">
      <p className="cq-label mb-1">Compiled Doctrine</p>
      <div className="flex justify-between text-secondary-foreground"><span>Battle skill</span><span className="text-brass-bright">{c.skill >= 0 ? "+" : ""}{c.skill}</span></div>
      <div className="flex justify-between text-secondary-foreground"><span>Damage dealt</span><span className={c.dmgOut >= 1 ? "text-brass-bright" : "text-rust"}>{pct(c.dmgOut)}</span></div>
      <div className="flex justify-between text-secondary-foreground"><span>Damage taken</span><span className={c.dmgIn <= 1 ? "text-brass-bright" : "text-rust"}>{pct(c.dmgIn)}</span></div>
      <div className="flex justify-between text-secondary-foreground"><span>Morale losses</span><span className={c.moraleIn <= 1 ? "text-brass-bright" : "text-rust"}>{pct(c.moraleIn)}</span></div>
      <div className="flex justify-between text-muted-foreground border-t border-border pt-1 mt-1"><span>Muster surcharge</span><span>{surcharge}</span></div>
    </div>
  );
}