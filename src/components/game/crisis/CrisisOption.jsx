import React from "react";
import { RESOURCE_META } from "@/lib/units";

const cost = (r = {}) => Object.entries(r).map(([k, v]) => `${v} ${RESOURCE_META[k]?.label || k}`).join(" + ");

// One response the staff can put before the commander
export default function CrisisOption({ option, disabled, note, onChoose }) {
  const s = option.stability || 0;
  return (
    <button
      disabled={disabled}
      onClick={() => onChoose(option.id)}
      className="cq-metal w-full text-left rounded-sm border border-border px-3 py-2 hover:border-brass/60 disabled:opacity-40 transition-colors"
    >
      <p className="font-heading uppercase tracking-[0.16em] text-xs text-brass-bright">{option.label}</p>
      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{option.detail}</p>
      <p className="font-mono text-[9px] tracking-wider mt-1 text-secondary-foreground">
        {option.give && `COST ${cost(option.give).toUpperCase()} · `}
        {option.gain && `TAKE ${cost(option.gain).toUpperCase()} · `}
        <span className={s >= 0 ? "text-olive" : "text-rust"}>STABILITY {s >= 0 ? `+${s}` : s}</span>
      </p>
      {note && <p className="font-mono text-[9px] text-rust tracking-wider mt-1">{note}</p>}
    </button>
  );
}