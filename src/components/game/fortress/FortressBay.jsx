import React, { useState } from "react";
import { Wrench } from "lucide-react";
import { MODULE_SLOTS, BASE_MODULES } from "@/lib/baseModules";
import BaseMoveControl from "@/components/game/fortress/BaseMoveControl";
import RefitYard from "@/components/game/fortress/RefitYard";

export default function FortressBay({ game, busy, onAction }) {
  const [yardOpen, setYardOpen] = useState(false);
  const base = game.myBase;
  if (game.status !== "active" || !base) return null;

  return (
    <div className="cq-panel relative overflow-hidden p-4">
      <div className="cq-hazard absolute top-0 left-0 right-0" />
      <div className="flex items-center justify-between pt-1 mb-1">
        <p className="cq-label">Fortress-Base</p>
        <span className="font-mono text-[9px] text-brass tracking-widest">HULL DEF +{base.defense}</span>
      </div>
      <p className="font-heading text-sm text-secondary-foreground tracking-wide">Stationed at {base.tileName}</p>
      {base.income && (
        <p className="font-mono text-[9px] text-muted-foreground mt-0.5">
          ON-BOARD WORKS: {Object.entries(base.income).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(" · ")}
        </p>
      )}
      <div className="space-y-1 mt-3">
        {Object.entries(MODULE_SLOTS).map(([family, meta]) => {
          const key = base.modules?.[family];
          return (
            <div key={family} className="flex items-center gap-2 text-xs">
              <span>{meta.icon}</span>
              <span className="cq-label">{meta.label}</span>
              <span className={`ml-auto font-heading tracking-wide ${key ? "text-brass-bright" : "text-muted-foreground"}`}>
                {key ? BASE_MODULES[key]?.label : "EMPTY"}
              </span>
            </div>
          );
        })}
      </div>
      <button onClick={() => setYardOpen(true)}
        className="w-full mt-3 cq-metal font-heading uppercase tracking-[0.2em] text-[10px] px-3 py-2 rounded-sm border border-border text-secondary-foreground hover:border-brass/60 hover:text-brass-bright transition-colors flex items-center justify-center gap-2">
        <Wrench className="w-3 h-3" /> Open Refit Yard
      </button>
      <BaseMoveControl base={base} game={game} busy={busy} onMove={(toTileId) => onAction({ action: "moveBase", toTileId })} />
      <RefitYard open={yardOpen} onClose={() => setYardOpen(false)} base={base} game={game} busy={busy} onAction={onAction} />
    </div>
  );
}