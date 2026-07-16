import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { BASE_MODULES, MODULE_SLOTS, computeBaseStats } from "@/lib/baseModules";
import { costString, RESOURCE_KEYS } from "@/lib/units";
import RefitBay from "@/components/game/fortress/RefitBay";
import StatReadout from "@/components/game/fortress/StatReadout";

// The Refit Yard — slot armor, engine and industry modules with a live stat preview
export default function RefitYard({ open, onClose, base, game, busy, onAction }) {
  const [pending, setPending] = useState({});
  useEffect(() => { if (open) setPending({ ...(base?.modules || {}) }); }, [open, base?.modules]);
  if (!open || !base) return null;

  const changed = Object.keys(MODULE_SLOTS).filter((f) => pending[f] && pending[f] !== (base.modules?.[f] || null));
  const totalCost = {};
  for (const f of changed) {
    for (const [k, v] of Object.entries(BASE_MODULES[pending[f]].cost)) totalCost[k] = (totalCost[k] || 0) + v;
  }
  const affordable = RESOURCE_KEYS.every((k) => (game.myResources?.[k] || 0) >= (totalCost[k] || 0));

  const commission = async () => {
    for (const f of changed) await onAction({ action: "installModule", moduleKey: pending[f] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="cq-panel cq-brackets w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 relative" onClick={(e) => e.stopPropagation()}>
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <button onClick={onClose} className="absolute top-4 right-3 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
        <div className="pt-2 mb-4">
          <p className="cq-label text-rust">Mobile Command Engineering Corps</p>
          <h2 className="cq-display text-2xl">The Refit Yard</h2>
          <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-1">
            STATIONED AT {base.tileName?.toUpperCase()} · SELECT MODULES, REVIEW THE HULL READOUT, COMMISSION THE REFIT
          </p>
        </div>

        <StatReadout current={computeBaseStats(base.modules)} preview={computeBaseStats(pending)} />

        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          {Object.keys(MODULE_SLOTS).map((family) => (
            <RefitBay key={family} family={family}
              installedKey={base.modules?.[family] || null}
              selectedKey={pending[family] || null}
              unlocks={game.myUnlocks || []}
              onSelect={(key) => setPending((p) => ({ ...p, [family]: key }))} />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 mt-4 border-t border-border pt-3">
          <div className="font-mono text-[10px]">
            {changed.length === 0 ? (
              <span className="text-muted-foreground tracking-widest">NO CHANGES PENDING</span>
            ) : (
              <span className={affordable ? "text-brass" : "text-rust"}>
                REFIT COST: {costString(totalCost)}{!affordable && " — INSUFFICIENT STORES"}
              </span>
            )}
          </div>
          <button
            disabled={busy || !game.isMyTurn || changed.length === 0 || !affordable}
            onClick={commission}
            className="cq-metal font-heading uppercase tracking-[0.2em] text-xs px-4 py-2 rounded-sm border border-brass/60 text-brass-bright hover:border-brass disabled:opacity-40 disabled:pointer-events-none transition-colors">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : "Commission Refit"}
          </button>
        </div>
        {!game.isMyTurn && <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-2 text-right">REFITS MAY ONLY BE COMMISSIONED ON YOUR TURN</p>}
      </div>
    </div>
  );
}