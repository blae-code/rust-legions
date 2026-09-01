import React from "react";
import { Crown, Skull } from "lucide-react";

const OUTCOME_STYLE = {
  Victory: "border-brass/70 text-brass-bright",
  Eliminated: "border-rust/60 text-rust",
  Armistice: "border-border text-muted-foreground",
};

function Stat({ label, value, tone = "text-secondary-foreground" }) {
  return (
    <div className="min-w-[64px]">
      <p className="font-mono text-[9px] text-muted-foreground tracking-widest">{label}</p>
      <p className={`font-display text-lg leading-none ${tone}`}>{value}</p>
    </div>
  );
}

// One commander's closing service record
export default function CommanderRecordRow({ record }) {
  const Icon = record.outcome === "Victory" ? Crown : record.outcome === "Eliminated" ? Skull : null;

  return (
    <div className={`relative overflow-hidden border rounded-sm p-3 ${record.outcome === "Victory" ? "border-brass/60 bg-brass/10" : "border-border bg-secondary/25"}`}>
      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: record.color }} />
      <div className="flex flex-wrap items-center gap-2 pl-2">
        {Icon && <Icon className={`w-4 h-4 ${record.outcome === "Victory" ? "text-brass" : "text-rust"}`} />}
        <span className="font-heading uppercase tracking-[0.15em] text-sm text-foreground">{record.factionName}</span>
        {record.isNPC && <span className="font-mono text-[9px] text-muted-foreground">NPC</span>}
        {record.isMe && <span className="cq-tag border-brass/50 text-brass-bright">You</span>}
        <span className={`cq-tag ml-auto ${OUTCOME_STYLE[record.outcome]}`}>{record.outcome}</span>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-2.5 pl-2">
        <Stat label="HOLDINGS" value={record.holdings} tone="text-brass-bright" />
        <Stat label="BATTLES" value={record.battles} />
        <Stat label="WON" value={record.won} tone="text-olive" />
        <Stat label="ASSAULTS LED" value={record.assaultsLed} />
        <Stat label="SITES TAKEN" value={record.captures} />
        <Stat label="SEATS TAKEN" value={record.capitals} tone="text-brass-bright" />
        <Stat label="LOSSES DEALT" value={record.inflicted} tone="text-olive" />
        <Stat label="LOSSES BORNE" value={record.suffered} tone="text-rust" />
      </div>
    </div>
  );
}