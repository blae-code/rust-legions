import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Flame, Coins, Shield, Check } from "lucide-react";
import { PRESET_FACTIONS } from "@/lib/presetFactions";
import { playSfx } from "@/lib/sfx";

export const DOCTRINE_META = {
  aggressive: { icon: Flame, label: "Aggressive", tone: "text-rust", blurb: "Strikes first, bleeds freely." },
  economic: { icon: Coins, label: "Economic", tone: "text-brass-bright", blurb: "Wins the war of stockpiles." },
  defensive: { icon: Shield, label: "Defensive", tone: "text-steel", blurb: "Digs in and outlasts." },
};

// Banner selection — each faction rendered as a selectable regimental plate.
export default function FactionSelect({ factions, factionId, setFactionId, forgingId, forgePreset }) {
  if (factions.length === 0) {
    return (
      <div className="mt-1.5 space-y-2">
        <p className="font-mono text-[10px] text-muted-foreground tracking-wide">
          NO BANNERS ON FILE — REQUISITION A STANDING FACTION, OR FORGE A NATION IN THE{" "}
          <Link to="/faction-builder" className="text-brass hover:text-brass-bright underline underline-offset-2">FOUNDRY</Link>.
        </p>
        <div className="grid sm:grid-cols-3 gap-2">
          {PRESET_FACTIONS.map((p, i) => {
            const D = DOCTRINE_META[p.doctrine] || DOCTRINE_META.aggressive;
            return (
              <motion.button
                key={p.id}
                type="button"
                disabled={!!forgingId}
                onClick={() => { playSfx("select"); forgePreset(p); }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="cq-metal text-left border border-border rounded-sm p-3 transition-colors hover:border-brass disabled:opacity-50 bg-secondary/30"
              >
                <p className="font-heading font-semibold tracking-wide text-foreground text-sm flex items-center gap-1.5">
                  {forgingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <D.icon className={`w-3 h-3 ${D.tone}`} />}
                  {p.factionName}
                </p>
                <p className={`text-[10px] uppercase tracking-[0.2em] mt-1 font-heading ${D.tone}`}>{D.label}</p>
                <p className="font-mono text-[9px] text-muted-foreground mt-0.5">{D.blurb}</p>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-2 mt-1.5">
      {factions.map((f, i) => {
        const D = DOCTRINE_META[f.doctrine] || DOCTRINE_META.aggressive;
        const active = factionId === f.id;
        return (
          <motion.button
            key={f.id}
            type="button"
            onClick={() => { playSfx("select"); setFactionId(f.id); }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`cq-metal relative text-left rounded-sm border p-2.5 transition-all ${
              active
                ? "border-brass bg-brass/10 shadow-[0_0_14px_hsl(40_20%_54%/0.15)]"
                : "border-border bg-secondary/30 hover:border-brass/50"
            }`}
          >
            {active && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-brass text-background">
                <Check className="w-3 h-3" />
              </span>
            )}
            <p className={`font-heading font-semibold tracking-wide text-sm flex items-center gap-1.5 ${active ? "text-brass-bright" : "text-foreground"}`}>
              <D.icon className={`w-3.5 h-3.5 ${D.tone}`} /> {f.factionName}
            </p>
            <p className="font-mono text-[9px] text-muted-foreground mt-0.5 uppercase tracking-[0.18em]">
              {D.label} DOCTRINE{f.isPublished ? " · PUBLISHED" : ""}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}