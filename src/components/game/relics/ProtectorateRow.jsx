import React from "react";
import { AlertTriangle } from "lucide-react";
import { RESOURCE_META } from "@/lib/units";

const RES = ["manpower", "steel", "fuel"];

// One settlement's file: what it was, what terms stand, and what it pays
export default function ProtectorateRow({ entry }) {
  const { dossier } = entry;
  return (
    <div className={`rounded-sm border p-3 ${entry.inSupply ? "border-border bg-secondary/20" : "border-rust/50 bg-rust/5"}`}>
      <div className="flex items-baseline gap-2 flex-wrap">
        <p className="font-heading uppercase tracking-[0.16em] text-xs text-brass-bright">{entry.name}</p>
        <p className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">{entry.kindLabel}</p>
        {!entry.inSupply && (
          <span className="inline-flex items-center gap-1 font-mono text-[9px] text-rust tracking-widest ml-auto">
            <AlertTriangle className="w-3 h-3" /> CUT OFF — PAYS NOTHING
          </span>
        )}
      </div>

      {dossier?.title && <p className="text-[11px] text-brass/80 italic mt-1">{dossier.title}</p>}
      {dossier?.text && <p className="text-[11px] text-secondary-foreground leading-snug mt-0.5">{dossier.text}</p>}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
        {RES.map((k) => (
          <span key={k} className="inline-flex items-center gap-1 font-mono text-[10px] text-secondary-foreground">
            <span>{RESOURCE_META[k]?.icon}</span>
            <span className={entry.yield[k] ? "text-brass-bright" : "text-muted-foreground"}>+{entry.yield[k]}</span>
          </span>
        ))}
        <span className="font-mono text-[9px] text-muted-foreground tracking-widest ml-auto">
          {entry.policy ? `ACCORD: ${entry.policy.label.toUpperCase()}` : "NO ACCORD STANDS"}
        </span>
      </div>

      <p className="font-mono text-[9px] text-muted-foreground tracking-wider mt-1.5">
        SURVEYED DAY {dossier?.foundTurn ?? "?"} · CHARTER {entry.charter ? entry.charter.toUpperCase() : "PENDING"}
        {entry.policy && ` · TERMS CUT DAY ${entry.policySince}`}
        {entry.locked && ` · SETTLING, ${entry.daysLeft} DAY${entry.daysLeft === 1 ? "" : "S"} LEFT`}
      </p>
    </div>
  );
}