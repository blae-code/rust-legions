import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { ALL_MANEUVERS } from "@/lib/massCombat";
import { getImage } from "@/lib/imageLibrary";

const OUTCOME_TEXT = {
  captured: "ZONE CAPTURED",
  retreated: "ATTACK REPULSED",
  repelled: "ATTACKING FORCE DESTROYED",
};

function OrderCard({ title, faction, general, entry }) {
  const m = ALL_MANEUVERS[entry?.maneuver] || { label: entry?.maneuver || "—", icon: "▪" };
  const orderArt = entry?.maneuver ? getImage(`mnv_${entry.maneuver}`) : null;
  return (
    <div className="flex-1 border border-border rounded-sm bg-background/60 p-3">
      <p className="font-mono text-[8px] text-steel tracking-[0.25em]">{title}</p>
      <p className="font-heading font-semibold text-sm text-foreground truncate">{faction}</p>
      <p className="font-mono text-[9px] text-muted-foreground mb-2 truncate">CMDG: {general?.toUpperCase()}</p>
      <div className="border border-brass/40 rounded-sm bg-brass/5 px-2 py-1.5 mb-2 flex items-center gap-2">
        {orderArt && <img src={orderArt} alt="" aria-hidden="true" className="w-9 h-9 object-contain shrink-0 rounded-sm select-none" />}
        <div className="min-w-0">
          <p className="font-mono text-[8px] text-brass/70 tracking-[0.25em]">ORDER ISSUED</p>
          <p className="font-heading uppercase tracking-widest text-brass-bright text-sm truncate">{orderArt ? m.label : `${m.icon} ${m.label}`}</p>
        </div>
      </div>
      <div className="font-mono text-[10px] text-secondary-foreground space-y-0.5">
        <p>CASUALTIES THIS ROUND: <span className={entry?.losses > 0 ? "text-rust" : ""}>{entry?.losses ?? 0}</span></p>
        <p>COMPANIES REMAINING: {entry?.remaining ?? "—"}</p>
        <p>MORALE: {entry?.morale ?? "—"}%</p>
      </div>
    </div>
  );
}

// Archived dispatch file — step round by round through a concluded battle
export default function DispatchViewer({ battle, onClose }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [battle?.id]);
  if (!battle) return null;
  const history = battle.history || [];
  const entry = history[idx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="cq-panel cq-brackets w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 relative" onClick={(e) => e.stopPropagation()}>
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>

        {/* Letterhead */}
        <div className="text-center pt-2 border-b border-dashed border-border pb-3 mb-3">
          <p className="font-mono text-[8px] text-steel tracking-[0.35em]">MINISTRY OF WAR · RECORDS DIRECTORATE</p>
          <h2 className="cq-display text-2xl mt-1">Field Dispatch — {battle.tileName}</h2>
          <p className="font-mono text-[9px] text-muted-foreground mt-1">
            FILE NO. {String(battle.id || "").toUpperCase() || "UNKNOWN"} · TURN {battle.turn} · {battle.terrain?.toUpperCase()}
          </p>
          <div className="flex justify-center gap-6 mt-2">
            <span className="cq-stamp text-[10px]">Declassified</span>
            <span className="cq-stamp text-[10px]" style={{ transform: "rotate(5deg)" }}>{OUTCOME_TEXT[battle.outcome] || battle.outcome}</span>
          </div>
        </div>

        {history.length === 0 ? (
          <p className="font-mono text-[10px] text-muted-foreground text-center py-6 tracking-widest">
            ROUND RECORDS MISSING — ENGAGEMENT PREDATES THE ARCHIVE PROTOCOL
          </p>
        ) : (
          <>
            {/* Round stepper */}
            <div className="flex items-center justify-center gap-4 mb-3">
              <button
                onClick={() => setIdx((i) => Math.max(i - 1, 0))}
                disabled={idx === 0}
                className="p-1.5 border border-border rounded-sm text-muted-foreground hover:border-brass/60 hover:text-brass-bright disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <p className="font-heading uppercase tracking-[0.25em] text-sm text-foreground">
                Round {entry.round} <span className="text-muted-foreground">of {history.length}</span>
              </p>
              <button
                onClick={() => setIdx((i) => Math.min(i + 1, history.length - 1))}
                disabled={idx === history.length - 1}
                className="p-1.5 border border-border rounded-sm text-muted-foreground hover:border-brass/60 hover:text-brass-bright disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Both sides' orders for this round */}
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <OrderCard title="ATTACKING FORCE" faction={battle.attacker?.faction} general={battle.attacker?.general} entry={entry.att} />
              <OrderCard title="DEFENDING FORCE" faction={battle.defender?.faction} general={battle.defender?.general} entry={entry.def} />
            </div>

            {/* Field report line */}
            <div className="border border-border rounded-sm bg-background/50 px-3 py-2 mb-3">
              <p className="font-mono text-[8px] text-steel tracking-[0.25em] mb-1">FIELD OBSERVER'S NOTE</p>
              <p className="font-mono text-[11px] text-secondary-foreground leading-relaxed">{entry.text}</p>
            </div>

            {/* Round timeline strip */}
            <div className="flex gap-1 justify-center flex-wrap">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  title={`Round ${h.round}`}
                  className={`w-5 h-5 rounded-sm border font-mono text-[9px] transition-colors ${
                    i === idx ? "border-brass bg-brass/20 text-brass-bright" : "border-border text-muted-foreground hover:border-brass/50"
                  }`}
                >
                  {h.round}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}