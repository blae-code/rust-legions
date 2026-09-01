import React from "react";
import { motion } from "framer-motion";
import CommandTip from "@/components/ui/CommandTip";
import { rankFor } from "@/lib/serviceRecord";

// Rank stamp with progress to the next commission.
export default function RankPlate({ wins = 0 }) {
  const rank = rankFor(wins);
  const toNext = rank.next ? rank.next.wins - wins : 0;
  const span = rank.next ? rank.next.wins - rank.wins : 1;
  const pct = rank.next ? Math.min(1, (wins - rank.wins) / span) : 1;

  return (
    <CommandTip
      title={rank.label}
      body={rank.next ? `${toNext} more victor${toNext === 1 ? "y" : "ies"} to ${rank.next.label}.` : "The highest commission the Ministry grants."}
      side="left"
    >
      <div className="rounded-sm border border-brass/40 bg-background/50 px-2.5 py-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[8px] text-muted-foreground tracking-[0.2em]">RANK</span>
          <span className="font-display text-brass-bright text-xs tracking-[0.2em]">{rank.insignia}</span>
        </div>
        <p className="font-heading uppercase tracking-[0.12em] text-[11px] text-foreground/90 truncate">{rank.label}</p>
        <div className="mt-1 h-1 rounded-sm bg-background border border-border/60 overflow-hidden">
          <motion.div
            className="h-full"
            style={{ background: "linear-gradient(90deg, hsl(var(--brass) / 0.5), hsl(var(--brass)))" }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(4, pct * 100)}%` }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </CommandTip>
  );
}