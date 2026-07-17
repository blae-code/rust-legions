import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, FileText } from "lucide-react";
import { PHASES, AMENDMENTS, STATUS_META } from "@/lib/roadmap";
import PhaseNode from "@/components/roadmap/PhaseNode";

// /roadmap — "Forward Operations Doctrine": a diegetic, interactive dossier of
// the game's phased future (core → mobile-base redesign → AIR → SEA). Display
// only; sourced from docs/VISION.md. Nothing here is in play until it ships as
// a Field Amendment.

const STATUS_KEYS = ["live", "design", "planned"];

export default function Roadmap() {
  // Spotlight the two committed expansions the operator asked to showcase.
  const [openIds, setOpenIds] = useState(() => new Set(["air", "sea"]));

  const toggle = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const expandAll = () => setOpenIds(new Set(PHASES.map((p) => p.id)));
  const collapseAll = () => setOpenIds(new Set());

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* masthead */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="cq-panel relative overflow-hidden mb-8"
      >
        <div className="cq-hazard" />
        <div className="cq-scanlines absolute inset-0 pointer-events-none opacity-40" />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="cq-label mb-2 flex items-center gap-2">
                <Compass className="w-3.5 h-3.5" /> Directorate of Forward Planning
              </div>
              <h1 className="cq-display text-5xl sm:text-6xl leading-none">Forward Operations Doctrine</h1>
              <p className="text-muted-foreground font-heading tracking-wide mt-2 max-w-2xl">
                The Ministry's committed line of advance — from the ground war we fight today to the theaters we mean to
                open tomorrow. Read the dossiers; the sequence is deliberate.
              </p>
            </div>
            <div className="cq-stamp hidden sm:block shrink-0 rotate-6 text-rust border-rust/60">Classified · Planning</div>
          </div>

          {/* status legend */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-5 pt-4 border-t border-border/40">
            {STATUS_KEYS.map((k) => (
              <div key={k} className="text-xs">
                <span className="font-heading uppercase tracking-wider text-foreground">{STATUS_META[k].label}</span>
                <span className="text-muted-foreground"> — {STATUS_META[k].blurb}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* controls */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <div className="cq-label">The Line of Advance</div>
        <div className="ml-auto flex gap-2 text-xs font-heading uppercase tracking-wider">
          <button onClick={expandAll} className="text-muted-foreground hover:text-brass-bright transition-colors">
            Open all
          </button>
          <span className="text-border">·</span>
          <button onClick={collapseAll} className="text-muted-foreground hover:text-brass-bright transition-colors">
            Seal all
          </button>
        </div>
      </div>

      {/* timeline */}
      <div className="relative">
        {/* spine */}
        <div className="absolute left-[14px] sm:left-[22px] top-2 bottom-2 w-px bg-gradient-to-b from-brass/40 via-border to-steel/30" />
        <div className="space-y-4">
          {PHASES.map((phase, i) => (
            <PhaseNode key={phase.id} phase={phase} index={i} open={openIds.has(phase.id)} onToggle={() => toggle(phase.id)} />
          ))}
        </div>
      </div>

      {/* standing amendments queue */}
      <div className="mt-12">
        <div className="cq-label mb-1">Standing Amendments Queue</div>
        <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
          Near-term measures that may ship as vanilla-era Field Amendments, independent of the great expansions above —
          scope confirmed with the Ministry before any is drafted.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {AMENDMENTS.map((a) => (
            <div key={a.title} className="cq-panel p-3.5 border-border/60">
              <div className="font-heading tracking-wide text-sm text-foreground">{a.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{a.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* footer — diegetic disclaimer */}
      <div className="mt-12 border-t border-border/40 pt-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-xs font-mono text-muted-foreground max-w-xl">
          ◈ No provision in this doctrine is in service until it is published as a Field Amendment. Timelines are
          directional, not contractual — the front decides the pace.
        </p>
        <Link
          to="/patch-notes"
          className="sm:ml-auto shrink-0 inline-flex items-center gap-2 cq-metal px-3 py-1.5 text-xs font-heading uppercase tracking-[0.2em] text-brass hover:text-brass-bright"
        >
          <FileText className="w-3.5 h-3.5" /> Field Amendments
        </Link>
      </div>
    </div>
  );
}
