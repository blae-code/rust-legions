import React from "react";
import { X, ClipboardList, AlertTriangle } from "lucide-react";
import { ledgerReport } from "@/lib/macro/ledger";
import { RESOURCE_KEYS, RESOURCE_META } from "@/lib/units";
import LedgerNodeRow from "./LedgerNodeRow";

export default function QuartermasterLedger({ open, onClose, game }) {
  if (!open) return null;
  const r = ledgerReport(game);

  return (
    <div className="fixed inset-0 z-[65] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="cq-panel relative w-full max-w-2xl max-h-[85vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-brass-bright">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mt-1 mb-1">
          <ClipboardList className="w-4 h-4 text-brass" />
          <h2 className="cq-display text-2xl leading-none">Quartermaster's Ledger</h2>
        </div>
        <p className="cq-label mb-4">Holdings · daily yield · supply coverage</p>

        {r.controlled === 0 ? (
          <div className="border border-dashed border-border rounded-sm p-6 text-center space-y-2">
            <p className="font-heading uppercase tracking-[0.2em] text-sm text-brass">The ledger is empty</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Your faction holds no settlements yet, so there is nothing to account for and no supply
              network to trace. March a column onto a township, city or fuel depot to open your first
              entry — the fortress-base and any captured depot then anchor supply for everything within
              roughly three road-days.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-border rounded-sm p-3 text-center bg-secondary/30">
                <p className="cq-display text-2xl text-brass-bright leading-none">{r.controlled}</p>
                <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-1">HOLDINGS OF {r.settlementCount}</p>
              </div>
              <div className={`border rounded-sm p-3 text-center ${r.coverage === 100 ? "border-border bg-secondary/30" : "border-rust/60 bg-rust/10"}`}>
                <p className={`cq-display text-2xl leading-none ${r.coverage === 100 ? "text-brass-bright" : "text-rust"}`}>{r.coverage}%</p>
                <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-1">SUPPLY COVERAGE</p>
              </div>
              <div className="border border-border rounded-sm p-3 text-center bg-secondary/30">
                <p className="cq-display text-2xl text-brass-bright leading-none">{r.hubs.length}</p>
                <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-1">SUPPLY HUBS</p>
              </div>
            </div>

            <div className="border border-border rounded-sm p-3 bg-secondary/20">
              <p className="cq-label mb-2">Daily income</p>
              <div className="flex gap-5 font-mono text-sm text-secondary-foreground">
                {RESOURCE_KEYS.map((k) => (
                  <span key={k} title={RESOURCE_META[k].label} className="inline-flex items-center gap-1.5">
                    {RESOURCE_META[k].icon} +{game.myProduction?.[k] ?? r.income[k]}
                    {r.lostIncome[k] > 0 && <span className="text-rust text-[10px]">(−{r.lostIncome[k]} cut off)</span>}
                  </span>
                ))}
              </div>
            </div>

            {(r.cutOff.length > 0 || r.columnsOut.length > 0) && (
              <div className="border border-rust/60 bg-rust/10 rounded-sm p-3 space-y-1">
                <p className="inline-flex items-center gap-1.5 font-heading uppercase tracking-[0.2em] text-xs text-rust">
                  <AlertTriangle className="w-3.5 h-3.5" /> Supply alerts
                </p>
                {r.cutOff.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    {r.cutOff.length} holding{r.cutOff.length === 1 ? "" : "s"} beyond the supply envelope — their yield is not reaching the ledger: {r.cutOff.map((h) => h.name).join(", ")}.
                  </p>
                )}
                {r.columnsOut.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    {r.columnsOut.length} column{r.columnsOut.length === 1 ? " is" : "s are"} out of supply — marching at half rate and bleeding companies: {r.columnsOut.map((c) => c.name).join(", ")}.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <p className="cq-label">Holdings</p>
              {r.holdings.map((h) => <LedgerNodeRow key={h.id} holding={h} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}