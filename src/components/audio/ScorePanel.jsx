import React from "react";
import { motion } from "framer-motion";
import { SkipForward } from "lucide-react";

// Tiny gramophone VU meter — bars dance while the score plays
const VuMeter = ({ active }) => (
  <span className="flex items-end gap-[2px] h-3 w-4 shrink-0" aria-hidden="true">
    {[0.9, 0.5, 1.1, 0.7].map((d, i) => (
      <span
        key={i}
        className={`w-[2.5px] rounded-[1px] ${active ? "cq-vu bg-brass-bright" : "bg-muted-foreground/40 h-[3px]"}`}
        style={active ? { animationDuration: `${d}s`, animationDelay: `${i * 0.13}s` } : undefined}
      />
    ))}
  </span>
);

// Expanded gramophone control plate — title readout, volume, skip, mute
export default function ScorePanel({ on, title, vol, onVol, onSkip, onToggle }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="cq-panel px-3 py-2.5"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <VuMeter active={on && !!title} />
        <span className="font-mono text-[8px] tracking-[0.25em] whitespace-nowrap max-w-[180px] sm:max-w-[240px] truncate text-muted-foreground">
          {!on ? "SCORE MUTED" : title || "STANDING BY…"}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="cq-label text-[8px]">Vol</span>
        <input
          type="range" min="0" max="100" value={Math.round(vol * 100)}
          onChange={(e) => onVol(e.target.value / 100)}
          disabled={!on}
          title="Score volume"
          className="w-24 accent-[hsl(var(--rust))] disabled:opacity-40"
        />
        <button
          onClick={onSkip}
          disabled={!on || !title}
          title="Next piece"
          className="p-1 rounded-sm border border-border text-muted-foreground hover:text-brass-bright hover:border-brass/50 transition-colors disabled:opacity-40"
        >
          <SkipForward className="w-3 h-3" />
        </button>
        <button
          onClick={onToggle}
          className={`font-heading uppercase tracking-widest text-[9px] px-2 py-1 rounded-sm border transition-colors ${
            on ? "border-brass/60 text-brass-bright hover:border-brass-bright" : "border-rust/60 text-rust hover:text-primary-foreground hover:bg-rust/80"
          }`}
        >
          {on ? "Playing" : "Muted"}
        </button>
      </div>
    </motion.div>
  );
}