import React from "react";
import { Store } from "lucide-react";
import { POLICIES, POLICY_COOLDOWN_DAYS } from "@/lib/settlementPolicy";

// One held settlement and the terms standing with its populace
export default function SettlementAccordRow({ node, dossier, current, turnNumber, canOrder, busy, onSet, onOpenBazaar }) {
  const locked = current && turnNumber - current.since < POLICY_COOLDOWN_DAYS;
  const daysLeft = current ? POLICY_COOLDOWN_DAYS - (turnNumber - current.since) : 0;

  return (
    <div className="rounded-sm border border-border bg-secondary/20 p-3">
      <div className="flex items-baseline gap-2">
        <p className="font-heading uppercase tracking-[0.16em] text-xs text-brass-bright">{node?.name || "Unknown"}</p>
        <p className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">{node?.kind}</p>
        {onOpenBazaar && (
          <button
            onClick={onOpenBazaar}
            title="Open the bazaar — trade stores or a salvaged relic"
            className="ml-auto inline-flex items-center gap-1 font-heading uppercase tracking-[0.14em] text-[10px] text-brass hover:text-brass-bright transition-colors"
          >
            <Store className="w-3 h-3" /> Bazaar
          </button>
        )}
      </div>
      {dossier?.title && <p className="text-[11px] text-muted-foreground italic mt-0.5">{dossier.title}</p>}

      <div className="grid grid-cols-3 gap-1.5 mt-2">
        {POLICIES.map((p) => {
          const active = current?.policy === p.id;
          return (
            <button
              key={p.id}
              title={`${p.blurb} — ${p.bonus}`}
              disabled={busy || !canOrder || active || locked}
              onClick={() => onSet(node.id, p.id)}
              className={`cq-metal rounded-sm border px-2 py-1.5 text-left disabled:opacity-45 transition-colors ${
                active ? "border-brass bg-brass/15" : "border-border hover:border-brass/60"
              }`}
            >
              <p className={`font-heading uppercase tracking-[0.14em] text-[10px] ${active ? "text-brass-bright" : "text-secondary-foreground"}`}>
                {p.label}
              </p>
              <p className="font-mono text-[9px] text-muted-foreground leading-tight mt-0.5">{p.bonus}</p>
            </button>
          );
        })}
      </div>

      <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-1.5">
        {!current
          ? "NO ACCORD STANDS — THE POPULACE AWAITS TERMS"
          : locked
            ? `TERMS SETTLING — ${daysLeft} DAY${daysLeft === 1 ? "" : "S"} BEFORE THEY MAY BE RE-CUT`
            : `TERMS MAY BE RE-CUT`}
      </p>
    </div>
  );
}