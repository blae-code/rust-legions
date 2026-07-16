import React, { useState } from "react";
import { VEHICLE_MODS, convoyCost } from "@/lib/commandVehicles";
import { costString } from "@/lib/units";

// Refit bays for a general's command vehicle — instant at a depot
// (barracks/foundry/fortress-base), or by supply convoy: slower but 25% cheaper.
export default function VehicleRefitSection({ army, busy, onRefit }) {
  const [open, setOpen] = useState(false);
  const g = army.general;
  if (!g || !g.vehicle) return null;
  const atDepot = !!army.vehicleDepot;
  const inSupply = army.inSupply !== false;
  const fitted = g.vehicleMods || {};
  const options = Object.entries(VEHICLE_MODS).filter(
    ([key, m]) => (m.bay === "equipment" || g.supreme || m.trait === g.trait) && fitted[m.bay] !== key
  );

  return (
    <div className="border border-border rounded-sm p-2 space-y-1.5">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-left">
        <span className="cq-label">⚙ Vehicle Refit Bays</span>
        <span className="font-mono text-[10px] text-muted-foreground">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <>
          <p className="font-mono text-[9px] text-muted-foreground">
            {atDepot
              ? "AT REFIT DEPOT — FITTED IMMEDIATELY"
              : inSupply
              ? "FIELD REFIT BY SUPPLY CONVOY — ARRIVES NEXT TURN, 25% CHEAPER"
              : "⚠ CUT OFF — NO DEPOT OR SUPPLY ROUTE IN REACH"}
          </p>
          {g.pendingRefit && (
            <p className="font-mono text-[9px] text-brass">
              🚚 CONVOY EN ROUTE — {VEHICLE_MODS[g.pendingRefit.modKey]?.label?.toUpperCase()}
            </p>
          )}
          {options.map(([key, m]) => {
            const cost = atDepot ? m.cost : convoyCost(m.cost);
            return (
              <button
                key={key}
                disabled={busy || !!g.pendingRefit || (!atDepot && !inSupply)}
                onClick={() => onRefit(g.id, key)}
                className="w-full text-left border border-border rounded-sm px-2 py-1 hover:border-brass/50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <span className="text-[11px] font-heading tracking-wide text-secondary-foreground">
                  {m.bay === "weapon" ? "☢" : "🔧"} {m.label}
                </span>
                <span className="block font-mono text-[9px] text-muted-foreground">
                  {m.bay.toUpperCase()} BAY · {m.effect} · {costString(cost)}
                </span>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}