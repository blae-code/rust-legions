import React from "react";
import { AlertTriangle, Anchor, Fuel } from "lucide-react";
import { KIND_LABEL } from "@/lib/macro/ledger";
import { RESOURCE_META } from "@/lib/units";

export default function LedgerNodeRow({ holding }) {
  const yields = Object.entries(holding.yield);
  return (
    <div className={`flex items-center gap-3 rounded-sm border px-3 py-2 ${holding.inSupply ? "border-border bg-secondary/30" : "border-rust/60 bg-rust/10"}`}>
      <span className="shrink-0 text-brass">
        {holding.isBase ? <Anchor className="w-3.5 h-3.5" /> : holding.kind === "depot" ? <Fuel className="w-3.5 h-3.5" /> : <span className="block w-2 h-2 rounded-full bg-brass/70" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-heading tracking-wide text-sm text-secondary-foreground truncate">
          {holding.name}
          {holding.isBase && <span className="text-brass-bright text-[10px] tracking-[0.2em] ml-2">FORTRESS-BASE</span>}
        </p>
        <p className="font-mono text-[10px] text-muted-foreground tracking-widest">
          {KIND_LABEL[holding.kind]?.toUpperCase()}
        </p>
      </div>
      <div className="flex items-center gap-2 font-mono text-xs text-secondary-foreground">
        {yields.length === 0 ? (
          <span className="text-muted-foreground text-[10px]">NO YIELD</span>
        ) : (
          yields.map(([k, v]) => (
            <span key={k} title={RESOURCE_META[k]?.label} className={holding.inSupply ? "" : "line-through text-muted-foreground"}>
              {RESOURCE_META[k]?.icon} +{v}
            </span>
          ))
        )}
      </div>
      {!holding.inSupply && (
        <span className="shrink-0 inline-flex items-center gap-1 text-rust font-heading uppercase text-[10px] tracking-widest">
          <AlertTriangle className="w-3 h-3" /> Cut off
        </span>
      )}
    </div>
  );
}