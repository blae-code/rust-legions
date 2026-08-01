import React from "react";
import { motion } from "framer-motion";
import { Skull } from "lucide-react";

// Shown while the Ministry's War of Attrition is in force: the front froze for
// too long, columns bleed daily, and the war is decided on points at the deadline.
export default function AttritionBanner({ attrition, turnNumber }) {
  if (!attrition?.active) return null;
  const daysLeft = Math.max((attrition.deadline ?? turnNumber) - turnNumber, 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="cq-panel relative overflow-hidden border-rust/70 px-4 py-3 flex items-center gap-3"
    >
      <div className="cq-hazard absolute top-0 left-0 right-0" />
      <span className="w-9 h-9 shrink-0 rounded-full cq-metal bg-secondary border border-rust/60 text-rust flex items-center justify-center cq-flicker">
        <Skull className="w-4 h-4" />
      </span>
      <div className="min-w-0 pt-1">
        <p className="font-heading uppercase tracking-[0.25em] text-sm text-rust">War of Attrition in Force</p>
        <p className="font-mono text-[10px] text-muted-foreground tracking-widest mt-0.5">
          THE FRONT FROZE — EVERY FACTION'S STRONGEST COLUMN BLEEDS A COMPANY EACH DAWN. SEIZE A SETTLEMENT TO LIFT IT.
        </p>
      </div>
      <div className="ml-auto shrink-0 text-center border border-rust/50 rounded-sm px-3 py-1.5 bg-black/40">
        <p className="cq-display text-xl text-rust leading-none">{daysLeft}</p>
        <p className="font-mono text-[8px] text-muted-foreground tracking-widest mt-0.5">DAYS TO DECISION ON POINTS</p>
      </div>
    </motion.div>
  );
}