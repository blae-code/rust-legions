import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ARMY_UNIT_KEYS, REGIMENT_LABELS } from "@/lib/massCombat";

// Feed garrison companies into a field army — only possible while the zone is in supply
export default function ReinforceSection({ game, army, tile, busy, onReinforce }) {
  const [qty, setQty] = useState({});
  useEffect(() => setQty({}), [army?.id]);
  const st = tile?.state || {};
  if (st.owner !== game.mySlot || army.inSupply === false) return null;
  const available = ARMY_UNIT_KEYS.filter((k) => (st.units?.[k] || 0) > 0);
  if (available.length === 0) return null;
  const total = ARMY_UNIT_KEYS.reduce((s, k) => s + (qty[k] || 0), 0);
  const step = (k, d) => setQty((p) => ({ ...p, [k]: Math.max(Math.min((p[k] || 0) + d, st.units?.[k] || 0), 0) }));

  return (
    <div className="border-t border-border pt-2 space-y-1.5">
      <p className="cq-label">Rearm &amp; Reinforce</p>
      {available.map((k) => (
        <div key={k} className="flex items-center justify-between text-xs">
          <span className="text-secondary-foreground font-heading tracking-wide">
            {REGIMENT_LABELS[k]} <span className="text-muted-foreground font-mono">({st.units?.[k] || 0})</span>
          </span>
          <span className="flex items-center gap-2">
            <button onClick={() => step(k, -1)} className="w-5 h-5 border border-border rounded-sm text-muted-foreground hover:border-brass/60">−</button>
            <span className="font-mono w-5 text-center text-brass-bright">{qty[k] || 0}</span>
            <button onClick={() => step(k, 1)} className="w-5 h-5 border border-border rounded-sm text-muted-foreground hover:border-brass/60">+</button>
          </span>
        </div>
      ))}
      <Button
        size="sm"
        variant="outline"
        disabled={busy || total === 0}
        onClick={() => { onReinforce(army.id, qty); setQty({}); }}
        className="w-full font-heading uppercase text-xs tracking-[0.2em]"
      >
        Transfer to Army
      </Button>
    </div>
  );
}