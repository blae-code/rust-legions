import React from "react";
import { motion } from "framer-motion";
import { Flame, Landmark, Skull, Crown, Radio, Swords } from "lucide-react";

const KIND = {
  blood: { icon: Flame, tone: "text-rust" },
  capital: { icon: Landmark, tone: "text-brass-bright" },
  event: { icon: Radio, tone: "text-brass" },
  bloodiest: { icon: Swords, tone: "text-rust" },
  fall: { icon: Skull, tone: "text-rust" },
  victory: { icon: Crown, tone: "text-brass-bright" },
};

// The campaign's turning points, telegraphed in one after the other
export default function MilestoneReel({ milestones }) {
  if (!milestones.length) {
    return (
      <p className="font-mono text-[10px] text-muted-foreground">
        NO MILESTONES RECORDED — THE WAR ENDED BEFORE IT TRULY BEGAN.
      </p>
    );
  }

  return (
    <div className="relative pl-4 space-y-2.5">
      <span className="absolute left-[5px] top-1 bottom-1 w-px bg-gradient-to-b from-brass/50 via-border to-transparent" />
      {milestones.map((m, i) => {
        const { icon: Icon, tone } = KIND[m.kind] || KIND.event;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.07, duration: 0.35 }}
            className="relative flex items-start gap-2"
          >
            <span className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full border border-brass/60 bg-background" />
            <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${tone}`} />
            <p className="font-body text-xs text-secondary-foreground leading-relaxed">
              {m.turn !== null && <span className="font-mono text-[10px] text-steel mr-1.5">T{m.turn}</span>}
              {m.text}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}