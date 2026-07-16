import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { playSfx } from "@/lib/sfx";

// The ministry stamp slams down on the signed commission
export default function CommissionSeal({ name, onDone }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stamp = setTimeout(() => playSfx("attack"), 550);
    const btn = setTimeout(() => setReady(true), 1600);
    return () => { clearTimeout(stamp); clearTimeout(btn); };
  }, []);

  return (
    <div className="cq-panel cq-brackets relative overflow-hidden p-8 text-center">
      <div className="cq-hazard absolute top-0 left-0 right-0" />
      <p className="cq-label pt-2">By order of the Ministry of War</p>
      <h1 className="cq-display text-4xl sm:text-5xl mt-2 text-brass-bright">{name}</h1>
      <p className="font-mono text-[10px] text-muted-foreground tracking-[0.3em] mt-2">
        RANK: GENERAL OF THE FIELD · CLEARANCE: ABSOLUTE
      </p>

      <motion.div
        initial={{ scale: 3.2, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: -8 }}
        transition={{ delay: 0.5, duration: 0.28, ease: [0.2, 0.9, 0.3, 1.2] }}
        className="inline-block my-6"
      >
        <span className="cq-stamp text-2xl sm:text-3xl">Commissioned</span>
      </motion.div>

      <div className="min-h-[44px]">
        {ready && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => { playSfx("purchase"); onDone(); }}
            className="cq-metal bg-primary text-primary-foreground border border-brass-bright/40 font-heading uppercase tracking-[0.25em] text-sm px-8 py-3 rounded-sm hover:bg-brass-bright transition-colors"
          >
            Report to the Field Terminal →
          </motion.button>
        )}
      </div>
      <p className="font-mono text-[8px] text-muted-foreground/60 tracking-[0.25em] mt-4">
        THE CONTINENT AWAITS, GENERAL. DIG DEEP. HOLD THE LINE.
      </p>
    </div>
  );
}