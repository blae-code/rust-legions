import React from "react";
import { X } from "lucide-react";
import { economyReport } from "@/lib/economy";
import ResourceLedger from "./ResourceLedger";
import SupplyRoutes from "./SupplyRoutes";

// Quartermaster's Ledger — full economy & supply dashboard for the session
export default function EconomyDashboard({ open, onClose, game }) {
  if (!open || !game) return null;
  const report = economyReport(game);
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="cq-panel cq-brackets relative w-full max-w-3xl max-h-[85vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <div className="flex items-center justify-between mb-4 pt-1">
          <div>
            <h2 className="cq-display text-xl">Quartermaster's Ledger</h2>
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest mt-0.5">STOCKPILES · PRODUCTION · SUPPLY ARTERIES</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-sm border border-border text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid md:grid-cols-[1.4fr_1fr] gap-4">
          <ResourceLedger resources={game.myResources} production={game.myProduction} zones={report.zones} />
          <SupplyRoutes report={report} myBase={game.myBase} />
        </div>
      </div>
    </div>
  );
}