import React from "react";
import { Loader2 } from "lucide-react";
import { ARMORY_KINDS, armoryByKind } from "@/lib/armory";
import { costString, RESOURCE_KEYS } from "@/lib/units";

// The State Armory — spend treasury resources off-turn on prototypes and decrees
export default function ArmoryPanel({ game, busy, onUnlock }) {
  const unlocks = game.myUnlocks || [];
  const affords = (cost) => RESOURCE_KEYS.every((k) => (game.myResources?.[k] || 0) >= (cost[k] || 0));

  return (
    <div className="mt-5 border-t border-border pt-4">
      <p className="cq-label text-rust">The State Armory</p>
      <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-1 mb-3">
        ONE-TIME UNLOCKS · PAID FROM THE TREASURY · AVAILABLE OFF-TURN
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {Object.entries(ARMORY_KINDS).map(([kind, meta]) => (
          <div key={kind} className="border border-border rounded-sm bg-secondary/20 p-2.5">
            <div className="flex items-center gap-2">
              <span>{meta.icon}</span>
              <span className="cq-label">{meta.label}</span>
            </div>
            <p className="font-mono text-[9px] text-muted-foreground mt-0.5 mb-2">{meta.blurb}</p>
            <div className="space-y-1.5">
              {armoryByKind(kind).map(([itemId, item]) => {
                const owned = unlocks.includes(itemId);
                const canBuy = !owned && !busy && affords(item.cost);
                return (
                  <div key={itemId} className={`border rounded-sm p-2 ${owned ? "border-olive/50 bg-olive/5" : "border-border"}`}>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-heading tracking-wide text-secondary-foreground">{item.label}</span>
                      {owned ? (
                        <span className="font-mono text-[9px] text-olive tracking-widest shrink-0">IN SERVICE</span>
                      ) : (
                        <span className={`font-mono text-[9px] shrink-0 ${affords(item.cost) ? "text-brass" : "text-rust"}`}>{costString(item.cost)}</span>
                      )}
                    </div>
                    <p className="font-mono text-[9px] text-muted-foreground mt-0.5">{item.desc}</p>
                    {!owned && (
                      <button
                        disabled={!canBuy}
                        onClick={() => onUnlock(itemId)}
                        className="mt-1.5 cq-metal font-heading uppercase tracking-[0.2em] text-[9px] px-3 py-1 rounded-sm border border-brass/60 text-brass-bright hover:border-brass disabled:opacity-40 disabled:pointer-events-none transition-colors">
                        {busy ? <Loader2 className="w-3 h-3 animate-spin inline" /> : kind === "decree" ? "Enact Decree" : "Fund Prototype"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}