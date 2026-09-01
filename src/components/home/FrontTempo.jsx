import React from "react";
import { motion } from "framer-motion";

// Operations tempo — active fronts rendered as an instrument strip:
// each war a labelled pressure bar, its length the depth of the campaign in turns.
const STATUS_TONE = {
  lobby: { bar: "hsl(var(--steel))", lamp: "bg-steel", label: "MUSTER" },
  active: { bar: "hsl(var(--brass))", lamp: "bg-brass", label: "ENGAGED" },
  complete: { bar: "hsl(var(--olive))", lamp: "bg-olive", label: "CLOSED" },
};

export default function FrontTempo({ games }) {
  if (!games || games.length === 0) return null;
  const shown = games.slice(0, 4);
  const maxTurn = Math.max(10, ...shown.map((g) => g.turnNumber || 1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.4 }}
      className="mt-4 max-w-md cq-panel p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="cq-label">Operations Tempo</p>
        <span className="font-mono text-[8px] text-muted-foreground tracking-[0.25em]">TURN DEPTH · LIVE</span>
      </div>
      <div className="space-y-2">
        {shown.map((g, i) => {
          const tone = STATUS_TONE[g.status] || STATUS_TONE.active;
          const frac = Math.min(1, (g.turnNumber || 1) / maxTurn);
          return (
            <div key={g.id} className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tone.lamp} ${g.status === "active" ? "cq-lamp text-brass" : ""}`} />
              <span className="font-heading text-[10px] uppercase tracking-wider text-foreground/80 w-24 truncate shrink-0">
                {g.name}
              </span>
              <div className="flex-1 h-2 rounded-sm bg-background/70 border border-border/60 overflow-hidden relative">
                <motion.div
                  className="h-full"
                  style={{
                    background: `linear-gradient(90deg, ${tone.bar}55, ${tone.bar})`,
                    boxShadow: `0 0 6px ${tone.bar}66`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(6, frac * 100)}%` }}
                  transition={{ duration: 1, delay: 0.9 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                />
                {/* gauge graduations */}
                <div className="absolute inset-0 flex justify-between px-[10%] pointer-events-none">
                  {[0, 1, 2, 3].map((t) => <span key={t} className="w-px h-full bg-background/50" />)}
                </div>
              </div>
              <span className="font-mono text-[8px] text-muted-foreground tracking-widest w-14 text-right shrink-0">
                T{g.turnNumber || 1} · {tone.label}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}