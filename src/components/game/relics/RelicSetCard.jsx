import React from "react";
import { Check, Lock } from "lucide-react";
import { RELICS } from "@/lib/relics";

// One matched set: which pieces are in hand, and the bonus for completing it
export default function RelicSetCard({ set, held, complete }) {
  const have = set.members.filter((m) => held.includes(m)).length;
  return (
    <div className={`rounded-sm border px-2.5 py-2 ${complete ? "border-brass/60 bg-brass/10" : "border-border bg-secondary/20"}`}>
      <div className="flex items-center gap-1.5">
        {complete ? <Check className="w-3 h-3 text-brass-bright" /> : <Lock className="w-3 h-3 text-muted-foreground" />}
        <p className={`font-heading uppercase tracking-[0.14em] text-xs ${complete ? "text-brass-bright" : "text-secondary-foreground"}`}>
          {set.label}
        </p>
        <span className="ml-auto font-mono text-[9px] text-muted-foreground">{have}/{set.members.length}</span>
      </div>
      <div className="mt-1 space-y-0.5">
        {set.members.map((m) => (
          <p key={m} className={`font-mono text-[9px] tracking-wider ${held.includes(m) ? "text-olive" : "text-muted-foreground"}`}>
            {held.includes(m) ? "▪" : "▫"} {(RELICS[m]?.label || m).toUpperCase()}
          </p>
        ))}
      </div>
      <p className={`font-mono text-[9px] tracking-wider mt-1 border-t border-border pt-1 ${complete ? "text-brass" : "text-muted-foreground"}`}>
        SET BONUS — {set.effect}
      </p>
    </div>
  );
}