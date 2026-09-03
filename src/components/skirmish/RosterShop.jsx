import React from "react";
import { UNIT_TYPES, ARM_LABEL } from "@/lib/tactical/orbat";
import { COST, ROSTER_ORDER } from "@/lib/skirmish/roster";

// The requisition roster: every stand the commander may buy for this battle.
export default function RosterShop({ left, onBuy }) {
  return (
    <div className="grid sm:grid-cols-2 gap-1.5">
      {ROSTER_ORDER.map((key) => {
        const t = UNIT_TYPES[key];
        const cost = COST[key];
        const afford = cost <= left;
        return (
          <button
            key={key}
            disabled={!afford}
            onClick={() => onBuy(key)}
            className={`cq-metal p-2 rounded-sm border text-left transition-colors ${
              afford ? "border-border hover:border-brass/60" : "border-border/50 opacity-40 cursor-not-allowed"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-heading uppercase tracking-widest text-[11px] text-secondary-foreground">
                {t.label}
              </p>
              <span className="font-mono text-[10px] text-brass shrink-0">{cost}</span>
            </div>
            <p className="font-mono text-[9px] text-muted-foreground tracking-widest">
              {ARM_LABEL[t.arm].toUpperCase()} · A{t.atk} D{t.def} · {t.maxStr} EFF
            </p>
          </button>
        );
      })}
    </div>
  );
}