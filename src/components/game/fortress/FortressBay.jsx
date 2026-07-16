import React from "react";
import { MODULE_SLOTS } from "@/lib/baseModules";
import ModuleBay from "@/components/game/fortress/ModuleBay";
import BaseMoveControl from "@/components/game/fortress/BaseMoveControl";

export default function FortressBay({ game, busy, onAction }) {
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
      <div className="space-y-2 mt-3">
        {Object.keys(MODULE_SLOTS).map((family) => (
          <ModuleBay key={family} family={family} base={base} game={game} busy={busy}
            onInstall={(moduleKey) => onAction({ action: "installModule", moduleKey })} />
        ))}
      </div>
      <BaseMoveControl base={base} game={game} busy={busy} onMove={(toTileId) => onAction({ action: "moveBase", toTileId })} />
    </div>
  );
}