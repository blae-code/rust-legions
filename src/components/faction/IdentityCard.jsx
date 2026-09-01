import React from "react";
import { motion } from "framer-motion";
import { playSfx } from "@/lib/sfx";
import { DOCTRINES, PHILOSOPHIES, VALUES } from "@/lib/lifepath";
import LabelTip from "@/components/ui/LabelTip";

const GROUPS = [
  { key: "doctrine", title: "Military Doctrine", tip: "How your armies fight — sets your NPC behavior when machine-run and colors your traits.", options: DOCTRINES },
  { key: "philosophy", title: "Economic Philosophy", tip: "How the nation feeds its war machine — woven into your synthesized history.", options: PHILOSOPHIES },
  { key: "value", title: "Cultural Value", tip: "What your people will not surrender — the heralds write it into your lore.", options: VALUES },
];

// The final chapter — doctrine, philosophy and value, declared under seal.
export default function IdentityCard({ step, identity, setIdentity }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="cq-panel p-4 sm:p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-sm border border-brass/50 bg-brass/10 font-display text-sm text-brass-bright shrink-0">
          {step}
        </span>
        <label className="cq-label text-foreground/90">Final Chapter — Doctrine & Identity</label>
      </div>
      <div className="space-y-4">
        {GROUPS.map((g) => (
          <div key={g.key}>
            <h3 className="cq-label text-brass mb-2">
              {g.title}
              <LabelTip title={g.title} body={g.tip} />
            </h3>
            <div className="grid sm:grid-cols-3 gap-2">
              {g.options.map((o) => {
                const on = identity[g.key] === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => { playSfx("select"); setIdentity({ ...identity, [g.key]: o.id }); }}
                    className={`cq-metal text-left border rounded-sm p-3 transition-colors ${
                      on ? "border-brass bg-brass/10" : "border-border hover:border-steel"
                    }`}
                  >
                    <p className={`font-heading font-semibold tracking-wide text-xs ${on ? "text-brass-bright" : "text-foreground"}`}>{o.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{o.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}