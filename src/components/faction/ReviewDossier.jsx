import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Check, Landmark } from "lucide-react";
import { PERK_BY_ID } from "@/lib/pointBuy";

// The synthesized nation, returned from the College of Heralds as a sealed file card.
export default function ReviewDossier({ result, picks, loading, saving, error, onRewrite, onSave }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="cq-slip rounded-sm relative overflow-hidden">
      <div className="cq-hazard" />
      <motion.span
        className="cq-stamp absolute top-4 right-4 text-xs"
        initial={{ opacity: 0, scale: 1.8, rotate: -20 }}
        animate={{ opacity: 1, scale: 1, rotate: -8 }}
        transition={{ delay: 0.4, duration: 0.25, ease: "easeOut" }}
      >
        Provisional
      </motion.span>

      <div className="p-5 space-y-4">
        <div>
          <p className="cq-label text-brass flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5" /> Heraldic Synthesis Complete</p>
          <h2 className="cq-display text-3xl mt-1">{result.factionName}</h2>
          <p className="text-xs text-muted-foreground italic mt-1">{result.insigniaDescription}</p>
        </div>

        <p className="text-sm text-secondary-foreground whitespace-pre-line leading-relaxed border-l-2 border-brass/40 pl-3">
          {result.lore}
        </p>

        <div>
          <h3 className="cq-label mb-2">National Traits</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {result.traits.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="border border-brass/30 bg-secondary/30 rounded-sm p-3"
              >
                <p className="text-sm font-heading font-semibold tracking-wide text-brass-bright">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {picks.length > 0 && (
          <div>
            <h3 className="cq-label mb-2">Requisition Ledger</h3>
            <div className="flex flex-wrap gap-1.5">
              {picks.map((id) => (
                <span key={id} className={`cq-tag ${PERK_BY_ID[id]?.cat === "liability" ? "border-rust/60 text-rust" : "border-brass/60 text-brass-bright"}`}>
                  {PERK_BY_ID[id]?.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="cq-label mb-2">Standing with the Great Powers</h3>
          <div className="space-y-1.5">
            {Object.entries(result.npcDispositions).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground w-24 shrink-0 uppercase truncate">{k}</span>
                <div className="relative flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(Math.abs(v), 20) * 2.5}%` }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className={`absolute top-0 bottom-0 ${v >= 0 ? "left-1/2 bg-olive" : "right-1/2 bg-rust"}`}
                  />
                </div>
                <span className={`font-mono text-[10px] w-8 text-right ${v > 5 ? "text-olive" : v < -5 ? "text-rust" : "text-muted-foreground"}`}>
                  {v > 0 ? "+" : ""}{v}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="font-mono text-[10px] text-rust tracking-wide border border-rust/40 bg-rust/10 rounded-sm px-2 py-1.5">{error}</p>}

        <div className="flex justify-between border-t border-border pt-3">
          <Button variant="outline" disabled={loading || saving} onClick={onRewrite} className="text-xs">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Rewrite History
          </Button>
          <Button disabled={saving || loading} onClick={onSave} className="text-xs">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Enlist Faction
          </Button>
        </div>
        <p className="font-mono text-[8px] text-muted-foreground/60 tracking-[0.2em]">
          A REWRITE RETURNS THE FILE TO THE HERALDS · ENLISTMENT ENTERS THE BANNER ON YOUR ROSTER
        </p>
      </div>
    </motion.div>
  );
}