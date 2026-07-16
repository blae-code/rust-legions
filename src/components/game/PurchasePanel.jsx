import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UNIT_TYPES, UNIT_KEYS } from "@/lib/units";
import UnitStepper from "./UnitStepper";

export default function PurchasePanel({ game, onPurchase, busy }) {
  const [qty, setQty] = useState({});
  const [tileId, setTileId] = useState("");

  if (!game.isMyTurn || game.status !== "active") return null;

  const myTiles = game.tiles.filter((t) => t.visible !== false && t.state?.owner === game.mySlot && !t.isSea);
  const mySeaTiles = game.tiles.filter(
    (t) => t.visible !== false && t.isSea && (t.adjacentIds || []).some((aid) => {
      const at = game.tiles.find((x) => x.id === aid);
      return at?.state?.owner === game.mySlot;
    })
  );
  const wantsSea = (qty.gunboat || 0) > 0;
  const placeOptions = wantsSea ? mySeaTiles : myTiles;

  const total = UNIT_KEYS.reduce((s, k) => s + (qty[k] || 0) * (game.myCosts?.[k] || UNIT_TYPES[k].cost), 0);
  const canBuy = total > 0 && total <= game.myTreasury && tileId && placeOptions.some((t) => t.id === tileId);

  return (
    <div className="border border-stone-800 bg-[#1C1714] rounded-lg p-4 space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-xs uppercase tracking-wider text-stone-500">Requisition Units</h3>
        <span className="text-sm font-mono text-amber-400">{game.myTreasury}₪</span>
      </div>
      {UNIT_KEYS.map((k) => (
        <UnitStepper
          key={k}
          label={UNIT_TYPES[k].label}
          cost={game.myCosts?.[k] || UNIT_TYPES[k].cost}
          value={qty[k] || 0}
          onChange={(v) => setQty({ ...qty, [k]: v })}
        />
      ))}
      <select
        value={tileId}
        onChange={(e) => setTileId(e.target.value)}
        className="w-full bg-stone-900 border border-stone-700 rounded text-xs p-2 text-stone-300"
      >
        <option value="">Place at… {wantsSea ? "(sea zone)" : ""}</option>
        {placeOptions.map((t) => (
          <option key={t.id} value={t.id}>{t.isCapital ? "★ " : ""}{t.name}</option>
        ))}
      </select>
      <div className="flex justify-between items-center pt-1">
        <span className={`text-xs font-mono ${total > game.myTreasury ? "text-red-400" : "text-stone-400"}`}>Cost: {total}₪</span>
        <Button
          size="sm"
          disabled={busy || !canBuy}
          onClick={() => { onPurchase(tileId, qty); setQty({}); setTileId(""); }}
          className="bg-amber-800 hover:bg-amber-700 uppercase tracking-wider text-xs"
        >
          Purchase
        </Button>
      </div>
    </div>
  );
}