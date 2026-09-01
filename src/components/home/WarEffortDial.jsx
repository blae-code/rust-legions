import React from "react";
import { motion } from "framer-motion";

// Brass pressure-gauge dial — win rate rendered as a Ministry instrument.
export default function WarEffortDial({ won = 0, played = 0 }) {
  const rate = played > 0 ? won / played : 0;
  const pct = Math.round(rate * 100);

  // 270° sweep gauge, from 135° to 405°
  const R = 34;
  const CIRC = 2 * Math.PI * R;
  const SWEEP = 0.75; // 270 of 360
  const arc = CIRC * SWEEP;

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 88 88" className="w-full h-full -rotate-[225deg]">
        {/* track */}
        <circle cx="44" cy="44" r={R} fill="none" stroke="hsl(var(--border))" strokeWidth="6"
          strokeDasharray={`${arc} ${CIRC}`} strokeLinecap="round" />
        {/* needle arc */}
        <motion.circle
          cx="44" cy="44" r={R} fill="none" stroke="hsl(var(--brass))" strokeWidth="6"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${CIRC}` }}
          animate={{ strokeDasharray: `${arc * rate} ${CIRC}` }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: "drop-shadow(0 0 4px hsl(var(--brass) / 0.5))" }}
        />
        {/* tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const a = t * SWEEP * 2 * Math.PI;
          const x1 = 44 + Math.cos(a) * 27, y1 = 44 + Math.sin(a) * 27;
          const x2 = 44 + Math.cos(a) * 23, y2 = 44 + Math.sin(a) * 23;
          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--brass) / 0.4)" strokeWidth="1.5" />;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl text-brass-bright leading-none">{played > 0 ? `${pct}%` : "—"}</span>
        <span className="font-mono text-[7px] text-muted-foreground tracking-[0.25em] mt-0.5">WAR EFFORT</span>
      </div>
    </div>
  );
}