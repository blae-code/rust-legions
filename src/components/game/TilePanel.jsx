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
    <div className="border border-stone-800 bg-[#1C1714] rounded-lg p-4 space-y-3">
      <div>
        <h3 className="font-bold uppercase tracking-wider text-stone-100">
          {tile.isCapital && "★ "}{tile.name}
        </h3>
        <p className="text-xs text-stone-500">
          {tile.isSea ? "Sea zone" : `${tile.terrain} · Income ${tile.baseIncome}`}
          {tile.resourceBonus && ` · ${RESOURCE_LABELS[tile.resourceBonus]}`}
        </p>
        <p className="text-xs mt-1" style={{ color: ownerFaction?.color || "#a8a29e" }}>
          {ownerFaction ? `Held by ${ownerFaction.factionName}` : tile.isSea ? "Open waters" : "Neutral garrison"}
        </p>
      </div>

      {UNIT_KEYS.some((k) => state.units[k] > 0) && (
        <div className="text-xs space-y-0.5">
          {UNIT_KEYS.filter((k) => state.units[k] > 0).map((k) => (
            <div key={k} className="flex justify-between text-stone-300">
              <span>{UNIT_TYPES[k].label}</span>
              <span className="font-mono">{state.units[k]}</span>
            </div>
          ))}
        </div>
      )}

      {canAct && availableUnits.length > 0 && (
        <div className="border-t border-stone-800 pt-3 space-y-2">
          <p className="text-xs uppercase tracking-wider text-stone-500">Deploy to adjacent zone</p>
          <div className="flex flex-wrap gap-1">
            {adjacentTiles.map((t) => {
              const owner = t.state?.owner;
              const mine = owner === mySlot;
              const hidden = t.visible === false;
              return (
                <button
                  key={t.id}
                  onClick={() => setTargetId(t.id === targetId ? null : t.id)}
                  className={`text-[11px] px-2 py-1 rounded border ${
                    targetId === t.id ? "border-amber-500 text-amber-400" : "border-stone-700 text-stone-400 hover:border-stone-500"
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
                className={`w-full mt-2 uppercase tracking-wider text-xs ${
                  targetIsMine ? "bg-stone-700 hover:bg-stone-600" : "bg-red-900 hover:bg-red-800"
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