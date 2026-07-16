import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UNIT_TYPES, UNIT_KEYS, RESOURCE_KEYS, RESOURCE_META, hasBuilding, costString } from "@/lib/units";
import UnitStepper from "./UnitStepper";

export default function PurchasePanel({ game, onPurchase, busy }) {
  const [qty, setQty] = useState({});
  const [tileId, setTileId] = useState("");

  if (!game.isMyTurn || game.status !== "active") return null;

  const res = game.myResources || {};
  const costs = (k) => game.myCosts?.[k] || UNIT_TYPES[k].cost;
  const selected = UNIT_KEYS.filter((k) => (qty[k] || 0) > 0);
  const wantsSea = (qty.gunboat || 0) > 0;

  const myLandTiles = game.tiles.filter((t) => t.visible !== false && !t.isSea && t.state?.owner === game.mySlot);
  const seaOptions = game.tiles.filter(
    (t) => t.visible !== false && t.isSea && (t.adjacentIds || []).some((aid) => {
      const at = game.tiles.find((x) => x.id === aid);
      return at?.state?.owner === game.mySlot && hasBuilding(at.state, "foundry");
    })
  );
  const landSelected = selected.filter((k) => k !== "gunboat");
  const landOptions = myLandTiles.filter((t) =>
    landSelected.length > 0
      ? landSelected.every((k) => hasBuilding(t.state, UNIT_TYPES[k].deployAt))
      : ["barracks", "foundry", "airstrip"].some((b) => hasBuilding(t.state, b))
  );
  const placeOptions = wantsSea ? seaOptions : landOptions;

  const totalCost = {};
  let points = 0;
  for (const k of selected) {
    const c = costs(k);
    for (const rk of RESOURCE_KEYS) totalCost[rk] = (totalCost[rk] || 0) + (qty[k] || 0) * (c[rk] || 0);
    points += (qty[k] || 0) * UNIT_TYPES[k].points;
  }
  const affordable = RESOURCE_KEYS.every((k) => (totalCost[k] || 0) <= (res[k] || 0));
  const underCap = game.myArmyPoints + points <= game.myArmyCap;
  const canBuy = points > 0 && affordable && underCap && tileId && placeOptions.some((t) => t.id === tileId);
  const mixedDomains = wantsSea && landSelected.length > 0;

  return (
    <div className="cq-panel cq-brackets p-4 space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="cq-label">Requisition Units</h3>
        <span className="text-[10px] font-mono text-muted-foreground">{game.myArmyPoints}/{game.myArmyCap} pts</span>
      </div>
      {UNIT_KEYS.map((k) => (
        <UnitStepper
          key={k}
          label={`${UNIT_TYPES[k].label} · ${UNIT_TYPES[k].points}pts`}
          cost={costString(costs(k))}
          value={qty[k] || 0}
          onChange={(v) => setQty({ ...qty, [k]: v })}
        />
      ))}
      {mixedDomains ? (
        <p className="text-[11px] text-rust">Gunboats deploy separately — purchase them on their own.</p>
      ) : (
        <select
          value={tileId}
          onChange={(e) => setTileId(e.target.value)}
          className="w-full bg-input border border-border rounded-sm text-xs p-2 text-secondary-foreground font-heading tracking-wide"
        >
          <option value="">
            {placeOptions.length === 0
              ? (wantsSea ? "No sea zone by a coastal Foundry" : "No zone with the required structure")
              : `Deploy at… ${wantsSea ? "(sea zone)" : ""}`}
          </option>
          {placeOptions.map((t) => (
            <option key={t.id} value={t.id}>{t.isCapital ? "★ " : ""}{t.name}</option>
          ))}
        </select>
      )}
      <div className="flex justify-between items-center pt-1 gap-2">
        <span className={`text-[11px] font-mono ${!affordable ? "text-rust" : "text-muted-foreground"}`}>
          {selected.length === 0 ? "—" : RESOURCE_KEYS.filter((k) => totalCost[k]).map((k) => `${totalCost[k]} ${RESOURCE_META[k].short}`).join(" + ")}
          {points > 0 && <span className={underCap ? "" : "text-rust"}> · {points}pts</span>}
        </span>
        <Button
          size="sm"
          disabled={busy || !canBuy || mixedDomains}
          onClick={() => { onPurchase(tileId, qty); setQty({}); setTileId(""); }}
          className="bg-brass hover:bg-brass-bright text-primary-foreground font-heading uppercase tracking-[0.2em] text-xs"
        >
          Purchase
        </Button>
      </div>
      {!underCap && points > 0 && <p className="text-[11px] text-rust">Army cap reached — raise Manpower income to field more.</p>}
    </div>
  );
}