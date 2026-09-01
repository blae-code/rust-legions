import React from "react";
import { motion } from "framer-motion";
import { Stamp } from "lucide-react";
import { playSfx } from "@/lib/sfx";

// One chapter of testimony — a numbered directive card with sworn-statement options.
export default function ChapterCard({ step, title, prompt, options, value, onPick }) {
  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="cq-panel p-4 sm:p-5"
    >
      <div className="flex items-center gap-2.5 mb-1">
        <span className="flex items-center justify-center w-7 h-7 rounded-sm border border-brass/50 bg-brass/10 font-display text-sm text-brass-bright shrink-0">
          {step}
        </span>
        <label className="cq-label text-foreground/90">Chapter {step} — {title}</label>
      </div>
      <h2 className="text-lg font-heading font-semibold tracking-wide text-foreground mb-3 ml-9">{prompt}</h2>
      <div className="space-y-2">
        {options.map((o) => {
          const on = value === o.id;
          return (
            <button
              key={o.id}
              onClick={() => { playSfx("select"); onPick(o.id); }}
              className={`cq-metal relative w-full text-left border rounded-sm p-3.5 pr-24 transition-colors ${
                on ? "border-brass bg-brass/10" : "border-border hover:border-steel"
              }`}
            >
              <p className="font-heading font-semibold tracking-wide text-foreground text-sm">{o.label}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{o.desc}</p>
              {on && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-sm border-2 border-double border-rust/70 px-1.5 py-0.5 font-display uppercase tracking-[0.2em] text-[9px] text-rust/90 -rotate-6">
                  <Stamp className="w-3 h-3" /> Sworn
                </span>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}