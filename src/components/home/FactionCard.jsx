import React from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

const DOCTRINE_STYLE = {
  aggressive: "border-rust/60 text-rust",
  economic: "border-brass/60 text-brass-bright",
  defensive: "border-steel/60 text-steel",
};

export default function FactionCard({ faction, index }) {
  return (
    <motion.div
      className="cq-panel cq-brackets p-5 relative overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.45 }}
    >
      <Shield className="absolute -right-4 -bottom-4 w-28 h-28 text-brass/5 rotate-12" />
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading font-semibold text-xl tracking-wide text-foreground">{faction.factionName}</h3>
        <span className="font-mono text-[10px] text-muted-foreground shrink-0 mt-1.5">DOSSIER</span>
      </div>
      <p className={`cq-tag mt-1 mb-2.5 ${DOCTRINE_STYLE[faction.doctrine] || "border-border text-muted-foreground"}`}>
        {faction.doctrine} doctrine
      </p>
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed relative">{faction.lore}</p>
      <div className="flex flex-wrap gap-1 mt-3 relative">
        {(faction.traits || []).map((t, i) => (
          <span key={i} className="text-[10px] font-heading uppercase tracking-wider bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-sm border border-border">
            {t.name}
          </span>
        ))}
      </div>
    </motion.div>
  );
}