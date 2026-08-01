import React from "react";

// A standing bonus in service — doctrine, relic or matched set
export default function BonusRow({ bonus }) {
  return (
    <div className="border border-brass/40 bg-brass/5 rounded-sm px-2.5 py-1.5">
      <div className="flex items-baseline gap-2">
        <p className="font-heading uppercase tracking-[0.14em] text-xs text-brass-bright truncate">{bonus.label}</p>
        <span className="ml-auto font-mono text-[9px] text-muted-foreground tracking-widest shrink-0">
          {bonus.source.toUpperCase()}
        </span>
      </div>
      <p className="font-mono text-[9px] text-secondary-foreground tracking-wider">{bonus.effect}</p>
    </div>
  );
}