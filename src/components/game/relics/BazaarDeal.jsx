import React from "react";
import { RESOURCE_META } from "@/lib/units";

const cost = (r = {}) => Object.entries(r).map(([k, v]) => `${v} ${RESOURCE_META[k]?.label || k}`).join(" + ");

// One stall at the market
export default function BazaarDeal({ deal, disabled, note, onTake }) {
  return (
    <button
      disabled={disabled}
      onClick={() => onTake(deal)}
      className="cq-metal w-full text-left rounded-sm border border-border px-3 py-2 hover:border-brass/60 disabled:opacity-40 transition-colors"
    >
      <p className="font-heading uppercase tracking-[0.16em] text-xs text-brass-bright">{deal.label}</p>
      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{deal.detail}</p>
      <p className="font-mono text-[9px] text-secondary-foreground tracking-wider mt-1">
        GIVE {deal.relic ? "1 SALVAGED RELIC" : cost(deal.give).toUpperCase()}
        {deal.gain && ` · TAKE ${cost(deal.gain).toUpperCase()}`}
        {deal.boost && ` · PLEDGE +${deal.boost.amt} ${deal.boost.res.toUpperCase()} DAILY`}
      </p>
      {note && <p className="font-mono text-[9px] text-rust tracking-wider mt-1">{note}</p>}
    </button>
  );
}