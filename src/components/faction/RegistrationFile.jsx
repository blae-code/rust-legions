import React from "react";
import { motion } from "framer-motion";
import { LIFEPATH_CHAPTERS, DOCTRINES, PHILOSOPHIES, VALUES } from "@/lib/lifepath";
import { PERK_BY_ID, netPoints } from "@/lib/pointBuy";

const IDENTITY_ROWS = [
  ["doctrine", "Doctrine", DOCTRINES],
  ["philosophy", "Philosophy", PHILOSOPHIES],
  ["value", "Value", VALUES],
];

const labelOf = (options, id) => options.find((o) => o.id === id)?.label;

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border/60 py-1.5">
      <span className="font-heading uppercase tracking-[0.15em] text-[9px] text-muted-foreground shrink-0">{label}</span>
      <span className={`font-mono text-[10px] text-right ${value ? "text-foreground" : "text-muted-foreground/40"}`}>
        {value || "— unrecorded —"}
      </span>
    </div>
  );
}

// The registration file — a live carbon copy of the testimony given so far.
export default function RegistrationFile({ choices, identity, picks, factionName }) {
  const net = netPoints(picks);
  const filed =
    LIFEPATH_CHAPTERS.filter((c) => choices[c.id]).length +
    IDENTITY_ROWS.filter(([k]) => identity[k]).length;
  const total = LIFEPATH_CHAPTERS.length + IDENTITY_ROWS.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.35 }}
      className="cq-slip rounded-sm xl:sticky xl:top-4"
    >
      <div className="cq-hazard opacity-70" />
      <div className="p-4">
        <div className="flex items-baseline justify-between">
          <p className="cq-label text-brass/90">Registration File</p>
          <span className="font-mono text-[9px] text-muted-foreground tracking-widest">{filed}/{total} FILED</span>
        </div>
        {factionName ? (
          <p className="cq-display text-xl text-brass-bright mt-1 leading-tight">{factionName}</p>
        ) : (
          <p className="font-mono text-[9px] text-muted-foreground/70 tracking-[0.2em] mt-1">NAME PENDING SYNTHESIS</p>
        )}

        <div className="mt-3">
          {LIFEPATH_CHAPTERS.map((c) => (
            <Row key={c.id} label={c.title} value={labelOf(c.options, choices[c.id])} />
          ))}
          {IDENTITY_ROWS.map(([key, label, options]) => (
            <Row key={key} label={label} value={labelOf(options, identity[key])} />
          ))}
        </div>

        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="font-heading uppercase tracking-[0.15em] text-[9px] text-muted-foreground">Requisition Ledger</span>
            <span className={`font-mono text-[10px] ${net > 0 ? "text-rust" : "text-brass-bright"}`}>
              {picks.length === 0 ? "CLEAN" : net > 0 ? `OVERDRAWN ${net}` : net < 0 ? `RESERVE +${-net}` : "BALANCED"}
            </span>
          </div>
          {picks.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {picks.map((id) => (
                <span key={id} className={`cq-tag ${PERK_BY_ID[id]?.cat === "liability" ? "border-rust/60 text-rust" : "border-brass/50 text-brass-bright"}`}>
                  {PERK_BY_ID[id]?.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="font-mono text-[8px] text-muted-foreground/60 tracking-[0.2em] leading-relaxed mt-4">
          CARBON COPY · RETAINED ON THE DESK<br />
          DRAFT SURVIVES A CLOSED TERMINAL
        </p>
      </div>
    </motion.div>
  );
}