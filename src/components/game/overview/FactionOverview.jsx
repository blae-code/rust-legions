import React from "react";
import { X, LayoutDashboard, Route } from "lucide-react";
import { overviewReport } from "@/lib/factionOverview";
import { RESOURCE_KEYS, RESOURCE_META } from "@/lib/units";
import OverviewStat from "@/components/game/overview/OverviewStat";
import OverviewSettlementRow from "@/components/game/overview/OverviewSettlementRow";
import BonusRow from "@/components/game/overview/BonusRow";
import StabilityGauge from "@/components/game/crisis/StabilityGauge";

// The Faction Overview — the whole war effort on one plate: holdings, the supply
// network that keeps them paying, and every standing bonus in service.
export default function FactionOverview({ open, onClose, game }) {
  if (!open) return null;
  const r = overviewReport(game);
  const { ledger, protectorate } = r;

  return (
    <div className="fixed inset-0 z-[68] bg-black/75 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="cq-panel cq-brackets relative w-full max-w-3xl my-6 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-brass-bright">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mt-1">
          <LayoutDashboard className="w-4 h-4 text-brass" />
          <h2 className="cq-display text-2xl leading-none">Faction Overview</h2>
        </div>
        <p className="cq-label mb-4">Holdings · supply network · standing bonuses</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <OverviewStat value={ledger.controlled} label={`HOLDINGS OF ${ledger.settlementCount}`} />
          <OverviewStat value={`${ledger.coverage}%`} label="SUPPLY COVERAGE" tone={ledger.coverage === 100 ? "brass" : "rust"} />
          <OverviewStat value={`${game.myLandControl ?? 0}%`} label={`CONTROL / ${game.mapControlTarget ?? 0}%`} />
          <OverviewStat value={`${game.myArmyPoints ?? 0}`} label={`ARMY OF ${game.myArmyCap ?? 0} PTS`} />
        </div>

        <div className="border border-border rounded-sm p-3 bg-secondary/20 mt-3 space-y-2">
          <p className="cq-label">Treasury &amp; daily income</p>
          <div className="flex flex-wrap gap-5 font-mono text-sm text-secondary-foreground">
            {RESOURCE_KEYS.map((k) => (
              <span key={k} title={RESOURCE_META[k].label} className="inline-flex items-center gap-1.5">
                {RESOURCE_META[k].icon} {game.myResources?.[k] ?? 0}
                <span className="text-brass text-[11px]">+{game.myProduction?.[k] ?? ledger.income[k]}</span>
                {ledger.lostIncome[k] > 0 && <span className="text-rust text-[10px]">({ledger.lostIncome[k]} at risk)</span>}
              </span>
            ))}
          </div>
          <StabilityGauge value={game.myStability} />
        </div>

        <div className="grid md:grid-cols-2 gap-3 mt-3">
          {/* Supply network */}
          <div className="border border-border rounded-sm p-3 bg-secondary/20 space-y-1.5">
            <p className="inline-flex items-center gap-1.5 cq-label"><Route className="w-3.5 h-3.5 text-brass" /> Supply network</p>
            <p className="font-mono text-[10px] text-secondary-foreground tracking-wider">
              {ledger.hubs.length} HUB{ledger.hubs.length === 1 ? "" : "S"} · {ledger.controlled - ledger.cutOff.length}/{ledger.controlled} HOLDINGS IN SUPPLY
            </p>
            {ledger.hubs.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Nothing anchors your supply. Park the fortress-base on a holding, or take a fuel depot.
              </p>
            ) : (
              ledger.hubs.map((h) => (
                <p key={h.id} className="font-mono text-[9px] text-brass tracking-wider">
                  ▸ {h.name.toUpperCase()} {h.isBase ? "— FORTRESS-BASE" : "— FUEL DEPOT"}
                </p>
              ))
            )}
            {ledger.cutOff.length > 0 && (
              <p className="font-mono text-[9px] text-rust tracking-wider">
                ✕ CUT OFF: {ledger.cutOff.map((h) => h.name.toUpperCase()).join(", ")}
              </p>
            )}
            {r.columns.length > 0 && (
              <p className="font-mono text-[9px] text-muted-foreground tracking-wider border-t border-border pt-1.5">
                {r.columns.length} COLUMN{r.columns.length === 1 ? "" : "S"} IN THE FIELD ·{" "}
                {r.columns.filter((c) => c.inSupply === false).length} OUT OF SUPPLY
              </p>
            )}
          </div>

          {/* Standing bonuses */}
          <div className="border border-border rounded-sm p-3 bg-secondary/20 space-y-1.5">
            <p className="cq-label">Standing bonuses</p>
            {r.focus && (
              <p className="font-mono text-[9px] text-muted-foreground tracking-wider">
                RESEARCHING {r.focus.label.toUpperCase()} · {r.focus.progress}/{r.focus.cost} RP
              </p>
            )}
            {r.bonuses.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                No doctrine in service and no precursor works recovered — your armies fight on issue equipment alone.
              </p>
            ) : (
              r.bonuses.map((b) => <BonusRow key={b.key} bonus={b} />)
            )}
          </div>
        </div>

        {/* Settlements */}
        <div className="mt-3 space-y-1.5">
          <p className="cq-label">Captured settlements</p>
          {protectorate.entries.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              No settlement has been surveyed under your flag yet. March a column onto a township, city or depot.
            </p>
          ) : (
            <>
              {protectorate.entries.map((e) => <OverviewSettlementRow key={e.id} entry={e} />)}
              <p className="font-mono text-[9px] text-muted-foreground tracking-widest">
                TRIBUTE REACHING THE WAR CHEST: {["manpower", "steel", "fuel"].map((k) => `${RESOURCE_META[k].icon}+${protectorate.totals[k]}`).join(" · ")}
                {protectorate.unsettled > 0 && ` · ${protectorate.unsettled} AWAITING AN ACCORD`}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}