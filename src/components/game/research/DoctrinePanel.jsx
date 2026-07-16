import React from "react";
import { X } from "lucide-react";
import { DOCTRINE_BRANCHES, TECHS, techsByBranch } from "@/lib/doctrine";
import TechCard from "@/components/game/research/TechCard";
import ArmoryPanel from "@/components/game/research/ArmoryPanel";

// The Doctrine Directorate — set research focus at any time, even off-turn.
// One research point accrues each time a full round of turns completes.
export default function DoctrinePanel({ open, onClose, research, busy, onSetFocus, game, onUnlock }) {
  if (!open || !research) return null;
  const focusTech = research.focus ? TECHS[research.focus] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="cq-panel cq-brackets w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 relative" onClick={(e) => e.stopPropagation()}>
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <button onClick={onClose} className="absolute top-4 right-3 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
        <div className="pt-2 mb-4">
          <p className="cq-label text-rust">Directorate of War Sciences</p>
          <h2 className="cq-display text-2xl">Doctrine Research</h2>
          <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-1">
            {focusTech
              ? `CURRENT FOCUS: ${focusTech.label.toUpperCase()} · ${(research.progress || {})[research.focus] || 0}/${focusTech.cost} RP`
              : "NO FOCUS SET — THE LABORATORIES STAND IDLE"}
            {" · 1 RP PER FULL ROUND · MAY BE SET OFF-TURN"}
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {Object.entries(DOCTRINE_BRANCHES).map(([branch, meta]) => (
            <div key={branch} className="border border-border rounded-sm bg-secondary/20 p-2.5">
              <div className="flex items-center gap-2">
                <span>{meta.icon}</span>
                <span className="cq-label">{meta.label}</span>
              </div>
              <p className="font-mono text-[9px] text-muted-foreground mt-0.5 mb-2">{meta.blurb}</p>
              <div className="space-y-1.5">
                {techsByBranch(branch).map(([techId, tech]) => (
                  <TechCard key={techId} techId={techId} tech={tech} research={research} busy={busy} onFocus={onSetFocus} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {game && onUnlock && <ArmoryPanel game={game} busy={busy} onUnlock={onUnlock} />}
      </div>
    </div>
  );
}