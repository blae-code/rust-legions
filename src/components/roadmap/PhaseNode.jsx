import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check, Circle } from "lucide-react";
import { STATUS_META } from "@/lib/roadmap";

// One dossier in the Forward Doctrine timeline. Accent is driven by theater;
// all class strings are literal so Tailwind keeps them through the purge.
const THEATER = {
  land: { dot: "bg-brass", ring: "border-brass/50", text: "text-brass", glow: "shadow-[0_0_24px_-6px_hsl(var(--brass))]", tag: "border-brass/50 text-brass" },
  air: { dot: "bg-steel", ring: "border-steel/50", text: "text-steel", glow: "shadow-[0_0_24px_-6px_hsl(var(--steel))]", tag: "border-steel/50 text-steel" },
  sea: { dot: "bg-olive", ring: "border-olive/50", text: "text-olive", glow: "shadow-[0_0_24px_-6px_hsl(var(--olive))]", tag: "border-olive/50 text-olive" },
};

const STATUS_PILL = {
  live: "border-olive/60 text-olive",
  design: "border-brass/60 text-brass-bright",
  planned: "border-steel/60 text-steel",
};

export default function PhaseNode({ phase, index, open, onToggle }) {
  const t = THEATER[phase.theater] || THEATER.land;
  const status = STATUS_META[phase.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      className="relative pl-12 sm:pl-16"
    >
      {/* timeline node */}
      <div className="absolute left-[14px] sm:left-[22px] top-4 -translate-x-1/2">
        <span className={`block w-4 h-4 rounded-full border-2 ${t.ring} ${t.dot} ${open ? t.glow : ""}`} />
      </div>

      <div className={`cq-panel relative overflow-hidden ${open ? t.ring : "border-border"} transition-colors`}>
        <div className="cq-hazard" />
        <button type="button" onClick={onToggle} className="w-full text-left p-4 sm:p-5 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`cq-tag ${t.tag} text-[10px]`}>{phase.era}</span>
              <span className={`cq-tag ${STATUS_PILL[phase.status]} text-[10px]`}>{status.label}</span>
            </div>
            <h3 className="cq-display text-2xl sm:text-3xl leading-none">{phase.title}</h3>
            <div className={`font-heading uppercase tracking-[0.2em] text-xs mt-1 ${t.text}`}>“{phase.codename}”</div>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{phase.tagline}</p>
          </div>
          <ChevronRight className={`w-5 h-5 shrink-0 mt-1 ${t.text} transition-transform duration-300 ${open ? "rotate-90" : ""}`} />
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-border/40">
                <p className="text-sm text-foreground/90 leading-relaxed max-w-3xl mt-3">{phase.summary}</p>

                {phase.prereq && (
                  <div className="mt-3 text-xs font-mono text-muted-foreground">
                    <span className="text-brass/70">◈ SEQUENCE — </span>
                    {phase.prereq}
                  </div>
                )}

                <div className="cq-label mt-5 mb-2">Standing Provisions</div>
                <ul className="space-y-2">
                  {phase.highlights.map((h) => (
                    <li key={h.title} className="flex gap-2.5 items-start">
                      {h.done ? (
                        <Check className="w-4 h-4 text-olive shrink-0 mt-0.5" />
                      ) : (
                        <Circle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${t.text} opacity-60`} />
                      )}
                      <div className="min-w-0">
                        <span className={`text-sm font-heading tracking-wide ${h.done ? "text-foreground" : "text-foreground/90"}`}>
                          {h.title}
                        </span>
                        {h.note && <span className="text-xs text-muted-foreground"> — {h.note}</span>}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className={`mt-5 border-l-2 pl-3 ${t.ring}`}>
                  <div className="cq-label mb-1">Strategic Aim</div>
                  <p className={`text-sm italic ${t.text}`}>{phase.aim}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
