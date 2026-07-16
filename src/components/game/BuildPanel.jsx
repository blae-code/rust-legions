import React from "react";
import { Button } from "@/components/ui/button";
import { BUILDINGS, BUILDING_KEYS, RESOURCE_KEYS, costString } from "@/lib/units";

export default function BuildPanel({ game, tile, busy, onBuild }) {
  if (!tile || tile.isSea || tile.visible === false) return null;
  if (tile.state?.owner !== game.mySlot) return null;

  const buildings = tile.state.buildings || [];
  const canAct = game.isMyTurn && game.status === "active";
  const slotLimit = tile.isCapital ? 2 : 1;
  const freeSlot = buildings.length < slotLimit;
  const res = game.myResources || {};
  const afford = (cost = {}) => RESOURCE_KEYS.every((k) => (res[k] || 0) >= (cost[k] || 0));

  return (
    <div className="cq-panel p-4 space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="cq-label">Structures</h3>
        <span className="text-[10px] font-mono text-muted-foreground">{buildings.length}/{slotLimit} slots</span>
      </div>

      {buildings.length === 0 && <p className="text-xs text-muted-foreground">No structures in this zone.</p>}

      {buildings.map((b, i) => {
        const def = BUILDINGS[b.type];
        const upgradable = def?.upgradeCost && b.level === 1 && !b.pending;
        return (
          <div key={i} className="flex items-center justify-between gap-2 border border-border bg-secondary/30 rounded-sm px-2.5 py-1.5">
            <div>
              <p className="text-xs font-heading font-semibold tracking-wide text-brass-bright">
                {def?.label} {b.pending ? <span className="text-muted-foreground font-normal">(under construction)</span> : `· Lv ${b.level}`}
              </p>
              <p className="text-[10px] text-muted-foreground">{def?.desc}</p>
            </div>
            {canAct && upgradable && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy || !afford(def.upgradeCost)}
                onClick={() => onBuild(tile.id, b.type)}
                className="h-7 border-brass/50 text-brass-bright text-[10px] font-heading uppercase tracking-wider shrink-0"
              >
                Upgrade · {costString(def.upgradeCost)}
              </Button>
            )}
          </div>
        );
      })}

      {canAct && freeSlot && (
        <div className="border-t border-border pt-2 space-y-1">
          <p className="cq-label">Construct (ready next turn)</p>
          {BUILDING_KEYS.filter((k) => !buildings.some((b) => b.type === k)).map((k) => {
            const def = BUILDINGS[k];
            return (
              <button
                key={k}
                disabled={busy || !afford(def.cost)}
                onClick={() => onBuild(tile.id, k)}
                className="w-full flex items-center justify-between gap-2 text-left border border-border rounded-sm px-2.5 py-1.5 hover:border-brass/60 disabled:opacity-40 disabled:hover:border-border transition-colors"
              >
                <div>
                  <p className="text-xs font-heading font-semibold tracking-wide text-foreground">{def.label}</p>
                  <p className="text-[10px] text-muted-foreground">{def.desc}</p>
                </div>
                <span className="text-[10px] font-mono text-brass-bright shrink-0">{costString(def.cost)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}