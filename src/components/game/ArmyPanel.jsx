import React from "react";
import { Button } from "@/components/ui/button";
import { Swords, MoveRight, Undo2 } from "lucide-react";
import GeneralBadge from "@/components/game/GeneralBadge";
import { ARMY_UNIT_KEYS, REGIMENT_LABELS } from "@/lib/massCombat";

export default function ArmyPanel({ game, army, busy, onMarch, onEngage, onDisband }) {
  if (!army) return null;
  const tile = game.tiles.find((t) => t.id === army.tileId);
  const adjacent = (tile?.adjacentIds || [])
    .map((id) => game.tiles.find((t) => t.id === id))
    .filter((t) => t && !t.isSea);
  const canAct = game.isMyTurn && !game.battle;
  const onFriendly = tile?.state?.owner === game.mySlot;

  return (
    <div className="cq-panel cq-brackets p-4 space-y-3 border-brass/40">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold uppercase tracking-wide text-brass-bright">⚑ {army.name}</h3>
        <span className="font-mono text-[9px] text-muted-foreground">AT {tile?.name?.toUpperCase() || "?"}</span>
      </div>
      <GeneralBadge general={army.general} />
      <div className="space-y-1">
        {ARMY_UNIT_KEYS.map((k) => (army.regiments?.[k] || 0) > 0 && (
          <div key={k} className="flex justify-between text-xs">
            <span className="text-secondary-foreground font-heading tracking-wide">{REGIMENT_LABELS[k]}</span>
            <span className="font-mono text-brass-bright">×{army.regiments[k]}</span>
          </div>
        ))}
        <p className="font-mono text-[9px] text-muted-foreground pt-0.5">FIELD STRENGTH {army.strength} PTS</p>
      </div>
      {canAct && (
        <div className="space-y-1.5">
          <p className="cq-label">Orders</p>
          {adjacent.map((t) => {
            const friendly = t.state?.owner === game.mySlot;
            const hidden = t.visible === false;
            return (
              <Button
                key={t.id}
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => (friendly ? onMarch(army.id, t.id) : onEngage(army.id, t.id))}
                className={`w-full justify-start font-heading text-xs tracking-wide ${friendly ? "border-border text-secondary-foreground" : "border-rust/60 text-rust hover:bg-rust/10"}`}
              >
                {friendly ? <MoveRight className="w-3 h-3 mr-2" /> : <Swords className="w-3 h-3 mr-2" />}
                {friendly ? "March to" : "Engage"} {hidden ? "unknown zone" : t.name}
              </Button>
            );
          })}
          {onFriendly && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => onDisband(army.id)} className="w-full justify-start text-muted-foreground font-heading text-xs tracking-wide">
              <Undo2 className="w-3 h-3 mr-2" /> Disband into garrison
            </Button>
          )}
        </div>
      )}
    </div>
  );
}