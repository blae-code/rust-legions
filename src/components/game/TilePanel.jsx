import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UNIT_TYPES, UNIT_KEYS, RESOURCE_LABELS } from "@/lib/units";
import UnitStepper from "./UnitStepper";

export default function TilePanel({ game, tile, onMove, onAttack, busy }) {
  const [targetId, setTargetId] = useState(null);
  const [qty, setQty] = useState({});

  useEffect(() => {
    setTargetId(null);
    setQty({});
  }, [tile?.id]);

  if (!tile || tile.visible === false) return null;

  const mySlot = game.mySlot;
  const state = tile.state || { owner: null, units: {} };
  const isMine = state.owner === mySlot;
  const ownerFaction = state.owner !== null && state.owner !== undefined ? game.factions[state.owner] : null;

  const adjacentTiles = (tile.adjacentIds || [])
    .map((aid) => game.tiles.find((t) => t.id === aid))
    .filter(Boolean);

  const target = adjacentTiles.find((t) => t.id === targetId);
  const targetIsMine = target?.state?.owner === mySlot;
  const canAct = game.isMyTurn && isMine && game.status === "active";

  const availableUnits = UNIT_KEYS.filter((k) => (state.units[k] || 0) > 0);

  const submit = () => {
    const units = { ...qty };
    if (targetIsMine) onMove(tile.id, targetId, units);
    else onAttack(tile.id, targetId, units);
    setTargetId(null);
    setQty({});
  };

  return (
    <div className="cq-panel p-4 space-y-3">
      <div>
        <h3 className="font-heading font-semibold text-lg uppercase tracking-wide text-foreground">
          {tile.isCapital && <span className="text-brass-bright">★ </span>}{tile.name}
        </h3>
        <p className="text-xs text-muted-foreground font-mono">
          {tile.isSea ? "SEA ZONE" : `${tile.terrain?.toUpperCase()} · INCOME ${tile.baseIncome}`}
          {tile.resourceBonus && ` · ${RESOURCE_LABELS[tile.resourceBonus].toUpperCase()}`}
        </p>
        <p className="text-xs mt-1 font-heading tracking-wide" style={{ color: ownerFaction?.color || "hsl(30 9% 54%)" }}>
          {ownerFaction ? `Held by ${ownerFaction.factionName}` : tile.isSea ? "Open waters" : "Neutral garrison"}
        </p>
      </div>

      {UNIT_KEYS.some((k) => state.units[k] > 0) && (
        <div className="text-xs space-y-0.5 border-t border-border pt-2">
          {UNIT_KEYS.filter((k) => state.units[k] > 0).map((k) => (
            <div key={k} className="flex justify-between text-secondary-foreground">
              <span className="font-heading tracking-wide">{UNIT_TYPES[k].label}</span>
              <span className="font-mono text-brass-bright">{state.units[k]}</span>
            </div>
          ))}
        </div>
      )}

      {canAct && availableUnits.length > 0 && (
        <div className="border-t border-border pt-3 space-y-2">
          <p className="cq-label">Deploy to adjacent zone</p>
          <div className="flex flex-wrap gap-1">
            {adjacentTiles.map((t) => {
              const owner = t.state?.owner;
              const mine = owner === mySlot;
              const hidden = t.visible === false;
              return (
                <button
                  key={t.id}
                  onClick={() => setTargetId(t.id === targetId ? null : t.id)}
                  className={`text-[11px] font-heading tracking-wide px-2 py-1 rounded-sm border transition-colors ${
                    targetId === t.id ? "border-brass text-brass-bright bg-brass/10" : "border-border text-muted-foreground hover:border-steel"
                  }`}
                >
                  {hidden ? "Unknown zone" : t.name} {!hidden && (mine ? "· yours" : owner !== null && owner !== undefined ? "· enemy" : "· neutral")}
                </button>
              );
            })}
          </div>

          {target && (
            <div className="space-y-1 pt-1">
              {availableUnits.map((k) => (
                <UnitStepper
                  key={k}
                  label={UNIT_TYPES[k].label}
                  value={qty[k] || 0}
                  max={state.units[k]}
                  onChange={(v) => setQty({ ...qty, [k]: v })}
                />
              ))}
              <Button
                disabled={busy || !UNIT_KEYS.some((k) => (qty[k] || 0) > 0)}
                onClick={submit}
                className={`w-full mt-2 font-heading uppercase tracking-[0.2em] text-xs ${
                  targetIsMine ? "bg-secondary hover:bg-muted text-secondary-foreground" : "bg-rust hover:bg-destructive text-destructive-foreground"
                }`}
              >
                {targetIsMine ? "Move Units" : "Attack"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}