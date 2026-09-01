import React from "react";
import { motion } from "framer-motion";
import { CHANGE_CATEGORIES, CATEGORY_KEYS } from "@/components/patch/patchMeta";

const BAR_TONE = {
  new_content: "hsl(var(--brass-bright))",
  balance: "hsl(var(--olive))",
  mechanics: "hsl(var(--steel))",
  fix: "hsl(var(--rust))",
  ui: "hsl(var(--secondary-foreground))",
  audio: "hsl(var(--muted-foreground))",
};

// Quantitative amendment ledger — each category a graduated pressure bar.
export default function AmendmentTally({ counts, total }) {
  const active = CATEGORY_KEYS.filter((k) => counts[k] > 0);
  if (active.length === 0) return null;
  const max = Math.max(...active.map((k) => counts[k]));

  return (
    <div className="space-y-1">
      {active.map((k, i) => {
        const meta = CHANGE_CATEGORIES[k];
        return (
          <div key={k} className="flex items-center gap-2">
            <span className={`font-mono text-[8px] tracking-[0.2em] w-7 shrink-0 ${meta.color}`}>{meta.code}</span>
            <div className="flex-1 h-1.5 rounded-sm bg-background/70 border border-border/60 overflow-hidden">
              <motion.div
                className="h-full"
                style={{ background: BAR_TONE[k], boxShadow: `0 0 5px ${BAR_TONE[k]}` }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(8, (counts[k] / max) * 100)}%` }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="font-mono text-[9px] text-muted-foreground w-4 text-right shrink-0">{counts[k]}</span>
          </div>
        );
      })}
      <p className="font-mono text-[8px] text-muted-foreground/70 tracking-[0.25em] pt-1">
        {total} AMENDMENT{total === 1 ? "" : "S"} FILED
      </p>
    </div>
  );
}