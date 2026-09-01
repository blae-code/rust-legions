import React from "react";
import { motion } from "framer-motion";

// Stamped registration masthead — Ministry of Heraldry, Form 9-H.
export default function FoundryHeader() {
  const now = new Date();
  const serial = `H-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}`;
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="cq-label text-rust">Ministry of Heraldry · Registration {serial}</p>
          <div className="relative inline-block">
            <h1 className="cq-display text-4xl sm:text-5xl leading-[0.9]">The Faction Foundry</h1>
            <motion.span
              className="cq-stamp absolute -right-24 top-1 text-[10px] whitespace-nowrap hidden sm:block"
              initial={{ opacity: 0, scale: 1.6, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: -8 }}
              transition={{ delay: 0.5, duration: 0.25, ease: "easeOut" }}
            >
              For the Record
            </motion.span>
          </div>
          <p className="text-sm text-muted-foreground font-heading tracking-wide mt-1 max-w-xl">
            Testify to your nation's history, chapter by chapter — the College of Heralds will synthesize it into lore, traits, and standing with the great powers.
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="font-mono text-[9px] text-muted-foreground tracking-[0.25em] leading-relaxed">
            FORM 9-H · REGISTRATION OF A SOVEREIGN BANNER<br />
            SWORN TESTIMONY · FALSE HISTORY IS TREASON
          </p>
        </div>
      </div>
      <div className="cq-hazard mt-3" />
    </motion.div>
  );
}