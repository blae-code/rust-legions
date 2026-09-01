import React from "react";
import { PRESENCE_OPTIONS, presenceMeta } from "@/lib/presence";
import { playSfx } from "@/lib/sfx";

// How the commander chooses to appear on the Ministry roll.
export default function PresenceSelector({ presence, onChange }) {
  const meta = presenceMeta(presence);
  return (
    <div className="space-y-1.5">
      <p className="cq-label">Standing on the Roll</p>
      <div className="grid grid-cols-3 gap-1">
        {PRESENCE_OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => { playSfx("select"); onChange(o.id); }}
            title={o.hint}
            className={`cq-metal flex items-center gap-1.5 rounded-sm border px-2 py-1 transition-colors ${
              presence === o.id ? "border-brass/70 bg-brass/10" : "border-border bg-secondary/30 hover:border-brass/40"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${o.dot}`} />
            <span className="font-heading uppercase tracking-widest text-[10px] text-secondary-foreground truncate">{o.label}</span>
          </button>
        ))}
      </div>
      <p className="font-mono text-[9px] text-muted-foreground tracking-widest">{meta.hint.toUpperCase()}</p>
    </div>
  );
}