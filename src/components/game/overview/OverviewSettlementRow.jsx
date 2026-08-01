import React from "react";
import { RESOURCE_META } from "@/lib/units";

// A holding as it reads on the overview: accord, supply state and daily pay-in
export default function OverviewSettlementRow({ entry }) {
  return (
    <div className={`flex items-center gap-2 border rounded-sm px-2.5 py-1.5 ${entry.inSupply ? "border-border bg-secondary/20" : "border-rust/50 bg-rust/5"}`}>
      <span className="font-heading tracking-wide text-xs text-secondary-foreground truncate">{entry.name}</span>
      <span className="font-mono text-[9px] text-muted-foreground tracking-wider truncate">
        {entry.kindLabel.toUpperCase()} · {entry.policy ? entry.policy.label.toUpperCase() : "NO ACCORD"}
      </span>
      <span className="ml-auto flex items-center gap-2 font-mono text-[9px] shrink-0">
        {["manpower", "steel", "fuel"].map((k) =>
          entry.yield[k] ? (
            <span key={k} title={RESOURCE_META[k].label} className="text-brass">
              {RESOURCE_META[k].icon}+{entry.yield[k]}
            </span>
          ) : null
        )}
        <span className={entry.inSupply ? "text-olive" : "text-rust"}>{entry.inSupply ? "SUPPLIED" : "CUT OFF"}</span>
      </span>
    </div>
  );
}